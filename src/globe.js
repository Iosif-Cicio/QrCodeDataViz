// ---------------------------------------------------------------------------
// The globe. Canvas orthographic projection (adapted from the D3 example).
//
// Each post is a dot. When a post is active the globe rotates it to centre,
// its country glows (inner edge-glow, Anthropic "81k" style) and that country's
// dots turn gold; all other dots stay grey. The text itself is shown by the DOM
// layer below the globe (hooks.onArrive).
//
// `posts` is a LIVE array — main.js pushes new submissions into it and calls
// jumpTo(newIndex) so the new dot becomes the next story.
// ---------------------------------------------------------------------------

import * as d3 from "d3";
import countries from "./countries.geo.json";

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
const accentA = (a) => `rgba(${AR}, ${AG}, ${AB}, ${a})`;

const HOLD_MS = 4200; // how long each story holds before advancing

export function createGlobe(canvas, posts, hooks = {}) {
  const ctx = canvas.getContext("2d");

  let width, height, dpr;
  const projection = d3.geoOrthographic().center([0, 0]).clipAngle(90);
  const path = d3.geoPath(projection, ctx);

  const BASE_SCALE_FACTOR = 0.46;
  const HOME_ROTATE = [-12, -48]; // facing Europe
  projection.rotate(HOME_ROTATE);

  let baseScale = 100;
  let zoom = 1;
  let activeCountry = null;

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

    // globe disc (soft ocean)
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, r, 0, 2 * Math.PI);
    ctx.fillStyle = COL.ocean;
    ctx.fill();

    // graticule
    ctx.beginPath();
    path(d3.geoGraticule10());
    ctx.strokeStyle = COL.line;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // countries (white fill + faint border)
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

    // student dots
    posts.forEach((p, idx) => {
      if (!isVisible(p.lng, p.lat)) return;
      const [x, y] = projection([p.lng, p.lat]);
      const on = idx === activeIndex;
      ctx.beginPath();
      ctx.arc(x, y, on ? 3 : 2, 0, 2 * Math.PI);
      ctx.fillStyle = on ? COL.dotActive : COL.dot;
      ctx.fill();
    });
  }

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

  function isVisible(lng, lat) {
    const c = projection.rotate();
    return d3.geoDistance([lng, lat], [-c[0], -c[1]]) < Math.PI / 2;
  }

  // ----- animation -----
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
  let seq = 0;        // guards against overlapping transitions (e.g. a jump)
  let timer = null;
  let activeIndex = -1;

  async function showPost(i) {
    const token = ++seq;
    const p = posts[i];
    const targetZoom = 1.5; // same zoom for every story

    // 1. swap the header to the new author + country, clear the old message
    if (hooks.onHeader) hooks.onHeader(p, i);

    // un-highlight the previous dot / country while the globe travels
    activeCountry = null;
    activeIndex = -1;

    // 2. move to the new country
    await animateTo([-p.lng, -p.lat], targetZoom, 1400);
    if (token !== seq) return; // superseded by a newer navigation

    // 3. highlight the new dot + glow its country
    activeCountry = p.country;
    activeIndex = i;
    draw();

    // 4. now in position — type the message
    if (hooks.onArrive) await hooks.onArrive(p, i, token, () => token === seq);
  }

  async function playFrom(i) {
    current = ((i % posts.length) + posts.length) % posts.length;
    await showPost(current);
    scheduleNext();
  }

  function scheduleNext() {
    clearTimeout(timer);
    if (!running) return;
    timer = setTimeout(() => playFrom(current + 1), HOLD_MS);
  }

  function start() {
    if (running) return;
    running = true;
    playFrom(0);
  }

  function stop() {
    running = false;
    clearTimeout(timer);
    seq++; // cancel any in-flight typing
  }

  // jump to a post and keep the loop going from there
  function jumpTo(i) {
    clearTimeout(timer);
    running = true;
    playFrom(i);
  }

  // current token still valid? (for the typewriter to bail on a jump)
  function isCurrent(token) {
    return token === seq;
  }

  // ----- drag to spin (live demo) -----
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