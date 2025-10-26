// API 응답 캐싱 유틸리티
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
  strategy: 'memory' | 'indexeddb' | 'both' | 'cache-first' | 'network-first' | 'stale-while-revalidate';
  storage?: 'memory' | 'indexeddb' | 'both'; // Storage type for caching
}

interface CachedResponse<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

class APICache {
  private memoryCache = new Map<string, CachedResponse>();
  private config: CacheConfig;
  private dbName = 'CoCoAiAPICache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: 5 * 60 * 1000, // 5분 기본 TTL
      maxSize: 100, // 최대 100개 항목
      strategy: 'both', // 메모리와 IndexedDB 모두 사용
      storage: 'both', // 기본 저장소 타입
      ...config
    };
    
    this.initIndexedDB();
  }

  // IndexedDB 초기화
  private async initIndexedDB() {
    if (this.config.storage === 'memory') return;

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('responses')) {
          const store = db.createObjectStore('responses', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // 캐시 키 생성
  private generateKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}${paramString}`;
  }

  // 캐시에서 데이터 가져오기
  async get<T>(url: string, params?: Record<string, any>): Promise<T | null> {
    const key = this.generateKey(url, params);
    
    // 메모리 캐시 확인
    if (this.config.storage === 'memory' || this.config.storage === 'both') {
      const cached = this.memoryCache.get(key);
      if (cached && this.isValid(cached)) {
        console.log('API Cache: Hit (memory)', key);
        return cached.data;
      }
    }

    // IndexedDB 캐시 확인
    if (this.config.storage === 'indexeddb' || this.config.storage === 'both') {
      const cached = await this.getFromIndexedDB(key);
      if (cached && this.isValid(cached)) {
        console.log('API Cache: Hit (indexeddb)', key);
        // 메모리 캐시에도 저장
        if (this.config.storage === 'both') {
          this.memoryCache.set(key, cached);
        }
        return cached.data;
      }
    }

    console.log('API Cache: Miss', key);
    return null;
  }

  // 캐시에 데이터 저장
  async set<T>(url: string, data: T, params?: Record<string, any>, ttl?: number): Promise<void> {
    const key = this.generateKey(url, params);
    const cachedResponse: CachedResponse<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl,
      key
    };

    // 메모리 캐시에 저장
    if (this.config.storage === 'memory' || this.config.storage === 'both') {
      this.memoryCache.set(key, cachedResponse);
      this.cleanupMemoryCache();
    }

    // IndexedDB에 저장
    if (this.config.storage === 'indexeddb' || this.config.storage === 'both') {
      await this.setToIndexedDB(cachedResponse);
    }

    console.log('API Cache: Set', key);
  }

  // 캐시 유효성 검사
  private isValid(cached: CachedResponse): boolean {
    return Date.now() - cached.timestamp < cached.ttl;
  }

  // 메모리 캐시 정리
  private cleanupMemoryCache(): void {
    if (this.memoryCache.size > this.config.maxSize) {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, entries.length - this.config.maxSize);
      toDelete.forEach(([key]) => this.memoryCache.delete(key));
      
      console.log(`API Cache: Cleaned ${toDelete.length} memory entries`);
    }
  }

  // IndexedDB에서 데이터 가져오기
  private async getFromIndexedDB(key: string): Promise<CachedResponse | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['responses'], 'readonly');
      const store = transaction.objectStore('responses');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // IndexedDB에 데이터 저장
  private async setToIndexedDB(cached: CachedResponse): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['responses'], 'readwrite');
      const store = transaction.objectStore('responses');
      const request = store.put(cached);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 캐시 삭제
  async delete(url: string, params?: Record<string, any>): Promise<void> {
    const key = this.generateKey(url, params);

    // 메모리 캐시에서 삭제
    if (this.config.storage === 'memory' || this.config.storage === 'both') {
      this.memoryCache.delete(key);
    }

    // IndexedDB에서 삭제
    if (this.config.storage === 'indexeddb' || this.config.storage === 'both') {
      await this.deleteFromIndexedDB(key);
    }

    console.log('API Cache: Deleted', key);
  }

  // IndexedDB에서 데이터 삭제
  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['responses'], 'readwrite');
      const store = transaction.objectStore('responses');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 만료된 캐시 정리
  async cleanup(): Promise<void> {
    const now = Date.now();

    // 메모리 캐시 정리
    if (this.config.storage === 'memory' || this.config.storage === 'both') {
      for (const [key, cached] of this.memoryCache.entries()) {
        if (!this.isValid(cached)) {
          this.memoryCache.delete(key);
        }
      }
    }

    // IndexedDB 정리
    if (this.config.storage === 'indexeddb' || this.config.storage === 'both') {
      await this.cleanupIndexedDB(now);
    }

    console.log('API Cache: Cleanup completed');
  }

  // IndexedDB 정리
  private async cleanupIndexedDB(now: number): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['responses'], 'readwrite');
      const store = transaction.objectStore('responses');
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const cached = cursor.value;
          if (!this.isValid(cached)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 캐시 통계
  getStats(): { memorySize: number; indexedDBSize: number } {
    return {
      memorySize: this.config.storage === 'memory' || this.config.storage === 'both' ? this.memoryCache.size : 0,
      indexedDBSize: 0 // IndexedDB 크기는 별도로 계산 필요
    };
  }

  // 전체 캐시 클리어
  async clear(): Promise<void> {
    // 메모리 캐시 클리어
    if (this.config.storage === 'memory' || this.config.storage === 'both') {
      this.memoryCache.clear();
    }

    // IndexedDB 클리어
    if (this.config.storage === 'indexeddb' || this.config.storage === 'both') {
      await this.clearIndexedDB();
    }

    console.log('API Cache: Cleared all');
  }

  // IndexedDB 클리어
  private async clearIndexedDB(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['responses'], 'readwrite');
      const store = transaction.objectStore('responses');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// 기본 API 캐시 인스턴스
export const apiCache = new APICache({
  ttl: 5 * 60 * 1000, // 5분
  maxSize: 100,
  strategy: 'both'
});

// 캐시된 fetch 함수
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheConfig?: Partial<CacheConfig>
): Promise<T> {
  const cache = cacheConfig ? new APICache(cacheConfig) : apiCache;
  
  // GET 요청만 캐시
  if (options.method === 'GET' || !options.method) {
    const cached = await cache.get<T>(url, options.body as any);
    if (cached) {
      return cached;
    }
  }

  // 네트워크 요청
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // GET 요청 결과 캐시
  if (options.method === 'GET' || !options.method) {
    await cache.set(url, data, options.body as any);
  }

  return data;
}

export default APICache;
