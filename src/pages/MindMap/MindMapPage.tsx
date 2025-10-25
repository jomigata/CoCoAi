import React, { useState, useEffect } from 'react';
import { useAuth } from '@store/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Brain, Download, Share2, RefreshCw } from 'lucide-react';
import InteractiveMindMap from '@components/MindMap/InteractiveMindMap';
import LoadingSpinner from '@components/Common/LoadingSpinner';
import AIWarning from '@components/Common/AIWarning';
import { useAIWarning } from '@hooks/useAIWarning';
import toast from 'react-hot-toast';

interface ProfilingResult {
  userId: string;
  ageGroup: string;
  completedAt: Date;
  responses: { [questionId: string]: any };
  scores: {
    selfEsteem: number;
    stressCoping: {
      active: number;
      passive: number;
      social: number;
      individual: number;
    };
    relationshipPattern: string;
    coreValues: string[];
    strengths: string[];
  };
  mindMap: {
    personality: string;
    emotionalPattern: string;
    communicationStyle: string;
    growthAreas: string[];
    recommendations: string[];
  };
  aiAnalysis: {
    summary: string;
    insights: string[];
    personalizedAdvice: string[];
    monthlyGoals: string[];
  };
  aiWarning: any;
}

const MindMapPage: React.FC = () => {
  const { user } = useAuth();
  const [profilingResult, setProfilingResult] = useState<ProfilingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const aiWarning = useAIWarning({
    analysisType: 'profiling',
    severity: 'medium'
  });

  useEffect(() => {
    if (user) {
      loadProfilingResult();
    }
  }, [user]);

  const loadProfilingResult = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const functions = getFunctions();
      const getProfilingResult = httpsCallable(functions, 'getProfilingResult');
      
      const result = await getProfilingResult({ userId: user.uid });
      
      if ((result.data as any).success) {
        setProfilingResult((result.data as any).result);
      } else {
        toast.error('프로파일링 결과를 찾을 수 없습니다. 먼저 프로파일링을 완료해주세요.');
      }
    } catch (error) {
      console.error('프로파일링 결과 로드 오류:', error);
      toast.error('프로파일링 결과를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateMindMap = async () => {
    if (!user || !profilingResult) return;

    try {
      setIsGenerating(true);
      const functions = getFunctions();
      const analyzeProfilingResults = httpsCallable(functions, 'analyzeProfilingResults');
      
      const result = await analyzeProfilingResults({
        userId: user.uid,
        ageGroup: profilingResult.ageGroup,
        responses: profilingResult.responses
      });

      if ((result.data as any).success) {
        setProfilingResult((result.data as any).result);
        toast.success('마음 지도가 새로 생성되었습니다! 🎉');
      } else {
        throw new Error('마음 지도 생성 실패');
      }
    } catch (error) {
      console.error('마음 지도 재생성 오류:', error);
      toast.error('마음 지도 재생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
  };

  const handleNodeHover = (node: any) => {
    // 호버 효과는 컴포넌트 내부에서 처리
  };

  const downloadMindMap = () => {
    // 마음 지도 이미지 다운로드 기능 (추후 구현)
    toast.success('마음 지도 다운로드 기능은 곧 제공됩니다!');
  };

  const shareMindMap = () => {
    // 마음 지도 공유 기능 (추후 구현)
    toast.success('마음 지도 공유 기능은 곧 제공됩니다!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profilingResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            프로파일링 결과가 없습니다
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            먼저 개인 프로파일링을 완료해주세요.
          </p>
          <a
            href="/profiling"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            프로파일링 시작하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                나의 마음 지도
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                개인 프로파일링 결과를 바탕으로 생성된 인터랙티브 마음 지도입니다.
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={regenerateMindMap}
                disabled={isGenerating}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>재생성</span>
              </button>
              
              <button
                onClick={downloadMindMap}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>다운로드</span>
              </button>
              
              <button
                onClick={shareMindMap}
                className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>공유</span>
              </button>
            </div>
          </div>
        </div>

        {/* AI 경고 */}
        <div className="mb-6">
          <AIWarning {...aiWarning} />
        </div>

        {/* 마음 지도 */}
        <div className="mb-8">
          <InteractiveMindMap
            profilingData={{
              personality: profilingResult.mindMap.personality,
              emotionalPattern: profilingResult.mindMap.emotionalPattern,
              communicationStyle: profilingResult.mindMap.communicationStyle,
              growthAreas: profilingResult.mindMap.growthAreas,
              recommendations: profilingResult.mindMap.recommendations,
              scores: profilingResult.scores
            }}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
          />
        </div>

        {/* 선택된 노드 상세 정보 */}
        {selectedNode && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {selectedNode.name} 상세 정보
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">기본 정보</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">카테고리:</span>
                    <span className="text-gray-900 dark:text-white capitalize">
                      {selectedNode.category === 'personality' ? '성격 특성' :
                       selectedNode.category === 'emotion' ? '감정 패턴' :
                       selectedNode.category === 'relationship' ? '관계 패턴' :
                       selectedNode.category === 'values' ? '핵심 가치' :
                       selectedNode.category === 'strengths' ? '주요 강점' :
                       selectedNode.category === 'growth' ? '성장 영역' : selectedNode.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">강도:</span>
                    <span className="text-gray-900 dark:text-white">{selectedNode.value}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">크기:</span>
                    <span className="text-gray-900 dark:text-white">{selectedNode.size}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">분석 결과</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedNode.category === 'personality' && '성격 특성에 대한 상세 분석이 여기에 표시됩니다.'}
                    {selectedNode.category === 'emotion' && '감정 패턴에 대한 상세 분석이 여기에 표시됩니다.'}
                    {selectedNode.category === 'relationship' && '관계 패턴에 대한 상세 분석이 여기에 표시됩니다.'}
                    {selectedNode.category === 'values' && '핵심 가치에 대한 상세 분석이 여기에 표시됩니다.'}
                    {selectedNode.category === 'strengths' && '주요 강점에 대한 상세 분석이 여기에 표시됩니다.'}
                    {selectedNode.category === 'growth' && '성장 영역에 대한 상세 분석이 여기에 표시됩니다.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI 분석 요약 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            AI 분석 요약
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">전체 요약</h4>
              <p className="text-gray-600 dark:text-gray-300">
                {profilingResult.aiAnalysis.summary}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">주요 통찰</h4>
              <ul className="list-disc list-inside space-y-1">
                {profilingResult.aiAnalysis.insights.map((insight, index) => (
                  <li key={index} className="text-gray-600 dark:text-gray-300">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">개인화된 조언</h4>
              <ul className="list-disc list-inside space-y-1">
                {profilingResult.aiAnalysis.personalizedAdvice.map((advice, index) => (
                  <li key={index} className="text-gray-600 dark:text-gray-300">
                    {advice}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">월간 목표</h4>
              <ul className="list-disc list-inside space-y-1">
                {profilingResult.aiAnalysis.monthlyGoals.map((goal, index) => (
                  <li key={index} className="text-gray-600 dark:text-gray-300">
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindMapPage;
