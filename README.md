# Multiboard Label Generator Clone

Practical, preset-first Multiboard label generator focused on reliable STL export for Bambu Studio.

## What ships now

- Preset-first sizing flow with **6 presets**:
  - Small (36 x 12 mm)
  - Medium (45 x 15 mm)
  - Large (60 x 20 mm)
  - MU 1.0 x 0.5 (25 x 12.5 mm)
  - MU 1.5 x 0.5 (37.5 x 12.5 mm)
  - MU 2.0 x 0.75 (50 x 18.75 mm)
- Optional **Advanced sizing** toggle for custom mm dimensions
- Hardware icon workflow (screw, bolt, nut, washer) with text + icon layout
- Export formats:
  - SVG
  - PNG
  - STL (mm scale, Bambu-friendly)

## STL reliability approach

- STL path uses **mm as canonical units**
- Geometry is generated directly (base + raised text + raised icon)
- In-app STL sanity check after generation (bounding box validation)
- Scripted verification in `scripts/verify-stl.mjs` for dimensions + mesh sanity

## Run locally

```bash
npm install
npm run dev
```

## Verify before shipping

```bash
npm run test
npm run build
```

## Bambu Studio export steps (exact)

1. Open app.
2. Pick a preset size.
3. Enter label text.
4. Pick a hardware icon (or upload SVG icon).
5. Click **Export STL (Bambu)**.
6. In Bambu Studio: `File -> Import -> Import STL`.
7. Keep scale at **100%** (mm-native model).
8. Slice and print.

## GitHub Pages

- Base path is configured for Pages in `vite.config.js`.
- Live URL after deploy: `https://stryxzilla.github.io/multiboard-label-generator-clone/`
