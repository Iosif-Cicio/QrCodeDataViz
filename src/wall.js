// ---------------------------------------------------------------------------
// The "Quote Wall" overlay: every quote as a flex-wrapped card grid that
// scrolls vertically. Filters by region (continent), by country (only the
// countries that actually appear), and a free-text name search. Region and
// country use the same custom combobox as the Add-quote form. Rebuilt from the
// live `posts` array each time it opens, so new submissions show up.
// ---------------------------------------------------------------------------

import { continentOf } from "./geo.js";
import { combobox } from "./combobox.js";
import { t } from "./translations.js";

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
}

export function setupWall(posts) {
    const wall = document.getElementById("wall");
    const grid = document.getElementById("wall-grid");
    const countEl = document.getElementById("wall-count");
    const regionEl = document.getElementById("wall-region");
    const regionListEl = document.getElementById("wall-region-list");
    const countryEl = document.getElementById("wall-country");
    const countryListEl = document.getElementById("wall-country-list");
    const searchEl = document.getElementById("wall-search");

    let region = "";
    let country = "";
    let query = "";

    const presentRegions = () =>
        [...new Set(posts.map((p) => continentOf(p.country)))].sort();
    const presentCountries = () =>
        [
            ...new Set(
                posts
                    .filter((p) => !region || continentOf(p.country) === region)
                    .map((p) => p.country)
            ),
        ].sort((a, b) => a.localeCompare(b));

    function regionOptions(q) {
        const query = q.trim().toLowerCase();
        return [t("allRegions"), ...presentRegions()].filter(
            (r) => !query || r.toLowerCase().includes(query)
        );
    }
    function countryOptions(q) {
        const query = q.trim().toLowerCase();
        return [t("allCountries"), ...presentCountries()].filter(
            (c) => !query || c.toLowerCase().includes(query)
        );
    }

    function resolveRegion() {
        const v = regionEl.value.trim().toLowerCase();
        if (!v || v === t("allRegions").toLowerCase()) return "";
        return presentRegions().find((r) => r.toLowerCase() === v) || "";
    }
    function resolveCountry() {
        const v = countryEl.value.trim().toLowerCase();
        if (!v || v === t("allCountries").toLowerCase()) return "";
        return presentCountries().find((c) => c.toLowerCase() === v) || "";
    }

    function matches(p) {
        if (region && continentOf(p.country) !== region) return false;
        if (country && p.country !== country) return false;
        if (query) {
            const hay = `${p.name || ""} ${p.country || ""}`.toLowerCase();
            if (!hay.includes(query)) return false;
        }
        return true;
    }

    function renderGrid() {
        const shown = posts.filter(matches);
        grid.innerHTML = shown
            .map((p, i) => {
                const who = [p.name, p.country].filter(Boolean).join(" · ");
                const cls = i === 0 ? "quote-card featured" : "quote-card";
                return (
                    `<figure class="${cls}">` +
                    `<blockquote>\u201C${escapeHtml(p.text)}\u201D</blockquote>` +
                    `<figcaption>${escapeHtml(who)}</figcaption>` +
                    "</figure>"
                );
            })
            .join("");
        if (countEl) countEl.textContent = String(shown.length);
    }

    combobox(regionEl, regionListEl, regionOptions, () => {
        const r = resolveRegion();
        if (r === region) return;
        region = r;
        if (country && region && continentOf(country) !== region) {
            country = "";
            countryEl.value = "";
        }
        renderGrid();
    });
    combobox(countryEl, countryListEl, countryOptions, () => {
        const c = resolveCountry();
        if (c === country) return;
        country = c;
        renderGrid();
    });
    searchEl.addEventListener("input", () => {
        query = searchEl.value.trim().toLowerCase();
        renderGrid();
    });

    function open() {
        region = country = query = "";
        regionEl.value = "";
        countryEl.value = "";
        searchEl.value = "";
        renderGrid();
        wall.hidden = false;
        grid.scrollTop = 0;
    }
    function close() {
        wall.hidden = true;
    }

    wall.querySelectorAll("[data-close]").forEach((el) =>
        el.addEventListener("click", close)
    );
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !wall.hidden) close();
    });

    function applyLang() {}

    return { open, close, render: renderGrid, applyLang };
}