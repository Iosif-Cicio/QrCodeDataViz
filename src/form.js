// ---------------------------------------------------------------------------
// The "Add a dot" modal: name, country (picked from the GeoJSON names), an
// optional city (autocompleted + dotted on its real coordinates), and a tweet.
// onSubmit receives a ready-to-use post: { name, country, city, lat, lng, text }.
// Later this is where a Supabase insert goes.
// ---------------------------------------------------------------------------

import { countryList, resolveCountry, citySuggestions, findCity } from "./geo.js";

export function setupForm(onSubmit) {
    const modal = document.getElementById("modal");
    const form = document.getElementById("add-form");
    const nameEl = document.getElementById("f-name");
    const countryEl = document.getElementById("f-country");
    const countryErr = document.getElementById("f-country-err");
    const cityEl = document.getElementById("f-city");
    const cityListEl = document.getElementById("city-list");
    const textEl = document.getElementById("f-text");
    const textCount = document.getElementById("f-text-count");
    const countryListEl = document.getElementById("country-list");

    // fill the country datalist once
    countryListEl.innerHTML = countryList
        .map((c) => `<option value="${c.name}"></option>`)
        .join("");

    function open() {
        modal.hidden = false;
        setTimeout(() => nameEl.focus(), 50);
    }
    function close() {
        modal.hidden = true;
    }

    // close on backdrop / x
    modal.querySelectorAll("[data-close]").forEach((el) =>
        el.addEventListener("click", close)
    );

    // live char counter
    textEl.addEventListener("input", () => {
        textCount.textContent = String(textEl.value.length);
    });

    // when a valid country is set, enable + populate the city field
    function refreshCity() {
        const country = resolveCountry(countryEl.value);
        if (country) {
            countryErr.hidden = true;
            cityEl.disabled = false;
            cityEl.placeholder = "Start typing… (optional)";
            cityListEl.innerHTML = citySuggestions(country.iso2, cityEl.value)
                .map((n) => `<option value="${n}"></option>`)
                .join("");
        } else {
            cityEl.disabled = true;
            cityEl.value = "";
            cityEl.placeholder = "Pick your country first";
            cityListEl.innerHTML = "";
        }
    }
    countryEl.addEventListener("input", refreshCity);
    cityEl.addEventListener("input", refreshCity);

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const country = resolveCountry(countryEl.value);
        if (!country) {
            countryErr.hidden = false;
            countryEl.focus();
            return;
        }
        const name = nameEl.value.trim();
        const text = textEl.value.trim();
        if (!name || !text) return;

        // city coords if we recognise it, else the country centroid
        const cityName = cityEl.value.trim();
        const cityHit = cityName ? findCity(country.iso2, cityName) : null;
        const lat = cityHit ? cityHit.lat : country.lat;
        const lng = cityHit ? cityHit.lng : country.lng;

        onSubmit({ name, country: country.name, city: cityName || null, lat, lng, text });

        form.reset();
        textCount.textContent = "0";
        refreshCity();
        close();
    });

    return { open, close };
}