const CACHE_NAME = "countdown-cache-v7";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/storage.js",
  "./manifest.json",
  "./service-worker.js",
  "./assets/placeholder1.jpg",
  "./assets/placeholder2.jpg",
  "./assets/placeholder3.jpg",
  "./assets/placeholder4.jpg",
  "./assets/placeholder5.jpg"
];

/* INSTALL */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

/* ACTIVATE */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* FETCH – iOS-sicher */
self.addEventListener("fetch", event => {

  // ⭐ WICHTIG: App-Start / Reload
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html")
        .then(response => response || fetch(event.request))
    );
    return;
  }

  // Alle anderen Dateien
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
