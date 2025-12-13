// Service Worker for caching static assets and enabling offline functionality
const CACHE_NAME = 'bet-buddies-v1.0.0';
const STATIC_CACHE = 'bet-buddies-static-v1.0.0';
const API_CACHE = 'bet-buddies-api-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  // Add other critical assets
];

// API endpoints to cache (with short TTL)
const API_ENDPOINTS = [
  '/functions/v1/get-cached-matches',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.includes('/functions/v1/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'document' ||
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default network-first for other requests
  event.respondWith(
    fetch(request)
      .catch(() => {
        // Return offline fallback if available
        return caches.match('/index.html');
      })
  );
});

// Handle API requests with cache-first strategy and background refresh
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);

  // If we have a cached response, return it and refresh in background
  if (cachedResponse) {
    // Check if cache is still fresh (5 minutes for API data)
    const cacheTime = new Date(cachedResponse.headers.get('sw-cache-time') || 0);
    const now = new Date();
    const age = (now - cacheTime) / 1000 / 60; // age in minutes

    if (age < 5) {
      // Cache is fresh, return it
      return cachedResponse;
    } else {
      // Cache is stale, refresh in background
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            responseClone.headers.set('sw-cache-time', now.toISOString());
            cache.put(request, responseClone);
          }
        })
        .catch(() => {
          // Background refresh failed, ignore
        });

      // Return stale cache while refreshing
      return cachedResponse;
    }
  }

  // No cache, fetch from network
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      responseClone.headers.set('sw-cache-time', new Date().toISOString());
      cache.put(request, responseClone);
    }
    return response;
  } catch (error) {
    // Network failed, try to return cached data even if stale
    if (cachedResponse) {
      return cachedResponse;
    }
    // No fallback available
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Not in cache, fetch from network
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful responses
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Network failed, return offline fallback for HTML
    if (request.destination === 'document') {
      return cache.match('/index.html');
    }
    throw error;
  }
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);

  if (event.tag === 'background-prediction-sync') {
    event.waitUntil(doBackgroundPredictionSync());
  }
});

// Background prediction sync (when coming back online)
async function doBackgroundPredictionSync() {
  console.log('Service Worker: Performing background prediction sync');

  try {
    // Refresh cached predictions
    const response = await fetch('/functions/v1/get-cached-matches?type=matches&limit=50&force_refresh=true');
    if (response.ok) {
      console.log('Service Worker: Background predictions refreshed');
    }
  } catch (error) {
    console.log('Service Worker: Background sync failed', error);
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);

  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      vibrate: [100, 50, 100],
      data: data.url,
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);

  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'prediction-update') {
      event.waitUntil(updatePredictionsInBackground());
    }
  });
}

async function updatePredictionsInBackground() {
  console.log('Service Worker: Periodic prediction update');

  try {
    // Update predictions every 30 minutes
    await fetch('/functions/v1/get-cached-matches?type=matches&limit=20&force_refresh=true');
    console.log('Service Worker: Predictions updated in background');
  } catch (error) {
    console.log('Service Worker: Periodic update failed', error);
  }
}