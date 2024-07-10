// service-worker.js

self.addEventListener('fetch', function(event) {
  // Handle fetch events, e.g., cache resources or update Firebase data
  // Example: caching resources
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        return response || fetch(event.request);
      })
  );
});
