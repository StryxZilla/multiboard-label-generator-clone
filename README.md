# Multiboard Label Generator Clone

Practical, mobile-first Multiboard label generator focused on reliable STL export for Bambu Studio.

## What ships now

- Preset-first sizing flow with **6 presets**:
  - Small (36 x 12 mm)
  - Medium (45 x 15 mm)
  - Large (60 x 20 mm)
  - MU 1.0 x 0.5 (25 x 12.5 mm)
  - MU 1.5 x 0.5 (37.5 x 12.5 mm)
  - MU 2.0 x 0.75 (50 x 18.75 mm)
- Simplified UX path: **preset → text → icon → export**
- Mobile-first responsive layout (touch-friendly controls, no clipping, clear export section)
- Built-in hardware icon library (**14 STL-compatible SVG icons + No icon**):
  - Screw, Bolt, Nut, Washer, Wing Nut
  - Hex Key, Wrench, Socket, Hammer, Drill Bit
  - Pliers, Tape Measure, Saw Blade, Clamp
- Optional **Advanced sizing** toggle for custom mm dimensions
- Export formats:
  - SVG
  - PNG
  - STL (mm scale, Bambu-friendly)

## STL reliability approach

- STL path uses **mm as canonical units**
- Geometry is generated directly (base + raised text + raised icon)
- Icon source is library SVG only, which keeps icon extrusion STL-safe
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
4. Pick a built-in hardware icon.
5. Click **Export STL (Bambu)**.
6. In Bambu Studio: `File -> Import -> Import STL`.
7. Keep scale at **100%** (mm-native model).
8. Slice and print.

## GitHub Pages

- Base path is configured for Pages in `vite.config.js`.
- Live URL after deploy: `https://stryxzilla.github.io/multiboard-label-generator-clone/`
