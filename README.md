# Nooraniyat

A lightweight, framework-free Islamic dashboard built with **HTML**, **CSS**, and **Vanilla JavaScript**.

Offline-capable (except external APIs). JSON-driven. Fully RTL.

---

## Views

The app supports four display modes, switchable from the floating control bar:

| Icon | Mode | Description |
|------|------|-------------|
| 📖 | Quran Reader | Browse and read the Quran with Persian translation and audio recitation |
| 🤲 | Dua Slideshow | Browse and display Duas slide by slide |
| 🖼️ | Background | Full-page Islamic event background image based on today's Hijri date |
| 🎦 | Webcam | Live camera feed behind the decorative frame |

---

## Features

### Quran Reader
- Full surah list with Arabic names and Persian chapter numbers
- **All Quran text stored locally** — Arabic (Uthmani script) and Persian translation (Fooladvand) pre-downloaded into `db/quran/` JSON files; no API call needed to read the Quran
- **Audio recitation streamed on demand** — MP3 files fetched from everyayah.com (Abdul Basit Murattal) only when the play button is pressed
- Verse-by-verse navigation with slider and Persian digit counter
- **Auto-advance playback** — after each verse ends, the next verse loads and plays automatically after a 1-second pause; pressing pause stops auto-advance
- Audio stops automatically when switching views or opening the surah list
- **Bismillah on its own slide** — بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ appears as a dedicated first slide with Persian translation "به نام خداوند بخشنده و مهربان" and its own audio recitation (`{surah}000.mp3`) for all surahs except Al-Fatiha (1) and At-Tawbah (9)
- **Bismillah numbered as slide 0** — the counter starts at ۰ for Bismillah, ۱ for the first verse; surahs without Bismillah start at ۱ as normal
- Deep-link URL: `?quran=<surah>&id=<n>` where `n` is 0 for Bismillah, 1 for verse 1

### Dua Slideshow
- JSON-driven dua files loaded from `db/`
- Arabic text + Persian translation per slide, with a gold fading divider line between them
- Alphabetically sorted dua list (by Persian name)
- Slide counter and progress slider (Persian digits)
- Closing credit slide (التماس دعا) appended automatically
- Deep-link URL: `?name=<uid>&id=<slide>`

### List Overlays
- Dua list and Quran surah list open as fullscreen tile overlays inside the content frame
- Consistent tile height (70 px) for a uniform grid
- Dismiss by clicking outside tiles, pressing Escape, or clicking the FAB icon again
- Deep-link URL: `?list=dua` and `?list=quran`
- Decorative corner L-brackets remain visible above overlays

### Calendar & Azan Block (Left FAB)
- Toggled with 📅, expands inline within the left FAB pill
- **City name** — click to edit, persisted in `localStorage`
- **Hijri date** — fetched from api.aladhan.com with Persian digits
- **Persian (Jalali) date** — computed via jalaali-js with Persian digits
- **Gregorian date** — day · month name · year in Western digits
- **Next upcoming prayer time** — Fajr, Sunrise, Dhuhr, Sunset, Maghrib filtered to the next single upcoming time; wraps to start of day when all have passed; display updates automatically every minute from cached data (no extra API calls)
- Calculation method: Institute of Geophysics, University of Tehran (method 7)
- Default city: Waterloo, Ontario, Canada

### Background System
- Hijri event manifest at `media/background/backgrounds.json`
- Automatically selects the matching background image for today's Islamic date
- Supports `start_hour` / `end_hour` for time-of-day transitions (e.g. Muharram eve from noon of 29 Dhul-Hijja)
- Falls back to next upcoming event if today has no match

### Background Music Player
- Shuffle playback from `media/music/` directory
- Playlist defined in `media/music/playlist.json`
- No-consecutive-repeat shuffle
- Continues until paused; single track loops if only one file exists

### General
- **Live clock** — updates every minute, shown in the left FAB pill (Persian digits)
- **Dark mode** toggle (🌓)
- **Fullscreen** toggle (⛶) — enters/exits browser fullscreen; icon changes to ⊡ when active
- **Adjustable Persian font size** (➖ / ➕), range 10px – 60px, visible only when content is active
- **Keyboard navigation** — ← → Page Up/Down Space Enter
- **Decorative CSS L-bracket corners** around the content frame — gold color, black glow, CSS-gradient-based (no images)
- **Pill-style title bar** — title of current dua or surah shown in a pill with decorative fading side lines
- **Responsive FAB bar** — on narrow screens the three pill blocks stack vertically (center → calendar → icons) via CSS container queries
- **Single-point background color** — change `--base-bg` in `:root` to retheme the entire app
- RTL layout throughout
- No frameworks, no build tools

### SEO & PWA
- Full Open Graph and Twitter Card meta tags for social sharing
- Canonical URL, keywords, and author meta
- `robots.txt` allowing full indexing with sitemap pointer
- `sitemap.xml` with weekly change frequency
- `site.webmanifest` for PWA installability (`display: standalone`, theme color `#c8b97a`)
- SVG favicon — gold "ن" on a cream circle

---

## System Architecture

### Overview

```
┌─────────────────────────────────────────────────────┐
│  Browser (localhost:8000)                           │
│                                                     │
│  index.html  ──loads──►  style.css                 │
│       │                                             │
│       └──loads──►  main.js                         │
│                       │                             │
│             ┌─────────┼──────────┐                  │
│             ▼         ▼          ▼                  │
│        db/*.json  media/*.json  External APIs       │
│        (local)    (local)       (network)           │
└─────────────────────────────────────────────────────┘
```

### File Layout

```
nooraniyat/
│
├── index.html              # Single-page app shell, all DOM structure
├── style.css               # All styles — layout, themes, animations
├── main.js                 # All logic — state, views, API calls, events
├── favicon.svg             # Gold "ن" SVG icon
├── robots.txt              # Search engine crawl rules
├── sitemap.xml             # Single-URL sitemap for nooraniyat.github.io
├── site.webmanifest        # PWA manifest
│
├── assets/
│   ├── fonts/
│   │   ├── Samim-v0.10.3.woff / .ttf          # Body text (normal)
│   │   ├── Samim-v0.10.3-Bold.woff / .ttf     # Body text (bold)
│   │   ├── NotoNaskhArabic-Regular.ttf         # Arabic prose (duas)
│   │   └── QuranTaha.ttf                       # Quranic Arabic
│   └── images/             # Decorative PNG assets
│
├── db/
│   ├── dua/
│   │   ├── manifest.json   # Index of all available dua/ziyarat files
│   │   └── *.json          # Individual dua files (Arabic + Persian content)
│   └── quran/
│       ├── manifest.json   # Surah list (id, name_arabic, verses_count)
│       └── 001.json…114.json  # Per-surah verses (Arabic Uthmani + Fooladvand Persian)
│
└── media/
    ├── background/
    │   ├── backgrounds.json    # Hijri calendar → background image mapping
    │   └── *.jpg               # Event background images
    └── music/
        ├── playlist.json       # Ordered list of music filenames
        └── *.mp3               # Background music tracks
```

### DOM Structure

```
<body>
  #background-layer          ← fixed, z-index 0; blurred + sharp layers
  #webcam-view               ← fixed, z-index 0; video feed
  #container                 ← z-index 1; centers the screen
    #screen                  ← flex column (container-type: inline-size)
      #dua-name (h2)         ← pill-style title bar (hidden when empty)
      #dua-content           ← flex:1 content frame (positioning parent)
        #dua-slides-container  ← dua slide stack
        #quran-view            ← quran reader panel
        #dua-list              ← absolute overlay, z-index 10; dua tile grid
        #quran-sidebar         ← absolute overlay, z-index 10; surah tile grid
        ::after                ← absolute overlay, z-index 20; CSS L-brackets
      #controls              ← 3-pill FAB bar (stacks on narrow screens)
        #controls-right      ← [📖][🤲][🖼️][🎦][🌓][🎵][⛶]
        #controls-center     ← [◀][slider][۳/۱۲][▶][➖][➕][▷]
        #controls-left       ← [📅][city/dates/azan] … [time]
```

### State Management

All mutable state lives as module-level `let` variables in `main.js`:

| Variable | Type | Purpose |
|---|---|---|
| `currentView` | string | Active view: `"dua"` \| `"quran"` \| `"webcam"` \| `"background"` |
| `previousView` | string | Last non-background view, for toggle-back |
| `currentLines` | array | Slides of the currently loaded dua |
| `currentSlide` | number | Zero-based index of the displayed slide |
| `currentFolder` | string | UID of the currently loaded dua |
| `currentSurah` | number | Currently selected Quran surah number |
| `quranVerses` | array | Verses of the currently loaded surah (+ credit slide) |
| `quranSurahs` | array | Full surah list (cached after first load) |
| `quranSurahsLoaded` | bool | Guard against re-fetching surah list |
| `isDarkMode` | bool | Dark mode toggle state |
| `persianFontSize` | number | Current Persian font size in px |
| `webcamStream` | MediaStream | Active camera stream (or null) |
| `calendarVisible` | bool | Calendar/azan block expanded state |
| `cachedHijriMonth/Day` | number | Hijri date cached after aladhan fetch |
| `musicPlaylist` | array | Filenames from `playlist.json` |
| `musicAudio` | Audio | Active music Audio element |
| `lastMusicIndex` | number | Previous track index (prevents consecutive repeat) |
| `currentAudio` | Audio | Active Quran verse Audio element |
| `isAutoPlaying` | bool | Whether Quran auto-advance is active |
| `autoPlayTimer` | number | setTimeout handle for inter-verse delay |

### View System

`showView(view)` is the central dispatcher. It:
1. Removes `.active` from all view containers
2. Hides both list overlays
3. Stops webcam unless entering webcam mode
4. Stops Quran audio when leaving Quran view
5. Records `previousView` (for background toggle-back)
6. Sets active-view CSS on FAB buttons
7. Controls `background-layer` opacity (0.45 normal, 0.95 in background mode)
8. Runs view-specific setup (show sidebar, activate quran, start webcam, etc.)
9. Clears URL if leaving dua/quran view

### URL Routing

The app uses `history.replaceState` — no page reloads, bookmarkable deep links:

| URL pattern | State |
|---|---|
| `/` (no params) | Home / blank |
| `?list=dua` | Dua list overlay open |
| `?list=quran` | Quran surah list overlay open |
| `?name=<uid>&id=<n>` | Dua `uid` at slide `n` (1-based) |
| `?quran=<surah>&id=<n>` | Quran surah at verse `n`; `id=0` for Bismillah, `id=1` for first verse |

On page load, `init()` reads `URLSearchParams` and restores the matching state.

### FAB Bar — Three Pill Blocks

All three blocks share the same pill style: `rgba(245,240,225,0.88)` background, `backdrop-filter: blur(8px)`, gold border, `border-radius: 50px`.

On screens narrower than 620 px (container query on `#screen`), the three blocks stack vertically: center navigation first, then calendar, then view controls.

**Right block** (`#controls-right`) — view & mode controls:
- 📖 Quran — opens quran list / toggles sidebar
- 🤲 Dua — opens dua list / toggles list
- 🖼️ Background — toggles background view
- 🎦 Webcam — toggles camera view
- 🌓 Contrast — toggles dark mode
- 🎵 Music — toggles shuffle playback
- ⛶ Fullscreen — toggles browser fullscreen (icon becomes ⊡ when active)

**Center block** (`#controls-center`) — content navigation (hidden when no content active or list is open):
- ▶ / ◀ Prev/Next slide
- Range slider — scrub to any slide (RTL, mirrored)
- Slide counter — `currentSlide/total` in Persian digits
- ➖ / ➕ Persian font size
- ▷ Audio play/pause (Quran mode only, separated by a gold divider); switches to ⏸ during playback

**Left block** (`#controls-left`) — calendar, azan, clock:
- 📅 toggles `#calendar-azan-block` (city · Hijri · Jalali · Gregorian · next azan)
- Live time display (Persian digits, updated every 60s)

### Quran Audio System

- `playVerseAudio(surah, ayah)` — fetches MP3 from everyayah.com and plays it; on `ended`, if `isAutoPlaying` is true, waits 1 second then advances to the next verse
- `stopAudio()` — cancels the auto-advance timer, clears `isAutoPlaying`, pauses and discards the Audio element, resets the play button
- `toggleVerseAudio()` — if not playing, sets `isAutoPlaying = true` and starts; if playing, calls `stopAudio()`
- Auto-advance stops at the last verse and does not loop

### Data Layer

**Local JSON (served via HTTP)**

| File | Schema | Consumer |
|---|---|---|
| `db/dua/manifest.json` | `[{uid, name_fa, name_ar}]` | `loadDuaList()` builds dua tile grid |
| `db/dua/<uid>.json` | `{uid, name_fa, content:[{ar,fa,m}]}` | `displayDua()` builds slide stack |
| `db/quran/manifest.json` | `[{id, name_arabic, verses_count, …}]` | `loadQuranSurahs()` builds surah tile grid |
| `db/quran/<NNN>.json` | `[{ayah, ar, fa}]` | `loadQuranSurah()` builds verse slides |
| `media/background/backgrounds.json` | `[{hijri_month, hijri_day, start_hour?, end_hour?, event_fa, image}]` | `loadBackground()` selects event image |
| `media/music/playlist.json` | `["file.mp3", ...]` | `toggleMusic()` loads shuffle playlist |

**External APIs**

| API | Endpoint | Used for |
|---|---|---|
| api.aladhan.com/v1 | `/gToH/<date>` | Gregorian → Hijri date conversion |
| api.aladhan.com/v1 | `/timingsByCity?city=…&method=7` | Daily prayer times |
| everyayah.com | `/data/Abdul_Basit_Murattal_192kbps/<verse>.mp3` | Per-verse audio recitation (streamed on demand) |
| jsDelivr CDN | `jalaali-js` | Jalali (Solar Hijri) calendar conversion |
| Google Fonts | `Amiri+Quran` | Quranic Arabic glyph coverage |

### Font System

Four typefaces, all loaded locally except Amiri Quran:

| Family | File | Used for |
|---|---|---|
| `SamimV1` (normal) | `Samim-v0.10.3.woff/ttf` | UI text, Persian translations, FAB labels |
| `SamimV1` (bold) | `Samim-v0.10.3-Bold.woff/ttf` | Bold city name in calendar block |
| `NotoNaskhArabic` | `NotoNaskhArabic-Regular.ttf` | Arabic text in dua slides and surah names |
| `QuranTaha` | `QuranTaha.ttf` | Quranic Arabic fallback |
| `Amiri Quran` | Google Fonts CDN | Primary Quranic Arabic (full glyph set) |

### CSS Custom Properties

| Variable | Default | Purpose |
|---|---|---|
| `--base-bg` | `#fdf8f0` | Page background color (light mode) — change once to retheme everywhere |
| `--base-bg-dark` | `#1a1a1a` | Page background color (dark mode) |
| `--persian-font-size` | `20px` | Persian translation font size (adjusted by ➖/➕) |

### Persistence (`localStorage`)

| Key | Value | Set by |
|---|---|---|
| `noor_city` | `{city, country, label?}` | City save button in calendar block |

No other state is persisted across sessions; URL params handle deep-linking.

### Decorative Frame

The four gold L-bracket corners around `#dua-content` are pure CSS — no images:

```css
#dua-content::after {
  position: absolute; inset: 0; z-index: 20; pointer-events: none;
  background-image: 8× linear-gradient(gold, gold);  /* 2 strips per corner */
  background-size: 64px×8px (H arm), 8px×64px (V arm);
  background-position: corner offsets (14px from each edge);
  filter: drop-shadow(0 0 6px black);
  background-repeat: no-repeat;
}
```

`#dua-content` uses `overflow: visible` so the drop-shadow is not clipped. The `::after` sits above the list overlays (z-index 20 vs 10) so brackets are always visible, and `pointer-events: none` lets clicks pass through.

---

## Dua File Format

`db/dua/manifest.json` — index of available content:

```json
[
  { "uid": "dua-kumayl", "name_fa": "دعای کمیل", "name_ar": "دعاء كميل" }
]
```

Individual dua file (e.g. `db/dua/dua-kumayl.json`):

```json
{
  "uid": "dua-kumayl",
  "name_fa": "دعای کمیل",
  "content": [
    { "ar": "Arabic text", "fa": "Persian translation", "m": "Optional meta / reference" }
  ]
}
```

Fields `ar`, `fa`, and `m` are all optional per slide. A trailing credit slide (التماس دعا) is appended automatically.

---

## Background Manifest Format

`media/background/backgrounds.json`:

```json
[
  { "hijri_month": 1,  "hijri_day": 10, "event_fa": "عاشورا", "image": "media/background/ashura.jpg" },
  { "hijri_month": 12, "hijri_day": 29, "start_hour": 12, "event_fa": "آستانه محرم", "image": "media/background/muharram1.jpg" }
]
```

- `start_hour` / `end_hour` — optional, restrict the entry to a time window on that day
- If no entry matches today, the app falls back to the next upcoming event in the calendar year

---

## Music Playlist Format

`media/music/playlist.json`:

```json
["track1.mp3", "track2.mp3"]
```

Files must be placed in `media/music/`. Tracks are played in shuffle order; the same track will not play twice in a row unless only one track exists.

---

## Running Locally

The app uses `fetch()`, so a local HTTP server is required (file:// does not work).

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

Or use the **Live Server** extension in VS Code.

---

## Tech Stack

- HTML5 (single page, no templating)
- CSS3 — Flexbox, CSS Grid, `backdrop-filter`, CSS custom properties, container queries, multi-layer `background-image` gradients
- Vanilla JavaScript — ES6+, `async/await`, `fetch`, `URLSearchParams`, `history.replaceState`, Web Audio, MediaDevices API, Fullscreen API
- JSON data files (local dua content + event calendar)
- No build tools. No frameworks. No dependencies.

---

## License

Free to use for educational, religious, and presentation purposes.
