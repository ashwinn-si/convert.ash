# convert.ash — Project Guidelines

A **100% client-side** universal file converter (50+ formats) built with vanilla JavaScript and Vite. No backend, no file uploads — all processing happens in the browser via WASM and JS libraries.

## Build & Dev Commands

```bash
npm run dev      # Vite dev server with HMR (http://localhost:5173)
npm run build    # Production bundle → dist/
npm run preview  # Test production build locally
```

No test runner is configured. Manually verify conversions in the browser after changes.

## Architecture

```
src/app.js              # Main UI controller & orchestration (~550 lines)
src/main.js             # DOM-ready bootstrap — calls initApp()
src/converters/
  registry.js           # Routes conversions to the correct converter module
  document.js           # DOCX, PDF, TXT, MD, HTML, RTF, EPUB
  image.js              # JPG, PNG, GIF, HEIC, SVG, TIFF, ICO, BMP, WEBP
  spreadsheet.js        # XLSX, XLS, CSV, TSV, ODS
  media.js              # Audio & Video (WebAssembly FFmpeg)
  developer.js          # JSON, XML, YAML
src/utils/formatData.js # Format metadata: categories, MIME types, icons, detection
```

## Converter Pattern (critical — follow this when adding formats)

Every converter module exports exactly two functions:

```javascript
// Returns true if the from→to route is handled by this module
export function canConvert(from, to) {
  return `${from.toLowerCase()}→${to.toLowerCase()}` in CONVERSIONS;
}

// Performs the conversion; must return a Blob
export async function convert(file, from, to, onProgress) {
  const key = `${from.toLowerCase()}→${to.toLowerCase()}`;
  const fn = CONVERSIONS[key];
  if (!fn) throw new Error(`Unsupported: ${from} → ${to}`);
  onProgress?.(5);
  return fn(file, onProgress);
}
```

Routes live in a `CONVERSIONS` object keyed by `'from→to'` arrow notation (e.g. `'docx→pdf'`). Register new converters in `registry.js` by adding them to the `converters` array.

## Progress Reporting

Converters receive an `onProgress` callback (`0–100`). Call it at meaningful milestones — typically `5` (start), `20–60` (mid-steps), `100` (done). Always use optional chaining: `onProgress?.(50)`.

## Conventions

- **Formats**: lowercase strings (`pdf`, `docx`, `jpg`)
- **Arrow notation**: `'formatA→formatB'` for CONVERSIONS keys
- **No framework**: vanilla JS only — no React, Vue, etc.
- **CSS**: CSS variables in `style.css`; supports light/dark via `data-theme` on `<html>`
- **Intermediate format**: HTML is the lingua franca for document conversions (e.g. DOCX → HTML → Markdown)

## Vite / WASM Gotchas

- `@ffmpeg/ffmpeg` and `@ffmpeg/util` are excluded from Vite's dependency optimization — FFmpeg loads its WASM separately and optimization breaks it.
- The dev server sets `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` — required for `SharedArrayBuffer` (FFmpeg WASM threading). Do not remove these headers.

## Key Libraries

| Library | Purpose |
|---------|---------|
| `pdf-lib` / `pdfjs-dist` | PDF creation & parsing |
| `mammoth` | DOCX → HTML/text |
| `@ffmpeg/ffmpeg` | Audio & video (WASM) |
| `xlsx` | Spreadsheet read/write |
| `marked` / `turndown` | Markdown ↔ HTML |
| `html2canvas` | HTML → image/PDF |
| `js-yaml` / `xml-js` | YAML & XML parsing |
| `fflate` | Zip archiving for batch downloads |
