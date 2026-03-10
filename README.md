# convert.ash
**The Simplest Universal File Converter**

convert.ash is a beautiful, client-side only web utility that converts files into 50+ different formats securely entirely within your browser. There are no backend servers, no file uploads, and your data remains 100% private. 

## Features
- **100% Client-Side:** Uses WebAssembly (WASM) and JavaScript to process conversions directly on your machine.
- **Privacy First:** Your files never leave your browser.
- **Universal Format Support:** Convert between Documents, Images, Spreadsheets, Developer formats, Audio, and Video.
- **Batch Processing:** Select multiple files to convert them all at once (outputs to a `.zip` file automatically).
- **Fast and Free:** No limits, no paywalls.
- **Modern UI:** Light and Dark mode, fluid animations, and a responsive glass-morphism aesthetic.

## Tech Stack
Built with vanilla JavaScript and Vite for lightning-fast performance without framework bloat.
- **Build Tool:** Vite
- **Styling:** Vanilla CSS variables over dark/light schemes + Lucide Icons
- **Core Conversion Engines:**
  - `pdf-lib` / `pdfjs-dist` (PDF magic)
  - `mammoth` (DOCX parsing)
  - `xlsx` (Spreadsheet handling)
  - `@ffmpeg/ffmpeg` (WASM Audio & Video processing)
  - `html2canvas` / `js-yaml` / `xml-js` / `marked` (Utility formatters)
  - `fflate` (High-performance Zip archiving for batch jobs)

## Deployed At
[convert.ashwinsi.in](https://convert.ashwinsi.in)

## Contact / Credits
Built by [Ashwin S I](https://github.com/ashwinn-si)
