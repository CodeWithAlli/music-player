# 🎧 Music Player ❤️

A clean and minimal music player built with **HTML, CSS, and JavaScript**, designed with a personal touch.

## ✨ About the Project

This project is based on an original implementation by **sayantanm19**, focused on building a simple JavaScript music player.

I customized and extended it to create a more personal experience by:

* Replacing default instrumental tracks with **custom MP3 files**
* Designing a more elegant and responsive UI
* Adding a playlist system with real track names
* Improving user interaction and overall experience

## 🚀 Features

* ▶️ Play / Pause music
* ⏭️ Next / Previous track
* 📃 Dynamic playlist
* 🎚️ Seek bar with real-time progress
* 📱 Responsive design (mobile-friendly)
* 🎨 Elegant dark theme with visual effects

## 📂 Project Structure

```
📁 project
 ┣ 📄 index.html
 ┣ 📄 style.css
 ┣ 📄 main.js
 ┗ 📁 assets
    ┣ 🎵 audio01.mp3
    ┣ 🎵 audio02.mp3
    ┗ ...
```

## ⚙️ How It Works

The player uses the **HTML5 Audio API** to load and control local `.mp3` files.

Tracks are defined in JavaScript like this:

```js
let track_list = [
  {
    name: "Track Name",
    path: "assets/audio01.mp3"
  }
];
```

## 📥 Audio Source

The audio files used in this project were obtained by converting YouTube videos into MP3 format using external tools.

⚠️ This project is for **educational and personal use only**.

## 🌐 Live Demo

👉 https://codewithalli.github.io/music-player/

## 🙌 Credits

* Original project idea: **sayantanm19**
* Customization & improvements: **Allison More**

## 💡 Future Improvements

* Add album covers
* Save last played track (localStorage)
* Add animations and transitions
* Improve accessibility

---

Made with ❤️ and a bit of obsession
