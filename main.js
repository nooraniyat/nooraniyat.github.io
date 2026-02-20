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
const homeBtn = document.getElementById("home-btn");
const contrastBtn = document.getElementById("contrast-btn");

const CREDIT_SLIDE = {
  ar: "التماس دعا",
  fa: null,
  m: null,
  isCredit: true
};



/* =================================================
   STATE
================================================= */

let currentLines = [];
let currentSlide = 0;
let currentFolder = "";
let isDarkMode = false;


/* =================================================
   FETCH JSON
================================================= */

async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (err) {
    console.error("Fetch error:", path);
    return null;
  }
}


/* =================================================
   CREATE SLIDE HTML
================================================= */

function createSlideHTML(line) {
  return `
    <div class="slide">

      ${line.m ? `<div class="meta-line">${line.m}</div>` : ""}

      ${line.ar ? `<div class="arabic-line">${line.ar}</div>` : ""}

      ${line.fa ? `<div class="farsi-line">${line.fa}</div>` : ""}

    </div>
  `;
}




/* =================================================
   SHOW SLIDE
================================================= */

function showSlide(index, updateURL = true) {
  if (!currentLines.length || !duaContentEl) return;

  index = Math.max(0, Math.min(index, currentLines.length - 1));
  currentSlide = index;

  duaContentEl.innerHTML = createSlideHTML(currentLines[index]);

  if (slideCounter)
    slideCounter.textContent = `${index + 1} / ${currentLines.length}`;

  if (slideSlider)
    slideSlider.value = currentLines.length - index;

  if (prevBtn)
    prevBtn.disabled = index === 0;

  if (nextBtn)
    nextBtn.disabled = index === currentLines.length - 1;

  if (updateURL && currentFolder) {
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

  duaListEl.style.display = "none";
  screenEl.style.display = "flex";

  if (homeBtn) homeBtn.style.display = "inline-flex";

  const duaJson = await fetchJSON(`${dbFolder}/${folder}.json`);
  if (!duaJson) {
    goHome();
    return;
  }

  duaNameEl.textContent = duaJson.name_fa || duaJson.uid;

  currentLines = [...(duaJson.content || [])];

  currentLines.push(CREDIT_SLIDE);

  if (slideSlider) {
    slideSlider.min = 1;
    slideSlider.max = currentLines.length;
    slideSlider.value = Math.max(1, currentLines.length - slideIndex);
  }

  showSlide(Math.max(0, slideIndex), false);
}


/* =================================================
   LOAD SIDEBAR LIST
================================================= */

async function loadDuaList() {
  const folders = await fetchJSON(manifestFile);
  if (!folders || !Array.isArray(folders)) return;

  duaListEl.innerHTML = "";

  for (const item of folders) {
    const btn = document.createElement("button");
    btn.textContent = item.name_fa || item.uid;
    btn.onclick = () => displayDua(item.uid, 0);
    duaListEl.appendChild(btn);
  }
}


/* =================================================
   CONTROLS
================================================= */

if (prevBtn)
  prevBtn.onclick = () => showSlide(currentSlide - 1);

if (nextBtn)
  nextBtn.onclick = () => showSlide(currentSlide + 1);

if (slideSlider)
  slideSlider.addEventListener("input", () => {
    showSlide(currentLines.length - Number(slideSlider.value));
  });


/* =================================================
   HOME BUTTON FUNCTION
================================================= */

function goHome() {
  duaListEl.style.display = "block";
  screenEl.style.display = "none";

  if (homeBtn) homeBtn.style.display = "none";

  currentLines = [];
  currentSlide = 0;
  currentFolder = "";

  history.replaceState(null, "", window.location.pathname);
}


/* =================================================
   CONTRAST / DARK MODE BUTTON
================================================= */

function toggleContrast() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("dark-mode", isDarkMode);
}


/* =================================================
   KEYBOARD CONTROLS
================================================= */

document.addEventListener("keydown", (e) => {
  if (!currentLines.length) return;

  if (e.key === "ArrowLeft" || e.key === "PageUp") {
    showSlide(currentSlide - 1);
  }

  if (e.key === "ArrowRight" || e.key === "PageDown") {
    showSlide(currentSlide + 1);
  }

  if (e.key === "Home") {
    goHome();
  }
});


/* =================================================
   INIT
================================================= */

async function init() {
  screenEl.style.display = "none";

  if (homeBtn) {
    homeBtn.style.display = "none";
    homeBtn.onclick = goHome;
  }

  if (contrastBtn) {
    contrastBtn.onclick = toggleContrast;
  }

  await loadDuaList();

  const params = new URLSearchParams(window.location.search);
  const nameParam = params.get("name");
  const idParam = parseInt(params.get("id"), 10) || 1;

  if (nameParam) {
    const folders = await fetchJSON(manifestFile) || [];
    const validUids = folders.map(f => f.uid);

    if (validUids.includes(nameParam)) {
      displayDua(nameParam, idParam - 1);
      return;
    }
  }

  goHome();
}

init();
