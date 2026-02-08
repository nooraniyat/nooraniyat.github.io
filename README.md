# 📖 Dua Viewer

A clean, distraction-free **Arabic + Persian (Farsi) dua reader** built with pure **HTML, CSS, and JavaScript**.

Designed for:

* 🕌 Mosque displays
* 📱 Mobile reading
* 💻 Laptop/projector use
* 📚 Studying supplications with translation

The app loads duas dynamically from JSON files and displays them as **slides** with:

✅ Arabic text
✅ Persian translation
✅ Meta lines
✅ Decorative frame
✅ Smooth navigation controls

---

## ✨ Features

### 📂 Dynamic loading

* Reads dua list from `db/manifest.json`
* Loads:

  * `text.json` (Arabic)
  * `translation-fa.json` (Persian + meta)

### 🎨 Clean layout

* Arabic centered (upper area)
* Translation fixed near bottom
* Decorative Islamic frame
* Controls outside frame

### 🔤 Proper typography

* Arabic → Noto Naskh / Quran font
* Persian → Samim font
* Separate font styling for each language

### 🎚 Navigation

* Previous / Next buttons
* Slider control
* URL state:

```
?name=dua-folder&id=5
```

Directly opens specific slide

### 📱 Mobile friendly

* Responsive layout
* Scales fonts
* Sidebar stacks vertically

### ⚡ Lightweight

* No frameworks
* No dependencies
* Works offline

---

## 📁 Project Structure

```
project/
│
├── index.html
├── style.css
├── main.js
│
├── assets/
│   ├── fonts/
│   └── images/
│
└── db/
    ├── manifest.json
    ├── dua-nudba/
    │   ├── text.json
    │   └── translation-fa.json
    └── ...
```

---

## 📦 Data Format

### manifest.json

```json
[
  "dua-nudba",
  "dua-kumayl"
]
```

---

### text.json (Arabic)

```json
{
  "name": "دُعَاء ٱلنُّدْبَة",
  "lines": [
    { "id": 1, "text": "..." }
  ]
}
```

---

### translation-fa.json

```json
{
  "name": "دعای ندبه",
  "lines": [
    { "id": 1, "text": "..." }
  ],
  "meta": [
    { "id": 124, "text": "زیارت مخصوص" }
  ]
}
```

### Notes

* `id` links Arabic ↔ translation ↔ meta
* Extra meta IDs automatically create standalone slides

---

## ▶️ Running the Project

Because of `fetch()` you must use a server.

### Option 1 — Python

```bash
python -m http.server 8000
```

Open:

```
http://localhost:8000
```

### Option 2 — VS Code

Use **Live Server** extension.

---

## 🎮 Usage

### 1. Open page

Shows only dua list

### 2. Click a dua

Viewer opens full screen

### 3. Navigate

* Buttons
* Slider
* URL

### Direct link example

```
http://localhost:8000/?name=dua-nudba&id=3
```

---

## 🎨 Customization

### Change fonts

Edit in `style.css`:

```css
@font-face { ... }
```

### Change colors

```css
.translation { color: gray; }
.meta-line { color: blue; }
```

### Frame decoration

Replace images in:

```
assets/images/
```

---

## 📱 Mobile Support

Includes:

* Viewport meta
* Responsive layout
* Smaller fonts
* Stacked sidebar

If adding custom styles, place them inside:

```css
@media (max-width: 768px) { }
```

---

## 🛠 Tech Stack

* HTML5
* CSS3 (Flexbox)
* Vanilla JavaScript (ES6)
* JSON data source

No frameworks required.

---

## 🚀 Possible Improvements

Ideas you can add:

* Swipe gestures
* Dark mode
* Fullscreen mode
* Auto-play slides
* Audio recitation sync
* Search
* PWA installable app

---

## 📜 License

Free to use for educational and religious purposes.

---

## ❤️ Author

Built for simple and beautiful dua reading.
