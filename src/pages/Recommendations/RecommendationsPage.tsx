import React, { useState, useEffect } from 'react';
import { useAuth } from '@store/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@config/firebase';
import toast from 'react-hot-toast';
import { 
  Lightbulb, 
  BookOpen, 
  Activity, 
  Brain, 
  Users, 
  Star,
  Clock,
  Target,
  Heart,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Filter,
  Play,
  CheckCircle
} from 'lucide-react';

// AI 경고 시스템
import AIWarning from '@components/Common/AIWarning';
import { useAIWarning } from '@hooks/useAIWarning';

interface Recommendation {
  id: string;
  type: 'content' | 'activity' | 'exercise' | 'mindfulness' | 'social' | 'learning';
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  actionItems: string[];
  expectedBenefit: string;
  relatedUrl?: string;
}

/**
 * 🎯 개인화 추천 페이지
 * AI 기반 맞춤형 콘텐츠 및 활동 추천
 * 
 * 심리상담가 1,2가 설계한 개인화 알고리즘 기반
 * 사용자의 프로필, 감정 패턴, 행동 데이터를 종합 분석
 */
const RecommendationsPage: React.FC = () => {
  const { user } = useAuth();
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'content' | 'activity' | 'mindfulness'>('all');
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  
  // AI 경고 시스템
  const aiWarning = useAIWarning({ 
    analysisType: 'general', 
    severity: 'medium' 
  });

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const generateRecommendations = httpsCallable(functions, 'generateRecommendations');
      const result = await generateRecommendations({
        userId: user.uid,
        type: 'general',
        limit: 10
      });

      if (result.data.success) {
        setRecommendations(result.data.recommendations);
      }
    } catch (error) {
      console.error('추천 로드 오류:', error);
      toast.error('추천을 불러오는 중 오류가 발생했습니다.');
      
      // 폴백 추천 데이터
      setRecommendations(getFallbackRecommendations());
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (recommendationId: string, feedback: 'helpful' | 'not_helpful') => {
    try {
      const saveFeedback = httpsCallable(functions, 'saveRecommendationFeedback');
      await saveFeedback({
        recommendationId,
        feedback
      });

      toast.success(feedback === 'helpful' ? '도움이 되었다고 기록했습니다! 👍' : '피드백을 기록했습니다.');
    } catch (error) {
      console.error('피드백 저장 오류:', error);
      toast.error('피드백 저장 중 오류가 발생했습니다.');
    }
  };

  const handleComplete = (recommendationId: string) => {
    setCompletedItems(prev => new Set([...prev, recommendationId]));
    toast.success('완료했습니다! 🎉');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content': return <BookOpen className="w-5 h-5" />;
      case 'activity': return <Activity className="w-5 h-5" />;
      case 'mindfulness': return <Brain className="w-5 h-5" />;
      case 'social': return <Users className="w-5 h-5" />;
      case 'learning': return <Target className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'content': return 'text-blue-600 bg-blue-100';
      case 'activity': return 'text-green-600 bg-green-100';
      case 'mindfulness': return 'text-purple-600 bg-purple-100';
      case 'social': return 'text-pink-600 bg-pink-100';
      case 'learning': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredRecommendations = recommendations.filter(rec => 
    activeFilter === 'all' || rec.type === activeFilter
  );

  const getFallbackRecommendations = (): Recommendation[] => [
    {
      id: 'fallback_1',
      type: 'mindfulness',
      title: '5분 마음챙김 명상',
      description: '간단한 호흡 명상으로 하루를 시작해보세요',
      reason: '스트레스 완화와 집중력 향상에 도움됩니다',
      priority: 'high',
      estimatedTime: '5분',
      difficulty: 'easy',
      tags: ['명상', '호흡', '스트레스해소'],
      actionItems: [
        '편안한 자세로 앉기',
        '눈을 감고 호흡에 집중하기',
        '5분간 천천히 호흡하기'
      ],
      expectedBenefit: '마음이 진정되고 하루를 긍정적으로 시작할 수 있습니다'
    },
    {
      id: 'fallback_2',
      type: 'activity',
      title: '감사 일기 쓰기',
      description: '오늘 감사한 일 3가지를 적어보세요',
      reason: '긍정적인 마음가짐을 기를 수 있습니다',
      priority: 'medium',
      estimatedTime: '10분',
      difficulty: 'easy',
      tags: ['감사', '긍정성', '일기'],
      actionItems: [
        '조용한 공간 찾기',
        '감사한 일 3가지 떠올리기',
        '각각의 이유 적어보기'
      ],
      expectedBenefit: '긍정적인 감정이 증가하고 행복감을 느낄 수 있습니다'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-soft p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">맞춤형 추천을 생성하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-6">
            <Lightbulb className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-display-medium text-gray-900 mb-4">
            나만의 추천
          </h1>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto">
            AI가 당신의 프로필과 감정 패턴을 분석하여 맞춤형 콘텐츠와 활동을 추천합니다.
          </p>
        </div>

        {/* AI 경고 시스템 */}
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

        <div className="max-w-6xl mx-auto">
          {/* 필터 및 새로고침 */}
          <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setActiveFilter('content')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'content'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  콘텐츠
                </button>
                <button
                  onClick={() => setActiveFilter('activity')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'activity'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  활동
                </button>
                <button
                  onClick={() => setActiveFilter('mindfulness')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'mindfulness'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  마음챙김
                </button>
              </div>

              <button
                onClick={loadRecommendations}
                className="btn-outline flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                새로 추천받기
              </button>
            </div>
          </div>

          {/* 추천 목록 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRecommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className={`bg-white rounded-xl shadow-soft p-6 border-l-4 ${getPriorityColor(recommendation.priority)} ${
                  completedItems.has(recommendation.id) ? 'opacity-75' : ''
                }`}
              >
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${getTypeColor(recommendation.type)}`}>
                      {getTypeIcon(recommendation.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-title-medium text-gray-900 mb-1">
                        {recommendation.title}
                      </h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recommendation.difficulty)}`}>
                          {recommendation.difficulty === 'easy' ? '쉬움' : 
                           recommendation.difficulty === 'medium' ? '보통' : '어려움'}
                        </span>
                        <span className="flex items-center text-body-small text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {recommendation.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {completedItems.has(recommendation.id) && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>

                {/* 설명 */}
                <p className="text-body-medium text-gray-700 mb-3">
                  {recommendation.description}
                </p>

                {/* 추천 이유 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-body-small text-blue-800">
                    <strong>추천 이유:</strong> {recommendation.reason}
                  </p>
                </div>

                {/* 태그 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {recommendation.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 실행 방법 */}
                <div className="mb-4">
                  <h4 className="text-body-medium font-medium text-gray-700 mb-2">
                    실행 방법:
                  </h4>
                  <ul className="space-y-1">
                    {recommendation.actionItems.map((item, index) => (
                      <li key={index} className="text-body-small text-gray-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 기대 효과 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-body-small text-green-800">
                    <Heart className="w-4 h-4 inline mr-1" />
                    <strong>기대 효과:</strong> {recommendation.expectedBenefit}
                  </p>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {!completedItems.has(recommendation.id) && (
                      <button
                        onClick={() => handleComplete(recommendation.id)}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        시작하기
                      </button>
                    )}
                    
                    {recommendation.relatedUrl && (
                      <a
                        href={recommendation.relatedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline text-sm px-4 py-2"
                      >
                        자세히 보기
                      </a>
                    )}
                  </div>

                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleFeedback(recommendation.id, 'helpful')}
                      className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                      title="도움됨"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback(recommendation.id, 'not_helpful')}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="도움안됨"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRecommendations.length === 0 && (
            <div className="text-center py-12">
              <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-headline-medium text-gray-900 mb-2">
                해당 카테고리의 추천이 없습니다
              </h3>
              <p className="text-body-medium text-gray-600 mb-6">
                다른 카테고리를 선택하거나 새로 추천받기를 시도해보세요.
              </p>
              <button
                onClick={() => setActiveFilter('all')}
                className="btn-primary"
              >
                전체 보기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationsPage;
