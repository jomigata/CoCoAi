// Service Worker for CoCo Ai PWA
const CACHE_NAME = 'cocoai-v1.0.0';
const STATIC_CACHE_NAME = 'cocoai-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'cocoai-dynamic-v1.0.0';

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
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// 네트워크 요청 가로채기
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
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // 캐시된 응답이 있으면 반환
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', request.url);
          return cachedResponse;
        }
        
        // 캐시된 응답이 없으면 네트워크에서 가져오기
        return fetch(request)
          .then((networkResponse) => {
            // 응답이 유효한지 확인
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // 동적 캐시에 저장
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
            
            console.log('Service Worker: Caching new resource', request.url);
            return networkResponse;
          })
          .catch((error) => {
            console.error('Service Worker: Network request failed', error);
            
            // 오프라인 페이지 반환 (홈페이지로 대체)
            if (request.destination === 'document') {
              return caches.match('/');
            }
            
            throw error;
          });
      })
  );
});

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
