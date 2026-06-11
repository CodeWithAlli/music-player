/* ============================================
   MUSIC PLAYER – main.js
   Optimizado para WebView Android
   - Sin Web Audio API (no compatible con WebView)
   - Sin Service Worker
   - Con localStorage para persistencia
   ============================================ */

// ============================================
// TRACKS
// ============================================
const TRACKS = [
  {
    name:   "Fairytale",
    artist: "Para ti ❤️",
    path:   "assets/audio01.mp3",
    image:  "assets/img/img01.jpg",
    color:  "#7c3aed"   // color dominante manual (morado)
  },
  {
    name:   "Francés Limón",
    artist: "Para ti ❤️",
    path:   "assets/audio02.mp3",
    image:  "assets/img/img02.jpg",
    color:  "#0ea5e9"   // azul
  },
  {
    name:   "Me and Your Mama",
    artist: "Para ti ❤️",
    path:   "assets/audio03.mp3",
    image:  "assets/img/img03.jpg",
    color:  "#d97706"   // ámbar
  },
  {
    name:   "Love Me",
    artist: "Para ti ❤️",
    path:   "assets/audio04.mp3",
    image:  "assets/img/img04.jpg",
    color:  "#e11d48"   // rosa/rojo
  }
];

// ============================================
// ESTADO
// ============================================
let currentIndex = 0;
let isPlaying    = false;
let isShuffle    = false;
let repeatMode   = 0;   // 0=off, 1=all, 2=one
let isMuted      = false;
let previousVolume = 80;
let updateTimer  = null;
let likedTracks  = new Set();

// Historial para shuffle sin repetir
let shuffleHistory = [];

// ============================================
// ELEMENTOS DOM
// ============================================
const audio         = new Audio();
const ambientBg     = document.getElementById("ambientBg");
const vinylDisc     = document.getElementById("vinylDisc");
const vinylImg      = document.getElementById("vinylImg");
const artworkGlow   = document.getElementById("artworkGlow");
const trackName     = document.getElementById("trackName");
const trackArtist   = document.getElementById("trackArtist");
const visualizer    = document.getElementById("visualizer");
const progressFill  = document.getElementById("progressFill");
const seekSlider    = document.getElementById("seekSlider");
const currentTime   = document.getElementById("currentTime");
const totalDuration = document.getElementById("totalDuration");
const playBtn       = document.getElementById("playBtn");
const playIcon      = document.getElementById("playIcon");
const shuffleBtn    = document.getElementById("shuffleBtn");
const repeatBtn     = document.getElementById("repeatBtn");
const repeatIcon    = document.getElementById("repeatIcon");
const muteBtn       = document.getElementById("muteBtn");
const volumeIcon    = document.getElementById("volumeIcon");
const volumeSlider  = document.getElementById("volumeSlider");
const volumeFill    = document.getElementById("volumeFill");
const heartBtn      = document.getElementById("heartBtn");
const trackList     = document.getElementById("trackList");
const sidebar       = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuBtn       = document.getElementById("menuBtn");
const sidebarClose  = document.getElementById("sidebarClose");

// ============================================
// INIT
// ============================================
function init() {
  loadState();
  renderTrackList();
  loadTrack(currentIndex, false);
  bindEvents();
}

// ============================================
// PERSISTENCIA (localStorage)
// ============================================
function saveState() {
  try {
    localStorage.setItem("mp_index",   currentIndex);
    localStorage.setItem("mp_time",    audio.currentTime || 0);
    localStorage.setItem("mp_volume",  volumeSlider.value);
    localStorage.setItem("mp_shuffle", isShuffle ? "1" : "0");
    localStorage.setItem("mp_repeat",  repeatMode);
    localStorage.setItem("mp_liked",   JSON.stringify([...likedTracks]));
  } catch(e) { /* WebView puede bloquear en algunos contextos */ }
}

function loadState() {
  try {
    const idx     = parseInt(localStorage.getItem("mp_index")) || 0;
    const vol     = parseInt(localStorage.getItem("mp_volume")) || 80;
    const shuffle = localStorage.getItem("mp_shuffle") === "1";
    const repeat  = parseInt(localStorage.getItem("mp_repeat")) || 0;
    const liked   = JSON.parse(localStorage.getItem("mp_liked") || "[]");

    currentIndex   = Math.min(idx, TRACKS.length - 1);
    isShuffle      = shuffle;
    repeatMode     = repeat;
    likedTracks    = new Set(liked);

    volumeSlider.value = vol;
    audio.volume = vol / 100;
    updateVolumeFill(vol);

    if (isShuffle) shuffleBtn.classList.add("active");
    updateRepeatUI();
  } catch(e) {}
}

// ============================================
// RENDERIZAR LISTA
// ============================================
function renderTrackList() {
  trackList.innerHTML = "";

  TRACKS.forEach((track, i) => {
    const li = document.createElement("li");
    li.className = "track-item" + (i === currentIndex ? " active" : "");
    li.dataset.index = i;

    li.innerHTML = `
      <img src="${track.image}" class="track-thumb" alt="${track.name}" loading="lazy">
      <div class="track-meta">
        <div class="track-meta-name">${track.name}</div>
        <div class="track-meta-artist">${track.artist}</div>
      </div>
      <div class="eq-bars" aria-hidden="true">
        <div class="eq-bar"></div>
        <div class="eq-bar"></div>
        <div class="eq-bar"></div>
      </div>
    `;

    li.addEventListener("click", () => {
      currentIndex = i;
      loadTrack(i, true);
      closeSidebar();
    });

    trackList.appendChild(li);
  });
}

function updateActiveTrack() {
  document.querySelectorAll(".track-item").forEach((el, i) => {
    el.classList.toggle("active", i === currentIndex);
    el.classList.toggle("playing", i === currentIndex && isPlaying);
  });
}

// ============================================
// CARGAR TRACK
// ============================================
function loadTrack(index, autoPlay = true) {
  const track = TRACKS[index];

  // Animación de cambio
  trackName.classList.remove("track-change");
  void trackName.offsetWidth; // reflow
  trackName.classList.add("track-change");

  // Info
  trackName.textContent  = track.name;
  trackArtist.textContent = track.artist;
  vinylImg.src           = track.image;

  // Color dinámico
  applyAccentColor(track.color);

  // Audio
  clearInterval(updateTimer);
  audio.src = track.path;
  audio.load();
  audio.volume = volumeSlider.value / 100;

  resetProgress();
  updateActiveTrack();
  updateMediaSession(track);

  if (autoPlay) {
    playTrack();
  }

  // Guardar estado tras pequeño delay
  setTimeout(saveState, 300);
}

// ============================================
// COLOR DINÁMICO
// ============================================
function applyAccentColor(hex) {
  // Actualizar variable CSS --accent
  document.documentElement.style.setProperty("--accent", hex);

  // Fondo ambiente
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);

  ambientBg.style.background = `
    radial-gradient(ellipse at 25% 15%, rgba(${r},${g},${b},0.35) 0%, transparent 55%),
    radial-gradient(ellipse at 75% 85%, rgba(${r},${g},${b},0.2) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.3) 0%, transparent 80%)
  `;

  // Glow del vinilo
  artworkGlow.style.background = hex;

  // Barra de progreso
  progressFill.style.background = hex;
}

// ============================================
// PLAY / PAUSE
// ============================================
function playTrack() {
  audio.play().catch(() => {
    // WebView puede bloquear autoplay sin gesto del usuario
    console.warn("Autoplay bloqueado, esperando interacción");
  });
  isPlaying = true;
  vinylDisc.classList.add("spinning");
  visualizer.classList.remove("paused");
  updatePlayIcon();
  updateActiveTrack();
  updateTimer = setInterval(updateProgress, 500);

  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = "playing";
  }
}

function pauseTrack() {
  audio.pause();
  isPlaying = false;
  vinylDisc.classList.remove("spinning");
  visualizer.classList.add("paused");
  updatePlayIcon();
  updateActiveTrack();
  clearInterval(updateTimer);
  saveState();

  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = "paused";
  }
}

function playpauseTrack() {
  isPlaying ? pauseTrack() : playTrack();
}

function updatePlayIcon() {
  if (isPlaying) {
    playIcon.innerHTML = `
      <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
      </svg>`;
  } else {
    playIcon.innerHTML = `
      <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>`;
  }
}

// ============================================
// SIGUIENTE / ANTERIOR
// ============================================
function nextTrack() {
  if (repeatMode === 2) {
    // Repetir una sola
    audio.currentTime = 0;
    playTrack();
    return;
  }

  if (isShuffle) {
    currentIndex = getShuffleIndex();
  } else {
    currentIndex = (currentIndex + 1) % TRACKS.length;
  }

  loadTrack(currentIndex, true);
}

function prevTrack() {
  // Si pasaron más de 3 segundos, reiniciar la canción
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  currentIndex = (currentIndex - 1 + TRACKS.length) % TRACKS.length;
  loadTrack(currentIndex, true);
}

function getShuffleIndex() {
  if (shuffleHistory.length >= TRACKS.length) {
    shuffleHistory = [currentIndex];
  }
  let next;
  do {
    next = Math.floor(Math.random() * TRACKS.length);
  } while (shuffleHistory.includes(next));
  shuffleHistory.push(next);
  return next;
}

// ============================================
// PROGRESO
// ============================================
function updateProgress() {
  if (isNaN(audio.duration)) return;

  const pct = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = pct + "%";
  seekSlider.value = pct;

  currentTime.textContent   = formatTime(audio.currentTime);
  totalDuration.textContent = formatTime(audio.duration);
}

function resetProgress() {
  progressFill.style.width = "0%";
  seekSlider.value = 0;
  currentTime.textContent   = "0:00";
  totalDuration.textContent = "0:00";
}

function seekTo() {
  if (!isNaN(audio.duration)) {
    audio.currentTime = audio.duration * (seekSlider.value / 100);
  }
}

function formatTime(secs) {
  if (isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return m + ":" + (s < 10 ? "0" + s : s);
}

// ============================================
// VOLUMEN
// ============================================
function setVolume() {
  const val = parseInt(volumeSlider.value);
  audio.volume = val / 100;
  updateVolumeFill(val);
  updateVolumeIcon(val);
  if (val > 0) isMuted = false;
  saveState();
}

function updateVolumeFill(val) {
  volumeFill.style.width = val + "%";
}

function updateVolumeIcon(val) {
  if (val === 0 || isMuted) {
    volumeIcon.innerHTML = `<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>`;
  } else if (val < 40) {
    volumeIcon.innerHTML = `<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>`;
  } else {
    volumeIcon.innerHTML = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
  }
}

function toggleMute() {
  isMuted = !isMuted;
  if (isMuted) {
    previousVolume = volumeSlider.value;
    audio.volume = 0;
    volumeSlider.value = 0;
    updateVolumeFill(0);
    updateVolumeIcon(0);
  } else {
    audio.volume = previousVolume / 100;
    volumeSlider.value = previousVolume;
    updateVolumeFill(previousVolume);
    updateVolumeIcon(previousVolume);
  }
}

// ============================================
// SHUFFLE
// ============================================
function toggleShuffle() {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
  shuffleHistory = [currentIndex];
  saveState();
}

// ============================================
// REPEAT  (0=off → 1=all → 2=one → 0)
// ============================================
function toggleRepeat() {
  repeatMode = (repeatMode + 1) % 3;
  updateRepeatUI();
  saveState();
}

function updateRepeatUI() {
  repeatBtn.classList.remove("active", "repeat-once");

  if (repeatMode === 0) {
    // Off: ícono normal sin color
  } else if (repeatMode === 1) {
    // Repetir todo
    repeatBtn.classList.add("active");
    repeatIcon.innerHTML = `
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>`;
  } else {
    // Repetir una
    repeatBtn.classList.add("active", "repeat-once");
    repeatIcon.innerHTML = `
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>`;
  }
}

// ============================================
// LIKES
// ============================================
function toggleLike() {
  if (likedTracks.has(currentIndex)) {
    likedTracks.delete(currentIndex);
    heartBtn.classList.remove("liked");
  } else {
    likedTracks.add(currentIndex);
    heartBtn.classList.add("liked");
    // Micro-animación
    heartBtn.style.transform = "scale(1.3)";
    setTimeout(() => heartBtn.style.transform = "", 200);
  }
  saveState();
}

function updateHeartUI() {
  heartBtn.classList.toggle("liked", likedTracks.has(currentIndex));
}

// ============================================
// SIDEBAR
// ============================================
function openSidebar() {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("show");
}

// ============================================
// MEDIA SESSION API (controles de notificación)
// ============================================
function updateMediaSession(track) {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title:  track.name,
    artist: track.artist,
    artwork: [
      { src: track.image, sizes: "512x512", type: "image/jpeg" }
    ]
  });

  navigator.mediaSession.setActionHandler("play",          playTrack);
  navigator.mediaSession.setActionHandler("pause",         pauseTrack);
  navigator.mediaSession.setActionHandler("previoustrack", prevTrack);
  navigator.mediaSession.setActionHandler("nexttrack",     nextTrack);
  navigator.mediaSession.setActionHandler("seekto", (e) => {
    if (!isNaN(audio.duration)) {
      audio.currentTime = e.seekTime;
    }
  });
}

// ============================================
// EVENTOS
// ============================================
function bindEvents() {
  // Seekbar
  seekSlider.addEventListener("input",  seekTo);
  seekSlider.addEventListener("change", seekTo);

  // Volumen
  volumeSlider.addEventListener("input",  setVolume);
  volumeSlider.addEventListener("change", setVolume);

  // Mute
  muteBtn.addEventListener("click", toggleMute);

  // Shuffle / Repeat
  shuffleBtn.addEventListener("click", toggleShuffle);
  repeatBtn.addEventListener("click",  toggleRepeat);

  // Like
  heartBtn.addEventListener("click", toggleLike);

  // Sidebar
  menuBtn.addEventListener("click",        openSidebar);
  sidebarClose.addEventListener("click",   closeSidebar);
  sidebarOverlay.addEventListener("click", closeSidebar);

  // Audio: fin de canción
  audio.addEventListener("ended", () => {
    if (repeatMode === 2) {
      audio.currentTime = 0;
      playTrack();
    } else {
      nextTrack();
    }
  });

  // Cuando carga metadata (duración disponible)
  audio.addEventListener("loadedmetadata", () => {
    totalDuration.textContent = formatTime(audio.duration);
    // Restaurar tiempo guardado si es la misma sesión
    try {
      const savedTime = parseFloat(localStorage.getItem("mp_time")) || 0;
      const savedIdx  = parseInt(localStorage.getItem("mp_index"))  || 0;
      if (savedIdx === currentIndex && savedTime > 0 && savedTime < audio.duration - 2) {
        audio.currentTime = savedTime;
      }
    } catch(e) {}
  });

  // Teclado (útil en emulador/debug)
  document.addEventListener("keydown", (e) => {
    switch(e.code) {
      case "Space":       e.preventDefault(); playpauseTrack(); break;
      case "ArrowRight":  nextTrack(); break;
      case "ArrowLeft":   prevTrack(); break;
      case "ArrowUp":
        volumeSlider.value = Math.min(100, parseInt(volumeSlider.value) + 5);
        setVolume(); break;
      case "ArrowDown":
        volumeSlider.value = Math.max(0, parseInt(volumeSlider.value) - 5);
        setVolume(); break;
    }
  });

  // Guardar estado periódicamente mientras reproduce
  audio.addEventListener("timeupdate", () => {
    if (Math.floor(audio.currentTime) % 5 === 0) {
      saveState();
    }
  });

  // Actualizar heart al cambiar canción
  audio.addEventListener("play", updateHeartUI);
}

// ============================================
// ARRANCAR
// ============================================
init();
