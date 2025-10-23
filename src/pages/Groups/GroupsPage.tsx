import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy 
} from 'firebase/firestore';
import { db } from '@config/firebase';
import toast from 'react-hot-toast';
import { 
  Users, 
  Plus, 
  Heart, 
  Home, 
  Briefcase, 
  UserPlus,
  Calendar,
  TrendingUp,
  Settings,
  Crown,
  Shield,
  User,
  Mail,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description?: string;
  type: 'family' | 'couple' | 'friends' | 'team' | 'custom';
  characteristics: string[];
  members: {
    [userId: string]: {
      role: 'owner' | 'admin' | 'member';
      joinedAt: Date;
      status: 'active' | 'inactive' | 'pending';
      nickname?: string;
    };
  };
  settings: {
    isPrivate: boolean;
    allowInvites: boolean;
    weeklyReportDay: string;
  };
  stats: {
    totalMembers: number;
    activeMembers: number;
    completedTests: number;
    weeklyReportsGenerated: number;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface GroupInvitation {
  id: string;
  groupId: string;
  invitedBy: string;
  invitedEmail: string;
  invitedUserId?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date;
}

const GroupsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-groups' | 'invitations'>('my-groups');

  useEffect(() => {
    if (user) {
      loadUserGroups();
      loadInvitations();
    }
  }, [user]);

  const loadUserGroups = async () => {
    if (!user) return;

    try {
      // 사용자가 속한 그룹들 조회
      const groupsQuery = query(
        collection(db, 'groups'),
        orderBy('updatedAt', 'desc')
      );
      
      const groupsSnapshot = await getDocs(groupsQuery);
      const userGroups: Group[] = [];

      for (const docSnap of groupsSnapshot.docs) {
        const groupData = docSnap.data() as Omit<Group, 'id'>;
        if (groupData.members && groupData.members[user.uid]) {
          userGroups.push({
            id: docSnap.id,
            ...groupData
          });
        }
      }

      setGroups(userGroups);
    } catch (error) {
      console.error('그룹 로드 오류:', error);
      toast.error('그룹을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadInvitations = async () => {
    if (!user) return;

    try {
      // 사용자에게 온 초대 조회
      const invitationsQuery = query(
        collection(db, 'groupInvitations'),
        where('invitedEmail', '==', user.email),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const invitationsSnapshot = await getDocs(invitationsQuery);
      const userInvitations: GroupInvitation[] = [];

      for (const docSnap of invitationsSnapshot.docs) {
        const invitationData = docSnap.data();
        
        // 만료된 초대는 제외
        if (new Date(invitationData.expiresAt.toDate()) > new Date()) {
          userInvitations.push({
            id: docSnap.id,
            ...invitationData,
            createdAt: invitationData.createdAt.toDate(),
            expiresAt: invitationData.expiresAt.toDate(),
            respondedAt: invitationData.respondedAt?.toDate()
          });
        }
      }

      setInvitations(userInvitations);
    } catch (error) {
      console.error('초대 로드 오류:', error);
      toast.error('초대를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getGroupTypeIcon = (type: string) => {
    switch (type) {
      case 'family': return <Home className="w-6 h-6" />;
      case 'couple': return <Heart className="w-6 h-6" />;
      case 'friends': return <Users className="w-6 h-6" />;
      case 'team': return <Briefcase className="w-6 h-6" />;
      default: return <Users className="w-6 h-6" />;
    }
  };

  const getGroupTypeName = (type: string) => {
    switch (type) {
      case 'family': return '가족';
      case 'couple': return '연인/부부';
      case 'friends': return '친구';
      case 'team': return '팀/회사';
      case 'custom': return '커스텀';
      default: return '그룹';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'owner': return '그룹장';
      case 'admin': return '관리자';
      default: return '멤버';
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    // 초대 수락 로직 (추후 구현)
    toast.success('초대를 수락했습니다.');
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    // 초대 거절 로직 (추후 구현)
    toast.success('초대를 거절했습니다.');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-600">그룹 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-display-medium text-gray-900 mb-4">
              나의 그룹
            </h1>
            <p className="text-body-large text-gray-600 max-w-2xl">
              가족, 친구, 연인과 함께 마음을 나누고 성장해보세요.
            </p>
          </div>
          
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={() => navigate('/groups/create')}
              className="btn-primary flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              그룹 만들기
            </button>
            <button
              onClick={() => navigate('/groups/join')}
              className="btn-outline flex items-center"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              그룹 참여
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="tab-list max-w-md">
            <button
              onClick={() => setActiveTab('my-groups')}
              className={`tab-button ${activeTab === 'my-groups' ? 'active' : 'inactive'}`}
            >
              내 그룹 ({groups.length})
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`tab-button ${activeTab === 'invitations' ? 'active' : 'inactive'}`}
            >
              초대 ({invitations.length})
            </button>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'my-groups' && (
          <div className="fade-in">
            {groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => {
                  const userMember = group.members[user!.uid];
                  return (
                    <div
                      key={group.id}
                      className="card-hover cursor-pointer"
                      onClick={() => navigate(`/groups/${group.id}`)}
                    >
                      {/* 그룹 헤더 */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-xl mr-4">
                            <div className="text-pink-600">
                              {getGroupTypeIcon(group.type)}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-title-large text-gray-900 mb-1">
                              {group.name}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500">
                              {getRoleIcon(userMember.role)}
                              <span className="ml-1">{getRoleName(userMember.role)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="badge-secondary">
                          {getGroupTypeName(group.type)}
                        </div>
                      </div>

                      {/* 그룹 설명 */}
                      {group.description && (
                        <p className="text-body-medium text-gray-600 mb-4 line-clamp-2">
                          {group.description}
                        </p>
                      )}

                      {/* 그룹 특성 */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {group.characteristics.slice(0, 3).map((characteristic, index) => (
                          <span key={index} className="badge-primary text-xs">
                            {characteristic}
                          </span>
                        ))}
                        {group.characteristics.length > 3 && (
                          <span className="badge-secondary text-xs">
                            +{group.characteristics.length - 3}
                          </span>
                        )}
                      </div>

                      {/* 그룹 통계 */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div className="text-center">
                          <div className="text-title-medium font-bold text-gray-900">
                            {group.stats.activeMembers}
                          </div>
                          <div className="text-body-small text-gray-500">활성 멤버</div>
                        </div>
                        <div className="text-center">
                          <div className="text-title-medium font-bold text-gray-900">
                            {group.stats.weeklyReportsGenerated}
                          </div>
                          <div className="text-body-small text-gray-500">주간 리포트</div>
                        </div>
                      </div>

                      {/* 액션 버튼들 */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/groups/${group.id}/report`);
                          }}
                          className="flex-1 btn-ghost text-sm flex items-center justify-center"
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          리포트
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/groups/${group.id}/calendar`);
                          }}
                          className="flex-1 btn-ghost text-sm flex items-center justify-center"
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          일정
                        </button>
                        {(userMember.role === 'owner' || userMember.role === 'admin') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/groups/${group.id}/settings`);
                            }}
                            className="flex-1 btn-ghost text-sm flex items-center justify-center"
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            설정
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <Users className="empty-state-icon" />
                <h3 className="empty-state-title">아직 참여한 그룹이 없습니다</h3>
                <p className="empty-state-description">
                  새로운 그룹을 만들거나 기존 그룹에 참여해보세요.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/groups/create')}
                    className="btn-primary"
                  >
                    그룹 만들기
                  </button>
                  <button
                    onClick={() => navigate('/groups/join')}
                    className="btn-outline"
                  >
                    그룹 참여하기
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="fade-in">
            {invitations.length > 0 ? (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mr-4">
                          <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-title-medium text-gray-900 mb-2">
                            그룹 초대
                          </h3>
                          <p className="text-body-medium text-gray-600 mb-2">
                            {invitation.invitedBy}님이 그룹에 초대했습니다.
                          </p>
                          {invitation.message && (
                            <p className="text-body-small text-gray-500 mb-3 p-3 bg-gray-50 rounded-lg">
                              "{invitation.message}"
                            </p>
                          )}
                          <div className="flex items-center text-body-small text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {invitation.createdAt.toLocaleDateString('ko-KR')} 초대됨
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          className="btn-success px-4 py-2 text-sm"
                        >
                          수락
                        </button>
                        <button
                          onClick={() => handleDeclineInvitation(invitation.id)}
                          className="btn-secondary px-4 py-2 text-sm"
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Mail className="empty-state-icon" />
                <h3 className="empty-state-title">새로운 초대가 없습니다</h3>
                <p className="empty-state-description">
                  친구나 가족으로부터 그룹 초대를 받으면 여기에 표시됩니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 도움말 섹션 */}
        <div className="mt-12">
          <div className="alert-info">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">그룹 기능 안내</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>그룹에서는 멤버들과 함께 심리검사를 진행하고 결과를 공유할 수 있습니다.</li>
                  <li>매주 자동으로 생성되는 위클리 리포트를 통해 관계의 변화를 확인하세요.</li>
                  <li>그룹 미션과 챌린지를 통해 더 깊은 유대감을 형성할 수 있습니다.</li>
                  <li>모든 데이터는 암호화되어 안전하게 보호됩니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupsPage;
