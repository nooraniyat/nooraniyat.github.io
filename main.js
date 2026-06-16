/* =================================================
   CONFIG
================================================= */

const dbFolder = "db";
const manifestFile = `${dbFolder}/manifest.json`;
const QURAN_API = "https://api.quran.com/api/v4";
const FARSI_TRANSLATION_ID = 29; // Fooladvand (Persian/Farsi)
const ALADHAN_API = "https://api.aladhan.com/v1";
const AUDIO_BASE = "https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/";


/* =================================================
   ELEMENTS
================================================= */

const duaListEl       = document.getElementById("dua-list");
const quranSidebarEl  = document.getElementById("quran-sidebar");
const screenEl        = document.getElementById("screen");
const duaNameEl       = document.getElementById("dua-name");
const duaContentEl    = document.getElementById("dua-content");
const duaSlidesEl     = document.getElementById("dua-slides-container");
const quranViewEl     = document.getElementById("quran-view");
const webcamViewEl    = document.getElementById("webcam-view");
const webcamFeedEl    = document.getElementById("webcam-feed");
const prevBtn         = document.getElementById("prev-slide");
const nextBtn         = document.getElementById("next-slide");
const slideCounter    = document.getElementById("slide-counter");
const slideSlider     = document.getElementById("slide-slider");
const navGroupEl      = document.getElementById("nav-group");
const homeBtn         = document.getElementById("home-btn");
const contrastBtn     = document.getElementById("contrast-btn");
const farsiPlusBtn    = document.getElementById("farsi-plus-btn");
const farsiMinusBtn   = document.getElementById("farsi-minus-btn");
const btnQuran        = document.getElementById("btn-quran");
const btnBackground   = document.getElementById("btn-background");
const btnCalendar     = document.getElementById("btn-calendar");
const btnCamera       = document.getElementById("btn-camera");
const calBlock        = document.getElementById("calendar-azan-block");
const calHijriEl      = document.getElementById("cal-hijri");
const calPersianEl    = document.getElementById("cal-persian");
const calGregEl       = document.getElementById("cal-gregorian");
const azanTimesEl     = document.getElementById("azan-times");
const cityDisplayEl   = document.getElementById("city-display");
const cityEditRow     = document.getElementById("city-edit-row");
const cityInputEl     = document.getElementById("city-input");
const citySaveBtn     = document.getElementById("city-save-btn");
const bgLayerEl       = document.getElementById("background-layer");
const bgBlurEl        = document.getElementById("bg-blur");
const bgSharpEl       = document.getElementById("bg-sharp");

const CREDIT_SLIDE = { ar: "التماس دعا", fa: null, m: null, isCredit: true };


/* =================================================
   STATE
================================================= */

let currentView    = "dua";   // "dua" | "quran" | "webcam" | "background"
let previousView   = "dua";
let currentLines   = [];
let currentSlide   = 0;
let currentFolder  = "";
let isDarkMode     = false;
let farsiFontSize  = null;
let webcamStream   = null;
let calendarVisible = false;

// Quran state
let quranSurahsLoaded = false;
let quranSurahs    = [];
let quranVerses    = [];
let currentSurah   = 0;
let currentAudio   = null;

// Cached Hijri date for background matching
let cachedHijriMonth = 0;
let cachedHijriDay   = 0;


/* =================================================
   FETCH JSON
================================================= */

async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    console.error("Fetch error:", path);
    return null;
  }
}


/* =================================================
   VIEW SWITCHING
================================================= */

function showView(view) {
  currentView = view;

  // Deactivate all view containers
  duaSlidesEl.classList.remove("active");
  quranViewEl.classList.remove("active");
  webcamViewEl.classList.remove("active");  // hides fixed webcam layer

  // Sidebars
  duaListEl.style.display    = "none";
  quranSidebarEl.style.display = "none";

  // Stop webcam unless entering webcam mode
  if (view !== "webcam") stopWebcam();

  // Track previous non-background view for toggle-back
  if (view !== "background") previousView = view;

  // Active view button styling
  btnQuran.classList.toggle("active-view", view === "quran");
  homeBtn.classList.toggle("active-view", view === "dua" && currentLines.length > 0);
  btnCamera.classList.toggle("active-view", view === "webcam");
  btnBackground.classList.toggle("active-view", view === "background");

  // Background layer: full opacity in background mode, hidden otherwise
  bgLayerEl.classList.toggle("active", view === "background");
  bgLayerEl.style.opacity = view === "background" ? "0.95" : "0.45";

  if (view === "dua") {
    duaSlidesEl.classList.add("active");
    navGroupEl.classList.toggle("hidden", currentLines.length === 0);
    if (currentLines.length === 0) {
      duaNameEl.textContent = "";
      duaSlidesEl.innerHTML = "";
    }
  } else if (view === "quran") {
    quranSidebarEl.style.display = "block";
    quranViewEl.classList.add("active");
    navGroupEl.classList.remove("hidden");
    if (!quranSurahsLoaded) loadQuranSurahs();
  } else if (view === "webcam") {
    webcamViewEl.classList.add("active");
    navGroupEl.classList.add("hidden");
    duaNameEl.textContent = "سخنرانی";
    startWebcam();
  } else if (view === "background") {
    navGroupEl.classList.add("hidden");
    duaNameEl.textContent = "";
    loadBackground();
  }

  // Clear URL if leaving dua
  if (view !== "dua") {
    history.replaceState(null, "", window.location.pathname);
  }
}


/* =================================================
   DUA SLIDE LOGIC
================================================= */

function createSlideHTML(line) {
  return `
    <div class="slide">
      ${line.m ? `<div class="meta-line">${line.m}</div>` : ""}
      ${line.ar ? `<div class="arabic-line">${line.ar.replace(/\n/g, "<br>")}</div>` : ""}
      ${line.fa ? `<div class="farsi-line">${line.fa.replace(/\n/g, "<br>")}</div>` : ""}
    </div>
  `;
}

function showSlide(index, updateURL = true, fromSlider = false) {
  if (!currentLines.length) return;
  if (!fromSlider && slideSlider) slideSlider.blur();

  index = Math.max(0, Math.min(index, currentLines.length - 1));
  currentSlide = index;

  if (currentView === "dua") {
    duaSlidesEl.innerHTML = createSlideHTML(currentLines[index]);
  } else if (currentView === "quran") {
    showQuranVerse(index);
  }

  updateNavUI();

  if (updateURL && currentFolder && currentView === "dua") {
    const params = new URLSearchParams();
    params.set("name", currentFolder);
    params.set("id", index + 1);
    history.replaceState(null, "", "?" + params.toString());
  }
}

function updateNavUI() {
  if (slideCounter)
    slideCounter.textContent = `${currentSlide + 1} / ${currentLines.length}`;
  if (slideSlider)
    slideSlider.value = currentLines.length - currentSlide;
  if (prevBtn) prevBtn.disabled = currentSlide === 0;
  if (nextBtn) nextBtn.disabled = currentSlide === currentLines.length - 1;
}

async function displayDua(folder, slideIndex = 0) {
  currentFolder = folder;
  currentView = "dua";

  duaListEl.style.display   = "none";
  quranSidebarEl.style.display = "none";
  duaSlidesEl.classList.add("active");
  quranViewEl.classList.remove("active");
  webcamViewEl.classList.remove("active");
  stopWebcam();

  const duaJson = await fetchJSON(`${dbFolder}/${folder}.json`);
  if (!duaJson) return;

  duaNameEl.textContent = duaJson.name_fa || duaJson.uid;
  currentLines = [...(duaJson.content || []), CREDIT_SLIDE];

  if (slideSlider) {
    slideSlider.min   = 1;
    slideSlider.max   = currentLines.length;
    slideSlider.value = Math.max(1, currentLines.length - slideIndex);
  }

  navGroupEl.classList.remove("hidden");
  homeBtn.classList.add("active-view");
  showSlide(Math.max(0, slideIndex), false);
}

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

function goHome() {
  currentLines  = [];
  currentSlide  = 0;
  currentFolder = "";
  showView("dua");
  history.replaceState(null, "", window.location.pathname);
}


/* =================================================
   QURAN READER
================================================= */

async function loadQuranSurahs() {
  quranViewEl.innerHTML = `<div class="quran-loading">در حال بارگذاری فهرست سور...</div>`;
  duaNameEl.textContent = "";
  navGroupEl.classList.add("hidden");

  const data = await fetchJSON(`${QURAN_API}/chapters?language=fa`);
  if (!data || !data.chapters) {
    quranViewEl.innerHTML = `<div class="quran-loading">خطا در بارگذاری</div>`;
    return;
  }

  quranSurahs = data.chapters;
  quranSurahsLoaded = true;

  quranSidebarEl.innerHTML = "";
  for (const s of quranSurahs) {
    const btn = document.createElement("button");
    const nameFa = s.translated_name?.name || "";
    btn.innerHTML = `
      <span class="surah-right">
        <span class="surah-num">${toFaDigits(s.id)}</span>
        <span class="surah-arabic">${s.name_arabic}</span>
      </span>
      <span class="surah-trans">${nameFa}</span>
    `;
    btn.onclick = () => loadQuranSurah(s.id);
    quranSidebarEl.appendChild(btn);
  }

  quranViewEl.innerHTML = `<div class="quran-loading">یک سوره را از فهرست انتخاب کنید</div>`;
}

async function loadQuranSurah(surahNum) {
  currentSurah = surahNum;
  stopAudio();
  quranSidebarEl.style.display = "none";

  const surah = quranSurahs.find(s => s.id === surahNum);
  duaNameEl.textContent = surah ? surah.name_arabic : "";

  quranViewEl.innerHTML = `<div class="quran-loading">در حال بارگذاری...</div>`;

  const url = `${QURAN_API}/verses/by_chapter/${surahNum}?translations=${FARSI_TRANSLATION_ID}&fields=text_uthmani&per_page=300&page=1`;
  const data = await fetchJSON(url);

  if (!data || !data.verses) {
    quranViewEl.innerHTML = `<div class="quran-loading">خطا در بارگذاری آیات</div>`;
    return;
  }

  quranVerses = data.verses.map(v => ({
    key: v.verse_key,
    ar: v.text_uthmani || "",
    fa: (v.translations?.[0]?.text || "").replace(/<[^>]+>/g, ""),
    surah: surahNum,
    ayah: v.verse_number
  }));

  currentLines = quranVerses;
  currentSlide = 0;

  if (slideSlider) {
    slideSlider.min   = 1;
    slideSlider.max   = currentLines.length;
    slideSlider.value = currentLines.length;
  }

  navGroupEl.classList.remove("hidden");
  showQuranVerse(0);
  updateNavUI();
}

function showQuranVerse(index) {
  if (!quranVerses.length) return;
  index = Math.max(0, Math.min(index, quranVerses.length - 1));
  currentSlide = index;

  const v = quranVerses[index];

  const showBismillah = index === 0 && v.surah !== 1 && v.surah !== 9;

  quranViewEl.innerHTML = `
    <div class="slide">
      ${showBismillah ? `<div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>` : ""}
      <div class="arabic-line">${v.ar}</div>
      <div class="verse-info">
        <span class="verse-key">${v.key}</span>
        <button class="audio-btn" id="audio-play-btn" title="پخش تلاوت">▷</button>
      </div>
      <div class="farsi-line">${v.fa}</div>
    </div>
  `;

  document.getElementById("audio-play-btn").onclick = () => toggleVerseAudio(v.surah, v.ayah);
}

function getAudioUrl(surah, ayah) {
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `${AUDIO_BASE}${s}${a}.mp3`;
}

function toggleVerseAudio(surah, ayah) {
  const btn = document.getElementById("audio-play-btn");
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    if (btn) btn.textContent = "▷";
    return;
  }
  stopAudio();
  currentAudio = new Audio(getAudioUrl(surah, ayah));
  currentAudio.play();
  if (btn) btn.textContent = "⏸";
  currentAudio.onended = () => { if (btn) btn.textContent = "▷"; };
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}


/* =================================================
   WEBCAM
================================================= */

async function startWebcam() {
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    webcamFeedEl.srcObject = webcamStream;
  } catch (e) {
    webcamViewEl.innerHTML = `<div style="color:#fff;padding:40px;text-align:center;font-family:SamimV1">دسترسی به دوربین ممکن نبود</div>`;
    console.error("Webcam:", e);
  }
}

function stopWebcam() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(t => t.stop());
    webcamStream = null;
    webcamFeedEl.srcObject = null;
  }
}


/* =================================================
   CALENDAR + AZAN
================================================= */

function getCityData() {
  try {
    return JSON.parse(localStorage.getItem("noor_city")) || { city: "Waterloo", country: "Canada", label: "واتربو انتاریو کانادا" };
  } catch {
    return { city: "Waterloo", country: "Canada", label: "واتربو انتاریو کانادا" };
  }
}

function saveCityData(city, country) {
  localStorage.setItem("noor_city", JSON.stringify({ city, country }));
}

function toFaDigits(str) {
  return String(str).replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

const HIJRI_MONTHS_FA = [
  "محرم","صفر","ربیع‌الاول","ربیع‌الثانی",
  "جمادی‌الاول","جمادی‌الثانی","رجب","شعبان",
  "رمضان","شوال","ذیقعده","ذیحجه"
];

const JALALI_MONTHS_FA = [
  "فروردین","اردیبهشت","خرداد","تیر",
  "مرداد","شهریور","مهر","آبان",
  "آذر","دی","بهمن","اسفند"
];

const AZAN_KEYS = {
  Fajr: "فجر", Sunrise: "طلوع", Dhuhr: "ظهر",
  Sunset: "غروب", Maghrib: "مغرب"
};

async function loadCalendarAzan() {
  const now   = new Date();
  const d = now.getDate(), m = now.getMonth() + 1, y = now.getFullYear();

  // Gregorian — day (left), month (center), year (right)
  const GREG_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  calGregEl.textContent = `${d}  ${GREG_MONTHS[m - 1]}  ${y}`;

  // Persian (Jalali) — Persian digits
  if (window.jalaali) {
    const j = jalaali.toJalaali(y, m, d);
    calPersianEl.textContent = `${toFaDigits(j.jd)} ${JALALI_MONTHS_FA[j.jm - 1]} ${toFaDigits(j.jy)}`;
  }

  // Hijri via aladhan
  try {
    const hijriRes = await fetch(`${ALADHAN_API}/gToH/${d}-${m}-${y}`);
    const hijriData = await hijriRes.json();
    const h = hijriData?.data?.hijri;
    if (h) {
      cachedHijriMonth = parseInt(h.month.number, 10);
      cachedHijriDay   = parseInt(h.day, 10);
      calHijriEl.textContent = `${toFaDigits(h.day)} ${HIJRI_MONTHS_FA[cachedHijriMonth - 1]} ${toFaDigits(h.year)}`;
    }
  } catch { calHijriEl.textContent = "—"; }

  // City + Azan
  const cd = getCityData();
  cityDisplayEl.textContent = cd.label || cd.city;

  try {
    const azanRes = await fetch(`${ALADHAN_API}/timingsByCity?city=${encodeURIComponent(cd.city)}&country=${encodeURIComponent(cd.country)}&method=7`);
    const azanData = await azanRes.json();
    const timings = azanData?.data?.timings;
    if (timings) {
      azanTimesEl.innerHTML = Object.entries(AZAN_KEYS).map(([key, label]) =>
        timings[key]
          ? `<span class="azan-item"><span class="azan-label">${label}</span> ${toFaDigits(timings[key])}</span>`
          : ""
      ).join("");
    }
  } catch { azanTimesEl.textContent = "—"; }

  // Load background after we have Hijri
  loadBackground();
}

function toggleCalendar() {
  calendarVisible = !calendarVisible;
  calBlock.classList.toggle("visible", calendarVisible);
  btnCalendar.classList.toggle("active-view", calendarVisible);
  if (calendarVisible && calHijriEl.textContent === "—") loadCalendarAzan();
}


/* =================================================
   BACKGROUND
================================================= */

async function loadBackground() {
  const manifest = await fetchJSON(`media/backgrounds.json`);
  if (!manifest || !Array.isArray(manifest)) return;

  // Fetch Hijri date independently if calendar hasn't been loaded yet
  if (!cachedHijriMonth) {
    const now = new Date();
    const d = now.getDate(), m = now.getMonth() + 1, y = now.getFullYear();
    try {
      const res  = await fetch(`${ALADHAN_API}/gToH/${d}-${m}-${y}`);
      const data = await res.json();
      const h    = data?.data?.hijri;
      if (h) {
        cachedHijriMonth = parseInt(h.month.number, 10);
        cachedHijriDay   = parseInt(h.day, 10);
      }
    } catch {}
  }

  const hm = cachedHijriMonth, hd = cachedHijriDay;
  if (!hm) return;

  const hour = new Date().getHours();

  // Find today's event respecting optional start_hour / end_hour
  let event = manifest.find(e => {
    if (e.hijri_month !== hm || e.hijri_day !== hd) return false;
    if (e.start_hour !== undefined && hour < e.start_hour) return false;
    if (e.end_hour   !== undefined && hour >= e.end_hour)  return false;
    return true;
  });

  if (!event) {
    event = manifest.find(e => e.hijri_month === hm && e.hijri_day > hd);
  }
  if (!event) {
    event = manifest.find(e => e.hijri_month > hm);
  }
  if (!event) {
    event = manifest[0];
  }

  if (event?.image) {
    bgBlurEl.style.backgroundImage  = `url('${event.image}')`;
    bgSharpEl.style.backgroundImage = `url('${event.image}')`;
  }
}

function toggleBackground() {
  if (currentView === "background") showView(previousView);
  else showView("background");
}


/* =================================================
   DARK MODE + FONT SIZE
================================================= */

function toggleContrast() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("dark-mode", isDarkMode);
}

function getFarsiFontSize() {
  if (farsiFontSize === null) {
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue("--farsi-font-size").trim();
    farsiFontSize = parseFloat(val) || 20;
  }
  return farsiFontSize;
}

function setFarsiFontSize(size) {
  farsiFontSize = Math.max(10, Math.min(60, size));
  document.documentElement.style.setProperty("--farsi-font-size", farsiFontSize + "px");
}


/* =================================================
   KEYBOARD CONTROLS
================================================= */

document.addEventListener("keydown", (e) => {
  if (e.target === cityInputEl) return;

  if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " " || e.key === "Enter") {
    if (currentLines.length) showSlide(currentSlide + 1);
  }
  if (e.key === "ArrowLeft" || e.key === "PageUp") {
    if (currentLines.length) showSlide(currentSlide - 1);
  }
  if (e.key === "Home") goHome();
});


/* =================================================
   WIRE CONTROLS
================================================= */

prevBtn.onclick   = () => showSlide(currentSlide - 1);
nextBtn.onclick   = () => showSlide(currentSlide + 1);
homeBtn.onclick = () => {
  if (currentView !== "dua") {
    showView("dua");
    duaListEl.style.display = "block";
  } else {
    duaListEl.style.display = duaListEl.style.display === "none" ? "block" : "none";
  }
};
btnQuran.onclick  = () => showView("quran");
btnCamera.onclick = () => {
  if (currentView === "webcam") showView("dua");
  else showView("webcam");
};

btnBackground.onclick = toggleBackground;
btnCalendar.onclick   = toggleCalendar;
contrastBtn.onclick   = toggleContrast;
farsiPlusBtn.onclick  = () => setFarsiFontSize(getFarsiFontSize() + 2);
farsiMinusBtn.onclick = () => setFarsiFontSize(getFarsiFontSize() - 2);

slideSlider.addEventListener("input", () => {
  showSlide(currentLines.length - Number(slideSlider.value), true, true);
});

// City editing
cityDisplayEl.onclick = () => {
  const cd = getCityData();
  cityInputEl.value = `${cd.city}, ${cd.country}`;
  cityEditRow.style.display = "flex";
  cityInputEl.focus();
};

citySaveBtn.onclick = () => {
  const parts = cityInputEl.value.split(",").map(s => s.trim());
  const city    = parts[0] || "Waterloo";
  const country = parts[1] || "Canada";
  saveCityData(city, country);
  cityEditRow.style.display = "none";
  cityDisplayEl.textContent = city;
  azanTimesEl.innerHTML = "...";
  loadCalendarAzan();
};

cityInputEl.addEventListener("keydown", e => {
  if (e.key === "Enter") citySaveBtn.click();
  if (e.key === "Escape") cityEditRow.style.display = "none";
});


/* =================================================
   INIT
================================================= */

async function init() {
  await loadDuaList();

  const params   = new URLSearchParams(window.location.search);
  const nameParam = params.get("name");
  const idParam   = parseInt(params.get("id"), 10) || 1;

  if (nameParam) {
    const folders   = await fetchJSON(manifestFile) || [];
    const validUids = folders.map(f => f.uid);
    if (validUids.includes(nameParam)) {
      await displayDua(nameParam, idParam - 1);
      return;
    }
  }

  showView("dua");
}

init();
