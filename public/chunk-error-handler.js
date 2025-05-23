// Service worker to handle chunk loading errors
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

// Listen for fetch events
self.addEventListener('fetch', function(event) {
  // Only handle JavaScript chunk requests
  if (event.request.url.includes('/static/js/') && event.request.url.includes('.chunk.js')) {
    event.respondWith(
      fetch(event.request)
        .catch(function(error) {
          console.error('Error loading chunk:', error);
          
          // Notify the client about the chunk loading error
          self.clients.matchAll().then(function(clients) {
            clients.forEach(function(client) {
              client.postMessage({
                type: 'CHUNK_LOAD_ERROR',
                url: event.request.url
              });
            });
          });
          
          // Return a simple script that will trigger the error boundary
          return new Response(
            'console.error("Chunk loading failed for: ' + event.request.url + '"); ' +
            'window.dispatchEvent(new CustomEvent("chunkError", { detail: { url: "' + event.request.url + '" } }));',
            { headers: { 'Content-Type': 'application/javascript' } }
          );
        })
    );
  }
});