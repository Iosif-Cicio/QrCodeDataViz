// ---------------------------------------------------------------------------
// Wires the globe + DOM: live count, the post text (typewriter), the progress
// indicator, and the Add-a-dot form. New submissions are pushed into the live
// `posts` array and the globe jumps to them.
// ---------------------------------------------------------------------------

import { createGlobe } from "./globe.js";
import { posts as seedPosts } from "./posts.js";
import { setupForm } from "./form.js";

// live, mutable list (seeds now; Supabase + 100 defaults later)
const posts = [...seedPosts];

// --- DOM refs ---
const canvas = document.getElementById("globe");
const countEl = document.getElementById("count");
const postEl = document.getElementById("post");
const authorEl = document.getElementById("post-author");
const countryEl = document.getElementById("post-country");
const textEl = document.getElementById("post-text");
const progressEl = document.getElementById("progress");
const addBtn = document.getElementById("add-btn");

// --- live count in the title ---
function updateCount() {
  countEl.textContent = String(posts.length);
}

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

// --- globe hooks ---
const hooks = {
  async onArrive(p, i, _token, isCurrent) {
    postEl.hidden = false;
    authorEl.textContent = p.name || "";
    countryEl.textContent = p.country;
    renderProgress(i);
    await typeText(p.text, textEl, isCurrent);
  },
};

const globe = createGlobe(canvas, posts, hooks);

// --- Add-a-dot: push into the live list, then jump to show it off ---
const form = setupForm((post) => {
  posts.push(post);
  updateCount();
  globe.jumpTo(posts.length - 1); // the new dot becomes the next story
});
addBtn.addEventListener("click", form.open);

// --- go ---
updateCount();
renderProgress(0);
globe.start();