import React, { useState, useEffect } from 'react';
import { useAuth } from '@store/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import { 
  Target, 
  Users, 
  TrendingUp,
  BarChart3,
  Activity,
  Lightbulb,
  Heart,
  Star,
  Shield,
  Zap,
  Globe,
  BookOpen,
  Award,
  Compass,
  Eye,
  Brain,
  Sparkles,
  User
} from 'lucide-react';
import { AIWarning } from '../../components/Common/AIWarning';
import { useAIWarning } from '../../hooks/useAIWarning';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

interface ValueAnalysis {
  id: string;
  userId: string;
  groupId: string;
  personalValues: PersonalValue[];
  groupValues: GroupValue[];
  compatibility: CompatibilityAnalysis;
  recommendations: Recommendation[];
  insights: Insight[];
  createdAt: Date;
  updatedAt: Date;
}

interface PersonalValue {
  id: string;
  name: string;
  description: string;
  importance: number; // 1-10
  category: 'core' | 'relationship' | 'achievement' | 'security' | 'growth' | 'creativity';
  icon: string;
  color: string;
}

interface GroupValue {
  id: string;
  name: string;
  description: string;
  averageImportance: number;
  memberCount: number;
  category: string;
  consensus: number; // 0-100%
  icon: string;
  color: string;
}

interface CompatibilityAnalysis {
  overallScore: number; // 0-100
  alignmentAreas: string[];
  conflictAreas: string[];
  growthOpportunities: string[];
  riskFactors: string[];
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'communication' | 'activity' | 'decision' | 'conflict';
  impact: number; // 1-10
}

interface Insight {
  id: string;
  type: 'pattern' | 'surprise' | 'opportunity' | 'warning';
  title: string;
  description: string;
  confidence: number; // 0-100%
  actionable: boolean;
}

/**
 * 🎯 가치관 분석 페이지
 * 개인과 그룹의 가치관을 분석하고 비교하여 관계 개선 방향을 제시
 * 
 * 심리상담가 1,2가 설계한 가치관 분석 시스템
 * 시각적 분석과 AI 인사이트로 깊이 있는 관계 이해 제공
 */
const ValueAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const functions = getFunctions();
  
  const [analysis, setAnalysis] = useState<ValueAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'group' | 'comparison' | 'insights'>('personal');

  // AI 경고 시스템
  const aiWarning = useAIWarning({
    analysisType: 'communication',
    severity: 'medium'
  });

  useEffect(() => {
    if (user) {
      loadValueAnalysis();
    }
  }, [user]);

  const loadValueAnalysis = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Firebase Functions를 통한 실제 가치관 분석 데이터 로드
      const getValueAnalysis = httpsCallable(functions, 'getValueAnalysis');
      const result = await getValueAnalysis({ userId: user.uid });
      const data = result.data as { success: boolean; analysis: ValueAnalysis };
      
      if (data.success && data.analysis) {
        setAnalysis({
          ...data.analysis,
          createdAt: new Date(data.analysis.createdAt),
          updatedAt: new Date(data.analysis.updatedAt)
        });
        toast.success('가치관 분석을 불러왔습니다!');
      } else {
        // 폴백으로 목업 데이터 사용
        setAnalysis(getMockAnalysis());
      }
    } catch (error) {
      console.error('가치관 분석 로드 오류:', error);
      toast.error('가치관 분석을 불러오는 중 오류가 발생했습니다.');
      
      // 폴백 데이터
      setAnalysis(getMockAnalysis());
    } finally {
      setIsLoading(false);
    }
  };

  const getValueIcon = (iconName: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      heart: <Heart className="w-6 h-6" />,
      star: <Star className="w-6 h-6" />,
      shield: <Shield className="w-6 h-6" />,
      zap: <Zap className="w-6 h-6" />,
      globe: <Globe className="w-6 h-6" />,
      book: <BookOpen className="w-6 h-6" />,
      award: <Award className="w-6 h-6" />,
      compass: <Compass className="w-6 h-6" />,
      eye: <Eye className="w-6 h-6" />,
      brain: <Brain className="w-6 h-6" />,
      sparkles: <Sparkles className="w-6 h-6" />
    };
    return icons[iconName] || <Target className="w-6 h-6" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'bg-red-100 text-red-800';
      case 'relationship': return 'bg-pink-100 text-pink-800';
      case 'achievement': return 'bg-blue-100 text-blue-800';
      case 'security': return 'bg-green-100 text-green-800';
      case 'growth': return 'bg-purple-100 text-purple-800';
      case 'creativity': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'core': return '핵심 가치';
      case 'relationship': return '관계 가치';
      case 'achievement': return '성취 가치';
      case 'security': return '안전 가치';
      case 'growth': return '성장 가치';
      case 'creativity': return '창의 가치';
      default: return '기타';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <BarChart3 className="w-5 h-5 text-blue-500" />;
      case 'surprise': return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'opportunity': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'warning': return <Shield className="w-5 h-5 text-red-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'pattern': return 'bg-blue-50 border-blue-200';
      case 'surprise': return 'bg-yellow-50 border-yellow-200';
      case 'opportunity': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getMockAnalysis = (): ValueAnalysis => {
    return {
      id: 'analysis_1',
      userId: 'user_1',
      groupId: 'group_1',
      personalValues: [
        {
          id: 'pv_1',
          name: '가족',
          description: '가족의 안녕과 행복이 가장 중요합니다.',
          importance: 9,
          category: 'core',
          icon: 'heart',
          color: 'red'
        },
        {
          id: 'pv_2',
          name: '성장',
          description: '지속적인 학습과 개인적 발전을 추구합니다.',
          importance: 8,
          category: 'growth',
          icon: 'trending-up',
          color: 'purple'
        },
        {
          id: 'pv_3',
          name: '창의성',
          description: '새로운 아이디어와 혁신적인 접근을 중시합니다.',
          importance: 7,
          category: 'creativity',
          icon: 'sparkles',
          color: 'yellow'
        },
        {
          id: 'pv_4',
          name: '안정성',
          description: '예측 가능하고 안전한 환경을 선호합니다.',
          importance: 6,
          category: 'security',
          icon: 'shield',
          color: 'green'
        }
      ],
      groupValues: [
        {
          id: 'gv_1',
          name: '협력',
          description: '함께 일하고 서로를 지원하는 것을 중시합니다.',
          averageImportance: 8.5,
          memberCount: 4,
          category: 'relationship',
          consensus: 85,
          icon: 'users',
          color: 'blue'
        },
        {
          id: 'gv_2',
          name: '성취',
          description: '목표 달성과 성과를 중요하게 생각합니다.',
          averageImportance: 7.2,
          memberCount: 4,
          category: 'achievement',
          consensus: 70,
          icon: 'award',
          color: 'blue'
        },
        {
          id: 'gv_3',
          name: '소통',
          description: '투명하고 정직한 소통을 중시합니다.',
          averageImportance: 8.8,
          memberCount: 4,
          category: 'relationship',
          consensus: 90,
          icon: 'message-circle',
          color: 'pink'
        }
      ],
      compatibility: {
        overallScore: 78,
        alignmentAreas: ['가족 중시', '성장 지향', '협력 정신'],
        conflictAreas: ['안정성 vs 변화', '개인주의 vs 집단주의'],
        growthOpportunities: ['창의적 협업', '감정적 소통', '갈등 해결'],
        riskFactors: ['가치 충돌 시 소통 부족', '변화에 대한 저항']
      },
      recommendations: [
        {
          id: 'rec_1',
          title: '가치관 대화 시간 정기화',
          description: '매주 가족 회의에서 각자의 가치관과 우선순위를 공유하는 시간을 가집니다.',
          priority: 'high',
          category: 'communication',
          impact: 9
        },
        {
          id: 'rec_2',
          title: '창의적 프로젝트 함께하기',
          description: '가족이 함께 참여할 수 있는 창의적인 활동을 계획하고 실행합니다.',
          priority: 'medium',
          category: 'activity',
          impact: 7
        },
        {
          id: 'rec_3',
          title: '갈등 해결 프로세스 정립',
          description: '가치관 충돌이 발생했을 때의 해결 절차를 미리 정해둡니다.',
          priority: 'high',
          category: 'conflict',
          impact: 8
        }
      ],
      insights: [
        {
          id: 'insight_1',
          type: 'pattern',
          title: '가족 중심의 가치관 패턴',
          description: '모든 구성원이 가족을 최우선 가치로 두고 있어 강한 결속력을 보입니다.',
          confidence: 95,
          actionable: true
        },
        {
          id: 'insight_2',
          type: 'opportunity',
          title: '성장과 창의성의 시너지',
          description: '개인의 성장 욕구와 창의성 추구가 결합되면 혁신적인 결과를 낼 수 있습니다.',
          confidence: 88,
          actionable: true
        },
        {
          id: 'insight_3',
          type: 'warning',
          title: '안정성과 변화의 균형',
          description: '안정성을 중시하는 성향과 성장을 위한 변화 사이의 균형이 필요합니다.',
          confidence: 82,
          actionable: true
        }
      ],
      createdAt: new Date('2024-10-20'),
      updatedAt: new Date('2024-10-21')
    };
  };

  if (isLoading) {
    return <LoadingSpinner message="가치관 분석을 불러오고 있습니다..." />;
  }

  if (!analysis) {
    return <ErrorMessage message="가치관 분석을 불러올 수 없습니다." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-6">
            <Target className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-display-medium text-gray-900 mb-4">
            가치관 분석
          </h1>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto mb-6">
            개인과 그룹의 가치관을 분석하여 더 나은 관계를 만들어보세요.
          </p>
          
          {/* 전체 호환성 점수 */}
          <div className="inline-flex items-center space-x-3 bg-white rounded-xl shadow-soft px-6 py-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-6 h-6 text-indigo-600" />
              <span className="text-lg font-semibold text-gray-900">전체 호환성</span>
            </div>
            <div className="text-3xl font-bold text-indigo-600">
              {analysis.compatibility.overallScore}%
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* 탭 네비게이션 */}
          <div className="bg-white rounded-xl shadow-soft p-2 mb-8">
            <div className="flex space-x-2">
              {[
                { id: 'personal', label: '개인 가치관', icon: <Heart className="w-5 h-5" /> },
                { id: 'group', label: '그룹 가치관', icon: <Users className="w-5 h-5" /> },
                { id: 'comparison', label: '비교 분석', icon: <BarChart3 className="w-5 h-5" /> },
                { id: 'insights', label: 'AI 인사이트', icon: <Brain className="w-5 h-5" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="space-y-8">
            {/* 개인 가치관 */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analysis.personalValues.map(value => (
                  <div
                    key={value.id}
                    className="bg-white rounded-xl shadow-soft p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${value.color === 'red' ? 'bg-red-100 text-red-600' :
                        value.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                        value.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                        value.color === 'green' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'}`}>
                        {getValueIcon(value.icon)}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {value.importance}
                        </div>
                        <div className="text-sm text-gray-500">중요도</div>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {value.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {value.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(value.category)}`}>
                        {getCategoryName(value.category)}
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            value.color === 'red' ? 'bg-red-500' :
                            value.color === 'purple' ? 'bg-purple-500' :
                            value.color === 'yellow' ? 'bg-yellow-500' :
                            value.color === 'green' ? 'bg-green-500' :
                            'bg-gray-500'
                          }`}
                          style={{ width: `${value.importance * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 그룹 가치관 */}
            {activeTab === 'group' && (
              <div className="space-y-6">
                {analysis.groupValues.map(value => (
                  <div key={value.id} className="bg-white rounded-xl shadow-soft p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg ${
                          value.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                          value.color === 'pink' ? 'bg-pink-100 text-pink-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {getValueIcon(value.icon)}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {value.name}
                          </h3>
                          <p className="text-gray-600">
                            {value.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {value.averageImportance.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-500">평균 중요도</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">합의도</span>
                          <span className="text-sm text-gray-600">{value.consensus}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${value.consensus}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">참여자</span>
                          <span className="text-sm text-gray-600">{value.memberCount}명</span>
                        </div>
                        <div className="flex space-x-1">
                          {Array.from({ length: value.memberCount }).map((_, i) => (
                            <div key={i} className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-blue-600" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 비교 분석 */}
            {activeTab === 'comparison' && (
              <div className="space-y-6">
                {/* 호환성 분석 */}
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    호환성 분석
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 일치 영역 */}
                    <div>
                      <h4 className="text-lg font-medium text-green-600 mb-3 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        일치 영역
                      </h4>
                      <div className="space-y-2">
                        {analysis.compatibility.alignmentAreas.map((area, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-gray-700">{area}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* 충돌 영역 */}
                    <div>
                      <h4 className="text-lg font-medium text-red-600 mb-3 flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        주의 영역
                      </h4>
                      <div className="space-y-2">
                        {analysis.compatibility.conflictAreas.map((area, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-gray-700">{area}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 추천사항 */}
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    맞춤 추천사항
                  </h3>
                  
                  <div className="space-y-4">
                    {analysis.recommendations.map(recommendation => (
                      <div key={recommendation.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {recommendation.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
                              recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {recommendation.priority === 'high' ? '높음' :
                               recommendation.priority === 'medium' ? '보통' : '낮음'}
                            </span>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm text-gray-600">{recommendation.impact}/10</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600">
                          {recommendation.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI 인사이트 */}
            {activeTab === 'insights' && (
              <div className="space-y-6">
                {analysis.insights.map(insight => (
                  <div key={insight.id} className={`bg-white rounded-xl shadow-soft p-6 border-l-4 ${getInsightColor(insight.type)}`}>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getInsightIcon(insight.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {insight.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-500">
                              신뢰도: {insight.confidence}%
                            </div>
                            {insight.actionable && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                실행 가능
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 leading-relaxed">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default ValueAnalysisPage;
