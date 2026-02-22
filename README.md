# Multiboard Label Generator Clone (Local)

A local, web-based Multiboard-style label generator with 2D exports (SVG/PNG) and direct **3D STL export for Bambu Studio**.

## Features

- Custom label text input
- Starter hardware icon set (screw, bolt, nut, washer)
- Optional icon upload (SVG/PNG for preview, SVG for 3D icon geometry)
- Label size presets (small/medium/large in mm)
- Layout controls:
  - font size
  - icon size
  - icon position (left/right/top)
  - padding
- Relief mode:
  - **Emboss** (raised text/icon)
  - **Deboss** (engraved text/icon)
- Export:
  - SVG (vector)
  - PNG (raster)
  - **STL (Bambu-ready 3D mesh)**

## Bambu Studio workflow (exact steps)

1. Open the app and design your label.
2. Set **Text/Icon mode** to `Emboss` or `Deboss`.
3. Click **Export STL (Bambu)**.
4. In Bambu Studio:
   - `File -> Import -> Import STL`
   - Select the downloaded file (e.g. `multiboard-label-emboss.stl`)
   - Keep scale at 100%
   - Slice/print normally

Notes:
- Generated STL is in millimeter scale and includes base plate + text geometry.
- Icon geometry in STL requires an SVG icon source.
- If you pick/upload PNG, preview still works; STL export will include base+text but skip PNG icon geometry.

## Project structure

- `src/` — app UI and generator logic
- `public/icons/` — bundled starter icon set
- `docs/research.md` — notes on original tool behavior and inferred workflow

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Build

```bash
npm run build
npm run preview
```

## Deploy (GitHub Pages)

This project is configured for GitHub Pages deployment via GitHub Actions.

- Expected live URL: https://stryxzilla.github.io/multiboard-label-generator-clone/
- Vite base path is set to `/multiboard-label-generator-clone/` in `vite.config.js`

## Verification status

- [x] `npm install` completes
- [x] `npm run build` succeeds
- [x] `npm run dev` starts
- [x] SVG export still works
- [x] PNG export still works
- [x] STL export added (base + text/icon geometry, emboss/deboss mode)
- [x] STL receives in-app mesh validation (STL parse + bounds checks)

> Robust mesh validation fallback used (STL parse/geometry checks) when Bambu Studio is not directly available in this environment.
