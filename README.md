# Trimly

**Crop any image, in a moment.** Free-form, standard ratios, rounded square, or a transparent circle for your profile picture, right in your browser.

**Ritaglia qualsiasi immagine, in un attimo.** Forma libera, proporzioni standard, quadrato arrotondato o cerchio trasparente per la foto profilo, direttamente nel browser.

- 🔒 **Private:** images never leave the device. There is no server and nothing is uploaded.
- 🖼️ **Any common format:** JPG, PNG, WebP, GIF, BMP, AVIF, SVG, ICO, **HEIC** (iPhone photos) and TIFF.
- ✂️ **Shapes:** free rectangle, 1:1 · 5:4 · 4:3 · 3:2 · 16:9 (and portrait versions), original or custom ratio, rounded square, circle. Outside the shape is transparent, or filled with a colour of your choice, with an optional border.
- 🔄 **Tools:** rotate 90°, straighten ±45°, flip, zoom and pinch, undo/redo, exact output size in pixels.
- 💾 **Export:** PNG, JPG or WebP, with a smart default, quality setting, live preview and file-size estimate. Download, copy, or share on phones.
- 📱 **Everywhere:** desktop and phone (touch, pinch, tabs), light/dark theme, Italian/English, installable PWA that works offline, WCAG 2.2 AA.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173. How to publish it: **[DEPLOY.md](DEPLOY.md)** (in Italian).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build into `dist/` (static files + `_headers`) |
| `npm run preview` | Serve `dist/` locally with the production security headers |
| `npm run check` | Type check + lint + unit tests (Vitest) |
| `npm run e2e` | End-to-end tests (Playwright: Chromium, WebKit, Firefox, Pixel 7, iPhone 15) |
| `npm run fixtures` | Regenerate test images (needs macOS `sips` and `cwebp`) |
| `npm run icons` / `og-image` / `licenses` | Regenerate PWA icons, social preview image, third-party licence notices |

## How it works

- **React + TypeScript + Vite.** No UI framework: design tokens in `src/styles/tokens.css`, CSS Modules per component.
- **Crop engine** (`src/lib/geometry.ts`): pure functions in "world" coordinates, with the origin at the image centre and 1 unit = 1 source pixel. The crop is always axis-aligned, and the image is rotated underneath it. The constraint "the crop stays inside the rotated image" is checked by mapping the crop's corners back into image space.
- **Editor state** (`src/state/editor.ts`): a reducer with undo/redo. A whole drag or slider movement is a single history step.
- **Rendering:** the same `drawWorldImage` function draws the on-screen stage and the exported file, so what you see is what you get (`src/lib/render.ts`, `src/lib/export.ts`).
- **Decoding** (`src/lib/decode.ts`): the format is detected from the file's bytes. HEIC (`heic-to`, WebAssembly) and TIFF (`utif2`) decoders are loaded only when needed. Images beyond the device's canvas limits (16.7 MP on iOS) are downscaled with a notice.

```
src/
  components/      UI: header, start screen, editor (stage, crop box, panels), UI kit
  hooks/           image loading, drag & drop, paste, export, theme, media queries
  i18n/            Italian and English dictionaries (type-checked to have the same keys)
  lib/             geometry, view math, decoding, rendering, export, limits
  state/           editor reducer + undo/redo
e2e/               Playwright tests + generated fixtures
docs/DESIGN.md     UX principles, wireframes, design tokens
TODO.md            Plan and development diary (in Italian)
```

## Third-party software

See [`public/third-party-licenses.txt`](public/third-party-licenses.txt), which is also published with the site. The HEIC decoder (heic-to / libheif) is LGPL-3.0 and is shipped unmodified, as a separate file.
