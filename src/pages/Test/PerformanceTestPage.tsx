import React, { useState } from 'react';
import { Activity, AlertTriangle, Play, RotateCcw, Smartphone, Image, Server } from 'lucide-react';
import PerformanceDashboard from '@components/Common/PerformanceDashboard';
import { usePerformanceMonitor } from '@utils/performanceMonitor';
import { useErrorTracker } from '@utils/errorTracker';
import { CacheTestSuite, ImageOptimizationTest } from '@utils/cacheTest';
import { PWATestSuite } from '@utils/pwaTest';
import LoadingSpinner from '@components/Common/LoadingSpinner';

const PerformanceTestPage: React.FC = () => {
  const { stats: perfStats, mark, measure } = usePerformanceMonitor();
  const { stats: errorStats, reportError } = useErrorTracker();
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [cacheTestResults, setCacheTestResults] = useState<any[]>([]);
  const [pwaTestResults, setPwaTestResults] = useState<any[]>([]);
  const [imageTestResults, setImageTestResults] = useState<any[]>([]);

  // 성능 테스트 실행
  const runPerformanceTest = async () => {
    setIsTestRunning(true);
    const results: any[] = [];

    try {
      // 테스트 1: 이미지 로딩 성능
      mark('image-load-test-start');
      const imageTest = await loadTestImages();
      measure('image-load-test', 'image-load-test-start');
      results.push({ test: '이미지 로딩', result: imageTest });

      // 테스트 2: API 호출 성능
      mark('api-call-test-start');
      const apiTest = await testApiCalls();
      measure('api-call-test', 'api-call-test-start');
      results.push({ test: 'API 호출', result: apiTest });

      // 테스트 3: 메모리 사용량 테스트
      mark('memory-test-start');
      const memoryTest = await testMemoryUsage();
      measure('memory-test', 'memory-test-start');
      results.push({ test: '메모리 사용량', result: memoryTest });

      // 테스트 4: DOM 조작 성능
      mark('dom-test-start');
      const domTest = await testDOMOperations();
      measure('dom-test', 'dom-test-start');
      results.push({ test: 'DOM 조작', result: domTest });

      setTestResults(results);
    } catch (error) {
      reportError('Performance test failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsTestRunning(false);
    }
  };

  // 이미지 로딩 테스트
  const loadTestImages = async (): Promise<{ success: boolean; loadTime: number }> => {
    const startTime = performance.now();
    try {
      const imageUrls = [
        'https://via.placeholder.com/300x200',
        'https://via.placeholder.com/400x300',
        'https://via.placeholder.com/500x400'
      ];

      const promises = imageUrls.map(url => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load ${url}`));
          img.src = url;
        });
      });

      await Promise.all(promises);
      const loadTime = performance.now() - startTime;
      return { success: true, loadTime };
    } catch (error) {
      return { success: false, loadTime: performance.now() - startTime };
    }
  };

  // API 호출 테스트
  const testApiCalls = async (): Promise<{ success: boolean; responseTime: number }> => {
    const startTime = performance.now();
    try {
      // 실제 API 호출 대신 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      const responseTime = performance.now() - startTime;
      return { success: true, responseTime };
    } catch (error) {
      return { success: false, responseTime: performance.now() - startTime };
    }
  };

  // 메모리 사용량 테스트
  const testMemoryUsage = async (): Promise<{ memoryUsed: number; memoryLimit: number }> => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        memoryUsed: memory.usedJSHeapSize || 0,
        memoryLimit: memory.jsHeapSizeLimit || 0
      };
    }
    return { memoryUsed: 0, memoryLimit: 0 };
  };

  // DOM 조작 테스트
  const testDOMOperations = async (): Promise<{ operations: number; timePerOp: number }> => {
    const startTime = performance.now();
    const testContainer = document.createElement('div');
    testContainer.style.display = 'none';
    document.body.appendChild(testContainer);

    const operations = 1000;
    for (let i = 0; i < operations; i++) {
      const element = document.createElement('div');
      element.textContent = `Test element ${i}`;
      testContainer.appendChild(element);
    }

    const endTime = performance.now();
    document.body.removeChild(testContainer);

    return {
      operations,
      timePerOp: (endTime - startTime) / operations
    };
  };

  // 에러 테스트
  const testErrorTracking = () => {
    const errorTypes = [
      { message: 'Test critical error', severity: 'critical' as const },
      { message: 'Test network timeout error', severity: 'high' as const },
      { message: 'Test validation error', severity: 'medium' as const },
      { message: 'Test low priority error', severity: 'low' as const }
    ];

    errorTypes.forEach((error, index) => {
      setTimeout(() => {
        reportError(error.message, { testError: true, index }, error.severity);
      }, index * 1000);
    });
  };

  // 캐시 시스템 테스트
  const runCacheTest = async () => {
    setIsTestRunning(true);
    try {
      const cacheTestSuite = new CacheTestSuite();
      const results = await cacheTestSuite.runAllTests();
      setCacheTestResults(results);
      
      // Service Worker 캐시 테스트
      const swResults = await cacheTestSuite.testServiceWorkerCache();
      setCacheTestResults(prev => [...prev, ...swResults]);
    } catch (error) {
      reportError('Cache test failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsTestRunning(false);
    }
  };

  // PWA 기능 테스트
  const runPWATest = async () => {
    setIsTestRunning(true);
    try {
      const pwaTestSuite = new PWATestSuite();
      const results = await pwaTestSuite.runAllTests();
      setPwaTestResults(results);
    } catch (error) {
      reportError('PWA test failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsTestRunning(false);
    }
  };

  // 이미지 최적화 테스트
  const runImageTest = async () => {
    setIsTestRunning(true);
    try {
      const imageTestSuite = new ImageOptimizationTest();
      const results = await imageTestSuite.runImageTests();
      setImageTestResults(results);
    } catch (error) {
      reportError('Image test failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsTestRunning(false);
    }
  };

  // 전체 테스트 실행
  const runAllTests = async () => {
    setIsTestRunning(true);
    try {
      await runPerformanceTest();
      await runCacheTest();
      await runPWATest();
      await runImageTest();
    } catch (error) {
      reportError('All tests failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsTestRunning(false);
    }
  };

  // 테스트 초기화
  const resetTests = () => {
    setTestResults([]);
    setCacheTestResults([]);
    setPwaTestResults([]);
    setImageTestResults([]);
    setIsTestRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            성능 모니터링 시스템 테스트
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            전체 시스템의 성능과 에러 추적 기능을 종합적으로 테스트합니다.
          </p>
        </div>

        {/* 성능 대시보드 */}
        <div className="mb-8">
          <PerformanceDashboard showDetails={true} />
        </div>

        {/* 테스트 컨트롤 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            테스트 컨트롤
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={runAllTests}
              disabled={isTestRunning}
              className="btn btn-primary flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isTestRunning ? '테스트 실행 중...' : '전체 테스트'}
            </button>
            
            <button
              onClick={runPerformanceTest}
              disabled={isTestRunning}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              성능 테스트
            </button>
            
            <button
              onClick={runCacheTest}
              disabled={isTestRunning}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Server className="h-4 w-4" />
              캐시 테스트
            </button>
            
            <button
              onClick={runPWATest}
              disabled={isTestRunning}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Smartphone className="h-4 w-4" />
              PWA 테스트
            </button>
            
            <button
              onClick={runImageTest}
              disabled={isTestRunning}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Image className="h-4 w-4" />
              이미지 테스트
            </button>
            
            <button
              onClick={testErrorTracking}
              className="btn btn-secondary flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              에러 추적
            </button>
            
            <button
              onClick={resetTests}
              className="btn btn-outline flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              초기화
            </button>
          </div>
        </div>

        {/* 테스트 실행 상태 */}
        {isTestRunning && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-center">
              <LoadingSpinner />
              <span className="ml-3 text-gray-600 dark:text-gray-300">
                통합 테스트를 실행 중입니다...
              </span>
            </div>
          </div>
        )}

        {/* 성능 테스트 결과 */}
        {testResults.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              성능 테스트 결과
            </h2>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {result.test}
                  </h3>
                  <pre className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 캐시 테스트 결과 */}
        {cacheTestResults.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Server className="h-5 w-5 text-green-500" />
              캐시 시스템 테스트 결과
            </h2>
            <div className="space-y-4">
              {cacheTestResults.map((result, index) => (
                <div key={index} className={`border rounded-lg p-4 ${
                  result.success ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {result.testName}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.success ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    }`}>
                      {result.success ? '성공' : '실패'}
                    </span>
                  </div>
                  {result.details && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {result.details}
                    </p>
                  )}
                  {result.duration && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      소요 시간: {result.duration.toFixed(2)}ms
                    </p>
                  )}
                  {result.error && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      오류: {result.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PWA 테스트 결과 */}
        {pwaTestResults.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-purple-500" />
              PWA 기능 테스트 결과
            </h2>
            <div className="space-y-4">
              {pwaTestResults.map((result, index) => (
                <div key={index} className={`border rounded-lg p-4 ${
                  result.success ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {result.testName}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.success ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    }`}>
                      {result.success ? '성공' : '실패'}
                    </span>
                  </div>
                  {result.details && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {result.details}
                    </p>
                  )}
                  {result.error && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      오류: {result.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 이미지 테스트 결과 */}
        {imageTestResults.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Image className="h-5 w-5 text-orange-500" />
              이미지 최적화 테스트 결과
            </h2>
            <div className="space-y-4">
              {imageTestResults.map((result, index) => (
                <div key={index} className={`border rounded-lg p-4 ${
                  result.success ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {result.testName}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.success ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    }`}>
                      {result.success ? '성공' : '실패'}
                    </span>
                  </div>
                  {result.duration && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      소요 시간: {result.duration.toFixed(2)}ms
                    </p>
                  )}
                  {result.error && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      오류: {result.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 실시간 성능 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              성능 지표
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">평균 로딩 시간:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {perfStats.averageLoadTime?.toFixed(2)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">느린 리소스:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {perfStats.slowResources || 0}개
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">메모리 사용량:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {perfStats.memoryUsage && typeof perfStats.memoryUsage === 'object' && 'usedJSHeapSize' in perfStats.memoryUsage ? 
                    `${((perfStats.memoryUsage as any).usedJSHeapSize / (1024 * 1024)).toFixed(2)}MB` : 
                    'N/A'
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              에러 통계
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">총 에러 수:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {errorStats.totalErrors || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">심각한 에러:</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {errorStats.criticalErrors || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">최근 에러:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {errorStats.recentErrors?.length || 0}개
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTestPage;
