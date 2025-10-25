import React, { useState, useEffect } from 'react';
import { useAuth } from '@store/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import { 
  Award, 
  Star, 
  Trophy, 
  Target, 
  Heart, 
  Users, 
  Brain,
  Calendar,
  Zap,
  Crown,
  Medal,
  Sparkles,
  TrendingUp,
  CheckCircle,
  Lock
} from 'lucide-react';
import { AIWarning } from '../../components/Common/AIWarning';
import { useAIWarning } from '../../hooks/useAIWarning';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'mood_tracking' | 'profiling' | 'group_activity' | 'chat_engagement' | 'consistency' | 'growth';
  icon: string;
  color: string;
  points: number;
  requirement: {
    type: 'count' | 'streak' | 'completion' | 'score';
    target: number;
    description: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  progress: number;
}

interface UserStats {
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
  achievements: Achievement[];
  streaks: {
    moodTracking: number;
    chatEngagement: number;
    groupParticipation: number;
  };
  milestones: {
    daysActive: number;
    moodRecords: number;
    chatMessages: number;
    groupReports: number;
    profilingCompleted: number;
  };
}

/**
 * 🏆 성취 및 뱃지 페이지
 * 게이미피케이션 요소를 통한 사용자 참여 증진
 * 
 * 심리상담가 1,2가 설계한 동기부여 시스템
 * 건전한 경쟁과 자기 성장에 초점
 */
const AchievementsPage: React.FC = () => {
  const { user } = useAuth();
  const functions = getFunctions();
  
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | Achievement['category']>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  // AI 경고 시스템
  const aiWarning = useAIWarning({
    analysisType: 'general',
    severity: 'low',
    includeEmergencyContact: false
  });

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Firebase Functions를 통한 실제 사용자 통계 로드
      const getUserStats = httpsCallable(functions, 'getUserStats');
      
      const statsResult = await getUserStats({ userId: user.uid });
      const statsData = statsResult.data as { success: boolean; userStats: UserStats };
      
      if (statsData.success) {
        setUserStats(statsData.userStats);
        toast.success('성취 정보를 불러왔습니다!');
      } else {
        // 폴백으로 목업 데이터 사용
        const mockStats = getMockUserStats();
        setUserStats(mockStats);
      }
    } catch (error) {
      console.error('사용자 통계 로드 오류:', error);
      toast.error('통계를 불러오는 중 오류가 발생했습니다.');
      
      // 폴백 데이터
      const mockStats = getMockUserStats();
      setUserStats(mockStats);
    } finally {
      setIsLoading(false);
    }
  };

  const getMockUserStats = (): UserStats => {
    const achievements: Achievement[] = [
      {
        id: 'first_mood',
        title: '첫 감정 기록',
        description: '첫 번째 감정을 기록했습니다',
        category: 'mood_tracking',
        icon: 'heart',
        color: 'text-pink-600 bg-pink-100',
        points: 10,
        requirement: {
          type: 'count',
          target: 1,
          description: '감정 기록 1회'
        },
        rarity: 'common',
        unlockedAt: new Date('2024-10-20'),
        progress: 100
      },
      {
        id: 'mood_streak_7',
        title: '꾸준한 기록자',
        description: '7일 연속 감정을 기록했습니다',
        category: 'mood_tracking',
        icon: 'calendar',
        color: 'text-green-600 bg-green-100',
        points: 50,
        requirement: {
          type: 'streak',
          target: 7,
          description: '7일 연속 기록'
        },
        rarity: 'rare',
        unlockedAt: new Date('2024-10-21'),
        progress: 100
      },
      {
        id: 'profiling_complete',
        title: '자기 탐험가',
        description: '개인 프로파일링을 완료했습니다',
        category: 'profiling',
        icon: 'brain',
        color: 'text-purple-600 bg-purple-100',
        points: 100,
        requirement: {
          type: 'completion',
          target: 1,
          description: '프로파일링 완료'
        },
        rarity: 'epic',
        unlockedAt: new Date('2024-10-19'),
        progress: 100
      },
      {
        id: 'chat_enthusiast',
        title: '대화의 달인',
        description: '코코와 50번 대화했습니다',
        category: 'chat_engagement',
        icon: 'sparkles',
        color: 'text-blue-600 bg-blue-100',
        points: 75,
        requirement: {
          type: 'count',
          target: 50,
          description: '챗봇과 50회 대화'
        },
        rarity: 'rare',
        progress: 76
      },
      {
        id: 'group_leader',
        title: '그룹 리더',
        description: '그룹을 생성하고 5명을 초대했습니다',
        category: 'group_activity',
        icon: 'crown',
        color: 'text-yellow-600 bg-yellow-100',
        points: 200,
        requirement: {
          type: 'count',
          target: 5,
          description: '그룹 멤버 5명 초대'
        },
        rarity: 'legendary',
        progress: 60
      },
      {
        id: 'consistency_master',
        title: '일관성의 대가',
        description: '30일 연속 앱을 사용했습니다',
        category: 'consistency',
        icon: 'trophy',
        color: 'text-orange-600 bg-orange-100',
        points: 300,
        requirement: {
          type: 'streak',
          target: 30,
          description: '30일 연속 사용'
        },
        rarity: 'legendary',
        progress: 23
      }
    ];

    return {
      totalPoints: 235,
      level: 3,
      nextLevelPoints: 300,
      achievements,
      streaks: {
        moodTracking: 7,
        chatEngagement: 3,
        groupParticipation: 2
      },
      milestones: {
        daysActive: 15,
        moodRecords: 12,
        chatMessages: 38,
        groupReports: 2,
        profilingCompleted: 1
      }
    };
  };

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'heart': return <Heart className="w-6 h-6" />;
      case 'calendar': return <Calendar className="w-6 h-6" />;
      case 'brain': return <Brain className="w-6 h-6" />;
      case 'sparkles': return <Sparkles className="w-6 h-6" />;
      case 'crown': return <Crown className="w-6 h-6" />;
      case 'trophy': return <Trophy className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common': return '일반';
      case 'rare': return '희귀';
      case 'epic': return '영웅';
      case 'legendary': return '전설';
      default: return '일반';
    }
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'mood_tracking': return <Heart className="w-4 h-4" />;
      case 'profiling': return <Brain className="w-4 h-4" />;
      case 'group_activity': return <Users className="w-4 h-4" />;
      case 'chat_engagement': return <Sparkles className="w-4 h-4" />;
      case 'consistency': return <Calendar className="w-4 h-4" />;
      case 'growth': return <TrendingUp className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const getCategoryName = (category: Achievement['category']) => {
    switch (category) {
      case 'mood_tracking': return '감정 기록';
      case 'profiling': return '프로파일링';
      case 'group_activity': return '그룹 활동';
      case 'chat_engagement': return '대화 참여';
      case 'consistency': return '꾸준함';
      case 'growth': return '성장';
      default: return '기타';
    }
  };

  const filteredAchievements = userStats?.achievements.filter(achievement => {
    const categoryMatch = activeCategory === 'all' || achievement.category === activeCategory;
    const unlockedMatch = !showUnlockedOnly || achievement.unlockedAt;
    return categoryMatch && unlockedMatch;
  }) || [];

  if (isLoading) {
    return <LoadingSpinner message="성취 데이터를 불러오고 있습니다..." />;
  }

  if (!userStats) {
    return <ErrorMessage message="성취 데이터를 불러올 수 없습니다." />;
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full mb-6">
            <Trophy className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-display-medium text-gray-900 mb-4">
            성취 및 뱃지
          </h1>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto">
            당신의 성장 여정을 기록하고 성취를 축하해보세요.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* 사용자 레벨 및 통계 */}
          <div className="bg-white rounded-xl shadow-soft p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 레벨 정보 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mb-4">
                  <Star className="w-10 h-10 text-pink-600" />
                </div>
                <h3 className="text-headline-large text-gray-900 mb-2">
                  레벨 {userStats.level}
                </h3>
                <p className="text-body-medium text-gray-600 mb-4">
                  {userStats.totalPoints} / {userStats.nextLevelPoints} 포인트
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(userStats.totalPoints / userStats.nextLevelPoints) * 100}%` }}
                  />
                </div>
              </div>

              {/* 연속 기록 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full mb-4">
                  <Zap className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-headline-large text-gray-900 mb-2">
                  {userStats.streaks.moodTracking}일
                </h3>
                <p className="text-body-medium text-gray-600">
                  감정 기록 연속
                </p>
              </div>

              {/* 총 성취 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mb-4">
                  <Medal className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="text-headline-large text-gray-900 mb-2">
                  {userStats.achievements.filter(a => a.unlockedAt).length}
                </h3>
                <p className="text-body-medium text-gray-600">
                  획득한 뱃지
                </p>
              </div>
            </div>
          </div>

          {/* 필터 */}
          <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
                {(['mood_tracking', 'profiling', 'group_activity', 'chat_engagement', 'consistency', 'growth'] as const).map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                      activeCategory === category
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getCategoryIcon(category)}
                    <span className="ml-1">{getCategoryName(category)}</span>
                  </button>
                ))}
              </div>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnlockedOnly}
                  onChange={(e) => setShowUnlockedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                />
                <span className="text-body-medium text-gray-700">획득한 뱃지만 보기</span>
              </label>
            </div>
          </div>

          {/* 성취 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`bg-white rounded-xl shadow-soft p-6 border-2 ${getRarityColor(achievement.rarity)} ${
                  achievement.unlockedAt ? '' : 'opacity-75'
                }`}
              >
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${achievement.color}`}>
                    {getAchievementIcon(achievement.icon)}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                      achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                      achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getRarityLabel(achievement.rarity)}
                    </span>
                    
                    {achievement.unlockedAt ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* 제목 및 설명 */}
                <h3 className="text-title-medium text-gray-900 mb-2">
                  {achievement.title}
                </h3>
                <p className="text-body-medium text-gray-600 mb-4">
                  {achievement.description}
                </p>

                {/* 요구사항 */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-body-small text-gray-700 mb-2">
                    <strong>조건:</strong> {achievement.requirement.description}
                  </p>
                  
                  {/* 진행률 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-body-small text-gray-600">
                      진행률
                    </span>
                    <span className="text-body-small font-medium text-gray-900">
                      {achievement.progress}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        achievement.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(achievement.progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* 포인트 및 날짜 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-body-small font-medium text-gray-900">
                      {achievement.points} 포인트
                    </span>
                  </div>
                  
                  {achievement.unlockedAt && (
                    <span className="text-body-small text-gray-500">
                      {achievement.unlockedAt.toLocaleDateString('ko-KR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-headline-medium text-gray-900 mb-2">
                해당 카테고리의 성취가 없습니다
              </h3>
              <p className="text-body-medium text-gray-600 mb-6">
                다른 카테고리를 선택하거나 필터를 변경해보세요.
              </p>
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setShowUnlockedOnly(false);
                }}
                className="btn-primary"
              >
                전체 보기
              </button>
            </div>
          )}

          {/* 다음 목표 */}
          <div className="bg-white rounded-xl shadow-soft p-8 mt-8">
            <h3 className="text-headline-medium text-gray-900 mb-6 flex items-center">
              <Target className="w-6 h-6 mr-2 text-pink-500" />
              다음 목표
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4">
                <h4 className="text-title-medium text-gray-900 mb-2">
                  레벨 {userStats.level + 1} 달성
                </h4>
                <p className="text-body-medium text-gray-600 mb-3">
                  {userStats.nextLevelPoints - userStats.totalPoints}포인트 더 필요
                </p>
                <div className="w-full bg-white rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${(userStats.totalPoints / userStats.nextLevelPoints) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4">
                <h4 className="text-title-medium text-gray-900 mb-2">
                  30일 연속 기록
                </h4>
                <p className="text-body-medium text-gray-600 mb-3">
                  {30 - userStats.streaks.moodTracking}일 더 필요
                </p>
                <div className="w-full bg-white rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                    style={{ width: `${(userStats.streaks.moodTracking / 30) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI 경고 */}
        <div className="mt-8">
          <AIWarning {...aiWarning} />
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
