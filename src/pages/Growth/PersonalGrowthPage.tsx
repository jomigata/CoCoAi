import React, { useState, useEffect } from 'react';
import { useAuth } from '@store/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  CheckCircle,
  Clock,
  Lightbulb,
  BarChart3,
  Brain,
  Heart,
  Zap,
  Award,
  RefreshCw,
  Star,
  Moon
} from 'lucide-react';

// AI 경고 시스템
import AIWarning from '@components/Common/AIWarning';
import { usePersonalWarning } from '@hooks/useAIWarning';

// 인터페이스 정의
interface EmotionalPattern {
  patternType: 'cyclic' | 'trending' | 'stable' | 'volatile' | 'seasonal';
  description: string;
  strength: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'irregular';
  triggers: string[];
  peakTimes: string[];
  lowTimes: string[];
}

interface GrowthArea {
  area: 'emotional_regulation' | 'stress_management' | 'relationship_skills' | 'self_awareness' | 'resilience' | 'communication';
  currentLevel: number;
  targetLevel: number;
  progressRate: number;
  keyStrengths: string[];
  improvementAreas: string[];
}

interface ActionableAlternative {
  id: string;
  category: 'mindfulness' | 'exercise' | 'social' | 'creative' | 'learning' | 'routine';
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeRequired: string;
  frequency: 'daily' | 'weekly' | 'as_needed';
  expectedBenefit: string;
  instructions: string[];
  trackingMethod: string;
  successMetrics: string[];
}

interface MonthlyGrowthReport {
  userId: string;
  month: string;
  emotionalPatterns: EmotionalPattern[];
  growthAreas: GrowthArea[];
  actionableAlternatives: ActionableAlternative[];
  overallProgress: {
    emotionalStability: number;
    selfAwareness: number;
    copingSkills: number;
    overallScore: number;
  };
  personalizedInsights: string[];
  nextMonthGoals: string[];
  aiWarning: any;
}

interface DreamAnalysis {
  interpretation: {
    mainThemes: string[];
    psychologicalMeaning: string;
    emotionalSignificance: string;
    possibleTriggers: string[];
    connectionToCurrentState: string;
  };
  insights: string[];
  recommendations: string[];
  aiWarning: any;
}

/**
 * 🌱 개인 성장 페이지
 * 월간 감정 패턴 분석, 실천 대안 추천, 꿈 해몽 서비스 제공
 * 
 * 심리상담가 1,2가 설계한 개인 성장 프레임워크 적용
 */
const PersonalGrowthPage: React.FC = () => {
  const { user } = useAuth();
  const functions = getFunctions();
  
  const [currentReport, setCurrentReport] = useState<MonthlyGrowthReport | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'alternatives' | 'dreams'>('overview');
  const [selectedAlternatives, setSelectedAlternatives] = useState<string[]>([]);
  const [dreamContent, setDreamContent] = useState('');
  const [dreamAnalysis, setDreamAnalysis] = useState<DreamAnalysis | null>(null);
  const [isDreamAnalyzing, setIsDreamAnalyzing] = useState(false);
  
  // AI 경고 시스템
  const aiWarning = usePersonalWarning();

  useEffect(() => {
    if (user) {
      loadGrowthReport();
    }
  }, [user, selectedMonth]);

  const loadGrowthReport = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const generateReport = httpsCallable(functions, 'generatePersonalGrowthReport');
      const result = await generateReport({
        userId: user.uid,
        month: selectedMonth
      });
      
      const data = result.data as { success: boolean; report: MonthlyGrowthReport; version: string };
      if (data.success) {
        setCurrentReport(data.report);
        toast.success('성장 리포트를 불러왔습니다.');
      }
    } catch (error) {
      console.error('성장 리포트 로드 오류:', error);
      toast.error('리포트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeDream = async () => {
    if (!user || !dreamContent.trim()) {
      toast.error('꿈 내용을 입력해주세요.');
      return;
    }
    
    setIsDreamAnalyzing(true);
    try {
      const analyzeDreamFunc = httpsCallable(functions, 'analyzeDream');
      const result = await analyzeDreamFunc({
        userId: user.uid,
        dreamContent: dreamContent.trim(),
        dreamDate: new Date().toISOString(),
        emotionalState: {
          // 현재 감정 상태 (간단한 예시)
          mood: 'neutral',
          intensity: 5
        }
      });
      
      const data = result.data as { success: boolean; analysis: DreamAnalysis; version: string };
      if (data.success) {
        setDreamAnalysis(data.analysis);
        toast.success('꿈 해석이 완료되었습니다.');
      }
    } catch (error) {
      console.error('꿈 해석 오류:', error);
      toast.error('꿈 해석 중 오류가 발생했습니다.');
    } finally {
      setIsDreamAnalyzing(false);
    }
  };

  const createGrowthProgram = async () => {
    if (!user || selectedAlternatives.length === 0) {
      toast.error('실천할 활동을 선택해주세요.');
      return;
    }
    
    try {
      const selectedItems = currentReport?.actionableAlternatives.filter(alt => 
        selectedAlternatives.includes(alt.id)
      ) || [];
      
      const createProgram = httpsCallable(functions, 'createGrowthProgram');
      const result = await createProgram({
        userId: user.uid,
        selectedAlternatives: selectedItems
      });
      
      const data = result.data as { success: boolean; program: any; version: string };
      if (data.success) {
        toast.success('성장 프로그램이 생성되었습니다!');
        // 프로그램 페이지로 이동하거나 모달 표시
      }
    } catch (error) {
      console.error('성장 프로그램 생성 오류:', error);
      toast.error('프로그램 생성 중 오류가 발생했습니다.');
    }
  };


  const getCategoryIcon = (category: string) => {
    const icons = {
      mindfulness: <Brain className="w-4 h-4" />,
      exercise: <Zap className="w-4 h-4" />,
      social: <Heart className="w-4 h-4" />,
      creative: <Star className="w-4 h-4" />,
      learning: <Target className="w-4 h-4" />,
      routine: <Clock className="w-4 h-4" />
    };
    return icons[category as keyof typeof icons] || <Target className="w-4 h-4" />;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">성장 리포트를 생성하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-display-medium text-gray-900 mb-4">
            개인 성장 리포트
          </h1>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto">
            AI가 분석한 감정 패턴을 바탕으로 개인 맞춤형 성장 방향을 제시합니다.
          </p>
        </div>

        {/* AI 경고 시스템 */}
        <div className="mb-8">
          <AIWarning
            message={currentReport?.aiWarning?.message || aiWarning.message}
            details={currentReport?.aiWarning?.details || aiWarning.details}
            timestamp={currentReport?.aiWarning?.timestamp || aiWarning.timestamp}
            type="info"
            showDetails={true}
            className="max-w-4xl mx-auto"
          />
        </div>

        <div className="max-w-6xl mx-auto">
          {/* 월 선택 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">분석 기간</span>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={loadGrowthReport}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : '분석'}
                </button>
              </div>
            </div>
          </div>

          {currentReport && (
            <>
              {/* 탭 네비게이션 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="flex border-b border-gray-200">
                  {[
                    { id: 'overview', name: '전체 개요', icon: <BarChart3 className="w-4 h-4" /> },
                    { id: 'patterns', name: '감정 패턴', icon: <TrendingUp className="w-4 h-4" /> },
                    { id: 'alternatives', name: '실천 방안', icon: <Target className="w-4 h-4" /> },
                    { id: 'dreams', name: '꿈 해몽', icon: <Moon className="w-4 h-4" /> }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </div>

                {/* 탭 내용 */}
                <div className="p-6">
                  {/* 전체 개요 탭 */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* 전체 진전도 */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {(currentReport.overallProgress.emotionalStability * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">감정 안정성</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {(currentReport.overallProgress.selfAwareness * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">자기 인식</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {(currentReport.overallProgress.copingSkills * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">대처 능력</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {(currentReport.overallProgress.overallScore * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">종합 점수</div>
                        </div>
                      </div>

                      {/* 개인화된 인사이트 */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                          <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                          개인화된 인사이트
                        </h3>
                        <div className="space-y-3">
                          {currentReport.personalizedInsights.map((insight, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <p className="text-gray-700">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 다음 달 목표 */}
                      <div className="bg-green-50 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                          <Target className="w-5 h-5 mr-2 text-green-500" />
                          다음 달 목표
                        </h3>
                        <div className="space-y-3">
                          {currentReport.nextMonthGoals.map((goal, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <p className="text-gray-700">{goal}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 감정 패턴 탭 */}
                  {activeTab === 'patterns' && (
                    <div className="space-y-6">
                      {currentReport.emotionalPatterns.length > 0 ? (
                        currentReport.emotionalPatterns.map((pattern, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-gray-900">{pattern.patternType}</h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">강도:</span>
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${pattern.strength * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 mb-4">{pattern.description}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">피크 시간</h4>
                                <div className="flex flex-wrap gap-2">
                                  {pattern.peakTimes.map((time, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                                      {time}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">저조한 시간</h4>
                                <div className="flex flex-wrap gap-2">
                                  {pattern.lowTimes.map((time, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded">
                                      {time}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">분석할 감정 패턴이 충분하지 않습니다.</p>
                          <p className="text-sm text-gray-400">더 많은 감정 기록을 남겨주세요.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 실천 방안 탭 */}
                  {activeTab === 'alternatives' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">추천 실천 방안</h3>
                        <button
                          onClick={createGrowthProgram}
                          disabled={selectedAlternatives.length === 0}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          선택한 활동으로 프로그램 생성 ({selectedAlternatives.length})
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentReport.actionableAlternatives.map((alternative) => (
                          <div key={alternative.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                {getCategoryIcon(alternative.category)}
                                <h4 className="font-medium text-gray-900">{alternative.title}</h4>
                              </div>
                              <input
                                type="checkbox"
                                checked={selectedAlternatives.includes(alternative.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAlternatives([...selectedAlternatives, alternative.id]);
                                  } else {
                                    setSelectedAlternatives(selectedAlternatives.filter(id => id !== alternative.id));
                                  }
                                }}
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                              />
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{alternative.description}</p>
                            
                            <div className="flex items-center justify-between mb-3">
                              <span className={`px-2 py-1 text-xs rounded ${getDifficultyColor(alternative.difficulty)}`}>
                                {alternative.difficulty}
                              </span>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {alternative.timeRequired}
                                </span>
                                <span>{alternative.frequency}</span>
                              </div>
                            </div>
                            
                            <div className="text-sm">
                              <p className="text-green-700 mb-2">
                                <strong>기대 효과:</strong> {alternative.expectedBenefit}
                              </p>
                              <p className="text-gray-600">
                                <strong>추적 방법:</strong> {alternative.trackingMethod}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 꿈 해몽 탭 */}
                  {activeTab === 'dreams' && (
                    <div className="space-y-6">
                      <div className="bg-purple-50 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                          <Moon className="w-5 h-5 mr-2 text-purple-500" />
                          꿈 기록 및 AI 해몽
                        </h3>
                        <div className="space-y-4">
                          <textarea
                            value={dreamContent}
                            onChange={(e) => setDreamContent(e.target.value)}
                            placeholder="최근에 꾼 꿈의 내용을 자세히 적어주세요..."
                            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          />
                          <button
                            onClick={analyzeDream}
                            disabled={isDreamAnalyzing || !dreamContent.trim()}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDreamAnalyzing ? (
                              <div className="flex items-center justify-center">
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                해석 중...
                              </div>
                            ) : (
                              '꿈 해석하기'
                            )}
                          </button>
                        </div>
                      </div>

                      {dreamAnalysis && (
                        <div className="space-y-6">
                          {/* AI 경고 */}
                          <AIWarning
                            message={dreamAnalysis.aiWarning.message}
                            details={dreamAnalysis.aiWarning.details}
                            timestamp={dreamAnalysis.aiWarning.timestamp}
                            type="warning"
                            showDetails={true}
                          />

                          {/* 해석 결과 */}
                          <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="font-semibold text-gray-900 mb-4">꿈 해석 결과</h4>
                            
                            <div className="space-y-4">
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">주요 테마</h5>
                                <div className="flex flex-wrap gap-2">
                                  {dreamAnalysis.interpretation.mainThemes.map((theme, index) => (
                                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                                      {theme}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">심리학적 의미</h5>
                                <p className="text-gray-700">{dreamAnalysis.interpretation.psychologicalMeaning}</p>
                              </div>
                              
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">감정적 의미</h5>
                                <p className="text-gray-700">{dreamAnalysis.interpretation.emotionalSignificance}</p>
                              </div>
                              
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">현재 상태와의 연관성</h5>
                                <p className="text-gray-700">{dreamAnalysis.interpretation.connectionToCurrentState}</p>
                              </div>
                            </div>
                          </div>

                          {/* 인사이트 및 권장사항 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-3">개인적 통찰</h5>
                              <div className="space-y-2">
                                {dreamAnalysis.insights.map((insight, index) => (
                                  <div key={index} className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <p className="text-sm text-gray-700">{insight}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="bg-green-50 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-3">실천 권장사항</h5>
                              <div className="space-y-2">
                                {dreamAnalysis.recommendations.map((recommendation, index) => (
                                  <div key={index} className="flex items-start space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                    <p className="text-sm text-gray-700">{recommendation}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalGrowthPage;
