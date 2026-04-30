const CACHE_NAME = "music-player-v4";

const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/main.js",
  "/manifest.json",

  // 🎵 audios
  "/assets/audio01.mp3",
  "/assets/audio02.mp3",
  "/assets/audio03.mp3",
  "/assets/audio04.mp3",

  // 🖼 imágenes
  "/assets/img/img01.jpg",
  "/assets/img/img02.jpg",
  "/assets/img/img03.jpg",
  "/assets/img/img04.jpg",

  // 🔲 iconos
  "/assets/img/icon-192.png",
  "/assets/img/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});