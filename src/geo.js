// ---------------------------------------------------------------------------
// Country + city lookups. Backs the add-quote form (country/city pickers) and
// the Quote Wall region filter. Everything is read from two bundled files:
// countries.geo.json (shapes) and cities.json (city coordinates).
//
// Exports:
//   countryList       every country {name, iso2, lng, lat} — lat/lng is the
//                     country's centre, used as the dot when no city is given
//   resolveCountry    typed text -> a known country (or null)
//   continentOf       country name -> its continent (for the region filter)
//   citySuggestions   city-name autocomplete within a country
//   findCity          a city's real {lat, lng} within a country (or null)
// ---------------------------------------------------------------------------

import * as d3 from "d3";
import countries from "./data/countries.geo.json";
import cities from "./data/cities.json"; // [{ n, c, lat, lng }] — c = ISO2 code

export const countryList = countries.features
    .map((f) => {
        const [lng, lat] = d3.geoCentroid(f);
        return { name: f.properties.name, iso2: f.properties.iso_a2, lng, lat };
    })
    .filter((c) => c.name)
    .sort((a, b) => a.name.localeCompare(b.name));

const byName = new Map(countryList.map((c) => [c.name.toLowerCase(), c]));

export function resolveCountry(input) {
    if (!input) return null;
    return byName.get(input.trim().toLowerCase()) || null;
}

const continentByCountry = new Map(
    countries.features.map((f) => [f.properties.name, f.properties.continent])
);
export function continentOf(name) {
    return continentByCountry.get(name) || "Other";
}

// group cities by country so autocomplete only scans one country's list
const citiesByIso = new Map();
for (const city of cities) {
    if (!citiesByIso.has(city.c)) citiesByIso.set(city.c, []);
    citiesByIso.get(city.c).push(city);
}

// up to `limit` city names in a country, matching the typed text
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

// exact match first, else first city that starts with the text
export function findCity(iso2, name) {
    if (!name) return null;
    const list = citiesByIso.get(iso2) || [];
    const target = name.trim().toLowerCase();
    const hit =
        list.find((c) => c.n.toLowerCase() === target) ||
        list.find((c) => c.n.toLowerCase().startsWith(target));
    return hit ? { lat: hit.lat, lng: hit.lng } : null;
}