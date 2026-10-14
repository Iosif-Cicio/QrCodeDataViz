# Gänsdorf's World

An interactive 3D globe showing where **FH Gänsdorf** students are from. Scan the
poster's QR code → the globe opens on Europe, then loops through students: it
rotates to each one's country, zooms in, highlights it, and types out their
one-liner about the university.

> FH Gänsdorf is a fictional university invented for this Print2Mobile assignment
> (Masterklasse Mobile). The quotes are playful, parody student voices — not real
> testimonials.

## Features

- **Auto-playing globe** — orthographic D3 globe on a canvas; drag to spin it by hand.
- **Add a quote** — a form (name, country, optional city, one line) drops a new
  dot onto the globe and into the wall.
- **Quote Wall** — every quote as a tile grid, with filters by region (continent),
  by country, and a name search.
- **EN / DE** — full English / German language toggle.
- Mobile-first, built in the FH Gänsdorf blue.

Built with plain HTML/CSS/JS + [D3](https://d3js.org/) (orthographic globe on a
canvas), bundled by [Vite](https://vitejs.dev/).

Live: https://iosif-cicio.github.io/QrCodeDataViz/

## Run it

```bash
npm install
npm run dev
```

Vite prints a local URL (default `http://localhost:5173`). Open it in a browser.
Drag the globe to spin it by hand — handy for the live demo.

```bash
npm run build     # production build into dist/
npm run preview   # preview the production build
```
