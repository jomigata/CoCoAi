import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@config/firebase';
import toast from 'react-hot-toast';
import { 
  Users, 
  Check, 
  X, 
  Clock, 
  AlertTriangle,
  Heart,
  UserPlus
} from 'lucide-react';

interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  inviterUid: string;
  inviterName: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

interface Group {
  id: string;
  name: string;
  description: string;
  type: string;
  characteristics: string[];
  memberCount: number;
  maxMembers: number;
  createdBy: string;
}

/**
 * 📧 그룹 초대 수락/거절 페이지
 * 이메일을 통해 받은 초대 링크로 접근하는 페이지
 * 
 * 디자이너 1,2의 UI/UX 설계 적용
 * 심리상담가 1,2의 그룹 참여 프로세스 최적화 반영
 */
const GroupInvitePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [invitation, setInvitation] = useState<GroupInvitation | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvitationData();
  }, []);

  const loadInvitationData = async () => {
    try {
      const token = searchParams.get('token');
      if (!token) {
        setError('유효하지 않은 초대 링크입니다.');
        setIsLoading(false);
        return;
      }

      // 토큰으로 초대 정보 찾기 (실제 구현에서는 Cloud Function 사용)
      // 임시로 하드코딩된 데이터 사용
      const mockInvitation: GroupInvitation = {
        id: 'invitation-1',
        groupId: 'group-1',
        groupName: '우리 가족',
        inviterUid: 'user-1',
        inviterName: '김철수',
        inviteeEmail: user?.email || '',
        status: 'pending',
        token: token,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5일 후
      };

      const mockGroup: Group = {
        id: 'group-1',
        name: '우리 가족',
        description: '가족 간의 소통과 이해를 높이기 위한 그룹입니다.',
        type: 'family',
        characteristics: ['communication_improvement', 'emotional_support', 'family_harmony'],
        memberCount: 3,
        maxMembers: 8,
        createdBy: 'user-1'
      };

      setInvitation(mockInvitation);
      setGroup(mockGroup);
      
    } catch (error) {
      console.error('초대 정보 로딩 오류:', error);
      setError('초대 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !group || !user) return;

    setIsProcessing(true);
    try {
      // TODO: Implement actual group member addition
      console.log('Adding member to group:', group.id, 'user:', user?.uid);
      /*
      // 1. 그룹 멤버로 추가
      await addDoc(collection(db, `groups/${group.id}/members`), {
        userId: user.uid,
        displayName: user.displayName || user.email,
        role: 'member',
        joinedAt: new Date(),
        permissions: {
          canInvite: false,
          canViewReports: true,
          canEditGroup: false
        },
        status: 'active'
      });

      // 2. 그룹 멤버 수 업데이트
      await updateDoc(doc(db, 'groups', group.id), {
        memberCount: group.memberCount + 1,
        updatedAt: new Date()
      });
      */

      // 3. 초대 상태 업데이트
      await updateDoc(doc(db, 'invitations', invitation.id), {
        status: 'accepted',
        inviteeUid: user.uid,
        respondedAt: new Date()
      });

      toast.success(`${group.name} 그룹에 참여했습니다! 🎉`);
      navigate('/groups');
      
    } catch (error) {
      console.error('초대 수락 오류:', error);
      toast.error('그룹 참여 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!invitation) return;

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'invitations', invitation.id), {
        status: 'declined',
        respondedAt: new Date()
      });

      toast.success('초대를 거절했습니다.');
      navigate('/groups');
      
    } catch (error) {
      console.error('초대 거절 오류:', error);
      toast.error('초대 거절 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getCharacteristicLabel = (characteristic: string): string => {
    const labels: Record<string, string> = {
      'communication_improvement': '소통 개선',
      'conflict_resolution': '갈등 해결',
      'emotional_support': '정서적 지지',
      'goal_sharing': '목표 공유',
      'trust_building': '신뢰 구축',
      'stress_management': '스트레스 관리',
      'relationship_growth': '관계 성장',
      'family_harmony': '가족 화목'
    };
    return labels[characteristic] || characteristic;
  };

  const getGroupTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'family': '가족',
      'couple': '연인/부부',
      'friends': '친구',
      'team': '팀/동료',
      'therapy': '치료 그룹',
      'other': '기타'
    };
    return labels[type] || type;
  };

  const isExpired = invitation && new Date() > invitation.expiresAt;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-soft p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">초대 정보를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation || !group) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-soft p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            초대를 찾을 수 없습니다
          </h2>
          <p className="text-gray-600 mb-6">
            {error || '유효하지 않은 초대 링크이거나 만료된 초대입니다.'}
          </p>
          <button
            onClick={() => navigate('/groups')}
            className="btn-primary w-full"
          >
            그룹 목록으로 이동
          </button>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-soft p-8 text-center">
          <Clock className="w-16 h-16 text-orange-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            초대가 만료되었습니다
          </h2>
          <p className="text-gray-600 mb-6">
            이 초대는 {invitation.expiresAt.toLocaleDateString('ko-KR')}에 만료되었습니다.
            새로운 초대를 요청해주세요.
          </p>
          <button
            onClick={() => navigate('/groups')}
            className="btn-primary w-full"
          >
            그룹 목록으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container-responsive py-12">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-100 rounded-full mb-6">
              <UserPlus className="w-10 h-10 text-pink-600" />
            </div>
            <h1 className="text-display-medium text-gray-900 mb-4">
              그룹 초대
            </h1>
            <p className="text-body-large text-gray-600">
              {invitation.inviterName}님이 그룹에 초대했습니다
            </p>
          </div>

          {/* 그룹 정보 카드 */}
          <div className="bg-white rounded-xl shadow-soft p-8 mb-8">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl">
                <Users className="w-8 h-8 text-pink-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-headline-large text-gray-900 mb-2">
                  {group.name}
                </h2>
                <div className="flex items-center space-x-4 text-body-medium text-gray-600 mb-3">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {getGroupTypeLabel(group.type)}
                  </span>
                  <span>{group.memberCount}/{group.maxMembers}명</span>
                </div>
                <p className="text-body-medium text-gray-700">
                  {group.description}
                </p>
              </div>
            </div>

            {/* 그룹 특성 */}
            <div className="mb-6">
              <h3 className="text-title-medium text-gray-900 mb-3">
                그룹 특성
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.characteristics.map((characteristic) => (
                  <span
                    key={characteristic}
                    className="px-3 py-1 bg-pink-50 text-pink-700 text-body-small rounded-full border border-pink-200"
                  >
                    {getCharacteristicLabel(characteristic)}
                  </span>
                ))}
              </div>
            </div>

            {/* 초대 정보 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-title-medium text-gray-900 mb-2">
                초대 정보
              </h3>
              <div className="space-y-2 text-body-medium text-gray-600">
                <p>
                  <span className="font-medium">초대자:</span> {invitation.inviterName}
                </p>
                <p>
                  <span className="font-medium">초대 일시:</span> {invitation.createdAt.toLocaleString('ko-KR')}
                </p>
                <p>
                  <span className="font-medium">만료 일시:</span> {invitation.expiresAt.toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="bg-white rounded-xl shadow-soft p-8">
            <div className="text-center mb-6">
              <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4" />
              <h3 className="text-headline-medium text-gray-900 mb-2">
                함께 성장해보세요
              </h3>
              <p className="text-body-medium text-gray-600">
                그룹에 참여하여 서로를 더 깊이 이해하고 건강한 관계를 만들어가세요.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleAcceptInvitation}
                disabled={isProcessing}
                className="btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-5 h-5 mr-2" />
                {isProcessing ? '참여 중...' : '초대 수락'}
              </button>
              
              <button
                onClick={handleDeclineInvitation}
                disabled={isProcessing}
                className="btn-outline flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5 mr-2" />
                {isProcessing ? '처리 중...' : '초대 거절'}
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/groups')}
                className="text-body-medium text-gray-500 hover:text-gray-700 underline"
              >
                나중에 결정하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupInvitePage;
