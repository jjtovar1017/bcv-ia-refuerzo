// BCV Asset Tracking - Service Worker
// Provides offline functionality and background sync

const CACHE_NAME = 'bcv-asset-tracking-v1.0.0';
const STATIC_CACHE = 'bcv-static-v1.0.0';
const DYNAMIC_CACHE = 'bcv-dynamic-v1.0.0';
const LOCATION_CACHE = 'bcv-location-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icon/favicon.ico',
  '/assets/imgs/logo.png',
  // Add other critical assets
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/assets',
  '/api/geofences',
  '/api/location'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(LOCATION_CACHE).then(cache => {
        console.log('[SW] Location cache initialized');
        return cache;
      })
    ])
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== LOCATION_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (request.method === 'GET') {
    if (isStaticAsset(url)) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (isAPIRequest(url)) {
      event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    } else if (isLocationRequest(url)) {
      event.respondWith(handleLocationRequest(request));
    } else if (isMapTileRequest(url)) {
      event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    } else {
      event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    }
  } else if (request.method === 'POST' && isLocationUpdate(url)) {
    event.respondWith(handleLocationUpdate(request));
  }
});

// Background sync for location updates
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocationUpdates());
  } else if (event.tag === 'asset-sync') {
    event.waitUntil(syncAssetData());
  }
});

// Push notifications for geofence alerts
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(showNotification(data));
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Caching strategies
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return new Response('Offline - Content not available', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error.message);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ 
      error: 'Offline - No cached data available',
      offline: true 
    }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Location-specific handlers
async function handleLocationRequest(request) {
  try {
    // Always try network first for location data
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful location responses
      const cache = await caches.open(LOCATION_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    // Fallback to cached location data
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return empty location data if no cache
    return new Response(JSON.stringify({
      assets: [],
      offline: true,
      message: 'Offline - Using cached data'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleLocationUpdate(request) {
  try {
    // Try to send location update immediately
    const response = await fetch(request);
    if (response.ok) {
      return response;
    }
    throw new Error('Network request failed');
  } catch (error) {
    console.log('[SW] Location update failed, queuing for sync');
    
    // Queue location update for background sync
    const requestData = await request.json();
    await queueLocationUpdate(requestData);
    
    // Register background sync
    await self.registration.sync.register('location-sync');
    
    return new Response(JSON.stringify({
      success: true,
      queued: true,
      message: 'Location update queued for sync'
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background sync functions
async function syncLocationUpdates() {
  console.log('[SW] Syncing queued location updates');
  
  try {
    const queuedUpdates = await getQueuedLocationUpdates();
    
    for (const update of queuedUpdates) {
      try {
        const response = await fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.data)
        });
        
        if (response.ok) {
          await removeQueuedUpdate(update.id);
          console.log('[SW] Location update synced:', update.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync location update:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    throw error; // This will cause the sync to be retried
  }
}

async function syncAssetData() {
  console.log('[SW] Syncing asset data');
  
  try {
    // Fetch latest asset data and update cache
    const response = await fetch('/api/assets');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put('/api/assets', response.clone());
    }
  } catch (error) {
    console.error('[SW] Asset sync failed:', error);
  }
}

// IndexedDB operations for offline queue
async function queueLocationUpdate(data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bcv-offline-queue', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['location-updates'], 'readwrite');
      const store = transaction.objectStore('location-updates');
      
      const updateData = {
        id: Date.now() + Math.random(),
        data: data,
        timestamp: Date.now()
      };
      
      store.add(updateData);
      transaction.oncomplete = () => resolve(updateData.id);
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('location-updates')) {
        db.createObjectStore('location-updates', { keyPath: 'id' });
      }
    };
  });
}

async function getQueuedLocationUpdates() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bcv-offline-queue', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['location-updates'], 'readonly');
      const store = transaction.objectStore('location-updates');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

async function removeQueuedUpdate(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bcv-offline-queue', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['location-updates'], 'readwrite');
      const store = transaction.objectStore('location-updates');
      
      store.delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

// Push notification handler
async function showNotification(data) {
  const options = {
    body: data.message || 'Nueva alerta de geocerca',
    icon: '/assets/icon/icon-192x192.png',
    badge: '/assets/icon/icon-72x72.png',
    tag: data.tag || 'geofence-alert',
    data: data,
    actions: [
      {
        action: 'view',
        title: 'Ver Detalles'
      },
      {
        action: 'dismiss',
        title: 'Descartar'
      }
    ],
    requireInteraction: data.severity === 'critical'
  };
  
  return self.registration.showNotification(
    data.title || 'BCV Asset Tracking',
    options
  );
}

// Helper functions
function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.pathname.includes(asset)) ||
         url.pathname.includes('/assets/') ||
         url.pathname.includes('/icons/');
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') && 
         CACHEABLE_APIS.some(api => url.pathname.startsWith(api));
}

function isLocationRequest(url) {
  return url.pathname.includes('/api/location') ||
         url.pathname.includes('/api/assets');
}

function isLocationUpdate(url) {
  return url.pathname === '/api/location' ||
         url.pathname === '/api/location-update';
}

function isMapTileRequest(url) {
  return url.hostname.includes('tile.openstreetmap.org') ||
         url.hostname.includes('tiles.') ||
         url.pathname.includes('/tiles/');
}

// Periodic cache cleanup
setInterval(() => {
  console.log('[SW] Running periodic cache cleanup');
  cleanupOldCacheEntries();
}, 60 * 60 * 1000); // Every hour

async function cleanupOldCacheEntries() {
  try {
    const cache = await caches.open(LOCATION_CACHE);
    const requests = await cache.keys();
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const request of requests) {
      const response = await cache.match(request);
      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const cacheDate = new Date(dateHeader).getTime();
        if (now - cacheDate > maxAge) {
          await cache.delete(request);
          console.log('[SW] Deleted old cache entry:', request.url);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}

console.log('[SW] Service Worker loaded successfully');
