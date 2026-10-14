// ---------------------------------------------------------------------------
// The globe. A D3 orthographic (round) projection drawn on a <canvas>.
//
// What it does: shows every student as a dot. On playback it loops through them,
// rotating to each one's country, zooming in, glowing the country and enlarging
// that dot, while the DOM layer below types out the quote.
//
// Key names:
//   posts        LIVE array of students {name, country, lat, lng, text}. main.js
//                owns it and pushes new submissions in.
//   hooks        callbacks into the UI: onHeader(p,i) sets name+country,
//                onArrive(p,i,...) types the quote once the globe arrives.
//   activeIndex  which post is currently highlighted (-1 = none / travelling).
//   seq          a counter that cancels an older move when a new one starts.
//
// Bits to tweak:
//   HOLD_MS            how long each quote stays before advancing (ms)
//   HOME_ROTATE        the starting view ([lng, lat])
//   BASE_SCALE_FACTOR  globe size vs. screen (bigger = larger globe)
//   targetZoom         (in showPost) how far it zooms into each country
//   dotRadius()        dot size; auto-shrinks as more students are added
//   SENS               drag-to-spin sensitivity
// ---------------------------------------------------------------------------

import * as d3 from "d3";
import countries from "./data/countries.geo.json";

// pull the palette from the CSS tokens so JS and CSS never drift apart
const css = getComputedStyle(document.documentElement);
const COL = {
  ocean: css.getPropertyValue("--ocean").trim() || "#f1f6fb",
  country: css.getPropertyValue("--country").trim() || "#ffffff",
  line: css.getPropertyValue("--country-line").trim() || "#d6d2c8",
  dot: css.getPropertyValue("--dot").trim() || "#b9b4a8",
  dotActive: css.getPropertyValue("--dot-active").trim() || "#e0a526",
  accent: css.getPropertyValue("--accent").trim() || "#e0a526",
};

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const [AR, AG, AB] = hexToRgb(COL.accent);
const accentA = (a) => `rgba(${AR}, ${AG}, ${AB}, ${a})`;   // accent at any opacity

const HOLD_MS = 4200;

export function createGlobe(canvas, posts, hooks = {}) {
  const ctx = canvas.getContext("2d");

  let width, height, dpr;
  const projection = d3.geoOrthographic().center([0, 0]).clipAngle(90);
  const path = d3.geoPath(projection, ctx);

  const BASE_SCALE_FACTOR = 0.46;
  const HOME_ROTATE = [-12, -48];   // start facing Europe
  projection.rotate(HOME_ROTATE);

  let baseScale = 100;
  let zoom = 1;
  let activeCountry = null;

  // size the canvas to the screen (and to the device pixel ratio for sharpness)
  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    baseScale = Math.min(width, height) * BASE_SCALE_FACTOR;
    projection.translate([width / 2, height / 2]).scale(baseScale * zoom);
    draw();
  }

  // ----- drawing -----
  function draw() {
    if (!width) return;
    ctx.clearRect(0, 0, width, height);

    const r = projection.scale();

    // ocean disc
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, r, 0, 2 * Math.PI);
    ctx.fillStyle = COL.ocean;
    ctx.fill();

    // grid lines
    ctx.beginPath();
    path(d3.geoGraticule10());
    ctx.strokeStyle = COL.line;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // countries
    let activeFeature = null;
    countries.features.forEach((f) => {
      if (f.properties.name === activeCountry) activeFeature = f;
      ctx.beginPath();
      path(f);
      ctx.fillStyle = COL.country;
      ctx.fill();
      ctx.strokeStyle = COL.line;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    });

    if (activeFeature) drawCountryGlow(activeFeature);

    // student dots: grey ones first, then the active one on top (bigger), so it
    // never gets covered — canvas has no z-index, paint order is the layering
    const dotR = dotRadius();
    let activePt = null;
    posts.forEach((p, idx) => {
      if (!isVisible(p.lng, p.lat)) return;
      if (idx === activeIndex) {
        activePt = projection([p.lng, p.lat]);   // save it, paint last
        return;
      }
      const [x, y] = projection([p.lng, p.lat]);
      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, 2 * Math.PI);
      ctx.fillStyle = COL.dot;
      ctx.fill();
    });
    if (activePt) {
      const [x, y] = activePt;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(3, dotR + 1.5), 0, 2 * Math.PI);
      ctx.fillStyle = COL.dotActive;
      ctx.fill();
    }
  }

  // dot size shrinks as the student count grows (clamped): ~2.2px small, ~1 at 1000
  function dotRadius() {
    const n = posts.length || 1;
    return Math.max(1, Math.min(2.2, 6.4 / Math.pow(n, 0.3)));
  }

  // inner glow on the active country (Anthropic "81k" style)
  function drawCountryGlow(f) {
    ctx.save();
    ctx.beginPath();
    path(f);
    ctx.clip();

    ctx.beginPath();
    path(f);
    ctx.fillStyle = accentA(0.12);
    ctx.fill();

    ctx.beginPath();
    path(f);
    ctx.strokeStyle = accentA(0.55);
    ctx.lineWidth = 1.5;
    ctx.shadowColor = accentA(0.85);
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.stroke();

    ctx.restore();
  }

  // is this point on the near side of the globe (not behind it)?
  function isVisible(lng, lat) {
    const c = projection.rotate();
    return d3.geoDistance([lng, lat], [-c[0], -c[1]]) < Math.PI / 2;
  }

  // ----- animation: ease the globe to a rotation + zoom over `ms` -----
  function animateTo(targetRotate, targetZoom, ms = 1400) {
    return new Promise((resolve) => {
      const rInterp = d3.interpolate(projection.rotate(), targetRotate);
      const zInterp = d3.interpolate(zoom, targetZoom);
      const start = performance.now();
      function frame(now) {
        const t = Math.min((now - start) / ms, 1);
        const e = d3.easeCubicInOut(t);
        projection.rotate(rInterp(e));
        zoom = zInterp(e);
        projection.scale(baseScale * zoom);
        draw();
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  // ----- playback -----
  let running = false;
  let current = 0;
  let seq = 0;        // bumped on every move; an old move bails when it's stale
  let timer = null;
  let activeIndex = -1;

  async function showPost(i) {
    const token = ++seq;
    const p = posts[i];
    const targetZoom = 1.5;   // same zoom for every story

    // 1. header shows the new name + country, old quote cleared
    if (hooks.onHeader) hooks.onHeader(p, i);

    // un-highlight while the globe travels
    activeCountry = null;
    activeIndex = -1;

    // 2. fly to the country
    await animateTo([-p.lng, -p.lat], targetZoom, 1400);
    if (token !== seq) return;   // a newer move started — stop

    // 3. highlight the dot + glow the country
    activeCountry = p.country;
    activeIndex = i;
    draw();

    // 4. in position — type the quote
    if (hooks.onArrive) await hooks.onArrive(p, i, token, () => token === seq);
  }

  async function playFrom(i) {
    current = ((i % posts.length) + posts.length) % posts.length;   // wrap around
    await showPost(current);
    scheduleNext();
  }

  function scheduleNext() {
    clearTimeout(timer);
    if (!running) return;
    timer = setTimeout(() => playFrom(current + 1), HOLD_MS);
  }

  function start() {
    if (running) return;   // don't start a second loop
    running = true;
    playFrom(0);
  }

  function stop() {
    running = false;
    clearTimeout(timer);
    seq++;   // cancel any in-flight typing
  }

  // jump to a post (e.g. a progress dot click) and keep looping from there
  function jumpTo(i) {
    clearTimeout(timer);
    running = true;
    playFrom(i);
  }

  function isCurrent(token) {
    return token === seq;
  }

  // ----- drag to spin -----
  const SENS = 75;
  d3.select(canvas).call(
      d3.drag().on("drag", (e) => {
        const rot = projection.rotate();
        const k = SENS / projection.scale();
        projection.rotate([rot[0] + e.dx * k, rot[1] - e.dy * k]);
        draw();
      })
  );

  window.addEventListener("resize", resize);
  resize();

  return { start, stop, jumpTo, isCurrent, draw, get current() { return current; } };
}