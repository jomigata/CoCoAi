// Firebase 설정 파일
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { getFunctions } from 'firebase/functions';

// Firebase 설정 객체
const firebaseConfig = {
  apiKey: "AIzaSyAIq3ePshbPFsUDwEEmtWrM14icGOmrmQQ",
  authDomain: "cocoai-60a2d.firebaseapp.com",
  projectId: "cocoai-60a2d",
  storageBucket: "cocoai-60a2d.firebasestorage.app",
  messagingSenderId: "589508812163",
  appId: "1:589508812163:web:36a28d29be8c3777fa6ab6",
  measurementId: "G-DDNRP7SK9S"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스들 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Analytics와 Performance는 브라우저 환경에서만 초기화
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const performance = typeof window !== 'undefined' ? getPerformance(app) : null;

// 기본 앱 인스턴스 export
export default app;
