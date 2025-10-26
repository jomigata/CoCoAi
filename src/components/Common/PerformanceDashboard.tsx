import React, { useState } from 'react';
import { Activity, AlertTriangle, Clock, Database, Wifi, Zap } from 'lucide-react';
import { usePerformanceMonitor } from '@utils/performanceMonitor';
import { useErrorTracker } from '@utils/errorTracker';

interface PerformanceDashboardProps {
  className?: string;
  showDetails?: boolean;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  className = '',
  showDetails = false
}) => {
  const { stats: perfStats } = usePerformanceMonitor();
  const { stats: errorStats } = useErrorTracker();
  const [isExpanded, setIsExpanded] = useState(showDetails);

  // 성능 점수 계산
  const calculatePerformanceScore = (): number => {
    const { averageLoadTime, slowResources, memoryUsage } = perfStats;
    
    let score = 100;
    
    // 로딩 시간 점수 (3초 이상이면 감점)
    if (averageLoadTime > 3000) {
      score -= Math.min(30, (averageLoadTime - 3000) / 100);
    }
    
    // 느린 리소스 점수 (5개 이상이면 감점)
    if (slowResources > 5) {
      score -= Math.min(20, slowResources * 2);
    }
    
    // 메모리 사용량 점수 (100MB 이상이면 감점)
    if (memoryUsage > 100 * 1024 * 1024) {
      score -= Math.min(20, (memoryUsage - 100 * 1024 * 1024) / (10 * 1024 * 1024));
    }
    
    return Math.max(0, Math.round(score));
  };

  const performanceScore = calculatePerformanceScore();
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return '우수';
    if (score >= 70) return '양호';
    if (score >= 50) return '보통';
    return '개선 필요';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Activity className="h-5 w-5 mr-2 text-primary-500" />
          성능 모니터링
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {isExpanded ? '접기' : '자세히'}
        </button>
      </div>

      {/* 성능 점수 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            전체 성능 점수
          </span>
          <span className={`text-lg font-bold ${getScoreColor(performanceScore)}`}>
            {performanceScore}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              performanceScore >= 90 ? 'bg-green-500' :
              performanceScore >= 70 ? 'bg-yellow-500' :
              performanceScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${performanceScore}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {getScoreLabel(performanceScore)}
        </p>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-xs text-gray-600 dark:text-gray-400">로딩 시간</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {perfStats.averageLoadTime > 0 
              ? `${(perfStats.averageLoadTime / 1000).toFixed(1)}초`
              : '측정 중...'
            }
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Database className="h-4 w-4 text-purple-500 mr-1" />
            <span className="text-xs text-gray-600 dark:text-gray-400">메모리</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {perfStats.memoryUsage > 0 
              ? `${(perfStats.memoryUsage / 1024 / 1024).toFixed(1)}MB`
              : '측정 중...'
            }
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Wifi className="h-4 w-4 text-orange-500 mr-1" />
            <span className="text-xs text-gray-600 dark:text-gray-400">느린 리소스</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {perfStats.slowResources}
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-xs text-gray-600 dark:text-gray-400">에러 수</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {errorStats.totalErrors}
          </p>
        </div>
      </div>

      {/* 상세 정보 */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            상세 정보
          </h4>

          {/* 성능 메트릭 */}
          <div className="mb-4">
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              성능 메트릭
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">총 메트릭 수</span>
                <span className="text-gray-900 dark:text-white">{perfStats.totalMetrics}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">평균 로딩 시간</span>
                <span className="text-gray-900 dark:text-white">
                  {perfStats.averageLoadTime > 0 
                    ? `${(perfStats.averageLoadTime / 1000).toFixed(2)}초`
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">현재 메모리 사용량</span>
                <span className="text-gray-900 dark:text-white">
                  {perfStats.memoryUsage > 0 
                    ? `${(perfStats.memoryUsage / 1024 / 1024).toFixed(2)}MB`
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* 에러 통계 */}
          <div className="mb-4">
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              에러 통계
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">총 에러 수</span>
                <span className="text-gray-900 dark:text-white">{errorStats.totalErrors}</span>
              </div>
              {Object.entries(errorStats.severityBreakdown).map(([severity, count]) => (
                <div key={severity} className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{severity}</span>
                  <span className={`font-medium ${
                    severity === 'critical' ? 'text-red-500' :
                    severity === 'high' ? 'text-orange-500' :
                    severity === 'medium' ? 'text-yellow-500' : 'text-gray-500'
                  }`}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 에러 */}
          {errorStats.recentErrors.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                최근 에러
              </h5>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {errorStats.recentErrors.map((error, index) => (
                  <div key={index} className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-900 dark:text-white truncate flex-1 mr-2">
                        {error.message}
                      </span>
                      <span className={`text-xs px-1 py-0.5 rounded ${
                        error.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        error.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        error.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {error.severity}
                      </span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 성능 개선 제안 */}
      {performanceScore < 70 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
            <Zap className="h-4 w-4 text-yellow-500 mr-1" />
            성능 개선 제안
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {perfStats.averageLoadTime > 3000 && (
              <p>• 페이지 로딩 시간이 느립니다. 이미지 최적화를 고려해보세요.</p>
            )}
            {perfStats.slowResources > 5 && (
              <p>• 느린 리소스가 많습니다. CDN 사용을 고려해보세요.</p>
            )}
            {perfStats.memoryUsage > 100 * 1024 * 1024 && (
              <p>• 메모리 사용량이 높습니다. 불필요한 컴포넌트를 정리해보세요.</p>
            )}
            {errorStats.totalErrors > 0 && (
              <p>• 에러가 발생하고 있습니다. 콘솔을 확인해보세요.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;
