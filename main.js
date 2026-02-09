/* =================================================
   CONFIG
================================================= */

const dbFolder = "db";
const manifestFile = `${dbFolder}/manifest.json`;


/* =================================================
   ELEMENTS
================================================= */

const duaListEl = document.getElementById("dua-list");
const duaContentEl = document.getElementById("dua-content");
const prevBtn = document.getElementById("prev-slide");
const nextBtn = document.getElementById("next-slide");
const slideCounter = document.getElementById("slide-counter");
const slideSlider = document.getElementById("slide-slider");
const duaNameEl = document.getElementById("dua-name");
const screenEl = document.getElementById("screen");
const homeBtn = document.getElementById("home-btn"); // added Home button reference


/* =================================================
   STATE
================================================= */

let currentLines = [];
let currentSlide = 0;
let currentFolder = "";


/* =================================================
   FETCH JSON
================================================= */

async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return null;
  }
}


/* =================================================
   CREATE SLIDE HTML
================================================= */

function createSlideHTML(ar, fa, meta) {
  return `
    <div class="slide">

      <div class="arabic-area">
        ${meta ? `<p class="meta-line">${meta.text}</p>` : ""}
        ${ar ? `<p class="arabic-line">${ar.text}</p>` : ""}
      </div>

      <div class="persian-area">
        ${fa ? `<p class="translation">${fa.text}</p>` : ""}
      </div>

    </div>
  `;
}


/* =================================================
   SHOW SLIDE
================================================= */

function showSlide(index, updateURL = true) {
  if (!currentLines.length) return;

  index = Math.max(0, Math.min(index, currentLines.length - 1));
  currentSlide = index;

  const { ar, fa, meta } = currentLines[index];

  duaContentEl.innerHTML = createSlideHTML(ar, fa, meta);

  slideCounter.textContent = `${index + 1} / ${currentLines.length}`;
  slideSlider.value = currentLines.length - index;

  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === currentLines.length - 1;

  /* ⭐ URL update (?name=folder&id=slide) */
  if (updateURL) {
    const params = new URLSearchParams();
    params.set("name", currentFolder);
    params.set("id", index + 1);
    history.replaceState(null, "", "?" + params.toString());
  }
}


/* =================================================
   DISPLAY DUA
================================================= */

async function displayDua(folder, slideIndex = 0) {
  currentFolder = folder;

  /* show screen / hide sidebar */
  duaListEl.style.display = "none";
  screenEl.style.display = "flex";
  if (homeBtn) homeBtn.style.display = "inline-flex"; // show Home button

  const arJson = await fetchJSON(`${dbFolder}/${folder}/text.json`);
  const faJson = await fetchJSON(`${dbFolder}/${folder}/translation-fa.json`);
  if (!arJson) return;

  /* =================================================
     TITLE (Arabic + Persian)
  ================================================= */

  const arName = arJson.name || folder;
  const faName = faJson?.name || "";

  duaNameEl.innerHTML = faName
    ? `<span class="arabic">${arName}</span> <span class="persian">(${faName})</span>`
    : `<span class="arabic">${arName}</span>`;


  /* =================================================
     BUILD SLIDES FROM ALL IDS (FIXED META BUG)
  ================================================= */

  const arLines = arJson.lines || [];
  const faLines = faJson?.lines || [];
  const metaLines = faJson?.meta || [];

  const idSet = new Set([
    ...arLines.map(l => l.id),
    ...faLines.map(l => l.id),
    ...metaLines.map(m => m.id)
  ]);

  const sortedIds = [...idSet].sort((a, b) => a - b);

  currentLines = sortedIds.map(id => ({
    ar: arLines.find(l => l.id === id) || null,
    fa: faLines.find(l => l.id === id) || null,
    meta: metaLines.find(m => m.id === id) || null
  }));


  /* =================================================
     SLIDER SETUP
  ================================================= */

  slideSlider.min = 1;
  slideSlider.max = currentLines.length;
  slideSlider.value = currentLines.length - slideIndex;

  showSlide(slideIndex, false);
}


/* =================================================
   LOAD SIDEBAR LIST
================================================= */

async function loadDuaList() {
  const folders = await fetchJSON(manifestFile);
  if (!folders || !Array.isArray(folders)) return;

  duaListEl.innerHTML = "";

  for (const folder of folders) {
    const arJson = await fetchJSON(`${dbFolder}/${folder}/text.json`);
    const faJson = await fetchJSON(`${dbFolder}/${folder}/translation-fa.json`);

    const arName = arJson?.name || folder;
    const faName = faJson?.name || "";

    const btn = document.createElement("button");

    /* Arabic + Persian fonts */
    btn.innerHTML = faName
      ? `<span class="btn-ar">${arName}</span> <span class="btn-fa">(${faName})</span>`
      : `<span class="btn-ar">${arName}</span>`;

    btn.onclick = () => displayDua(folder, 0);

    duaListEl.appendChild(btn);
  }
}


/* =================================================
   CONTROLS
================================================= */

prevBtn.onclick = () => showSlide(currentSlide - 1);
nextBtn.onclick = () => showSlide(currentSlide + 1);

slideSlider.addEventListener("input", () => {
  showSlide(currentLines.length - Number(slideSlider.value));
});


/* =================================================
   HOME BUTTON
================================================= */

function goHome() {
  // show sidebar / hide screen
  duaListEl.style.display = "block";
  screenEl.style.display = "none";

  // hide home button
  if (homeBtn) homeBtn.style.display = "none";

  // reset state
  currentLines = [];
  currentSlide = 0;
  currentFolder = "";

  // clean URL
  history.replaceState(null, "", window.location.pathname);
}

if (homeBtn) homeBtn.onclick = goHome;


/* =================================================
   INIT
================================================= */

async function init() {
  /* ⭐ start with screen hidden */
  screenEl.style.display = "none";
  if (homeBtn) homeBtn.style.display = "none"; // hide home initially

  await loadDuaList();

  /* support direct URL open */
  const params = new URLSearchParams(window.location.search);
  const nameParam = params.get("name");
  const idParam = parseInt(params.get("id")) || 1;

  if (nameParam) {
    displayDua(nameParam, idParam - 1);
  }
}

init();
