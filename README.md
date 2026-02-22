# Multiboard Label Generator Clone (Local)

A local, web-based, inspired implementation of the Multiboard label generator workflow.

## Features

- Custom label text input
- Starter hardware icon set (screw, bolt, nut, washer)
- Optional icon upload (SVG/PNG)
- Label size presets (small/medium/large in mm)
- Layout controls:
  - font size
  - icon size
  - icon position (left/right/top)
  - padding
- Live preview
- Export:
  - SVG (vector, printable)
  - PNG (raster, printable)

## Project structure

- `src/` — app UI and generator logic
- `public/icons/` — bundled starter icon set
- `docs/research.md` — notes on original tool behavior and inferred workflow

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Deploy (GitHub Pages)

This project is configured for GitHub Pages deployment via GitHub Actions.

- Expected live URL: https://stryxzilla.github.io/multiboard-label-generator-clone/
- Vite base path is set to `/multiboard-label-generator-clone/` in `vite.config.js`


## Manual verification checklist

Verified on local machine:
- [x] `npm install` completes
- [x] `npm run build` succeeds
- [x] `npm run dev` starts with no startup errors
- [x] Text input updates preview
- [x] Icon picker changes icon in preview
- [x] Uploaded SVG/PNG icon appears in preview
- [x] Export SVG downloads successfully
- [x] Export PNG downloads successfully

> No tests were added; `npm run test` is not defined in this Vite template.

## Notes

This app is an independent local clone inspired by publicly visible behavior/description of the original listing. It does **not** include gated assets or Blender files from the original creator.
