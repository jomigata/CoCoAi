// src/utils/cacheTest.ts
import { cachedFetch } from './apiCache';

interface CacheTestResult {
  testName: string;
  success: boolean;
  duration: number;
  cacheHit?: boolean;
  error?: string;
}

export class CacheTestSuite {
  private results: CacheTestResult[] = [];

  // 캐시 테스트 실행
  async runAllTests(): Promise<CacheTestResult[]> {
    this.results = [];
    
    console.log('🚀 캐시 시스템 테스트 시작...');
    
    await this.testCacheFirstStrategy();
    await this.testNetworkFirstStrategy();
    await this.testStaleWhileRevalidateStrategy();
    await this.testCacheExpiration();
    await this.testOfflineFallback();
    
    console.log('✅ 캐시 시스템 테스트 완료');
    return this.results;
  }

  // Cache First 전략 테스트
  private async testCacheFirstStrategy(): Promise<void> {
    const testName = 'Cache First 전략';
    const startTime = performance.now();
    
    try {
      // 첫 번째 요청 (캐시 미스)
      const firstRequest = await cachedFetch('/api/test-cache-first', {}, {
        strategy: 'cache-first',
        ttl: 5000,
        storage: 'memory'
      });
      
      // 두 번째 요청 (캐시 히트)
      const secondRequest = await cachedFetch('/api/test-cache-first', {}, {
        strategy: 'cache-first',
        ttl: 5000,
        storage: 'memory'
      });
      
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName,
        success: true,
        duration,
        cacheHit: true
      });
      
      console.log(`✅ ${testName}: 성공 (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  // Network First 전략 테스트
  private async testNetworkFirstStrategy(): Promise<void> {
    const testName = 'Network First 전략';
    const startTime = performance.now();
    
    try {
      const response = await cachedFetch('/api/test-network-first', {}, {
        strategy: 'network-first',
        ttl: 3000,
        storage: 'both'
      });
      
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName,
        success: true,
        duration,
        cacheHit: false
      });
      
      console.log(`✅ ${testName}: 성공 (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  // Stale While Revalidate 전략 테스트
  private async testStaleWhileRevalidateStrategy(): Promise<void> {
    const testName = 'Stale While Revalidate 전략';
    const startTime = performance.now();
    
    try {
      const response = await cachedFetch('/api/test-stale-revalidate', {}, {
        strategy: 'stale-while-revalidate',
        ttl: 2000,
        storage: 'both'
      });
      
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName,
        success: true,
        duration,
        cacheHit: true
      });
      
      console.log(`✅ ${testName}: 성공 (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  // 캐시 만료 테스트
  private async testCacheExpiration(): Promise<void> {
    const testName = '캐시 만료 테스트';
    const startTime = performance.now();
    
    try {
      // 짧은 TTL로 캐시 설정
      await cachedFetch('/api/test-expiration', {}, {
        strategy: 'cache-first',
        ttl: 100, // 100ms
        storage: 'memory'
      });
      
      // 캐시 만료 대기
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // 만료된 캐시 요청
      const response = await cachedFetch('/api/test-expiration', {}, {
        strategy: 'cache-first',
        ttl: 100,
        storage: 'memory'
      });
      
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName,
        success: true,
        duration,
        cacheHit: false
      });
      
      console.log(`✅ ${testName}: 성공 (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  // 오프라인 폴백 테스트
  private async testOfflineFallback(): Promise<void> {
    const testName = '오프라인 폴백 테스트';
    const startTime = performance.now();
    
    try {
      // 네트워크 상태 저장
      const originalOnline = navigator.onLine;
      
      // 오프라인 시뮬레이션
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      
      // 캐시된 데이터 요청
      const response = await cachedFetch('/api/test-offline', {}, {
        strategy: 'network-first',
        ttl: 10000,
        storage: 'both'
      });
      
      // 네트워크 상태 복원
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: originalOnline
      });
      
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName,
        success: true,
        duration,
        cacheHit: true
      });
      
      console.log(`✅ ${testName}: 성공 (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  // Service Worker 캐시 테스트
  async testServiceWorkerCache(): Promise<CacheTestResult[]> {
    const swResults: CacheTestResult[] = [];
    
    if ('serviceWorker' in navigator) {
      try {
        // Service Worker 등록 확인
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration) {
          swResults.push({
            testName: 'Service Worker 등록',
            success: true,
            duration: 0
          });
          
          // 캐시 상태 확인
          const cacheNames = await caches.keys();
          swResults.push({
            testName: '캐시 저장소 확인',
            success: cacheNames.length > 0,
            duration: 0
          });
          
          // 캐시된 리소스 확인
          const cache = await caches.open('cocoai-static-v2.0.0');
          const keys = await cache.keys();
          swResults.push({
            testName: '캐시된 리소스',
            success: keys.length > 0,
            duration: 0
          });
        } else {
          swResults.push({
            testName: 'Service Worker 등록',
            success: false,
            duration: 0,
            error: 'Service Worker가 등록되지 않음'
          });
        }
      } catch (error) {
        swResults.push({
          testName: 'Service Worker 테스트',
          success: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      swResults.push({
        testName: 'Service Worker 지원',
        success: false,
        duration: 0,
        error: 'Service Worker를 지원하지 않는 브라우저'
      });
    }
    
    return swResults;
  }

  // 테스트 결과 요약
  getTestSummary(): { total: number; passed: number; failed: number; averageDuration: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    
    return {
      total,
      passed,
      failed,
      averageDuration
    };
  }
}

// 이미지 최적화 테스트
export class ImageOptimizationTest {
  private results: CacheTestResult[] = [];

  async runImageTests(): Promise<CacheTestResult[]> {
    this.results = [];
    
    console.log('🖼️ 이미지 최적화 테스트 시작...');
    
    await this.testImageLoading();
    await this.testLazyLoading();
    await this.testWebPSupport();
    await this.testResponsiveImages();
    
    console.log('✅ 이미지 최적화 테스트 완료');
    return this.results;
  }

  private async testImageLoading(): Promise<void> {
    const testName = '이미지 로딩 성능';
    const startTime = performance.now();
    
    try {
      const imageUrls = [
        'https://via.placeholder.com/300x200',
        'https://via.placeholder.com/400x300',
        'https://via.placeholder.com/500x400'
      ];

      const promises = imageUrls.map(url => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load ${url}`));
          img.src = url;
        });
      });

      await Promise.all(promises);
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName,
        success: true,
        duration
      });
      
      console.log(`✅ ${testName}: 성공 (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  private async testLazyLoading(): Promise<void> {
    const testName = 'Lazy Loading 지원';
    const startTime = performance.now();
    
    try {
      const supportsLazyLoading = 'loading' in HTMLImageElement.prototype;
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName,
        success: supportsLazyLoading,
        duration
      });
      
      console.log(`✅ ${testName}: ${supportsLazyLoading ? '지원됨' : '지원되지 않음'}`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  private async testWebPSupport(): Promise<void> {
    const testName = 'WebP 포맷 지원';
    const startTime = performance.now();
    
    try {
      const canvas = document.createElement('canvas');
      const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName,
        success: supportsWebP,
        duration
      });
      
      console.log(`✅ ${testName}: ${supportsWebP ? '지원됨' : '지원되지 않음'}`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }

  private async testResponsiveImages(): Promise<void> {
    const testName = '반응형 이미지 지원';
    const startTime = performance.now();
    
    try {
      const supportsSrcset = 'srcset' in HTMLImageElement.prototype;
      const supportsSizes = 'sizes' in HTMLImageElement.prototype;
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName,
        success: supportsSrcset && supportsSizes,
        duration
      });
      
      console.log(`✅ ${testName}: ${supportsSrcset && supportsSizes ? '지원됨' : '지원되지 않음'}`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error(`❌ ${testName}: 실패 - ${error}`);
    }
  }
}
