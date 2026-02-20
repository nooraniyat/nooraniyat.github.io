# Slide Viewer

A lightweight, framework-free slide presentation engine built with **HTML**, **CSS**, and **Vanilla JavaScript**.

Clean. Fast. Offline-ready. Fully JSON-driven.

---

## Features

- Dynamic slide loading from JSON  
- URL-based navigation (`?name=file&id=3`)  
- Previous / Next controls  
- Slide progress slider  
- Responsive layout  
- RTL support  
- Optional dark mode  
- No frameworks  
- No dependencies  

---

## Project Structure

```text
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
    ├── presentation-1.json
    ├── presentation-2.json
    └── ...
```

All slide files are stored directly inside the `db/` folder.

---

## Data Format

### manifest.json

Lists available slide files:

```json
[
  "presentation-1",
  "presentation-2"
]
```

The app loads:

```text
db/presentation-1.json
```

---

### Slide File Structure

Example: `presentation-1.json`

```json
{
  "title": "Presentation Title",
  "slides": [
    {
      "id": 1,
      "meta": "Optional meta line",
      "main": "Main slide content",
      "sub": "Optional secondary content"
    }
  ]
}
```

---

## Navigation

Slides can be controlled using:

- Previous / Next buttons  
- Range slider  
- Direct URL access  

Example:

```text
http://localhost:8000/?name=presentation-1&id=3
```

Opens slide 3 directly.

---

## Running Locally

Because the app uses `fetch()`, you must run it with a local server.

### Python

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### VS Code

Use the **Live Server** extension.

---

## Customization

Modify layout or typography inside:

```text
style.css
```

Example:

```css
.slide-main { font-size: 48px; }
.slide-meta { font-size: 14px; }
.slide-sub  { color: gray; }
```

Decorative assets can be replaced inside:

```text
assets/images/
```

---

## Responsive Design

Mobile styles are handled via:

```css
@media (max-width: 768px) { }
```

Includes:

- Reduced padding  
- Scaled typography  
- Stacked sidebar  

---

## Tech Stack

- HTML5  
- CSS3 (Flexbox)  
- Vanilla JavaScript (ES6)  
- JSON data source  

No build tools required.

---

## License

Free to use for educational and presentation purposes.
