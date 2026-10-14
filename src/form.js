// ---------------------------------------------------------------------------
// The "Add a dot" modal: name, country (picked from the GeoJSON names), an
// optional city (autocompleted + dotted on its real coordinates), and a tweet.
// onSubmit receives a ready-to-use post: { name, country, city, lat, lng, text }.
//
// Country/city use a small custom combobox instead of <datalist>, because the
// native one filters by the field's value and won't reopen the full list once
// something is picked.
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

    // --- tiny custom combobox ---
    // getOptions(query) -> array of strings; onPick runs after a value is set.
    function combobox(input, listEl, getOptions, onPick) {
        const combo = input.parentElement; // the .combo wrapper

        // round toggle button with a triangle (CSS flips it up when open)
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "combo-toggle";
        toggle.setAttribute("aria-label", "Toggle list");
        toggle.innerHTML =
            '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">' +
            '<path d="M1 3 L9 3 L5 8 Z" fill="currentColor"/></svg>';
        combo.appendChild(toggle);

        function render(query) {
            const items = getOptions(query);
            listEl.innerHTML = items
                .map((o) => `<li role="option">${o}</li>`)
                .join("");
            listEl.hidden = items.length === 0;
            combo.classList.toggle("open", !listEl.hidden);
        }
        const hide = () => {
            listEl.hidden = true;
            combo.classList.remove("open");
        };

        input.addEventListener("focus", () => render(""));        // show the full list
        input.addEventListener("input", () => {
            render(input.value);
            if (onPick) onPick();
        });
        // mousedown (not click) so the value is set before the input's blur fires
        listEl.addEventListener("mousedown", (e) => {
            const li = e.target.closest("li");
            if (!li) return;
            e.preventDefault();
            input.value = li.textContent;
            hide();
            if (onPick) onPick();
        });
        input.addEventListener("blur", () => setTimeout(hide, 150));

        // caret button toggles the list open/closed
        toggle.addEventListener("mousedown", (e) => {
            e.preventDefault(); // don't steal focus / trigger the input blur
            if (input.disabled) return;
            if (listEl.hidden) {
                input.focus();
                render("");
            } else {
                hide();
            }
        });

        return { hide };
    }

    // Country: filter the GeoJSON names.
    const countryNames = countryList.map((c) => c.name);
    function countryOptions(query) {
        const q = query.trim().toLowerCase();
        const list = q
            ? countryNames.filter((n) => n.toLowerCase().includes(q))
            : countryNames;
        return list.slice(0, 80);
    }

    // City: depends on the chosen country.
    function cityOptions(query) {
        const country = resolveCountry(countryEl.value);
        return country ? citySuggestions(country.iso2, query) : [];
    }

    // Enable/disable the city field and set its placeholder based on the country.
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

    // live char counter + clear the error state as the user fixes things
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

        // mark any empty/invalid required field red; turn the "Required" note red+bold
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

    // re-apply language to the dynamic city placeholder
    function applyLang() {
        syncCity();
    }

    return { open, close, applyLang };
}