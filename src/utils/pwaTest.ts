// src/utils/pwaTest.ts
interface PWATestResult {
  testName: string;
  success: boolean;
  details?: string;
  error?: string;
}

export class PWATestSuite {
  private results: PWATestResult[] = [];

  // 모든 PWA 테스트 실행
  async runAllTests(): Promise<PWATestResult[]> {
    this.results = [];
    
    console.log('📱 PWA 기능 테스트 시작...');
    
    await this.testServiceWorkerRegistration();
    await this.testManifestFile();
    await this.testOfflineCapability();
    await this.testInstallability();
    await this.testPushNotifications();
    await this.testBackgroundSync();
    await this.testCacheAPI();
    
    console.log('✅ PWA 기능 테스트 완료');
    return this.results;
  }

  // Service Worker 등록 테스트
  private async testServiceWorkerRegistration(): Promise<void> {
    const testName = 'Service Worker 등록';
    
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration) {
          this.results.push({
            testName,
            success: true,
            details: `Service Worker 활성화됨 (스코프: ${registration.scope})`
          });
          console.log(`✅ ${testName}: 성공`);
        } else {
          this.results.push({
            testName,
            success: false,
            error: 'Service Worker가 등록되지 않음'
          });
          console.log(`❌ ${testName}: Service Worker가 등록되지 않음`);
        }
      } else {
        this.results.push({
          testName,
          success: false,
          error: 'Service Worker를 지원하지 않는 브라우저'
        });
        console.log(`❌ ${testName}: Service Worker를 지원하지 않음`);
      }
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  // Manifest 파일 테스트
  private async testManifestFile(): Promise<void> {
    const testName = 'Web App Manifest';
    
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      
      if (manifestLink) {
        const manifestUrl = manifestLink.href;
        const response = await fetch(manifestUrl);
        
        if (response.ok) {
          const manifest = await response.json();
          
          const requiredFields = ['name', 'short_name', 'start_url', 'display'];
          const hasRequiredFields = requiredFields.every(field => manifest[field]);
          
          this.results.push({
            testName,
            success: hasRequiredFields,
            details: hasRequiredFields ? 
              `Manifest 파일 유효 (${Object.keys(manifest).length}개 필드)` : 
              '필수 필드 누락'
          });
          console.log(`✅ ${testName}: ${hasRequiredFields ? '성공' : '부분 성공'}`);
        } else {
          this.results.push({
            testName,
            success: false,
            error: `Manifest 파일 로드 실패 (${response.status})`
          });
          console.log(`❌ ${testName}: Manifest 파일 로드 실패`);
        }
      } else {
        this.results.push({
          testName,
          success: false,
          error: 'Manifest 링크를 찾을 수 없음'
        });
        console.log(`❌ ${testName}: Manifest 링크 없음`);
      }
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  // 오프라인 기능 테스트
  private async testOfflineCapability(): Promise<void> {
    const testName = '오프라인 기능';
    
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration) {
          // 캐시된 리소스 확인
          const cacheNames = await caches.keys();
          const hasCaches = cacheNames.length > 0;
          
          this.results.push({
            testName,
            success: hasCaches,
            details: hasCaches ? 
              `${cacheNames.length}개 캐시 저장소 발견` : 
              '캐시 저장소 없음'
          });
          console.log(`✅ ${testName}: ${hasCaches ? '성공' : '부분 성공'}`);
        } else {
          this.results.push({
            testName,
            success: false,
            error: 'Service Worker가 등록되지 않음'
          });
          console.log(`❌ ${testName}: Service Worker 없음`);
        }
      } else {
        this.results.push({
          testName,
          success: false,
          error: 'Service Worker를 지원하지 않음'
        });
        console.log(`❌ ${testName}: Service Worker 지원 안함`);
      }
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  // 설치 가능성 테스트
  private async testInstallability(): Promise<void> {
    const testName = '앱 설치 가능성';
    
    try {
      // Before Install Prompt 이벤트 지원 확인
      const supportsInstallPrompt = 'onbeforeinstallprompt' in window;
      
      // iOS Safari의 경우 다른 방식으로 확인
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      const canInstall = supportsInstallPrompt || (isIOS && isStandalone);
      
      this.results.push({
        testName,
        success: canInstall,
        details: canInstall ? 
          '앱 설치 가능' : 
          '앱 설치 불가능 (브라우저 지원 안함)'
      });
      console.log(`✅ ${testName}: ${canInstall ? '성공' : '부분 성공'}`);
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  // 푸시 알림 테스트
  private async testPushNotifications(): Promise<void> {
    const testName = '푸시 알림 지원';
    
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration) {
          const permission = await Notification.requestPermission();
          const supportsPush = permission === 'granted';
          
          this.results.push({
            testName,
            success: supportsPush,
            details: `알림 권한: ${permission}`
          });
          console.log(`✅ ${testName}: ${supportsPush ? '성공' : '부분 성공'}`);
        } else {
          this.results.push({
            testName,
            success: false,
            error: 'Service Worker가 등록되지 않음'
          });
          console.log(`❌ ${testName}: Service Worker 없음`);
        }
      } else {
        this.results.push({
          testName,
          success: false,
          error: '푸시 알림을 지원하지 않는 브라우저'
        });
        console.log(`❌ ${testName}: 푸시 알림 지원 안함`);
      }
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  // 백그라운드 동기화 테스트
  private async testBackgroundSync(): Promise<void> {
    const testName = '백그라운드 동기화';
    
    try {
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration) {
          this.results.push({
            testName,
            success: true,
            details: '백그라운드 동기화 지원됨'
          });
          console.log(`✅ ${testName}: 성공`);
        } else {
          this.results.push({
            testName,
            success: false,
            error: 'Service Worker가 등록되지 않음'
          });
          console.log(`❌ ${testName}: Service Worker 없음`);
        }
      } else {
        this.results.push({
          testName,
          success: false,
          error: '백그라운드 동기화를 지원하지 않는 브라우저'
        });
        console.log(`❌ ${testName}: 백그라운드 동기화 지원 안함`);
      }
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  // Cache API 테스트
  private async testCacheAPI(): Promise<void> {
    const testName = 'Cache API 지원';
    
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        
        this.results.push({
          testName,
          success: true,
          details: `Cache API 지원됨 (${cacheNames.length}개 캐시)`
        });
        console.log(`✅ ${testName}: 성공`);
      } else {
        this.results.push({
          testName,
          success: false,
          error: 'Cache API를 지원하지 않는 브라우저'
        });
        console.log(`❌ ${testName}: Cache API 지원 안함`);
      }
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  // PWA 점수 계산
  calculatePWAScore(): { score: number; maxScore: number; percentage: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const percentage = Math.round((passed / total) * 100);
    
    return {
      score: passed,
      maxScore: total,
      percentage
    };
  }

  // 테스트 결과 요약
  getTestSummary(): { total: number; passed: number; failed: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    
    return {
      total,
      passed,
      failed
    };
  }
}
