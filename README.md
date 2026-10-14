# FH Gänsendorf

<img width="3840" height="1919" alt="image" src="https://github.com/user-attachments/assets/8c445b2c-82cb-4fb2-b950-4049a3a9766d" />

An interactive 3D globe showing where **FH Gänsendorf** students are from. Scan the
poster's QR code → the globe opens on Europe, then loops through students: it
rotates to each one's country, zooms in, highlights it, and types out their
one-liner about the university.

> FH Gänsendorf is a purely fictional university invented for an university assignment.
> The quotes are playful, parody student voices, not real testimonials.

The inspiration for this project has been: https://www.anthropic.com/features/81k-interviews

## Features

- **Auto-playing globe** — orthographic D3 globe on a canvas; drag to spin it by hand.
- **Add a quote** — a form (name, country, optional city, one line) drops a new
  dot onto the globe and into the wall.
- **Quote Wall** — every quote as a tile grid, with filters by region (continent),
  by country, and a name search.
- **EN / DE** — full English / German language toggle.
- Mobile-first, built in the FH Gänsendorf blue.

Built with plain HTML/CSS/JS + [D3](https://d3js.org/) (orthographic globe on a
canvas), bundled by [Vite](https://vitejs.dev/).

Live: https://iosif-cicio.github.io/QrCodeDataViz/

## Run it

```bash
npm install
npm run dev
```

Vite prints a local URL (default `http://localhost:5173`). Open it in a browser.

```bash
npm run build     # production build into dist/
npm run preview   # preview the production build
```
