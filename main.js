// =======================
// 🔹 SELECTORES
// =======================
let now_playing = document.querySelector(".now-playing");
let track_name = document.querySelector(".track-name");
let track_artist = document.querySelector(".track-artist");
let playpause_btn = document.querySelector(".playpause-track");

let seek_slider = document.querySelector(".seek_slider");
let volume_slider = document.querySelector(".volume_slider");
let curr_time = document.querySelector(".current-time");
let total_duration = document.querySelector(".total-duration");

let trackListContainer = document.getElementById("track-list");

// =======================
// 🔹 ESTADO
// =======================
let isPlaying = false;
let updateTimer;
let currentIndex = 0;

// =======================
// 🔹 AUDIO
// =======================
let curr_track = new Audio();

// =======================
// 🔹 LISTA DE TRACKS
// =======================
let track_list = [
{
name: "Fairytale",
path: "assets/audio01.mp3"
},
{
name: "Francés Limón",
path: "assets/audio02.mp3"
},
{
name: "Me and Your Mama",
path: "assets/audio03.mp3"
},
{
name: "Love Me",
path: "assets/audio04.mp3"
}
];

// =======================
// 🔹 RENDER LISTA
// =======================
function renderTrackList() {
trackListContainer.innerHTML = "";

track_list.forEach((track, index) => {
let li = document.createElement("li");
li.classList.add("track-item");
li.textContent = track.name;


li.onclick = () => {
  currentIndex = index;
  loadTrack();
  playTrack();
};

trackListContainer.appendChild(li);


});

updateActive();
}

// =======================
// 🔹 CARGAR TRACK
// =======================
function loadTrack() {
clearInterval(updateTimer);
resetValues();

// 🔥 AQUÍ estaba tu error
curr_track.src = track_list[currentIndex].path;
curr_track.load();

now_playing.textContent = "❤️❤️❤️❤️❤️❤️❤️";
track_name.textContent = track_list[currentIndex].name;
track_artist.textContent = "Para ti ❤️";

updateActive();

updateTimer = setInterval(seekUpdate, 500);

curr_track.onended = nextTrack;
}

// =======================
// 🔹 ACTIVO EN LISTA
// =======================
function updateActive() {
let items = document.querySelectorAll(".track-item");
items.forEach((el, i) => {
el.classList.toggle("active", i === currentIndex);
});
}

// =======================
// 🔹 PLAY / PAUSE
// =======================
function playTrack() {
curr_track.play();
isPlaying = true;
playpause_btn.innerHTML =
'<i class="fa fa-pause-circle fa-5x"></i>';
}

function pauseTrack() {
curr_track.pause();
isPlaying = false;
playpause_btn.innerHTML =
'<i class="fa fa-play-circle fa-5x"></i>';
}

function playpauseTrack() {
isPlaying ? pauseTrack() : playTrack();
}

// =======================
// 🔹 NEXT / PREV
// =======================
function nextTrack() {
currentIndex = (currentIndex + 1) % track_list.length;
loadTrack();
playTrack();
}

function prevTrack() {
currentIndex =
(currentIndex - 1 + track_list.length) % track_list.length;
loadTrack();
playTrack();
}

// =======================
// 🔹 SEEK
// =======================
function seekTo() {
if (!isNaN(curr_track.duration)) {
curr_track.currentTime =
curr_track.duration * (seek_slider.value / 100);
}
}

// =======================
// 🔹 VOLUMEN
// =======================
function setVolume() {
curr_track.volume = volume_slider.value / 100;
}

// =======================
// 🔹 TIEMPO
// =======================
function seekUpdate() {
if (!isNaN(curr_track.duration)) {
let pos =
(curr_track.currentTime / curr_track.duration) * 100;


seek_slider.value = pos;

let curM = Math.floor(curr_track.currentTime / 60);
let curS = Math.floor(curr_track.currentTime % 60);
let durM = Math.floor(curr_track.duration / 60);
let durS = Math.floor(curr_track.duration % 60);

if (curS < 10) curS = "0" + curS;
if (durS < 10) durS = "0" + durS;

curr_time.textContent = curM + ":" + curS;
total_duration.textContent = durM + ":" + durS;


}
}

// =======================
// 🔹 RESET
// =======================
function resetValues() {
curr_time.textContent = "00:00";
total_duration.textContent = "00:00";
seek_slider.value = 0;
}

// =======================
// 🔹 INIT
// =======================
renderTrackList();
loadTrack();
