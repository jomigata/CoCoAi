// 에러 추적 및 알림 시스템
import React from 'react';
interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  url: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp: number;
  userAgent: string;
  userId?: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'javascript' | 'network' | 'promise' | 'custom';
  metadata?: Record<string, any>;
}

interface ErrorTrackingConfig {
  enabled: boolean;
  sampleRate: number;
  maxReports: number;
  reportInterval: number;
  endpoint?: string;
  ignorePatterns: RegExp[];
  severityThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

class ErrorTracker {
  private config: ErrorTrackingConfig;
  private reports: ErrorReport[] = [];
  private sessionId: string;
  private reportTimer: number | null = null;
  private errorCounts: Map<string, number> = new Map();

  constructor(config: Partial<ErrorTrackingConfig> = {}) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      maxReports: 100,
      reportInterval: 30000, // 30초
      ignorePatterns: [
        /Script error/i,
        /Non-Error promise rejection/i,
        /ResizeObserver loop limit exceeded/i
      ],
      severityThresholds: {
        low: 1,
        medium: 5,
        high: 10,
        critical: 20
      },
      ...config
    };

    this.sessionId = this.generateSessionId();

    if (this.config.enabled) {
      this.init();
    }
  }

  private init(): void {
    // 전역 에러 핸들러 등록
    this.setupGlobalErrorHandlers();
    
    // Promise rejection 핸들러 등록
    this.setupPromiseRejectionHandler();
    
    // 네트워크 에러 모니터링
    this.setupNetworkErrorMonitoring();
    
    // 보고서 전송 타이머 시작
    this.startReportTimer();
    
    // 페이지 언로드 시 데이터 전송
    this.setupUnloadHandler();
  }

  // 전역 에러 핸들러 설정
  private setupGlobalErrorHandlers(): void {
    // JavaScript 에러
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        category: 'javascript'
      });
    });

    // 리소스 로딩 에러
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError({
          message: `Failed to load resource: ${(event.target as any).src || (event.target as any).href}`,
          url: (event.target as any).src || (event.target as any).href,
          category: 'network'
        });
      }
    }, true);
  }

  // Promise rejection 핸들러 설정
  private setupPromiseRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        category: 'promise',
        metadata: { reason: event.reason }
      });
    });
  }

  // 네트워크 에러 모니터링
  private setupNetworkErrorMonitoring(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // HTTP 에러 상태 체크
        if (!response.ok) {
          this.handleError({
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0] as string,
            category: 'network',
            metadata: {
              status: response.status,
              statusText: response.statusText,
              method: args[1]?.method || 'GET'
            }
          });
        }
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.handleError({
          message: `Network request failed: ${errorMessage}`,
          url: args[0] as string,
          category: 'network',
          metadata: { error: errorMessage }
        });
        throw error;
      }
    };
  }

  // 에러 처리
  private handleError(errorInfo: {
    message: string;
    stack?: string;
    url?: string;
    lineNumber?: number;
    columnNumber?: number;
    category: ErrorReport['category'];
    metadata?: Record<string, any>;
  }): void {
    // 샘플링 확인
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    // 무시할 패턴 확인
    if (this.config.ignorePatterns.some(pattern => pattern.test(errorInfo.message))) {
      return;
    }

    // 에러 카운트 증가
    const errorKey = `${errorInfo.message}:${errorInfo.url}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);

    // 심각도 결정
    const severity = this.determineSeverity(errorKey, count + 1);

    const report: ErrorReport = {
      id: this.generateErrorId(),
      message: errorInfo.message,
      stack: errorInfo.stack,
      url: errorInfo.url || window.location.href,
      lineNumber: errorInfo.lineNumber,
      columnNumber: errorInfo.columnNumber,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      severity,
      category: errorInfo.category,
      metadata: {
        ...errorInfo.metadata,
        errorCount: count + 1,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        url: window.location.href,
        referrer: document.referrer
      }
    };

    this.addReport(report);

    // 심각한 에러의 경우 즉시 알림
    if (severity === 'critical' || severity === 'high') {
      this.showErrorNotification(report);
    }
  }

  // 심각도 결정
  private determineSeverity(errorKey: string, count: number): ErrorReport['severity'] {
    const thresholds = this.config.severityThresholds;
    
    if (count >= thresholds.critical) return 'critical';
    if (count >= thresholds.high) return 'high';
    if (count >= thresholds.medium) return 'medium';
    return 'low';
  }

  // 커스텀 에러 보고
  reportError(
    message: string,
    metadata?: Record<string, any>,
    severity: ErrorReport['severity'] = 'medium'
  ): void {
    this.handleError({
      message,
      category: 'custom',
      metadata: {
        ...metadata,
        customSeverity: severity
      },
      url: window.location.href
    });
  }

  // 에러 보고서 추가
  private addReport(report: ErrorReport): void {
    this.reports.push(report);
    
    // 최대 보고서 수 초과 시 오래된 보고서 삭제
    if (this.reports.length > this.config.maxReports) {
      this.reports = this.reports.slice(-this.config.maxReports);
    }

    console.warn('Error Tracker:', report.message, report);
  }

  // 에러 알림 표시
  private showErrorNotification(report: ErrorReport): void {
    // 개발 환경에서는 콘솔에만 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('Critical Error:', report);
      return;
    }

    // 사용자에게 친화적인 알림 표시
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium">오류가 발생했습니다</h3>
          <p class="text-sm mt-1">문제가 지속되면 페이지를 새로고침해주세요.</p>
        </div>
        <button class="ml-auto text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // 5초 후 자동 제거
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // 보고서 전송 타이머 시작
  private startReportTimer(): void {
    if (this.reportTimer) return;

    this.reportTimer = window.setInterval(() => {
      this.sendReports();
    }, this.config.reportInterval);
  }

  // 에러 보고서 전송
  private async sendReports(): Promise<void> {
    if (this.reports.length === 0 || !this.config.endpoint) return;

    try {
      const reportsToSend = [...this.reports];
      
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          url: window.location.href,
          timestamp: Date.now(),
          reports: reportsToSend
        })
      });

      // 전송된 보고서 제거
      this.reports = [];
      
      console.log('Error Tracker: Reports sent successfully');
    } catch (error) {
      console.warn('Error Tracker: Report sending failed', error);
    }
  }

  // 언로드 핸들러 설정
  private setupUnloadHandler(): void {
    const sendReports = () => {
      if (this.reports.length === 0 || !this.config.endpoint) return;

      const reportsToSend = [...this.reports];
      
      // sendBeacon 사용 (페이지 언로드 시에도 전송 가능)
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon(
          this.config.endpoint,
          JSON.stringify({
            sessionId: this.sessionId,
            url: window.location.href,
            timestamp: Date.now(),
            reports: reportsToSend
          })
        );
      }
    };

    window.addEventListener('beforeunload', sendReports);
    window.addEventListener('pagehide', sendReports);
  }

  // 세션 ID 생성
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 에러 ID 생성
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 에러 통계 가져오기
  getStats(): {
    totalErrors: number;
    errorCounts: Record<string, number>;
    severityBreakdown: Record<string, number>;
    recentErrors: ErrorReport[];
  } {
    const severityBreakdown = this.reports.reduce((acc, report) => {
      acc[report.severity] = (acc[report.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.reports.length,
      errorCounts: Object.fromEntries(this.errorCounts),
      severityBreakdown,
      recentErrors: this.reports.slice(-10) // 최근 10개 에러
    };
  }

  // 에러 추적 중지
  destroy(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }

    this.reports = [];
    this.errorCounts.clear();
  }
}

// 기본 에러 추적기 인스턴스
export const errorTracker = new ErrorTracker({
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: 1.0,
  maxReports: 50,
  reportInterval: 30000,
  endpoint: '/api/errors'
});

// React Hook for Error Tracking
export function useErrorTracker() {
  const [stats, setStats] = React.useState(errorTracker.getStats());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(errorTracker.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    reportError: errorTracker.reportError.bind(errorTracker)
  };
}

export default ErrorTracker;
