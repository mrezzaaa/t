var cacheName = 'Logisthink-driver-v1.1';
var filesToCache = [
  '//fonts.googleapis.com/icon?family=Material+Icons',
  '/angular.min.js',
  '/as-driver.js',
  '/style.css',
  '/md5.js',
  '/moment.js',
  '/socket.io/socket.io.js',
  '/socket-client.js',
  "/angular-animate.min.js",
  "/angular-aria.min.js",
  "/angular-material.min.js",
  "/jquery-3.1.1.min.js",
  "/favicon.png"
];

function promiseAny(promises) {
  return new Promise((resolve, reject) => {
    // make sure promises are all promises
    promises = promises.map(p => Promise.resolve(p));
    // resolve this promise as soon as one resolves
    promises.forEach(p => p.then(resolve));
    // reject if all promises reject
    promises.reduce((a, b) => a.catch(() => b))
      .catch(() => reject(Error("All failed")));
  });
};

self.addEventListener('install', function (e) {
    console.log('[Service Worker] Install');
    e.waitUntil(
      caches.open(cacheName).then(function (cache) {
          console.log('[Service Worker] Caching app shell');
          return cache.addAll(filesToCache);
      }).then(function(e){
        return self.skipWaiting();
      })
    );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          // Return true if you want to remove this cache,
          // but remember that caches are shared across
          // the whole origin
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});


self.addEventListener('fetch', function(event) {
  // Parse the URL:
  var requestURL = new URL(event.request.url);

  // Handle requests to a particular host specifically
  if (requestURL.hostname == '//operator.logisthink.id/as-driver') {
    event.respondWith(/* some combination of patterns */);
    return;
  }
  // Routing for local URLs
  if (requestURL.origin == location.origin) {
    // Handle article URLs
    if (/^\/article\//.test(requestURL.pathname)) {
      event.respondWith(/* some other combination of patterns */);
      return;
    }
    if (/\.webp$/.test(requestURL.pathname)) {
      event.respondWith(/* some other combination of patterns */);
      return;
    }
    if (event.request.method == 'POST') {
      event.respondWith(/* some other combination of patterns */);
      return;
    }
    if (/cheese/.test(requestURL.pathname)) {
      event.respondWith(
        new Response("Flagrant cheese error", {
          status: 512
        })
      );
      return;
    }
  }

  // A sensible default pattern
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
