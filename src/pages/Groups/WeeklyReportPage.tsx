import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@config/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import { 
  Users, 
  Heart, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Lightbulb,
  Target,
  MessageCircle,
  AlertTriangle,
  Download,
  Share2,
  RefreshCw
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
  groupId: string;
  weekStartDate: string;
  generatedAt: string;
  reportResult: {
    groupInfo: {
      id: string;
      name: string;
      type: string;
      memberCount: number;
      weekStartDate: string;
      generatedAt: string;
    };
    crossAnalysis: {
      groupDynamics: {
        overallHarmony: number;
        emotionalStability: number;
        supportNetwork: string[];
      };
      memberEmotions: {
        [memberId: string]: {
          averageMood: number;
          emotionalRange: number;
          stressLevel: number;
          positiveMoments: number;
        };
      };
    };
    relationshipPatterns: Array<{
      pattern: string;
      description: string;
      strength: number;
      impact: 'positive' | 'negative' | 'neutral';
    }>;
    personalizedAdvice: {
      [memberId: string]: {
        memberName: string;
        insights: string[];
        recommendations: string[];
        focusAreas: string[];
      };
    };
    groupSummary: {
      overallHarmony: number;
      emotionalStability: number;
      keyInsights: string[];
    };
    aiWarning: any;
  };
}

/**
 * 📊 위클리 리포트 페이지
 * 그룹 멤버들의 데일리 기록을 교차 분석하여 관계 패턴 인식
 * 
 * 심리상담가 1,2가 설계한 관계 분석 도구
 * AI 기반 다각도 분석 결과 제공
 */
const WeeklyReportPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'advice'>('overview');
  
  // AI 경고 시스템
  const aiWarning = useGroupWarning();

  useEffect(() => {
    if (groupId) {
      loadGroupData();
      loadWeeklyReport();
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

  const loadWeeklyReport = async () => {
    if (!groupId) return;

    try {
      const functions = getFunctions();
      const getGroupReport = httpsCallable(functions, 'generateGroupReport');
      
      // 이번 주 시작일 계산
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // 일요일
      const weekStartDate = weekStart.toISOString().split('T')[0];

      const result = await getGroupReport({
        groupId,
        weekStartDate
      });

      if (result.data.success) {
        setReport(result.data.reportResult);
      } else {
        // 리포트가 없으면 생성
        await generateWeeklyReport();
      }
    } catch (error) {
      console.error('위클리 리포트 로드 오류:', error);
      // 리포트가 없으면 생성
      await generateWeeklyReport();
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeeklyReport = async () => {
    if (!groupId) return;

    setIsGenerating(true);
    try {
      const functions = getFunctions();
      const generateGroupReport = httpsCallable(functions, 'generateGroupReport');
      
      // 이번 주 시작일 계산
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // 일요일
      const weekStartDate = weekStart.toISOString().split('T')[0];

      const result = await generateGroupReport({
        groupId,
        weekStartDate
      });

      if (result.data.success) {
        setReport(result.data.reportResult);
        toast.success('위클리 리포트가 생성되었습니다! 🎉');
      } else {
        throw new Error('리포트 생성 실패');
      }
    } catch (error) {
      console.error('위클리 리포트 생성 오류:', error);
      toast.error('리포트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${group?.name} 그룹 위클리 리포트`,
          text: '우리 그룹의 관계 분석 결과를 확인해보세요!',
          url: window.location.href,
        });
      } catch (error) {
        console.error('공유 오류:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 클립보드에 복사되었습니다.');
    }
  };

  const handleDownload = () => {
    // PDF 다운로드 기능 (추후 구현)
    toast.success('PDF 다운로드 기능은 곧 제공될 예정입니다.');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-soft p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">위클리 리포트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-soft p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            그룹을 찾을 수 없습니다
          </h2>
          <button
            onClick={() => navigate('/groups')}
            className="btn-primary w-full"
          >
            그룹 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-soft p-8 text-center">
          <Calendar className="w-16 h-16 text-blue-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            위클리 리포트가 없습니다
          </h2>
          <p className="text-gray-600 mb-6">
            이번 주의 관계 분석 리포트를 생성해보세요.
          </p>
          <button
            onClick={generateWeeklyReport}
            disabled={isGenerating}
            className="btn-primary w-full disabled:opacity-50"
          >
            {isGenerating ? '리포트 생성 중...' : '리포트 생성하기'}
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
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto mb-6">
            이번 주 우리 그룹의 관계 패턴과 감정 변화를 분석했습니다.
          </p>
          <div className="text-body-medium text-gray-500">
            {new Date(report.reportResult.groupInfo.weekStartDate).toLocaleDateString('ko-KR')} ~ {new Date(report.reportResult.groupInfo.generatedAt).toLocaleDateString('ko-KR')}
          </div>
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

        {/* 액션 버튼들 */}
        <div className="text-center mb-8">
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
              onClick={generateWeeklyReport}
              disabled={isGenerating}
              className="btn-ghost flex items-center disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              새로 생성하기
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
              onClick={() => setActiveTab('analysis')}
              className={`tab-button ${activeTab === 'analysis' ? 'active' : 'inactive'}`}
            >
              상세 분석
            </button>
            <button
              onClick={() => setActiveTab('advice')}
              className={`tab-button ${activeTab === 'advice' ? 'active' : 'inactive'}`}
            >
              맞춤 조언
            </button>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6 fade-in">
              {/* 그룹 요약 */}
              <div className="card-elevated">
                <h2 className="text-headline-large text-gray-900 mb-6 text-center">
                  이번 주 그룹 요약
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-6 bg-pink-50 rounded-xl">
                    <Heart className="w-12 h-12 text-pink-600 mx-auto mb-4" />
                    <h3 className="text-title-medium text-gray-900 mb-2">그룹 조화도</h3>
                    <p className="text-body-large font-semibold text-pink-700">
                      {Math.round(report.reportResult.groupSummary.overallHarmony * 100)}%
                    </p>
                  </div>

                  <div className="text-center p-6 bg-blue-50 rounded-xl">
                    <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-title-medium text-gray-900 mb-2">감정 안정성</h3>
                    <p className="text-body-large font-semibold text-blue-700">
                      {Math.round(report.reportResult.groupSummary.emotionalStability * 100)}%
                    </p>
                  </div>

                  <div className="text-center p-6 bg-green-50 rounded-xl">
                    <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-title-medium text-gray-900 mb-2">지지 네트워크</h3>
                    <p className="text-body-large font-semibold text-green-700">
                      {report.reportResult.crossAnalysis.groupDynamics.supportNetwork.length}명
                    </p>
                  </div>
                </div>

                {/* 주요 인사이트 */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-title-medium text-gray-900 mb-4 flex items-center">
                    <Lightbulb className="w-6 h-6 text-yellow-500 mr-2" />
                    주요 인사이트
                  </h3>
                  <ul className="space-y-2">
                    {report.reportResult.groupSummary.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0" />
                        <span className="text-body-medium text-gray-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 관계 패턴 */}
              <div className="card">
                <h3 className="text-headline-small text-gray-900 mb-6 flex items-center">
                  <Target className="w-6 h-6 text-purple-500 mr-2" />
                  발견된 관계 패턴
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.reportResult.relationshipPatterns.map((pattern, index) => (
                    <div key={index} className={`p-4 rounded-lg border-2 ${
                      pattern.impact === 'positive' 
                        ? 'border-green-200 bg-green-50' 
                        : pattern.impact === 'negative'
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-title-small font-medium text-gray-900">
                          {pattern.pattern}
                        </h4>
                        <span className={`badge ${
                          pattern.impact === 'positive' 
                            ? 'badge-success' 
                            : pattern.impact === 'negative'
                            ? 'badge-error'
                            : 'badge-secondary'
                        }`}>
                          {pattern.impact === 'positive' ? '긍정적' : 
                           pattern.impact === 'negative' ? '개선 필요' : '중립적'}
                        </span>
                      </div>
                      <p className="text-body-small text-gray-600 mb-2">
                        {pattern.description}
                      </p>
                      <div className="flex items-center">
                        <span className="text-body-small text-gray-500 mr-2">강도:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${pattern.strength * 100}%` }}
                          />
                        </div>
                        <span className="text-body-small text-gray-500 ml-2">
                          {Math.round(pattern.strength * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6 fade-in">
              {/* 멤버별 감정 분석 */}
              <div className="card">
                <h3 className="text-headline-small text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="w-6 h-6 text-blue-500 mr-2" />
                  멤버별 감정 분석
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(report.reportResult.crossAnalysis.memberEmotions).map(([memberId, emotions]) => (
                    <div key={memberId} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-title-small font-medium text-gray-900 mb-3">
                        {report.reportResult.personalizedAdvice[memberId]?.memberName || '멤버'}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-body-small text-gray-600">평균 기분</span>
                          <span className="text-body-small font-medium text-gray-900">
                            {emotions.averageMood.toFixed(1)}/5
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-body-small text-gray-600">감정 범위</span>
                          <span className="text-body-small font-medium text-gray-900">
                            {emotions.emotionalRange.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-body-small text-gray-600">스트레스 수준</span>
                          <span className="text-body-small font-medium text-gray-900">
                            {emotions.stressLevel.toFixed(1)}/5
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-body-small text-gray-600">긍정적 순간</span>
                          <span className="text-body-small font-medium text-gray-900">
                            {emotions.positiveMoments}회
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 그룹 역학 분석 */}
              <div className="card">
                <h3 className="text-headline-small text-gray-900 mb-6 flex items-center">
                  <Users className="w-6 h-6 text-green-500 mr-2" />
                  그룹 역학 분석
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-title-small font-medium text-gray-900 mb-2">
                      전체 조화도
                    </h4>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-500 h-3 rounded-full" 
                          style={{ width: `${report.reportResult.crossAnalysis.groupDynamics.overallHarmony * 100}%` }}
                        />
                      </div>
                      <span className="text-body-small font-medium text-gray-900 ml-3">
                        {Math.round(report.reportResult.crossAnalysis.groupDynamics.overallHarmony * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="text-title-small font-medium text-gray-900 mb-2">
                      감정 안정성
                    </h4>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full" 
                          style={{ width: `${report.reportResult.crossAnalysis.groupDynamics.emotionalStability * 100}%` }}
                        />
                      </div>
                      <span className="text-body-small font-medium text-gray-900 ml-3">
                        {Math.round(report.reportResult.crossAnalysis.groupDynamics.emotionalStability * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advice' && (
            <div className="space-y-6 fade-in">
              <div className="text-center mb-8">
                <Lightbulb className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-headline-large text-gray-900 mb-2">
                  맞춤형 관계 개선 조언
                </h2>
                <p className="text-body-medium text-gray-600">
                  각 멤버별로 개인화된 조언과 그룹 전체를 위한 제안입니다.
                </p>
              </div>

              {Object.entries(report.reportResult.personalizedAdvice).map(([memberId, advice]) => (
                <div key={memberId} className="card-hover">
                  <h3 className="text-headline-small text-gray-900 mb-4">
                    {advice.memberName}님을 위한 조언
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-title-medium text-gray-900 mb-3 flex items-center">
                        <MessageCircle className="w-5 h-5 text-blue-500 mr-2" />
                        주요 인사이트
                      </h4>
                      <ul className="space-y-2">
                        {advice.insights.map((insight, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0" />
                            <span className="text-body-medium text-gray-700">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-title-medium text-gray-900 mb-3 flex items-center">
                        <Target className="w-5 h-5 text-green-500 mr-2" />
                        추천 사항
                      </h4>
                      <ul className="space-y-2">
                        {advice.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0" />
                            <span className="text-body-medium text-gray-700">{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {advice.focusAreas.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-title-medium text-gray-900 mb-3 flex items-center">
                        <TrendingUp className="w-5 h-5 text-purple-500 mr-2" />
                        집중 영역
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {advice.focusAreas.map((area, index) => (
                          <span key={index} className="badge-primary">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyReportPage;
