/**
 * DITO.guru Service Worker
 * Provides offline caching for PWA functionality
 */

const CACHE_NAME = 'dito-v1';
const STATIC_CACHE = [
  '/',
  '/discovery',
  '/connect',
  '/chat',
  '/guide',
  '/manifest.json',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/ember-logo.png',
];

const RUNTIME_CACHE = 'dito-runtime-v1';

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_CACHE);
      })
      .then(() => {
        console.log('[SW] Static cache complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Cache cleanup complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - network-first strategy with offline fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and external requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API calls - these should fail gracefully when offline
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Skip _next chunks - let the dev server handle these directly
  if (event.request.url.includes('/_next/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache successful responses for offline use
        if (event.request.mode === 'navigate' || event.request.destination === 'document') {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }

        return response;
      })
      .catch(() => {
        // Network failed - try cache, then offline fallback
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving from cache (offline):', event.request.url);
              return cachedResponse;
            }
            if (event.request.mode === 'navigate') {
              console.log('[SW] Serving offline fallback for:', event.request.url);
              return caches.match('/');
            }
          });
      })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded');