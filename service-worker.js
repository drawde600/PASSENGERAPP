// service-worker.js - Enhanced for background operation
const CACHE_NAME = 'passenger-cache-v1';
const urlsToCache = [
  '/',
  '/passenger.html',
  '/buslist.html',
  '/viewmap.html',
  '/onboard.html',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

// Initialize IndexedDB for offline data storage
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LocationDatabase', 1);
    
    request.onerror = event => {
      console.error('[SW] IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      const store = db.createObjectStore('locations', { autoIncrement: true });
      store.createIndex('timestamp', 'timestamp', { unique: false });
    };
    
    request.onsuccess = event => {
      console.log('[SW] IndexedDB initialized successfully');
      resolve(event.target.result);
    };
  });
}

// Get all stored locations from IndexedDB
async function getStoredLocations() {
  // This function has been removed
}

// Clear locations after successful sync
async function clearStoredLocations() {
  // This function has been removed
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => initDB())
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached file or fetch from network if not available
        return response || fetch(event.request);
      })
      .catch(error => {
        console.error('[SW] Fetch error:', error);
        // You might want to return a custom offline page here
      })
  );
});

// Periodic background location capturing
async function recordLocationInBackground() {
  // This function has been removed
}

// Get Supabase client info from the main thread
async function getSupabaseClientInfo() {
  const clients = await self.clients.matchAll();
  if (clients.length === 0) {
    return {
      supabaseUrl: 'https://bguwiprkgcxrqauztmvd.supabase.co',
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJndXdpcHJrZ2N4cnFhdXp0bXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3ODAxOTksImV4cCI6MjA1NjM1NjE5OX0.ATbtMPiPt8VvtyVBu-gpmDo8Mo1eWy1aFXKfb6m1QsE'
    };
  }
  
  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = event => resolve(event.data);
    clients[0].postMessage({ type: 'GET_CLIENT_INFO' }, [messageChannel.port2]);
    // Add timeout in case there's no response
    setTimeout(() => {
      reject(new Error('Timeout getting client info'));
    }, 3000);
  });
}


// For handling messages from the main thread
self.addEventListener('message', event => {
  if (event.data.type === 'STORE_USER_ID') {
    // Store user ID in service worker scope
    self.userId = event.data.userId;
    console.log('[SW] User ID stored:', self.userId);
    event.ports[0].postMessage({ success: true });
  } else if (event.data.type === 'GET_USER_ID') {
    // Return stored user ID
    event.ports[0].postMessage({ userId: self.userId });
  } else if (event.data.type === 'RECORD_LOCATION_NOW') {
    // Manually trigger location recording
    event.waitUntil(recordLocationInBackground());
    event.ports[0].postMessage({ success: true });
  }
});