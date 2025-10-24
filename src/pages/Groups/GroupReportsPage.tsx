import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@config/firebase';
import toast from 'react-hot-toast';
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  Heart, 
  Brain,
  Target,
  Download,
  Share2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Star,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  BarChart3
} from 'lucide-react';

// AI 경고 시스템
import AIWarning from '@components/Common/AIWarning';
import { useGroupWarning } from '@hooks/useAIWarning';

interface Group {
  id: string;
  name: string;
  type: string;
  memberCount: number;
}

interface WeeklyReport {
  id: string;
  groupId: string;
  weekStartDate: string;
  weekEndDate: string;
  reportResult: {
    groupMoodTemperature: {
      score: number;
      trend: 'improving' | 'stable' | 'declining';
      description: string;
    };
    memberPatterns: Array<{
      userId: string;
      displayName: string;
      weeklyMood: {
        average: number;
        dominant: string;
        changes: string[];
      };
      insights: string[];
    }>;
    connectionInsights: {
      sharedMoods: string[];
      complementaryPatterns: string[];
      concernAreas: string[];
    };
    recommendations: Array<{
      targetMember: string;
      category: 'communication' | 'support' | 'activity' | 'mindfulness';
      advice: string;
      actionItems: string[];
    }>;
    aiWarning: {
      message: string;
      details: string[];
      timestamp: string;
    };
  };
  memberCount: number;
  recordCount: number;
  generatedBy: 'auto' | 'manual';
  createdAt: Date;
}

/**
 * 📊 그룹 위클리 리포트 페이지
 * AI 기반 그룹 관계 분석 리포트 제공
 * 
 * 심리상담가 1,2가 설계한 관계 분석 프레임워크 적용
 * 실천 가능한 조언과 액션 아이템 제공
 */
const GroupReportsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    overview: true,
    members: false,
    insights: false,
    recommendations: false
  });
  
  // AI 경고 시스템
  const aiWarning = useGroupWarning();

  useEffect(() => {
    if (groupId) {
      loadGroupData();
      loadReports();
    }
  }, [groupId]);

  const loadGroupData = async () => {
    if (!groupId) return;

    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (groupDoc.exists()) {
        setGroup({ id: groupDoc.id, ...groupDoc.data() } as Group);
      }
    } catch (error) {
      console.error('그룹 데이터 로드 오류:', error);
      toast.error('그룹 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadReports = async () => {
    if (!groupId) return;

    try {
      // 실제 구현에서는 Firestore에서 리포트 로드
      // 임시로 목업 데이터 사용
      const mockReports: WeeklyReport[] = [
        {
          id: 'report-1',
          groupId: groupId,
          weekStartDate: '2024-10-14',
          weekEndDate: '2024-10-20',
          reportResult: {
            groupMoodTemperature: {
              score: 7.2,
              trend: 'improving',
              description: '이번 주 그룹의 전반적인 분위기가 긍정적으로 변화했습니다.'
            },
            memberPatterns: [
              {
                userId: 'user-1',
                displayName: '김철수',
                weeklyMood: {
                  average: 7.5,
                  dominant: '행복',
                  changes: ['월요일 스트레스 높음', '주말 기분 상승']
                },
                insights: [
                  '업무 스트레스가 주중에 집중되는 패턴',
                  '가족과의 시간이 기분 회복에 도움',
                  '운동 후 감정 상태 개선'
                ]
              },
              {
                userId: 'user-2',
                displayName: '이영희',
                weeklyMood: {
                  average: 6.8,
                  dominant: '평온',
                  changes: ['화요일 불안감', '목요일 기쁨']
                },
                insights: [
                  '새로운 도전에 대한 불안감 존재',
                  '성취감을 느낄 때 큰 기쁨',
                  '혼자만의 시간이 필요한 성향'
                ]
              }
            ],
            connectionInsights: {
              sharedMoods: ['주말 휴식 후 기분 상승', '월요일 스트레스 공통'],
              complementaryPatterns: ['철수의 활동성이 영희의 안정감에 도움', '영희의 신중함이 철수의 충동성 완화'],
              concernAreas: ['소통 빈도 감소', '개인 시간 부족']
            },
            recommendations: [
              {
                targetMember: '김철수',
                category: 'stress_management',
                advice: '주중 스트레스 관리를 위한 짧은 휴식 시간을 만들어보세요.',
                actionItems: [
                  '점심시간 10분 명상하기',
                  '퇴근 후 30분 산책하기',
                  '주말 가족 시간 늘리기'
                ]
              },
              {
                targetMember: '이영희',
                category: 'confidence',
                advice: '새로운 도전에 대한 자신감을 키워보세요.',
                actionItems: [
                  '작은 목표부터 달성하기',
                  '성공 경험 일기 쓰기',
                  '가족과 고민 나누기'
                ]
              }
            ],
            aiWarning: {
              message: '⚠️ AI 분석 결과 안내',
              details: [
                '이 리포트는 AI 기반 분석으로 제공됩니다.',
                '실제 관계의 복잡성과 맥락을 완전히 파악하지 못할 수 있습니다.',
                '개인적인 상황이나 외부 요인이 반영되지 않을 수 있습니다.',
                '참고용으로 활용하시고, 중요한 결정은 충분한 대화를 통해 해주세요.'
              ],
              timestamp: new Date().toISOString()
            }
          },
          memberCount: 2,
          recordCount: 14,
          generatedBy: 'auto',
          createdAt: new Date('2024-10-21')
        },
        {
          id: 'report-2',
          groupId: groupId,
          weekStartDate: '2024-10-07',
          weekEndDate: '2024-10-13',
          reportResult: {
            groupMoodTemperature: {
              score: 6.5,
              trend: 'stable',
              description: '안정적인 관계를 유지하고 있습니다.'
            },
            memberPatterns: [],
            connectionInsights: {
              sharedMoods: [],
              complementaryPatterns: [],
              concernAreas: []
            },
            recommendations: [],
            aiWarning: {
              message: '⚠️ AI 분석 결과 안내',
              details: [],
              timestamp: new Date().toISOString()
            }
          },
          memberCount: 2,
          recordCount: 12,
          generatedBy: 'auto',
          createdAt: new Date('2024-10-14')
        }
      ];

      setReports(mockReports);
      if (mockReports.length > 0) {
        setSelectedReport(mockReports[0]);
      }
      
    } catch (error) {
      console.error('리포트 로드 오류:', error);
      toast.error('리포트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getMoodColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'declining': return <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />;
      default: return <BarChart3 className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication': return <Users className="w-4 h-4" />;
      case 'support': return <Heart className="w-4 h-4" />;
      case 'activity': return <Target className="w-4 h-4" />;
      case 'mindfulness': return <Brain className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-soft p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">리포트를 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!group || reports.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-soft p-8 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            아직 리포트가 없습니다
          </h2>
          <p className="text-gray-600 mb-6">
            그룹 멤버들이 일주일간 감정을 기록하면 자동으로 리포트가 생성됩니다.
          </p>
          <button
            onClick={() => navigate(`/groups/${groupId}`)}
            className="btn-primary w-full"
          >
            그룹으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <BarChart3 className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-display-medium text-gray-900 mb-4">
            {group.name} 위클리 리포트
          </h1>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto">
            AI가 분석한 그룹의 감정 패턴과 관계 인사이트를 확인해보세요.
          </p>
        </div>

        {/* AI 경고 시스템 */}
        <div className="mb-8">
          <AIWarning
            message={selectedReport?.reportResult.aiWarning.message || aiWarning.message}
            details={selectedReport?.reportResult.aiWarning.details || aiWarning.details}
            timestamp={selectedReport?.reportResult.aiWarning.timestamp || aiWarning.timestamp}
            type="warning"
            showDetails={false}
            className="max-w-4xl mx-auto"
          />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 리포트 목록 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h3 className="text-title-medium text-gray-900 mb-4">
                  리포트 목록
                </h3>
                <div className="space-y-3">
                  {reports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        selectedReport?.id === report.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-body-medium font-medium">
                          {new Date(report.weekStartDate).toLocaleDateString('ko-KR')} 주차
                        </span>
                        {getTrendIcon(report.reportResult.groupMoodTemperature.trend)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-body-small font-medium ${
                          getMoodColor(report.reportResult.groupMoodTemperature.score)
                        }`}>
                          {report.reportResult.groupMoodTemperature.score}/10
                        </span>
                        <span className="text-body-small text-gray-500">
                          {report.recordCount}개 기록
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 리포트 상세 */}
            <div className="lg:col-span-3">
              {selectedReport && (
                <div className="space-y-6">
                  {/* 개요 */}
                  <div className="bg-white rounded-xl shadow-soft p-6">
                    <button
                      onClick={() => toggleSection('overview')}
                      className="w-full flex items-center justify-between mb-4"
                    >
                      <h3 className="text-headline-medium text-gray-900">
                        그룹 감정 온도
                      </h3>
                      {expandedSections.overview ? (
                        <ChevronUp className="w-6 h-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      )}
                    </button>

                    {expandedSections.overview && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-center">
                          <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-4xl font-bold text-gray-900">
                                  {selectedReport.reportResult.groupMoodTemperature.score}
                                </div>
                                <div className="text-body-small text-gray-600">/ 10</div>
                              </div>
                            </div>
                            <div className="absolute -top-2 -right-2">
                              {getTrendIcon(selectedReport.reportResult.groupMoodTemperature.trend)}
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-body-large text-gray-700 mb-4">
                            {selectedReport.reportResult.groupMoodTemperature.description}
                          </p>
                          <div className="flex items-center justify-center space-x-6 text-body-medium text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              {new Date(selectedReport.weekStartDate).toLocaleDateString('ko-KR')} - {new Date(selectedReport.weekEndDate).toLocaleDateString('ko-KR')}
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              {selectedReport.memberCount}명 참여
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 멤버별 패턴 */}
                  <div className="bg-white rounded-xl shadow-soft p-6">
                    <button
                      onClick={() => toggleSection('members')}
                      className="w-full flex items-center justify-between mb-4"
                    >
                      <h3 className="text-headline-medium text-gray-900">
                        멤버별 감정 패턴
                      </h3>
                      {expandedSections.members ? (
                        <ChevronUp className="w-6 h-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      )}
                    </button>

                    {expandedSections.members && (
                      <div className="space-y-6">
                        {selectedReport.reportResult.memberPatterns.map((member, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-title-medium text-gray-900">
                                {member.displayName}
                              </h4>
                              <div className="flex items-center space-x-3">
                                <span className={`px-3 py-1 rounded-full text-body-small font-medium ${
                                  getMoodColor(member.weeklyMood.average)
                                }`}>
                                  평균 {member.weeklyMood.average}/10
                                </span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-body-small">
                                  주요 감정: {member.weeklyMood.dominant}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-body-medium font-medium text-gray-700 mb-2">
                                  주요 변화
                                </h5>
                                <ul className="space-y-1">
                                  {member.weeklyMood.changes.map((change, i) => (
                                    <li key={i} className="text-body-small text-gray-600 flex items-start">
                                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                                      {change}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h5 className="text-body-medium font-medium text-gray-700 mb-2">
                                  AI 인사이트
                                </h5>
                                <ul className="space-y-1">
                                  {member.insights.map((insight, i) => (
                                    <li key={i} className="text-body-small text-gray-600 flex items-start">
                                      <Lightbulb className="w-3 h-3 text-yellow-500 mt-1 mr-2 flex-shrink-0" />
                                      {insight}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 관계 인사이트 */}
                  <div className="bg-white rounded-xl shadow-soft p-6">
                    <button
                      onClick={() => toggleSection('insights')}
                      className="w-full flex items-center justify-between mb-4"
                    >
                      <h3 className="text-headline-medium text-gray-900">
                        관계 인사이트
                      </h3>
                      {expandedSections.insights ? (
                        <ChevronUp className="w-6 h-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      )}
                    </button>

                    {expandedSections.insights && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="text-title-small text-green-800 mb-3 flex items-center">
                            <Heart className="w-4 h-4 mr-2" />
                            공통 감정
                          </h4>
                          <ul className="space-y-2">
                            {selectedReport.reportResult.connectionInsights.sharedMoods.map((mood, i) => (
                              <li key={i} className="text-body-small text-green-700">
                                • {mood}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="text-title-small text-blue-800 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            상호 보완
                          </h4>
                          <ul className="space-y-2">
                            {selectedReport.reportResult.connectionInsights.complementaryPatterns.map((pattern, i) => (
                              <li key={i} className="text-body-small text-blue-700">
                                • {pattern}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <h4 className="text-title-small text-orange-800 mb-3 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            관심 영역
                          </h4>
                          <ul className="space-y-2">
                            {selectedReport.reportResult.connectionInsights.concernAreas.map((area, i) => (
                              <li key={i} className="text-body-small text-orange-700">
                                • {area}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 맞춤형 조언 */}
                  <div className="bg-white rounded-xl shadow-soft p-6">
                    <button
                      onClick={() => toggleSection('recommendations')}
                      className="w-full flex items-center justify-between mb-4"
                    >
                      <h3 className="text-headline-medium text-gray-900">
                        맞춤형 조언
                      </h3>
                      {expandedSections.recommendations ? (
                        <ChevronUp className="w-6 h-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      )}
                    </button>

                    {expandedSections.recommendations && (
                      <div className="space-y-6">
                        {selectedReport.reportResult.recommendations.map((rec, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center">
                                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mr-3">
                                  {getCategoryIcon(rec.category)}
                                </div>
                                <div>
                                  <h4 className="text-title-medium text-gray-900">
                                    {rec.targetMember}님을 위한 조언
                                  </h4>
                                  <span className="text-body-small text-purple-600 capitalize">
                                    {rec.category}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p className="text-body-medium text-gray-700 mb-4">
                              {rec.advice}
                            </p>

                            <div>
                              <h5 className="text-body-medium font-medium text-gray-700 mb-2">
                                실천 방법:
                              </h5>
                              <ul className="space-y-2">
                                {rec.actionItems.map((item, i) => (
                                  <li key={i} className="flex items-start text-body-small text-gray-600">
                                    <ArrowRight className="w-3 h-3 text-purple-500 mt-1 mr-2 flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="bg-white rounded-xl shadow-soft p-6">
                    <div className="flex flex-wrap gap-4 justify-center">
                      <button className="btn-outline flex items-center">
                        <Download className="w-4 h-4 mr-2" />
                        PDF 다운로드
                      </button>
                      <button className="btn-outline flex items-center">
                        <Share2 className="w-4 h-4 mr-2" />
                        공유하기
                      </button>
                      <button 
                        onClick={() => navigate(`/groups/${groupId}/diagnosis`)}
                        className="btn-primary flex items-center"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        새 진단 시작
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupReportsPage;
