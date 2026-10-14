// ---------------------------------------------------------------------------
// The add-quote bottom sheet. Collects name, country, an optional city and a
// 120-char quote, validates the required fields, then hands a ready-to-use post
// to onSubmit: { name, country, city, lat, lng, text }.
//
// Country and city use the shared combobox (see combobox.js). If a city is
// chosen the dot sits on its real coordinates, otherwise on the country centre.
//
// ---------------------------------------------------------------------------

import { countryList, resolveCountry, citySuggestions, findCity } from "./geo.js";
import { t } from "./translations.js";
import { combobox } from "./combobox.js";

export function setupForm(onSubmit) {
    const modal = document.getElementById("modal");
    const form = document.getElementById("add-form");
    const nameEl = document.getElementById("f-name");
    const countryEl = document.getElementById("f-country");
    const countryErr = document.getElementById("f-country-err");
    const countryListEl = document.getElementById("country-list");
    const cityEl = document.getElementById("f-city");
    const cityListEl = document.getElementById("city-list");
    const textEl = document.getElementById("f-text");
    const textCount = document.getElementById("f-text-count");
    const reqNote = document.getElementById("req-note");

    const required = [nameEl, countryEl, textEl];
    function clearError(el) {
        el.classList.remove("error");
        if (!required.some((f) => f.classList.contains("error"))) {
            reqNote.classList.remove("error");
        }
    }

    // country picker: filter the country names
    const countryNames = countryList.map((c) => c.name);
    function countryOptions(query) {
        const q = query.trim().toLowerCase();
        const list = q
            ? countryNames.filter((n) => n.toLowerCase().includes(q))
            : countryNames;
        return list.slice(0, 80);
    }

    // city picker: cities of the chosen country
    function cityOptions(query) {
        const country = resolveCountry(countryEl.value);
        return country ? citySuggestions(country.iso2, query) : [];
    }

    // enable the city field only once a valid country is picked
    function syncCity() {
        const country = resolveCountry(countryEl.value);
        if (country) {
            countryErr.hidden = true;
            clearError(countryEl);
            cityEl.disabled = false;
            cityEl.placeholder = t("cityEnabled");
        } else {
            cityEl.disabled = true;
            cityEl.value = "";
            cityEl.placeholder = t("cityDisabled");
        }
    }

    combobox(countryEl, countryListEl, countryOptions, syncCity);
    combobox(cityEl, cityListEl, cityOptions);

    // live char counter + clear errors as the user fixes fields
    textEl.addEventListener("input", () => {
        textCount.textContent = String(textEl.value.length);
        clearError(textEl);
    });
    nameEl.addEventListener("input", () => clearError(nameEl));
    countryEl.addEventListener("input", () => clearError(countryEl));

    function open() {
        modal.hidden = false;
        required.forEach((el) => el.classList.remove("error"));
        reqNote.classList.remove("error");
        setTimeout(() => nameEl.focus(), 50);
    }
    function close() {
        modal.hidden = true;
    }
    modal.querySelectorAll("[data-close]").forEach((el) =>
        el.addEventListener("click", close)
    );

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const country = resolveCountry(countryEl.value);
        const name = nameEl.value.trim();
        const text = textEl.value.trim();

        // flag any empty required field red; stop if there are any
        const invalid = [];
        if (!name) invalid.push(nameEl);
        if (!country) invalid.push(countryEl);
        if (!text) invalid.push(textEl);
        required.forEach((el) => el.classList.remove("error"));
        invalid.forEach((el) => el.classList.add("error"));
        reqNote.classList.toggle("error", invalid.length > 0);
        if (invalid.length) {
            invalid[0].focus();
            return;
        }

        // dot on the city if one was matched, otherwise the country centre
        const cityName = cityEl.value.trim();
        const cityHit = cityName ? findCity(country.iso2, cityName) : null;
        const lat = cityHit ? cityHit.lat : country.lat;
        const lng = cityHit ? cityHit.lng : country.lng;

        onSubmit({ name, country: country.name, city: cityName || null, lat, lng, text });

        form.reset();
        textCount.textContent = "0";
        syncCity();
        close();
    });

    // the city placeholder is dynamic, so re-run it on a language switch
    function applyLang() {
        syncCity();
    }

    return { open, close, applyLang };
}