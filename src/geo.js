// ---------------------------------------------------------------------------
// Country + city helpers.
//   - countryList: every country from the GeoJSON, with its ISO2 code and a
//     centroid (used as the dot position when no city is given).
//   - findCity: look up a city within a country (from the bundled cities.json)
//     so a chosen city dots on its real coordinates.
// ---------------------------------------------------------------------------

import * as d3 from "d3";
import countries from "./countries.geo.json";
import cities from "./cities.json"; // [{ n, c, lat, lng }] — c = ISO2

export const countryList = countries.features
    .map((f) => {
        const [lng, lat] = d3.geoCentroid(f);
        return { name: f.properties.name, iso2: f.properties.iso_a2, lng, lat };
    })
    .filter((c) => c.name)
    .sort((a, b) => a.name.localeCompare(b.name));

const byName = new Map(countryList.map((c) => [c.name.toLowerCase(), c]));

// Resolve a typed country string to a known country (exact, else case-insensitive).
export function resolveCountry(input) {
    if (!input) return null;
    return byName.get(input.trim().toLowerCase()) || null;
}

// Continent (region) for a country name — used by the Quote Wall region filter.
const continentByCountry = new Map(
    countries.features.map((f) => [f.properties.name, f.properties.continent])
);
export function continentOf(name) {
    return continentByCountry.get(name) || "Other";
}

// Cities grouped by ISO2 for quick per-country autocomplete.
const citiesByIso = new Map();
for (const city of cities) {
    if (!citiesByIso.has(city.c)) citiesByIso.set(city.c, []);
    citiesByIso.get(city.c).push(city);
}

// Up to `limit` city names in a country, optionally matching a typed prefix.
export function citySuggestions(iso2, query = "", limit = 40) {
    const list = citiesByIso.get(iso2) || [];
    const q = query.trim().toLowerCase();
    const out = [];
    for (const city of list) {
        if (!q || city.n.toLowerCase().includes(q)) {
            out.push(city.n);
            if (out.length >= limit) break;
        }
    }
    return out;
}

// Exact-ish city lookup within a country; returns { lat, lng } or null.
export function findCity(iso2, name) {
    if (!name) return null;
    const list = citiesByIso.get(iso2) || [];
    const target = name.trim().toLowerCase();
    const hit =
        list.find((c) => c.n.toLowerCase() === target) ||
        list.find((c) => c.n.toLowerCase().startsWith(target));
    return hit ? { lat: hit.lat, lng: hit.lng } : null;
}