// ---------------------------------------------------------------------------
// Wiring. Connects the globe, the DOM and the other modules together — this is
// the file that actually runs the page.
//
// builds the live `posts` list, renders the title/progress,
// handles the DE/EN toggle, types out each quote, and opens the add-form + wall.
//
// Key names:
//   posts          the live student list (seeds now, a backend later)
//   hooks          handed to the globe: onHeader fills the name/country,
//                  onArrive types the quote once the globe has arrived
//   renderProgress draws the row of dots (a sliding window, PAGE at a time)
//   typeText       the typewriter effect for the quote
//   applyLang      re-renders all text for the current language
//
// Bits to tweak:
//   PAGE           how many progress dots show at once (batch size)
//   typeText speed typing speed in ms per character
//   seed order     comes from posts.js (Iosif first = the opening story)
// ---------------------------------------------------------------------------

import { createGlobe } from "./globe.js";
import { posts as seedPosts } from "./posts.js";
import { setupForm } from "./form.js";
import { language, t } from "./translations.js";
import { setupWall } from "./wall.js";

// live, editable copy of the seeds (new submissions get pushed in here)
const posts = [...seedPosts];

// --- DOM refs ---
const canvas = document.getElementById("globe");
const titleEl = document.getElementById("title");
const postEl = document.getElementById("post");
const authorEl = document.getElementById("post-author");
const countryEl = document.getElementById("post-country");
const textEl = document.getElementById("post-text");
const progressEl = document.getElementById("progress");
const addBtn = document.getElementById("add-btn");
const wallBtn = document.getElementById("wall-btn");
const langEl = document.getElementById("lang");

// --- language (DE / EN) ---
function renderTitle() {
  // keep the live student count inside the translated title
  titleEl.innerHTML = t("title").replace(
      "{n}",
      `<span id="count">${posts.length}</span>`
  );
}

// re-translate every [data-t] / [data-t-ph] element for the current language
function applyLang() {
  renderTitle();
  document.querySelectorAll("[data-t]").forEach((el) => {
    el.textContent = t(el.dataset.t);
  });
  document.querySelectorAll("[data-t-ph]").forEach((el) => {
    el.setAttribute("placeholder", t(el.dataset.tPh));
  });
  if (form) form.applyLang();
}

function setLang(l) {
  language.lang = l;
  langEl.dataset.lang = l;   // CSS reads this to slide the knob
  langEl.querySelector(".lang-label.de").classList.toggle("active", l === "de");
  langEl.querySelector(".lang-label.en").classList.toggle("active", l === "en");
  document.documentElement.lang = l;
  applyLang();
}

langEl.querySelector(".lang-switch").addEventListener("click", () =>
    setLang(language.lang === "en" ? "de" : "en")
);
langEl.querySelector(".lang-label.de").addEventListener("click", () => setLang("de"));
langEl.querySelector(".lang-label.en").addEventListener("click", () => setLang("en"));

// --- typewriter: types `str` char by char, bails if the globe moved on ---
let typeTimer = null;
function typeText(str, el, isCurrent, speed = 28) {
  clearInterval(typeTimer);
  return new Promise((resolve) => {
    el.textContent = "";
    el.classList.add("typing");
    let i = 0;
    typeTimer = setInterval(() => {
      if (!isCurrent()) {   // navigated away mid-type — stop
        clearInterval(typeTimer);
        el.classList.remove("typing");
        return resolve();
      }
      el.textContent = str.slice(0, ++i);
      if (i >= str.length) {
        clearInterval(typeTimer);
        el.classList.remove("typing");
        resolve();
      }
    }, speed);
  });
}

// --- progress dots: a sliding window of PAGE dots, only the current one blue ---
const PAGE = 12;
let batchStart = 0;

function windowIndices() {
  const n = posts.length;
  const len = Math.min(PAGE, n);
  const out = [];
  for (let k = 0; k < len; k++) out.push((batchStart + k) % n);   // wrap at the end
  return out;
}

function renderProgress(activeIndex = -1) {
  progressEl.innerHTML = "";
  const n = posts.length;
  if (n === 0) return;

  let win = windowIndices();
  // active fell outside the window (advanced past it or jumped) -> start a fresh
  // window at the active post
  if (activeIndex >= 0 && !win.includes(activeIndex)) {
    batchStart = activeIndex;
    win = windowIndices();
  }

  win.forEach((gi) => {
    const b = document.createElement("button");
    b.className = "dot" + (gi === activeIndex ? " active" : "");
    b.type = "button";
    b.setAttribute("aria-label", `Story ${gi + 1}`);
    b.addEventListener("click", () => globe.jumpTo(gi));   // click a dot to jump
    progressEl.appendChild(b);
  });
}

const postHeadEl = document.querySelector(".post-head");

// --- globe hooks: the globe calls these at the two moments of each story ---
const hooks = {
  // before it moves: show the new name + country, clear the old quote
  onHeader(p, i) {
    clearInterval(typeTimer);
    postEl.hidden = false;
    postHeadEl.style.display = "flex";
    authorEl.textContent = p.name || "";
    countryEl.textContent = p.country;
    textEl.textContent = "";
    renderProgress(i);
  },
  // after it arrives: type the quote
  async onArrive(p, i, _token, isCurrent) {
    await typeText(p.text, textEl, isCurrent);
  },
};

const globe = createGlobe(canvas, posts, hooks);

// --- add-quote button: append the new quote, bump the count (no jump) ---
const form = setupForm((post) => {
  posts.push(post);
  renderTitle();
});
addBtn.addEventListener("click", form.open);

// --- quote-wall button ---
const wall = setupWall(posts);
wallBtn.addEventListener("click", wall.open);

// --- start ---
applyLang();
renderProgress(0);
globe.start();