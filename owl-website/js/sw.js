/**
 * Service Worker for Owl Security Scanner
 * Handles offline functionality, push notifications, and background sync
 */

'use strict';

const CACHE_NAME = 'owl-security-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/config.js',
    '/js/main.js',
    '/js/data-collection.js',
    '/js/modules/config.js',
    '/js/modules/data-collection-api.js',
    '/js/modules/hardware-analysis.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing Service Worker');
    
    // Skip waiting to activate immediately
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating Service Worker');
    
    // Claim clients to control all tabs immediately
    self.clients.claim();
    
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    // Network first, falling back to cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response to store in cache
                const responseToCache = response.clone();
                
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        // Cache successful responses only
                        if (event.request.method === 'GET' && response.status === 200) {
                            cache.put(event.request, responseToCache);
                        }
                    });
                
                return response;
            })
            .catch(() => {
                // Fallback to cache if network request fails
                return caches.match(event.request);
            })
    );
});

// Handle push notifications
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event);
    
    let notificationData = {};
    
    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch (e) {
            notificationData = {
                title: 'New Notification',
                body: event.data.text(),
                icon: '/img/owl-icon-192.png'
            };
        }
    } else {
        notificationData = {
            title: 'Owl Security Alert',
            body: 'Something requires your attention.',
            icon: '/img/owl-icon-192.png'
        };
    }
    
    const options = {
        body: notificationData.body || 'Check your security dashboard.',
        icon: notificationData.icon || '/img/owl-icon-192.png',
        badge: '/img/owl-badge.png',
        data: {
            timestamp: new Date().getTime(),
            url: notificationData.url || self.location.origin
        },
        actions: [
            {
                action: 'view',
                title: 'View Details'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click:', event);
    
    event.notification.close();
    
    // Handle action clicks
    if (event.action === 'view' && event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    } else if (event.action === 'dismiss') {
        // Just close the notification
        return;
    } else {
        // Default action is to open the app
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // Check if there's already a window open
                    for (const client of clientList) {
                        if (client.url === '/' && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // If no window is open, open a new one
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
});

// Handle background sync
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background Sync:', event);
    
    if (event.tag === 'owl-data-sync') {
        event.waitUntil(
            // Perform the background sync operation
            new Promise((resolve, reject) => {
                // Simulate data synchronization
                setTimeout(() => {
                    console.log('[Service Worker] Sync completed');
                    
                    // Notify the user with a notification
                    self.registration.showNotification('Sync Complete', {
                        body: 'Your security data has been synchronized.',
                        icon: '/img/owl-icon-192.png',
                        badge: '/img/owl-badge.png'
                    });
                    
                    resolve();
                }, 2000);
            })
        );
    }
});
