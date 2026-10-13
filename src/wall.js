// ---------------------------------------------------------------------------
// The "Quote Wall" overlay: a masonry grid of every quote. Rebuilt from the
// live `posts` array each time it opens, so new submissions show up.
// ---------------------------------------------------------------------------

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
}

export function setupWall(posts) {
    const wall = document.getElementById("wall");
    const grid = document.getElementById("wall-grid");
    const countEl = document.getElementById("wall-count");

    function render() {
        grid.innerHTML = posts
            .map((p) => {
                const who = [p.name, p.country].filter(Boolean).join(" · ");
                return (
                    '<figure class="quote-card">' +
                    `<blockquote>\u201C${escapeHtml(p.text)}\u201D</blockquote>` +
                    `<figcaption>${escapeHtml(who)}</figcaption>` +
                    "</figure>"
                );
            })
            .join("");
        if (countEl) countEl.textContent = String(posts.length);
    }

    function open() {
        render();
        wall.hidden = false;
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

    return { open, close, render };
}