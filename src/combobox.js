// ---------------------------------------------------------------------------
// Tiny custom combobox, shared by the Add-quote form and the Quote Wall filters.
// Replaces <datalist>/<select> so the full list can always be reopened after a
// value is picked, with a round triangle toggle that flips up when open.
//
//   input      — the <input> inside a `.combo` wrapper
//   listEl     — the <ul class="combo-list"> that holds the options
//   getOptions — (query) => string[]  the options to show for the typed query
//   onPick     — optional; runs after a value is set (typed or picked)
// ---------------------------------------------------------------------------

export function combobox(input, listEl, getOptions, onPick) {
    const combo = input.parentElement; // the .combo wrapper

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
        listEl.innerHTML = items.map((o) => `<li role="option">${o}</li>`).join("");
        listEl.hidden = items.length === 0;
        combo.classList.toggle("open", !listEl.hidden);
    }
    const hide = () => {
        listEl.hidden = true;
        combo.classList.remove("open");
    };

    input.addEventListener("focus", () => render(""));
    input.addEventListener("input", () => {
        render(input.value);
        if (onPick) onPick();
    });
    listEl.addEventListener("mousedown", (e) => {
        const li = e.target.closest("li");
        if (!li) return;
        e.preventDefault();
        input.value = li.textContent;
        hide();
        if (onPick) onPick();
    });
    input.addEventListener("blur", () => setTimeout(hide, 150));

    toggle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        if (input.disabled) return;
        if (listEl.hidden) {
            input.focus();
            render("");
        } else {
            hide();
        }
    });

    return { hide, render };
}