// Preview service worker - placeholder to prevent 404 errors
// This file is intentionally empty to satisfy requests from development tools
self.addEventListener('install', () => {
  // Skip waiting to become active immediately
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  // Take control of all pages immediately
  self.clients.claim()
})
