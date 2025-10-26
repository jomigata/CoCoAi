// Service Worker for CoCo Ai PWA - Enhanced Performance Version
const CACHE_NAME = 'cocoai-v2.0.0';
const STATIC_CACHE_NAME = 'cocoai-static-v2.0.0';
const DYNAMIC_CACHE_NAME = 'cocoai-dynamic-v2.0.0';
const API_CACHE_NAME = 'cocoai-api-v2.0.0';
const IMAGE_CACHE_NAME = 'cocoai-images-v2.0.0';

// 캐시 전략 설정
const CACHE_STRATEGIES = {
  STATIC: 'cache-first',      // 정적 리소스: 캐시 우선
  DYNAMIC: 'network-first',   // 동적 리소스: 네트워크 우선
  API: 'stale-while-revalidate', // API: 오래된 캐시 사용하면서 백그라운드 업데이트
  IMAGES: 'cache-first'       // 이미지: 캐시 우선
};

// 캐시 만료 시간 (밀리초)
const CACHE_EXPIRY = {
  STATIC: 7 * 24 * 60 * 60 * 1000,    // 7일
  DYNAMIC: 24 * 60 * 60 * 1000,       // 1일
  API: 5 * 60 * 1000,                 // 5분
  IMAGES: 30 * 24 * 60 * 60 * 1000    // 30일
};

// 캐시할 정적 리소스
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // CSS 파일들
  '/css/index.css',
  '/css/design-system.css',
  // 기본 JS 청크들
  '/js/react-vendor-[hash].js',
  '/js/firebase-vendor-[hash].js',
  '/js/ui-vendor-[hash].js'
];

// 캐시하지 않을 리소스 (API 호출 등)
const EXCLUDE_CACHE = [
  '/api/',
  '/functions/',
  '/firebase/',
  '/auth/',
  '/firestore/'
];

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // 오래된 캐시 정리
      cleanupOldCaches(),
      // 캐시 크기 관리
      manageCacheSize(),
      // 클라이언트 제어권 획득
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker: Activation complete');
    })
  );
});

// 오래된 캐시 정리
async function cleanupOldCaches() {
  const validCaches = [
    STATIC_CACHE_NAME,
    DYNAMIC_CACHE_NAME,
    API_CACHE_NAME,
    IMAGE_CACHE_NAME
  ];
  
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames
    .filter(cacheName => !validCaches.includes(cacheName))
    .map(cacheName => {
      console.log('Service Worker: Deleting old cache', cacheName);
      return caches.delete(cacheName);
    });
  
  return Promise.all(deletePromises);
}

// 캐시 크기 관리
async function manageCacheSize() {
  const maxCacheSize = 50 * 1024 * 1024; // 50MB
  
  for (const cacheName of [DYNAMIC_CACHE_NAME, API_CACHE_NAME, IMAGE_CACHE_NAME]) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      
      if (keys.length > 100) { // 최대 100개 항목
        // 오래된 항목부터 삭제
        const sortedKeys = await sortKeysByAge(keys);
        const keysToDelete = sortedKeys.slice(0, keys.length - 100);
        
        for (const key of keysToDelete) {
          await cache.delete(key);
        }
        
        console.log(`Service Worker: Cleaned ${keysToDelete.length} old entries from ${cacheName}`);
      }
    } catch (error) {
      console.error(`Service Worker: Cache size management failed for ${cacheName}`, error);
    }
  }
}

// 키를 나이순으로 정렬
async function sortKeysByAge(keys) {
  const keyAges = await Promise.all(
    keys.map(async (key) => {
      try {
        const response = await caches.match(key);
        const age = response ? Date.now() - new Date(response.headers.get('date')).getTime() : 0;
        return { key, age };
      } catch {
        return { key, age: Infinity };
      }
    })
  );
  
  return keyAges
    .sort((a, b) => b.age - a.age)
    .map(item => item.key);
}

// 네트워크 요청 가로채기 - 고도화된 캐싱 전략
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 캐시하지 않을 리소스는 네트워크에서 직접 가져오기
  if (EXCLUDE_CACHE.some(path => url.pathname.startsWith(path))) {
    return;
  }
  
  // GET 요청만 캐시 처리
  if (request.method !== 'GET') {
    return;
  }
  
  // 리소스 타입에 따른 캐싱 전략 적용
  const resourceType = getResourceType(request);
  event.respondWith(handleRequest(request, resourceType));
});

// 리소스 타입 결정
function getResourceType(request) {
  const url = new URL(request.url);
  
  // API 요청
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/')) {
    return 'API';
  }
  
  // 이미지 리소스
  if (request.destination === 'image' || 
      /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname)) {
    return 'IMAGES';
  }
  
  // 정적 리소스 (HTML, CSS, JS)
  if (request.destination === 'document' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      /\.(html|css|js)$/i.test(url.pathname)) {
    return 'STATIC';
  }
  
  // 기타 동적 리소스
  return 'DYNAMIC';
}

// 캐싱 전략에 따른 요청 처리
async function handleRequest(request, resourceType) {
  const cacheName = getCacheName(resourceType);
  const strategy = CACHE_STRATEGIES[resourceType];
  
  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request, cacheName);
    case 'network-first':
      return networkFirst(request, cacheName);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, cacheName);
    default:
      return networkFirst(request, cacheName);
  }
}

// 캐시 이름 결정
function getCacheName(resourceType) {
  switch (resourceType) {
    case 'STATIC': return STATIC_CACHE_NAME;
    case 'DYNAMIC': return DYNAMIC_CACHE_NAME;
    case 'API': return API_CACHE_NAME;
    case 'IMAGES': return IMAGE_CACHE_NAME;
    default: return DYNAMIC_CACHE_NAME;
  }
}

// Cache First 전략
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Cache First - Serving from cache', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('Service Worker: Cache First - Caching new resource', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Cache First failed', error);
    return handleOfflineFallback(request);
  }
}

// Network First 전략
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('Service Worker: Network First - Updated cache', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network First - Falling back to cache', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return handleOfflineFallback(request);
  }
}

// Stale While Revalidate 전략
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  // 백그라운드에서 네트워크 요청
  const networkPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName);
      cache.then(c => c.put(request, networkResponse.clone()));
      console.log('Service Worker: Stale While Revalidate - Updated cache', request.url);
    }
    return networkResponse;
  }).catch(error => {
    console.log('Service Worker: Stale While Revalidate - Network failed', error);
  });
  
  // 캐시된 응답이 있으면 즉시 반환, 없으면 네트워크 응답 대기
  return cachedResponse || networkPromise;
}

// 오프라인 폴백 처리
function handleOfflineFallback(request) {
  if (request.destination === 'document') {
    return caches.match('/');
  }
  
  // 이미지 요청의 경우 기본 이미지 반환
  if (request.destination === 'image') {
    return caches.match('/icons/icon-192x192.png');
  }
  
  throw new Error('No offline fallback available');
}

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 오프라인 상태에서 저장된 데이터 동기화
      syncOfflineData()
    );
  }
});

// 푸시 알림 처리
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '확인하기',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('CoCo Ai 알림', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 오프라인 데이터 동기화 함수
async function syncOfflineData() {
  try {
    // IndexedDB에서 오프라인 데이터 가져오기
    const offlineData = await getOfflineData();
    
    if (offlineData.length > 0) {
      console.log('Service Worker: Syncing offline data', offlineData.length, 'items');
      
      // 각 데이터 항목을 서버에 동기화
      for (const data of offlineData) {
        try {
          await fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          });
          
          // 동기화 성공 시 로컬 데이터 삭제
          await removeOfflineData(data.id);
        } catch (error) {
          console.error('Service Worker: Sync failed for item', data.id, error);
        }
      }
    }
  } catch (error) {
    console.error('Service Worker: Sync process failed', error);
  }
}

// IndexedDB에서 오프라인 데이터 가져오기
async function getOfflineData() {
  return new Promise((resolve) => {
    const request = indexedDB.open('CoCoAiOffline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
      
      getAllRequest.onerror = () => {
        resolve([]);
      };
    };
    
    request.onerror = () => {
      resolve([]);
    };
  });
}

// IndexedDB에서 오프라인 데이터 삭제
async function removeOfflineData(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('CoCoAiOffline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
      
      deleteRequest.onerror = () => {
        resolve();
      };
    };
    
    request.onerror = () => {
      resolve();
    };
  });
}
