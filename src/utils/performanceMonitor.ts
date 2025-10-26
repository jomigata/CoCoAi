// 성능 모니터링 시스템
import React from 'react';
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'navigation' | 'resource' | 'custom' | 'user-timing';
  metadata?: Record<string, any>;
}

interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number; // 0-1 사이의 샘플링 비율
  maxMetrics: number; // 최대 저장할 메트릭 수
  reportInterval: number; // 보고서 전송 간격 (ms)
  endpoint?: string; // 성능 데이터 전송 엔드포인트
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private reportTimer: number | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      maxMetrics: 1000,
      reportInterval: 60000, // 1분
      ...config
    };

    if (this.config.enabled) {
      this.init();
    }
  }

  private init(): void {
    // 샘플링 확인
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    // 네비게이션 타이밍 모니터링
    this.observeNavigationTiming();
    
    // 리소스 타이밍 모니터링
    this.observeResourceTiming();
    
    // 사용자 타이밍 모니터링
    this.observeUserTiming();
    
    // 메모리 사용량 모니터링
    this.observeMemoryUsage();
    
    // 보고서 전송 타이머 시작
    this.startReportTimer();
    
    // 페이지 언로드 시 데이터 전송
    this.setupUnloadHandler();
  }

  // 네비게이션 타이밍 모니터링
  private observeNavigationTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.collectNavigationMetrics(entry as PerformanceNavigationTiming);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Performance Monitor: Navigation timing observation failed', error);
    }
  }

  // 네비게이션 메트릭 수집
  private collectNavigationMetrics(entry: PerformanceNavigationTiming): void {
    const metrics: PerformanceMetric[] = [
      {
        name: 'dom-content-loaded',
        value: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
        timestamp: Date.now(),
        type: 'navigation',
        metadata: { url: window.location.href }
      },
      {
        name: 'load-complete',
        value: entry.loadEventEnd - entry.loadEventStart,
        timestamp: Date.now(),
        type: 'navigation',
        metadata: { url: window.location.href }
      },
      {
        name: 'first-contentful-paint',
        value: entry.responseEnd - entry.requestStart,
        timestamp: Date.now(),
        type: 'navigation',
        metadata: { url: window.location.href }
      }
    ];

    // LCP (Largest Contentful Paint) 수집
    this.collectLCP();
    
    // FID (First Input Delay) 수집
    this.collectFID();

    metrics.forEach(metric => this.addMetric(metric));
  }

  // LCP 수집
  private collectLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        this.addMetric({
          name: 'largest-contentful-paint',
          value: lastEntry.startTime,
          timestamp: Date.now(),
          type: 'navigation',
          metadata: { 
            url: window.location.href,
            element: lastEntry.element?.tagName || 'unknown'
          }
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Performance Monitor: LCP observation failed', error);
    }
  }

  // FID 수집
  private collectFID(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.addMetric({
            name: 'first-input-delay',
            value: entry.processingStart - entry.startTime,
            timestamp: Date.now(),
            type: 'navigation',
            metadata: { 
              url: window.location.href,
              eventType: entry.name
            }
          });
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Performance Monitor: FID observation failed', error);
    }
  }

  // 리소스 타이밍 모니터링
  private observeResourceTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.collectResourceMetrics(entry as PerformanceResourceTiming);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Performance Monitor: Resource timing observation failed', error);
    }
  }

  // 리소스 메트릭 수집
  private collectResourceMetrics(entry: PerformanceResourceTiming): void {
    // 느린 리소스만 수집 (1초 이상)
    if (entry.duration < 1000) return;

    this.addMetric({
      name: 'slow-resource',
      value: entry.duration,
      timestamp: Date.now(),
      type: 'resource',
      metadata: {
        url: entry.name,
        initiatorType: entry.initiatorType,
        transferSize: entry.transferSize,
        decodedBodySize: entry.decodedBodySize
      }
    });
  }

  // 사용자 타이밍 모니터링
  private observeUserTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            this.addMetric({
              name: entry.name,
              value: entry.duration,
              timestamp: Date.now(),
              type: 'user-timing',
              metadata: { url: window.location.href }
            });
          }
        });
      });

      observer.observe({ entryTypes: ['measure'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Performance Monitor: User timing observation failed', error);
    }
  }

  // 메모리 사용량 모니터링
  private observeMemoryUsage(): void {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      
      this.addMetric({
        name: 'memory-used',
        value: memory.usedJSHeapSize,
        timestamp: Date.now(),
        type: 'custom',
        metadata: {
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        }
      });
    };

    // 초기 메모리 사용량
    checkMemory();
    
    // 30초마다 메모리 사용량 체크
    setInterval(checkMemory, 30000);
  }

  // 커스텀 메트릭 추가
  addCustomMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.addMetric({
      name,
      value,
      timestamp: Date.now(),
      type: 'custom',
      metadata
    });
  }

  // 사용자 타이밍 마크
  mark(name: string): void {
    if ('mark' in performance) {
      performance.mark(name);
    }
  }

  // 사용자 타이밍 측정
  measure(name: string, startMark?: string, endMark?: string): void {
    if ('measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        console.warn('Performance Monitor: Measure failed', error);
      }
    }
  }

  // 메트릭 추가
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // 최대 메트릭 수 초과 시 오래된 메트릭 삭제
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics);
    }
  }

  // 보고서 전송 타이머 시작
  private startReportTimer(): void {
    if (this.reportTimer) return;

    this.reportTimer = window.setInterval(() => {
      this.sendReport();
    }, this.config.reportInterval);
  }

  // 성능 보고서 전송
  private async sendReport(): Promise<void> {
    if (this.metrics.length === 0 || !this.config.endpoint) return;

    try {
      const report = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        metrics: [...this.metrics]
      };

      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });

      // 전송된 메트릭 제거
      this.metrics = [];
      
      console.log('Performance Monitor: Report sent successfully');
    } catch (error) {
      console.warn('Performance Monitor: Report sending failed', error);
    }
  }

  // 언로드 핸들러 설정
  private setupUnloadHandler(): void {
    const sendBeacon = () => {
      if (this.metrics.length === 0 || !this.config.endpoint) return;

      const report = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        metrics: [...this.metrics]
      };

      // sendBeacon 사용 (페이지 언로드 시에도 전송 가능)
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon(
          this.config.endpoint,
          JSON.stringify(report)
        );
      }
    };

    window.addEventListener('beforeunload', sendBeacon);
    window.addEventListener('pagehide', sendBeacon);
  }

  // 성능 통계 가져오기
  getStats(): {
    totalMetrics: number;
    averageLoadTime: number;
    slowResources: number;
    memoryUsage: number;
  } {
    const navigationMetrics = this.metrics.filter(m => m.type === 'navigation');
    const resourceMetrics = this.metrics.filter(m => m.type === 'resource');
    const memoryMetrics = this.metrics.filter(m => m.name === 'memory-used');

    return {
      totalMetrics: this.metrics.length,
      averageLoadTime: navigationMetrics.length > 0 
        ? navigationMetrics.reduce((sum, m) => sum + m.value, 0) / navigationMetrics.length 
        : 0,
      slowResources: resourceMetrics.length,
      memoryUsage: memoryMetrics.length > 0 
        ? memoryMetrics[memoryMetrics.length - 1].value 
        : 0
    };
  }

  // 모니터링 중지
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }

    this.metrics = [];
  }
}

// 기본 성능 모니터 인스턴스
export const performanceMonitor = new PerformanceMonitor({
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: 0.1, // 10% 샘플링
  maxMetrics: 500,
  reportInterval: 60000,
  endpoint: '/api/performance'
});

// React Hook for Performance Monitoring
export function usePerformanceMonitor() {
  const [stats, setStats] = React.useState(performanceMonitor.getStats());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(performanceMonitor.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    mark: performanceMonitor.mark.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    addCustomMetric: performanceMonitor.addCustomMetric.bind(performanceMonitor)
  };
}

export default PerformanceMonitor;
