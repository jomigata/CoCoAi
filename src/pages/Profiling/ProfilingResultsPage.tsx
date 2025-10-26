import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@config/firebase';
import toast from 'react-hot-toast';
import { 
  Brain, 
  Heart, 
  Users, 
  Target, 
  Star, 
  Download,
  Share2,
  RefreshCw,
  TrendingUp,
  Award,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';

// AI 경고 시스템 import
import AIWarning from '@components/Common/AIWarning';
import { useProfilingWarning } from '@hooks/useAIWarning';
import LoadingSpinner from '@components/Common/LoadingSpinner';

interface PersonalProfile {
  ageGroup: string;
  completedAt: Date;
  profileData: {
    selfEsteem: number;
    stressCoping: string[];
    relationshipPattern: string;
    coreValues: string[];
    strengths: string[];
  };
  mindMap: {
    personality: string;
    emotionalPattern: string;
    communicationStyle: string;
  };
}

const ProfilingResultsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<PersonalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'recommendations'>('overview');
  
  // AI 경고 시스템 Hook
  const aiWarning = useProfilingWarning();

  useEffect(() => {
    if (!authLoading) {
      loadProfile();
    }
  }, [user, authLoading]);

  const loadProfile = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists() && userDoc.data().personalProfile) {
        const profileData = userDoc.data().personalProfile;
        setProfile(profileData);
      } else {
        // 프로파일링 결과가 없는 경우
        toast.error('프로파일링 결과를 찾을 수 없습니다. 먼저 프로파일링을 완료해주세요.');
        navigate('/profiling');
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error);
      toast.error('프로필을 불러오는 중 오류가 발생했습니다.');
      navigate('/profiling');
    } finally {
      setIsLoading(false);
    }
  };

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <LoadingSpinner message="인증 상태를 확인하는 중..." />
      </div>
    );
  }

  // 프로필 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <LoadingSpinner message="프로파일을 불러오는 중..." />
      </div>
    );
  }

  // 프로필이 없는 경우 (이미 navigate로 처리됨)
  if (!profile) {
    return null;
  }

  const getSelfEsteemLevel = (score: number): { level: string; color: string; description: string } => {
    if (score >= 80) {
      return { 
        level: '매우 높음', 
        color: 'text-green-600 bg-green-100', 
        description: '자신에 대한 긍정적 인식이 매우 강합니다.' 
      };
    } else if (score >= 60) {
      return { 
        level: '높음', 
        color: 'text-blue-600 bg-blue-100', 
        description: '자신에 대해 전반적으로 긍정적으로 생각합니다.' 
      };
    } else if (score >= 40) {
      return { 
        level: '보통', 
        color: 'text-yellow-600 bg-yellow-100', 
        description: '자아존중감이 상황에 따라 변동됩니다.' 
      };
    } else if (score >= 20) {
      return { 
        level: '낮음', 
        color: 'text-orange-600 bg-orange-100', 
        description: '자신에 대한 확신이 부족할 수 있습니다.' 
      };
    } else {
      return { 
        level: '매우 낮음', 
        color: 'text-red-600 bg-red-100', 
        description: '자아존중감 향상이 필요합니다.' 
      };
    }
  };

  const getRecommendations = () => {
    if (!profile) return [];

    const recommendations = [];
    const { profileData } = profile;

    // 자아존중감 기반 추천
    if (profileData.selfEsteem < 60) {
      recommendations.push({
        category: '자아존중감 향상',
        icon: <Heart className="w-5 h-5" />,
        title: '자기 긍정 연습',
        description: '매일 자신의 장점 3가지를 적어보는 습관을 만들어보세요.',
        action: '긍정 일기 시작하기'
      });
    }

    // 스트레스 대처 기반 추천
    if (profileData.stressCoping.includes('일시적으로 피하기')) {
      recommendations.push({
        category: '스트레스 관리',
        icon: <Brain className="w-5 h-5" />,
        title: '건강한 대처법 학습',
        description: '스트레스 상황에서 더 효과적인 대처 방법을 익혀보세요.',
        action: '스트레스 관리 가이드 보기'
      });
    }

    // 관계 패턴 기반 추천
    if (profileData.relationshipPattern.includes('내향적')) {
      recommendations.push({
        category: '대인관계 발전',
        icon: <Users className="w-5 h-5" />,
        title: '소통 기회 확대',
        description: '작은 그룹부터 시작해서 점진적으로 사회적 활동을 늘려보세요.',
        action: '소통 연습 프로그램 참여'
      });
    }

    // 강점 활용 추천
    if (profileData.strengths.length > 0) {
      recommendations.push({
        category: '강점 활용',
        icon: <Star className="w-5 h-5" />,
        title: `${profileData.strengths[0]} 강점 발휘`,
        description: '당신의 주요 강점을 더 적극적으로 활용할 수 있는 방법을 찾아보세요.',
        action: '강점 활용 가이드 보기'
      });
    }

    return recommendations;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WizCoCo 개인 프로파일링 결과',
          text: '나의 마음 지도를 확인해보세요!',
          url: window.location.href,
        });
      } catch (error) {
        console.error('공유 오류:', error);
      }
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 클립보드에 복사되었습니다.');
    }
  };

  const handleDownload = () => {
    // PDF 다운로드 기능 (추후 구현)
    toast.success('PDF 다운로드 기능은 곧 제공될 예정입니다.');
  };

  const selfEsteemInfo = getSelfEsteemLevel(profile.profileData.selfEsteem);
  const recommendations = getRecommendations();

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-display-medium text-gray-900 mb-4">
            나의 마음 지도
          </h1>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto mb-6">
            당신의 고유한 심리적 특성과 성장 방향을 확인해보세요.
          </p>
        </div>

        {/* AI 편향성 경고 */}
        <div className="mb-8">
          <AIWarning
            message={aiWarning.message}
            details={aiWarning.details}
            timestamp={aiWarning.timestamp}
            type={aiWarning.type}
            showDetails={false}
            className="max-w-4xl mx-auto"
          />
        </div>

        <div className="text-center">
          {/* 액션 버튼들 */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handleShare}
              className="btn-outline flex items-center"
            >
              <Share2 className="w-4 h-4 mr-2" />
              공유하기
            </button>
            <button
              onClick={handleDownload}
              className="btn-outline flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF 다운로드
            </button>
            <button
              onClick={() => navigate('/profiling')}
              className="btn-ghost flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 검사하기
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="tab-list">
            <button
              onClick={() => setActiveTab('overview')}
              className={`tab-button ${activeTab === 'overview' ? 'active' : 'inactive'}`}
            >
              전체 개요
            </button>
            <button
              onClick={() => setActiveTab('detailed')}
              className={`tab-button ${activeTab === 'detailed' ? 'active' : 'inactive'}`}
            >
              상세 분석
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`tab-button ${activeTab === 'recommendations' ? 'active' : 'inactive'}`}
            >
              맞춤 추천
            </button>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6 fade-in">
              {/* 마음 지도 카드 */}
              <div className="card-elevated">
                <div className="text-center mb-8">
                  <h2 className="text-headline-large text-gray-900 mb-4">
                    {user?.displayName}님의 마음 지도
                  </h2>
                  <p className="text-body-medium text-gray-600">
                    {new Date(profile.completedAt).toLocaleDateString('ko-KR')} 완성
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-pink-50 rounded-xl">
                    <Brain className="w-12 h-12 text-pink-600 mx-auto mb-4" />
                    <h3 className="text-title-medium text-gray-900 mb-2">성격 유형</h3>
                    <p className="text-body-large font-semibold text-pink-700">
                      {profile.mindMap.personality}
                    </p>
                  </div>

                  <div className="text-center p-6 bg-blue-50 rounded-xl">
                    <Heart className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-title-medium text-gray-900 mb-2">감정 패턴</h3>
                    <p className="text-body-large font-semibold text-blue-700">
                      {profile.mindMap.emotionalPattern}
                    </p>
                  </div>

                  <div className="text-center p-6 bg-green-50 rounded-xl">
                    <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-title-medium text-gray-900 mb-2">소통 스타일</h3>
                    <p className="text-body-large font-semibold text-green-700">
                      {profile.mindMap.communicationStyle}
                    </p>
                  </div>
                </div>
              </div>

              {/* 자아존중감 점수 */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-headline-small text-gray-900">자아존중감 점수</h3>
                  <div className={`badge ${selfEsteemInfo.color} px-4 py-2`}>
                    {selfEsteemInfo.level}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-body-medium text-gray-600">점수</span>
                    <span className="text-title-large font-bold text-gray-900">
                      {profile.profileData.selfEsteem}/100
                    </span>
                  </div>
                  <div className="progress-bar h-3">
                    <div 
                      className="progress-fill h-3" 
                      style={{ width: `${profile.profileData.selfEsteem}%` }}
                    />
                  </div>
                </div>
                
                <p className="text-body-medium text-gray-600">
                  {selfEsteemInfo.description}
                </p>
              </div>

              {/* 주요 강점 */}
              <div className="card">
                <h3 className="text-headline-small text-gray-900 mb-6 flex items-center">
                  <Star className="w-6 h-6 text-yellow-500 mr-2" />
                  주요 강점
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {profile.profileData.strengths.slice(0, 6).map((strength, index) => (
                    <div key={index} className="badge-primary text-center py-3">
                      {strength}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'detailed' && (
            <div className="space-y-6 fade-in">
              {/* 스트레스 대처 방식 */}
              <div className="card">
                <h3 className="text-headline-small text-gray-900 mb-6 flex items-center">
                  <Brain className="w-6 h-6 text-purple-500 mr-2" />
                  스트레스 대처 방식
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.profileData.stressCoping.map((method, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                      <span className="text-body-medium text-gray-700">{method}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 대인관계 패턴 */}
              <div className="card">
                <h3 className="text-headline-small text-gray-900 mb-6 flex items-center">
                  <Users className="w-6 h-6 text-blue-500 mr-2" />
                  대인관계 패턴
                </h3>
                <div className="p-6 bg-blue-50 rounded-xl">
                  <p className="text-body-large text-blue-800 font-medium">
                    {profile.profileData.relationshipPattern}
                  </p>
                </div>
              </div>

              {/* 핵심 가치관 */}
              <div className="card">
                <h3 className="text-headline-small text-gray-900 mb-6 flex items-center">
                  <Target className="w-6 h-6 text-green-500 mr-2" />
                  핵심 가치관
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {profile.profileData.coreValues.map((value, index) => (
                    <div key={index} className="badge-success text-center py-3">
                      {value}
                    </div>
                  ))}
                </div>
              </div>

              {/* 전체 강점 목록 */}
              <div className="card">
                <h3 className="text-headline-small text-gray-900 mb-6 flex items-center">
                  <Award className="w-6 h-6 text-yellow-500 mr-2" />
                  전체 강점 목록
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {profile.profileData.strengths.map((strength, index) => (
                    <div key={index} className="badge-warning text-center py-2">
                      {strength}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-6 fade-in">
              <div className="text-center mb-8">
                <Lightbulb className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-headline-large text-gray-900 mb-2">
                  맞춤형 성장 가이드
                </h2>
                <p className="text-body-medium text-gray-600">
                  당신의 프로파일 분석 결과를 바탕으로 한 개인 맞춤 추천입니다.
                </p>
              </div>

              {recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="card-hover">
                      <div className="flex items-start mb-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-pink-100 rounded-lg mr-4">
                          <div className="text-pink-600">
                            {rec.icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="badge-secondary text-xs mb-2">
                            {rec.category}
                          </div>
                          <h4 className="text-title-medium text-gray-900 mb-2">
                            {rec.title}
                          </h4>
                        </div>
                      </div>
                      <p className="text-body-medium text-gray-600 mb-4">
                        {rec.description}
                      </p>
                      <button className="btn-outline w-full">
                        {rec.action}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <TrendingUp className="empty-state-icon" />
                  <h3 className="empty-state-title">훌륭한 균형감을 보여주고 있습니다!</h3>
                  <p className="empty-state-description">
                    현재 심리적 상태가 안정적입니다. 지속적인 자기 관리를 통해 더욱 성장해보세요.
                  </p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-primary"
                  >
                    대시보드로 이동
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI 경고 메시지 */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="alert-info">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">AI 분석 결과에 대한 안내</p>
                <p>
                  이 프로파일링 결과는 AI 분석에 기반하며, 개인의 복잡한 심리를 완전히 반영하지 못할 수 있습니다. 
                  전문적인 심리 상담이 필요한 경우 전문가의 도움을 받으시기 바랍니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilingResultsPage;