import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@config/firebase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, role: 'client' | 'counselor') => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  loginWithGoogle: (useRedirect?: boolean) => Promise<void>;
  loginWithFacebook: (useRedirect?: boolean) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 사용자 정보를 Firestore에서 가져와서 role 정보 추가
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          (user as any).role = userData.role;
        }
      }
      setUser(user);
      setLoading(false);
    });

    // 리다이렉트 결과 처리 (OAuth 로그인 후)
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // 리다이렉트 로그인 성공 처리
          const userDoc = await getDoc(doc(db, 'users', result.user.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', result.user.uid), {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL,
              role: 'client',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          toast.success('로그인이 완료되었습니다.');
        }
      } catch (error: any) {
        toast.error(getErrorMessage(error.code));
      }
    };

    handleRedirectResult();
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('로그인되었습니다.');
    } catch (error: any) {
      toast.error(getErrorMessage(error.code));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
    role: 'client' | 'counselor'
  ) => {
    try {
      setLoading(true);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // 프로필 업데이트
      await updateProfile(user, { displayName });
      
      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        role,
        emailVerified: user.emailVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 이메일 인증 발송
      await sendEmailVerification(user, {
        url: `${window.location.origin}/login?verified=true`,
        handleCodeInApp: false,
      });

      toast.success('회원가입이 완료되었습니다. 이메일 인증을 확인해주세요.');
    } catch (error: any) {
      toast.error(getErrorMessage(error.code));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('로그아웃되었습니다.');
    } catch (error: any) {
      toast.error('로그아웃 중 오류가 발생했습니다.');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      toast.success('비밀번호 재설정 이메일을 발송했습니다.');
    } catch (error: any) {
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (!user) throw new Error('사용자가 로그인되지 않았습니다.');
    
    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/login?verified=true`,
        handleCodeInApp: false,
      });
      toast.success('인증 이메일을 발송했습니다.');
    } catch (error: any) {
      toast.error(getErrorMessage(error.code));
      throw error;
    }
  };

  const loginWithGoogle = async (useRedirect: boolean = false) => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      let result;
      if (useRedirect) {
        // 모바일 환경이나 팝업이 차단된 경우 리다이렉트 사용
        await signInWithRedirect(auth, provider);
        return; // 리다이렉트 후 결과는 useEffect에서 처리
      } else {
        // 데스크톱 환경에서는 팝업 사용
        result = await signInWithPopup(auth, provider);
      }
      
      if (result) {
        // Firestore에 사용자 정보 저장 (처음 로그인인 경우)
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', result.user.uid), {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            role: 'client', // 기본값
            emailVerified: result.user.emailVerified,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        
        toast.success('Google 로그인이 완료되었습니다.');
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        // 팝업이 차단된 경우 리다이렉트로 재시도
        toast.info('팝업이 차단되었습니다. 리다이렉트 방식으로 로그인합니다.');
        return loginWithGoogle(true);
      }
      toast.error(getErrorMessage(error.code));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithFacebook = async (useRedirect: boolean = false) => {
    try {
      setLoading(true);
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      
      let result;
      if (useRedirect) {
        // 모바일 환경이나 팝업이 차단된 경우 리다이렉트 사용
        await signInWithRedirect(auth, provider);
        return; // 리다이렉트 후 결과는 useEffect에서 처리
      } else {
        // 데스크톱 환경에서는 팝업 사용
        result = await signInWithPopup(auth, provider);
      }
      
      if (result) {
        // Firestore에 사용자 정보 저장 (처음 로그인인 경우)
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', result.user.uid), {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            role: 'client', // 기본값
            emailVerified: result.user.emailVerified,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        
        toast.success('Facebook 로그인이 완료되었습니다.');
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        // 팝업이 차단된 경우 리다이렉트로 재시도
        toast.info('팝업이 차단되었습니다. 리다이렉트 방식으로 로그인합니다.');
        return loginWithFacebook(true);
      }
      toast.error(getErrorMessage(error.code));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (!user) throw new Error('사용자가 로그인되지 않았습니다.');
    
    try {
      await updateProfile(user, data);
      
      // Firestore 업데이트
      await setDoc(doc(db, 'users', user.uid), {
        ...data,
        updatedAt: new Date(),
      }, { merge: true });
      
      toast.success('프로필이 업데이트되었습니다.');
    } catch (error: any) {
      toast.error('프로필 업데이트 중 오류가 발생했습니다.');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    sendVerificationEmail,
    loginWithGoogle,
    loginWithFacebook,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Firebase 오류 메시지 한국어 변환
const getErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    'auth/user-not-found': '등록되지 않은 이메일입니다.',
    'auth/wrong-password': '잘못된 비밀번호입니다.',
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
    'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
    'auth/user-disabled': '비활성화된 계정입니다.',
    'auth/too-many-requests': '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    'auth/network-request-failed': '네트워크 오류가 발생했습니다.',
    'auth/popup-closed-by-user': '팝업이 사용자에 의해 닫혔습니다.',
    'auth/cancelled-popup-request': '팝업 요청이 취소되었습니다.',
    'auth/popup-blocked': '팝업이 차단되었습니다. 팝업 차단을 해제하거나 리다이렉트 방식을 사용해주세요.',
    'auth/redirect-cancelled-by-user': '로그인이 사용자에 의해 취소되었습니다.',
    'auth/redirect-operation-pending': '리다이렉트 작업이 진행 중입니다.',
  };
  
  return errorMessages[errorCode] || '알 수 없는 오류가 발생했습니다.';
};
