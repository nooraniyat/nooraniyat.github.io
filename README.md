# Nooraniyat — داشبورد اسلامی

A lightweight, framework-free Islamic dashboard built with **HTML**, **CSS**, and **Vanilla JavaScript**.

Offline-capable. JSON-driven. Fully RTL.

---

## Views

The app supports four display modes, switchable from the floating control bar:

| Icon | Mode | Description |
|------|------|-------------|
| 📖 | Quran Reader | Browse and read the Quran with Farsi translation and audio recitation |
| 🤲 | Dua Slideshow | Browse and display Duas slide by slide |
| 🖼️ | Background | Full-page Islamic event background image based on today's Hijri date |
| 🎦 | Webcam (سخنرانی) | Live camera feed behind the decorative frame |

---

## Features

### Quran Reader
- Full surah list with Arabic names, Persian translations, and Persian chapter numbers
- Verse-by-verse navigation with slider
- Farsi translation by Fooladvand (ID 29 via api.quran.com)
- Audio recitation via everyayah.com (Abdul Basit Murattal)
- Bismillah displayed automatically on the first verse of applicable chapters
- Amiri Quran font for complete Arabic glyph coverage

### Dua Slideshow
- JSON-driven dua files loaded from `db/`
- Arabic text + Farsi translation per slide
- URL-based deep linking (`?name=dua-name&id=3`)
- Slide counter and progress slider

### Calendar & Azan Block
- Three separate compact panels (city / dates / prayer times), toggled with 📅
- **Hijri date** — fetched from api.aladhan.com with Persian digits
- **Persian (Jalali) date** — computed via jalaali-js with Persian digits
- **Gregorian date** — day · month · year in Western digits
- **Azan times** — Fajr, Sunrise, Dhuhr, Sunset, Maghrib in Persian digits
- Calculation method: Institute of Geophysics, University of Tehran (method 7)
- Default city: Waterloo, Ontario, Canada — click city name to change, persisted in localStorage

### Background System
- Hijri event manifest at `media/backgrounds.json`
- Automatically selects the matching background image for today's Islamic date
- Supports `start_hour` / `end_hour` for noon-based transitions (e.g. Muharram eve from noon of 29 Dhul-Hijja)

### General
- Dark mode toggle (🌓)
- Adjustable Farsi font size (➖ / ➕), range 10px – 60px
- Keyboard navigation (← → Page Up/Down Space Enter)
- Decorative GIF frame around content area
- RTL layout throughout
- No frameworks, no build tools

---

## Project Structure

```text
nooraniyat/
│
├── index.html
├── style.css
├── main.js
│
├── assets/
│   ├── fonts/          # SamimV1, NotoNaskhArabic, QuranTaha
│   └── images/         # Decorative GIF frame pieces
│
├── db/
│   ├── manifest.json   # List of available Duas
│   └── *.json          # Individual Dua files
│
└── media/
    ├── backgrounds.json  # Hijri event → image mapping
    └── *.jpg             # Event background images
```

---

## Dua File Format

`db/manifest.json` — list of available Duas:

```json
[
  { "uid": "dua-kumayl", "name_fa": "دعای کمیل" }
]
```

Individual dua file (e.g. `db/dua-kumayl.json`):

```json
{
  "uid": "dua-kumayl",
  "name_fa": "دعای کمیل",
  "content": [
    { "ar": "Arabic text", "fa": "Farsi translation", "m": "Optional meta" }
  ]
}
```

---

## Background Manifest Format

`media/backgrounds.json`:

```json
[
  { "hijri_month": 1, "hijri_day": 10, "event_fa": "عاشورا", "image": "media/ashura.jpg" },
  { "hijri_month": 12, "hijri_day": 29, "start_hour": 12, "event_fa": "آستانه محرم", "image": "media/muharram.jpg" }
]
```

Place event images in `media/`. The app picks the entry matching today's Hijri date, respecting optional `start_hour` / `end_hour` for time-of-day transitions.

---

## Running Locally

The app uses `fetch()`, so a local server is required.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

Or use the **Live Server** extension in VS Code.

---

## External APIs & Fonts

| Service | Usage |
|---------|-------|
| api.quran.com/api/v4 | Quran Arabic text + Farsi translation |
| api.aladhan.com/v1 | Hijri date conversion + prayer times |
| everyayah.com | Verse-level audio recitation MP3s |
| jalaali-js (jsDelivr CDN) | Persian (Jalali) calendar conversion |
| Google Fonts — Amiri Quran | Full Quranic Arabic glyph support |

---

## Tech Stack

- HTML5
- CSS3 (Flexbox, backdrop-filter, CSS custom properties)
- Vanilla JavaScript (ES6, async/await)
- JSON data source

No build tools. No dependencies.

---

## License

Free to use for educational, religious, and presentation purposes.
