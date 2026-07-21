/* =================================================
   CONFIG
================================================= */

const dbFolder = "db/quotation";
const manifestFile = `${dbFolder}/manifest.json`;
const ALADHAN_API = "https://api.aladhan.com/v1";
const AUDIO_BASE = "https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/";


/* =================================================
   ELEMENTS
================================================= */

const quotationListEl    = document.getElementById("quotation-list");
const bookSidebarEl      = document.getElementById("book-sidebar");
const screenEl        = document.getElementById("screen");
const quotationNameEl    = document.getElementById("quotation-name");
const quotationContentEl = document.getElementById("quotation-content");
const quotationSlidesEl  = document.getElementById("quotation-slides-container");
const bookViewEl      = document.getElementById("book-view");
const webcamViewEl    = document.getElementById("webcam-view");
const webcamFeedEl    = document.getElementById("webcam-feed");
const prevBtn         = document.getElementById("prev-slide");
const nextBtn         = document.getElementById("next-slide");
const slideCounter    = document.getElementById("slide-counter");
const slideSlider     = document.getElementById("slide-slider");
const navGroupEl      = document.getElementById("nav-group");
const homeBtn         = document.getElementById("home-btn");
const btnHomeLink     = document.getElementById("btn-home-link");
const contrastBtn     = document.getElementById("contrast-btn");
const persianPlusBtn    = document.getElementById("persian-plus-btn");
const persianMinusBtn   = document.getElementById("persian-minus-btn");
const audioPlayBtn    = document.getElementById("audio-play-btn");
const btnBook         = document.getElementById("btn-book");
const btnBackground   = document.getElementById("btn-background");
const btnCalendar     = document.getElementById("btn-calendar");
const btnCamera       = document.getElementById("btn-camera");
const btnMusic        = document.getElementById("btn-music");
const btnFullscreen   = document.getElementById("btn-fullscreen");
const calBlock        = document.getElementById("calendar-call-time-block");
const calHijriEl      = document.getElementById("cal-hijri");
const calPersianEl    = document.getElementById("cal-persian");
const calGregEl       = document.getElementById("cal-gregorian");
const callTimesEl     = document.getElementById("call-times");
const cityDisplayEl   = document.getElementById("city-display");
const cityEditRow     = document.getElementById("city-edit-row");
const cityInputEl     = document.getElementById("city-input");
const citySaveBtn     = document.getElementById("city-save-btn");
const bgLayerEl       = document.getElementById("background-layer");
const bgBlurEl        = document.getElementById("bg-blur");
const bgSharpEl       = document.getElementById("bg-sharp");
const currentTimeEl   = document.getElementById("current-time");
const controlsCenterEl = document.getElementById("controls-center");

const CREDIT_SLIDE       = { ar: "التماس دعا",           fa: null, m: null, isCredit: true };


/* =================================================
   STATE
================================================= */

let currentView    = "quotation";   // "quotation" | "book" | "webcam" | "background"
let previousView   = "quotation";
let currentLines   = [];
let currentSlide   = 0;
let currentFolder  = "";
let isDarkMode     = false;
let persianFontSize  = null;
let webcamStream   = null;
let calendarVisible = false;
let cachedCallTimes = [];   // prayer times for today, set once after API fetch

// Book state
let bookSurahsLoaded = false;
let bookSurahs     = [];
let bookVerses     = [];
let currentSurah   = 0;
let currentAudio   = null;
let isAutoPlaying  = false;
let autoPlayTimer  = null;

// Cached Hijri date for background matching
let cachedHijriMonth = 0;
let cachedHijriDay   = 0;

// Music player state
let musicPlaylist  = [];
let musicLoaded    = false;
let musicAudio     = null;
let lastMusicIndex = -1;


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
  if (view !== "book") stopAudio();
  currentView = view;

  // Deactivate all view containers
  quotationSlidesEl.classList.remove("active");
  bookViewEl.classList.remove("active");
  webcamViewEl.classList.remove("active");  // hides fixed webcam layer

  // Sidebars
  quotationListEl.style.display    = "none";
  bookSidebarEl.style.display = "none";

  // Stop webcam unless entering webcam mode
  if (view !== "webcam") stopWebcam();

  // Track previous non-overlay view for toggle-back
  if (view !== "background" && view !== "webcam") previousView = view;

  // Active view button styling
  btnBook.classList.toggle("active-view", view === "book");
  homeBtn.classList.toggle("active-view", view === "quotation" && currentLines.length > 0);
  btnCamera.classList.toggle("active-view", view === "webcam");
  btnBackground.classList.toggle("active-view", view === "background");

  // Background layer: full opacity in background mode, hidden otherwise
  bgLayerEl.classList.toggle("active", view === "background");
  bgLayerEl.style.opacity = view === "background" ? "0.95" : "0.45";

  if (view === "quotation") {
    quotationSlidesEl.classList.add("active");
    navGroupEl.classList.toggle("hidden", currentLines.length === 0);
    if (currentLines.length === 0) {
      quotationNameEl.textContent = "";
      quotationSlidesEl.innerHTML = "";
    }
  } else if (view === "book") {
    bookSidebarEl.style.display = "grid";
    navGroupEl.classList.remove("hidden");
    if (!bookSurahsLoaded) loadBookSurahs();
    history.replaceState(null, "", "?list=book");
  } else if (view === "webcam") {
    webcamViewEl.classList.add("active");
    navGroupEl.classList.add("hidden");
    quotationNameEl.textContent = "";
    startWebcam();
  } else if (view === "background") {
    navGroupEl.classList.add("hidden");
    quotationNameEl.textContent = "";
    loadBackground();
  }

  if (view === "webcam" || view === "background") {
    history.replaceState(null, "", "?view=" + view);
  } else if (view === "quotation") {
    if (currentFolder && currentLines.length > 0) {
      const params = new URLSearchParams();
      params.set("name", currentFolder);
      params.set("id", currentSlide + 1);
      history.replaceState(null, "", "?" + params.toString());
    } else {
      history.replaceState(null, "", window.location.pathname);
    }
  } else if (view === "book") {
    if (currentSurah) {
      const params = new URLSearchParams();
      params.set("book", currentSurah);
      const hasBismillah = currentLines[0]?.isBismillah;
      params.set("id", hasBismillah ? currentSlide : currentSlide + 1);
      history.replaceState(null, "", "?" + params.toString());
    } else {
      history.replaceState(null, "", "?list=book");
    }
  } else {
    history.replaceState(null, "", window.location.pathname);
  }

  updateFontSizeBtns();
}


/* =================================================
   QUOTATION SLIDE LOGIC
================================================= */


function flyOutText(el) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const clone = el.cloneNode(true);
  clone.style.position = "fixed";
  clone.style.left = rect.left + "px";
  clone.style.top = rect.top + "px";
  clone.style.width = rect.width + "px";
  clone.style.margin = "0";
  clone.classList.add("text-leaving");
  document.body.appendChild(clone);
  clone.addEventListener("animationend", () => clone.remove(), { once: true });
}

function prepareTextTransition(container) {
  flyOutText(container.querySelector(".arabic-line"));
  flyOutText(container.querySelector(".persian-line"));
}

function markTextEntering(container) {
  for (const el of container.querySelectorAll(".arabic-line, .persian-line")) {
    el.classList.add("text-entering");
    el.addEventListener("animationend", () => el.classList.remove("text-entering"), { once: true });
  }
}

function createSlideHTML(line) {
  return `
    <div class="slide">
      ${line.m ? `<div class="meta-line">${line.m}</div>` : ""}
      ${line.ar ? `<div class="arabic-line">${line.ar.replace(/\n/g, "<br>")}</div>` : ""}
      ${line.fa ? `<div class="persian-line">${line.fa.replace(/\n/g, "<br>")}</div>` : ""}
    </div>
  `;
}

function showSlide(index, updateURL = true, fromSlider = false) {
  if (!currentLines.length) return;
  if (!fromSlider && slideSlider) slideSlider.blur();

  index = Math.max(0, Math.min(index, currentLines.length - 1));
  currentSlide = index;

  if (currentView === "quotation") {
    prepareTextTransition(quotationSlidesEl);
    quotationSlidesEl.innerHTML = createSlideHTML(currentLines[index]);
    markTextEntering(quotationSlidesEl);
  } else if (currentView === "book") {
    showBookVerse(index);
  }

  updateNavUI();

  if (updateURL && currentFolder && currentView === "quotation") {
    const params = new URLSearchParams();
    params.set("name", currentFolder);
    params.set("id", index + 1);
    history.replaceState(null, "", "?" + params.toString());
  }

  if (updateURL && currentView === "book" && currentSurah) {
    const params = new URLSearchParams();
    params.set("book", currentSurah);
    const hasBismillah = currentLines[0]?.isBismillah;
    params.set("id", hasBismillah ? index : index + 1);
    history.replaceState(null, "", "?" + params.toString());
  }
}

function updateNavUI() {
  const hasBismillah = currentLines.length > 0 && currentLines[0]?.isBismillah;
  const displayNum   = hasBismillah ? currentSlide : currentSlide + 1;
  const displayTotal = hasBismillah ? currentLines.length - 1 : currentLines.length;
  if (slideCounter)
    slideCounter.textContent = `${toFaDigits(displayNum)} / ${toFaDigits(displayTotal)}`;
  if (slideSlider)
    slideSlider.value = currentSlide + 1;
  if (prevBtn) prevBtn.disabled = currentSlide === 0;
  if (nextBtn) nextBtn.disabled = currentSlide === currentLines.length - 1;
}

async function displayQuotation(folder, slideIndex = 0) {
  currentFolder = folder;
  currentView = "quotation";

  quotationListEl.style.display   = "none";
  bookSidebarEl.style.display = "none";
  quotationSlidesEl.classList.add("active");
  bookViewEl.classList.remove("active");
  webcamViewEl.classList.remove("active");
  stopWebcam();

  const quotationJson = await fetchJSON(`${dbFolder}/${folder}.json`);
  if (!quotationJson) return;

  quotationNameEl.textContent = quotationJson.name_fa || quotationJson.uid;
  currentLines = [...(quotationJson.content || []), CREDIT_SLIDE];

  if (slideSlider) {
    slideSlider.min   = 1;
    slideSlider.max   = currentLines.length;
    slideSlider.value = slideIndex + 1;
  }

  navGroupEl.classList.remove("hidden");
  homeBtn.classList.add("active-view");
  updateFontSizeBtns();
  showSlide(Math.max(0, slideIndex), true);
}

async function loadQuotationList() {
  const folders = await fetchJSON(manifestFile);
  if (!folders || !Array.isArray(folders)) return;

  folders.sort((a, b) => (a.name_fa || a.uid).localeCompare(b.name_fa || b.uid, "fa"));

  quotationListEl.innerHTML = "";
  for (const item of folders) {
    const btn = document.createElement("button");
    btn.textContent = item.name_fa || item.uid;
    btn.onclick = () => displayQuotation(item.uid, 0);
    quotationListEl.appendChild(btn);
  }
}

function goHome() {
  currentLines  = [];
  currentSlide  = 0;
  currentFolder = "";
  showView("quotation");
  history.replaceState(null, "", window.location.pathname);
}


/* =================================================
   BOOK READER
================================================= */

async function loadBookSurahs() {
  bookViewEl.innerHTML = `<div class="book-loading">در حال بارگذاری فهرست سور...</div>`;
  quotationNameEl.textContent = "";
  navGroupEl.classList.add("hidden");
  updateFontSizeBtns();

  const data = await fetchJSON("db/book/manifest.json");
  if (!data || !Array.isArray(data)) {
    bookViewEl.innerHTML = `<div class="book-loading">خطا در بارگذاری</div>`;
    return;
  }

  bookSurahs = data;
  bookSurahsLoaded = true;

  bookSidebarEl.innerHTML = "";
  for (const s of bookSurahs) {
    const btn = document.createElement("button");
    btn.innerHTML = `
      <span class="surah-num">${toFaDigits(s.id)}</span>
      <span class="surah-arabic">${s.name_arabic}</span>
    `;
    btn.onclick = () => loadBookSurah(s.id);
    bookSidebarEl.appendChild(btn);
  }

  bookViewEl.innerHTML = "";
}

async function loadBookSurah(surahNum, updateURL = true) {
  currentSurah = surahNum;
  stopAudio();
  bookSidebarEl.style.display = "none";
  bookViewEl.classList.add("active");

  const surah = bookSurahs.find(s => s.id === surahNum);
  quotationNameEl.textContent = surah ? `${toFaDigits(surah.id)}. ${surah.name_arabic}` : "";

  bookViewEl.innerHTML = `<div class="book-loading">در حال بارگذاری...</div>`;

  const pad = String(surahNum).padStart(3, "0");
  const data = await fetchJSON(`db/book/${pad}.json`);

  if (!data || !Array.isArray(data)) {
    bookViewEl.innerHTML = `<div class="book-loading">خطا در بارگذاری آیات</div>`;
    return;
  }

  const verses = data.map(v => ({
    key: `${surahNum}:${v.ayah}`,
    ar: v.ar,
    fa: v.fa,
    surah: surahNum,
    ayah: v.ayah
  }));

  const needsBismillah = surahNum !== 1 && surahNum !== 9;
  bookVerses = needsBismillah
    ? [{ ar: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", fa: "به نام خداوند بخشنده و مهربان", isBismillah: true, surah: surahNum, ayah: 0 }, ...verses]
    : [...verses];
  currentLines = bookVerses;
  currentSlide = 0;

  if (slideSlider) {
    slideSlider.min   = 1;
    slideSlider.max   = currentLines.length;
    slideSlider.value = 1;
  }

  navGroupEl.classList.remove("hidden");
  updateFontSizeBtns();
  showSlide(0, updateURL);
  updateNavUI();
}

function showBookVerse(index) {
  if (!bookVerses.length) return;
  index = Math.max(0, Math.min(index, bookVerses.length - 1));
  currentSlide = index;

  const v = bookVerses[index];
  const wasAutoPlaying = isAutoPlaying;
  stopAudio();

  prepareTextTransition(bookViewEl);
  bookViewEl.innerHTML = `
    <div class="slide">
      <div class="arabic-line">${v.ar}</div>
      <div class="persian-line">${v.fa}</div>
    </div>
  `;
  markTextEntering(bookViewEl);

  audioPlayBtn.onclick = () => toggleVerseAudio(v.surah, v.ayah);
  updateFontSizeBtns();

  if (wasAutoPlaying) {
    isAutoPlaying = true;
    playVerseAudio(v.surah, v.ayah);
  }
}

function getAudioUrl(surah, ayah) {
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `${AUDIO_BASE}${s}${a}.mp3`;
}

function toggleVerseAudio(surah, ayah) {
  if (currentAudio && !currentAudio.paused) {
    stopAudio();
    return;
  }
  isAutoPlaying = true;
  playVerseAudio(surah, ayah);
}

function playVerseAudio(surah, ayah) {
  if (currentAudio) { currentAudio.onended = null; currentAudio.pause(); currentAudio = null; }
  currentAudio = new Audio(getAudioUrl(surah, ayah));
  currentAudio.play();
  audioPlayBtn.textContent = "⏸";
  currentAudio.onended = () => {
    const next = currentSlide + 1;
    if (isAutoPlaying && next < bookVerses.length) {
      autoPlayTimer = setTimeout(() => showSlide(next), 1000);
    } else {
      isAutoPlaying = false;
      audioPlayBtn.textContent = "▷";
    }
  };
}

function stopAudio() {
  clearTimeout(autoPlayTimer);
  isAutoPlaying = false;
  if (currentAudio) { currentAudio.onended = null; currentAudio.pause(); currentAudio = null; }
  audioPlayBtn.textContent = "▷";
}


/* =================================================
   WEBCAM
================================================= */

async function startWebcam() {
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    webcamFeedEl.srcObject = webcamStream;
  } catch (e) {
    webcamViewEl.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55)"><span style="color:#fff;font-family:SamimV1;font-size:22px">دسترسی به دوربین ممکن نبود</span></div>`;
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
   CALENDAR + CALL TIME
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

const CALL_TIME_KEYS = {
  Fajr: "فجر", Sunrise: "طلوع", Dhuhr: "ظهر",
  Sunset: "غروب", Maghrib: "مغرب"
};

async function loadCalendarCallTime() {
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

  // City + Call Time
  const cd = getCityData();
  cityDisplayEl.textContent = cd.label || cd.city;

  try {
    const callTimeRes = await fetch(`${ALADHAN_API}/timingsByCity?city=${encodeURIComponent(cd.city)}&country=${encodeURIComponent(cd.country)}&method=7`);
    const callTimeData = await callTimeRes.json();
    const timings = callTimeData?.data?.timings;
    if (timings) {
      cachedCallTimes = Object.entries(CALL_TIME_KEYS)
        .filter(([key]) => timings[key])
        .map(([key, label]) => {
          const timeStr = timings[key].replace(/\s*\(.*\)/, '').trim();
          const [h, m] = timeStr.split(':').map(Number);
          return { label, timeStr, mins: h * 60 + m };
        });
      renderCallTime();
    }
  } catch { callTimesEl.textContent = "—"; }

  // Load background after we have Hijri
  loadBackground();
}

function toggleCalendar() {
  calendarVisible = !calendarVisible;
  calBlock.classList.toggle("visible", calendarVisible);
  btnCalendar.classList.toggle("active-view", calendarVisible);
  if (calendarVisible && calHijriEl.textContent === "—") loadCalendarCallTime();
}


/* =================================================
   BACKGROUND
================================================= */

async function loadBackground() {
  const manifest = await fetchJSON(`assets/media/background/backgrounds.json`);
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

function updateFontSizeBtns() {
  const quotationListOpen = quotationListEl.style.display !== "none";
  const bookListOpen   = bookSidebarEl.style.display !== "none";

  const show = (currentView === "quotation" && currentLines.length > 0  && !quotationListOpen) ||
               (currentView === "book"      && bookVerses.length > 0   && !bookListOpen);
  const isBookContent = currentView === "book" && bookVerses.length > 0 && !bookListOpen;

  persianPlusBtn.classList.toggle("hidden", !show);
  persianMinusBtn.classList.toggle("hidden", !show);
  audioPlayBtn.classList.toggle("hidden", !isBookContent);
  controlsCenterEl.style.display = show ? "" : "none";
}

function renderCallTime() {
  if (!cachedCallTimes.length) return;
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const upcoming = cachedCallTimes.filter(a => a.mins > nowMins);
  const next1 = upcoming.length ? upcoming[0] : cachedCallTimes[0];
  callTimesEl.innerHTML = `<span class="call-time-item">${next1.label} ${toFaDigits(next1.timeStr)}</span>`;
}

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  currentTimeEl.textContent = toFaDigits(`${h}:${m}`);
  renderCallTime();
}

function toggleContrast() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("dark-mode", isDarkMode);
  const params = new URLSearchParams(window.location.search);
  if (isDarkMode) params.set("dark", "1");
  else params.delete("dark");
  const qs = params.toString();
  history.replaceState(null, "", qs ? "?" + qs : window.location.pathname);
}

function getPersianFontSize() {
  if (persianFontSize === null) {
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue("--persian-font-size").trim();
    persianFontSize = parseFloat(val) || 20;
  }
  return persianFontSize;
}

function setPersianFontSize(size) {
  persianFontSize = Math.max(10, Math.min(60, size));
  document.documentElement.style.setProperty("--persian-font-size", persianFontSize + "px");
}


/* =================================================
   KEYBOARD CONTROLS
================================================= */

function dismissOverlays() {
  quotationListEl.style.display = "none";
  bookSidebarEl.style.display = "none";
  // Restore the content view that was showing before the list opened
  if (currentView === "quotation" && currentLines.length > 0) {
    quotationSlidesEl.classList.add("active");
  } else if (currentView === "book" && currentSurah) {
    bookViewEl.classList.add("active");
  }
  // Restore content URL or clear
  if (currentView === "quotation" && currentFolder) {
    // showSlide already set the quotation URL — leave it
  } else if (currentView === "book" && currentSurah) {
    // showSlide already set the book URL — leave it
  } else {
    history.replaceState(null, "", window.location.pathname);
  }
  updateFontSizeBtns();
}



document.addEventListener("keydown", (e) => {
  if (e.target === cityInputEl) return;

  if (e.key === "Escape") {
    if (quotationListEl.style.display !== "none" || bookSidebarEl.style.display !== "none") {
      dismissOverlays();
    } else {
      goHome();
    }
    return;
  }
  if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "PageDown" || e.key === " " || e.key === "Enter") {
    if (currentLines.length) showSlide(currentSlide + 1);
  }
  if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "PageUp") {
    if (currentLines.length) showSlide(currentSlide - 1);
  }
  if (e.key === "Home") goHome();
});


/* =================================================
   MUSIC PLAYER
================================================= */

async function loadMusicPlaylist() {
  if (musicLoaded) return;
  const data = await fetchJSON("assets/media/music/playlist.json");
  if (data && Array.isArray(data)) musicPlaylist = data.filter(Boolean);
  musicLoaded = true;
}

function pickMusicIndex() {
  if (musicPlaylist.length === 1) return 0;
  let idx;
  do { idx = Math.floor(Math.random() * musicPlaylist.length); }
  while (idx === lastMusicIndex);
  return idx;
}

function playNextTrack() {
  if (!musicPlaylist.length) return;
  lastMusicIndex = pickMusicIndex();
  const src = `assets/media/music/${musicPlaylist[lastMusicIndex]}`;
  if (musicAudio) { musicAudio.onended = null; musicAudio.pause(); }
  musicAudio = new Audio(src);
  musicAudio.volume = 0.35;
  musicAudio.play().catch(() => {});
  musicAudio.onended = playNextTrack;
}

async function toggleMusic() {
  await loadMusicPlaylist();
  if (!musicPlaylist.length) return;

  if (musicAudio && !musicAudio.paused) {
    musicAudio.pause();
    btnMusic.classList.remove("active-view");
  } else {
    if (musicAudio && musicAudio.src) {
      musicAudio.play().catch(() => {});
    } else {
      playNextTrack();
    }
    btnMusic.classList.add("active-view");
  }
}


/* =================================================
   WIRE CONTROLS
================================================= */

prevBtn.onclick   = () => showSlide(currentSlide - 1);
nextBtn.onclick   = () => showSlide(currentSlide + 1);
homeBtn.onclick = () => {
  if (quotationListEl.style.display !== "none") {
    dismissOverlays();
  } else {
    if (currentView !== "quotation") showView("quotation");
    quotationNameEl.textContent = "";
    quotationSlidesEl.classList.remove("active");
    bookViewEl.classList.remove("active");
    quotationListEl.style.display = "grid";
    history.replaceState(null, "", "?list=quotation");
    updateFontSizeBtns();
  }
};
btnBook.onclick = () => {
  if (bookSidebarEl.style.display !== "none") {
    dismissOverlays();
  } else {
    stopAudio();
    if (currentView !== "book") showView("book");
    quotationNameEl.textContent = "";
    quotationSlidesEl.classList.remove("active");
    bookViewEl.classList.remove("active");
    bookSidebarEl.style.display = "grid";
    history.replaceState(null, "", "?list=book");
    updateFontSizeBtns();
  }
};
btnCamera.onclick = () => {
  if (currentView === "webcam") showView(previousView);
  else showView("webcam");
};

btnHomeLink.onclick   = goHome;

btnBackground.onclick = toggleBackground;
btnCalendar.onclick   = toggleCalendar;
btnMusic.onclick      = toggleMusic;
contrastBtn.onclick   = toggleContrast;

btnFullscreen.onclick = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};
document.addEventListener("fullscreenchange", () => {
  btnFullscreen.textContent = document.fullscreenElement ? "⊡" : "⛶";
});
persianPlusBtn.onclick  = () => setPersianFontSize(getPersianFontSize() + 2);
persianMinusBtn.onclick = () => setPersianFontSize(getPersianFontSize() - 2);

slideSlider.addEventListener("input", () => {
  showSlide(Number(slideSlider.value) - 1, true, true);
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
  callTimesEl.innerHTML = "...";
  loadCalendarCallTime();
};

cityInputEl.addEventListener("keydown", e => {
  if (e.key === "Enter") citySaveBtn.click();
  if (e.key === "Escape") cityEditRow.style.display = "none";
});


/* =================================================
   INIT
================================================= */

async function init() {
  updateClock();
  setInterval(updateClock, 60000);

  await loadQuotationList();

  const params     = new URLSearchParams(window.location.search);
  const nameParam  = params.get("name");
  const bookParam  = parseInt(params.get("book"), 10);
  const idRaw      = params.get("id");
  const idParam    = idRaw !== null ? parseInt(idRaw, 10) : null;
  const listParam  = params.get("list");
  const viewParam  = params.get("view");

  if (params.get("dark") === "1") {
    isDarkMode = true;
    document.body.classList.add("dark-mode");
  }

  if (nameParam) {
    const folders   = await fetchJSON(manifestFile) || [];
    const validUids = folders.map(f => f.uid);
    if (validUids.includes(nameParam)) {
      await displayQuotation(nameParam, idParam !== null ? idParam - 1 : 0);
      return;
    }
  }

  if (bookParam) {
    currentView = "book";
    previousView = "quotation";
    quotationSlidesEl.classList.remove("active");
    bookViewEl.classList.add("active");
    quotationListEl.style.display = "none";
    bookSidebarEl.style.display = "none";
    btnBook.classList.add("active-view");
    bgLayerEl.style.opacity = "0.45";
    updateFontSizeBtns();
    await loadBookSurahs();
    await loadBookSurah(bookParam, false);
    const hasBismillahInit = bookVerses[0]?.isBismillah;
    const slideIndex = idParam !== null ? (hasBismillahInit ? idParam : idParam - 1) : 0;
    showSlide(Math.max(0, slideIndex), true);
    return;
  }

  if (listParam === "quotation") {
    showView("quotation");
    quotationListEl.style.display = "grid";
    updateFontSizeBtns();
    return;
  }

  if (listParam === "book") {
    await loadBookSurahs();
    showView("book");
    updateFontSizeBtns();
    return;
  }

  if (viewParam === "webcam" || viewParam === "background") {
    showView(viewParam);
    return;
  }

  showView("quotation");
}

init();
