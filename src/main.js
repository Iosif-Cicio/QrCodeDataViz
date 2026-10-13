// ---------------------------------------------------------------------------
// Wires the globe + DOM: language toggle, live count in the title, the post
// text (typewriter), the progress indicator, and the Add-a-dot form.
// ---------------------------------------------------------------------------

import { createGlobe } from "./globe.js";
import { posts as seedPosts } from "./posts.js";
import { setupForm } from "./form.js";
import { language, t } from "./translations.js";
import { setupWall } from "./wall.js";

// live, mutable list (seeds now; Supabase + 100 defaults later)
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

// --- i18n ---
function renderTitle() {
  // keep the live count inside the translated title
  titleEl.innerHTML = t("title").replace(
      "{n}",
      `<span id="count">${posts.length}</span>`
  );
}

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
  langEl.dataset.lang = l;
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

// --- typewriter (cancellable; bails if the globe moved on) ---
let typeTimer = null;
function typeText(str, el, isCurrent, speed = 28) {
  clearInterval(typeTimer);
  return new Promise((resolve) => {
    el.textContent = "";
    el.classList.add("typing");
    let i = 0;
    typeTimer = setInterval(() => {
      if (!isCurrent()) {
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

// --- progress indicator: dots when few, bar + counter when many ---
const DOT_LIMIT = 12;
function renderProgress(activeIndex = -1) {
  progressEl.innerHTML = "";
  if (posts.length <= DOT_LIMIT) {
    posts.forEach((_, i) => {
      const b = document.createElement("button");
      b.className = "dot" + (i === activeIndex ? " active" : "");
      b.type = "button";
      b.setAttribute("aria-label", `Story ${i + 1}`);
      b.addEventListener("click", () => globe.jumpTo(i));
      progressEl.appendChild(b);
    });
  } else {
    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("span");
    const pct = activeIndex < 0 ? 0 : ((activeIndex + 1) / posts.length) * 100;
    fill.style.width = pct + "%";
    bar.appendChild(fill);
    const counter = document.createElement("span");
    counter.className = "counter";
    counter.textContent = `${activeIndex + 1} / ${posts.length}`;
    progressEl.append(bar, counter);
  }
}

const postHeadEl = document.querySelector(".post-head");

// --- globe hooks ---
const hooks = {
  // BEFORE the globe moves: show the new name + country, clear the old message
  // (the blinking caret sits on the empty line while the globe travels)
  onHeader(p, i) {
    clearInterval(typeTimer);
    postEl.hidden = false;
    postHeadEl.style.display = "flex";
    authorEl.textContent = p.name || "";
    countryEl.textContent = p.country;
    textEl.textContent = "";
    renderProgress(i);
  },
  // AFTER arrival (dot highlighted): type the message
  async onArrive(p, i, _token, isCurrent) {
    await typeText(p.text, textEl, isCurrent);
  },
};

const globe = createGlobe(canvas, posts, hooks);

// -AddBtn
const form = setupForm((post) => {
  posts.push(post);
  renderTitle();
  globe.jumpTo(posts.length - 1); // the new dot becomes the next story
});
addBtn.addEventListener("click", form.open);

// -WallBtn
const wall = setupWall(posts);
wallBtn.addEventListener("click", wall.open);

// --- go ---
applyLang();
renderProgress(0);
globe.start();