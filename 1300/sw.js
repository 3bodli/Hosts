// sw.js - Service Worker للتخزين المؤقت المتقدم

const CACHE_NAME = 'ps4-jailbreak-v1';
const OFFLINE_URL = 'cache.html';

// قائمة الملفات التي سيتم تخزينها مؤقتاً
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/cache.html',
    '../style.css',
    '../img.jpg',
    '/chain_poops.js',
    '/mem.js',
    '/int64.js',
    '/ps4_offsets.js',
    '/core.js?v=10',
    '/patches/payload.bin'
];

// تثبيت Service Worker وتخزين الملفات
self.addEventListener('install', function(event) {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('[SW] Caching files...');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(function() {
                console.log('[SW] All files cached successfully!');
                return self.skipWaiting();
            })
            .catch(function(error) {
                console.error('[SW] Cache installation failed:', error);
            })
    );
});

// تنشيط Service Worker وتنظيف الكاش القديم
self.addEventListener('activate', function(event) {
    console.log('[SW] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(function() {
                console.log('[SW] Claiming clients...');
                return self.clients.claim();
            })
    );
});

// اعتراض الطلبات وإرجاع النسخة المخزنة مؤقتاً
self.addEventListener('fetch', function(event) {
    // تجاهل طلبات التحليلات والإحصائيات
    if (event.request.url.includes('analytics') || 
        event.request.url.includes('google')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // إذا وجد الملف في الكاش، أرجعه
                if (response) {
                    console.log('[SW] Cache hit:', event.request.url);
                    return response;
                }
                
                // وإلا، قم بتحميله من الشبكة
                console.log('[SW] Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then(function(networkResponse) {
                        // تخزين النسخة الجديدة في الكاش للمرة القادمة
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(function(cache) {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(function(error) {
                        console.error('[SW] Fetch failed:', error);
                        // صفحة الخطأ في حالة عدم وجود اتصال
                        return caches.match(OFFLINE_URL);
                    });
            })
    );
});

// تحديث الكاش في الخلفية (عند وجود إصدار جديد)
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
