# Research Notes: Multiboard Label Generator (Thangs)

Source target: https://thangs.com/designer/Multiboard/3d-model/Multiboard%20Label%20Generator-1135329

## What could be directly observed

From the public Thangs page metadata and page text:
- The item is named **Multiboard Label Generator**.
- Description states it is **"a Blender tool for easily creating labels with custom text and icons."**
- It links to a walkthrough video: `https://youtu.be/xf6I0PIXHL0`.
- It specifies Blender compatibility: **Blender 4.2+**.
- It appears membership-gated on Thangs ("Become a member to download").

## Access limitations encountered

- Direct unauthenticated HTML fetches were blocked by anti-bot/interstitial behavior (403 / "Just a moment").
- The downloadable Blender generator itself was not directly accessible without membership gating.
- Because of this, implementation below is **inferred from available description + normal label-generator workflow patterns**.

## Inferred original workflow (likely)

Based on the page description and naming:
1. User opens a Blender scene/add-on/script provided by Multiboard.
2. User edits text fields for label content.
3. User chooses icon(s) from a predefined icon set.
4. Tool composes geometry for a printable label suited to Multiboard bins.
5. User exports STL/3MF and prints.

## What this local clone replicates

This web clone intentionally mirrors the likely user-facing concept (not Blender internals):
- Custom label text input.
- Starter icon set including screws/bolts/nuts-style options.
- Optional custom icon upload (SVG/PNG).
- Label size presets and layout controls (font size, icon size, icon position, padding).
- Live visual preview.
- Printable exports (SVG + PNG).

## Known gaps vs likely original

- No direct Blender integration or mesh/STL generation.
- No exact parity with any proprietary Multiboard geometry, fonts, or icon library.
- No membership-gated content from original package included.
- Export is 2D printable artwork, not 3D model output.
