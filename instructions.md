# instructions.md

This document contains step-by-step instructions on how to run, develop, and deploy **convert.ash**.

## 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm**, **yarn**, or **pnpm** (npm is used in these instructions)

## 2. Local Development

To run the application locally with hot-module-reloading:

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Open in Browser:**
   The terminal will output a local address (usually `http://localhost:5173`). Open that URL in your browser.

> **Note regarding FFmpeg (Audio/Video conversions):**
> FFmpeg uses WebAssembly `SharedArrayBuffer` for high performance. To allow this, the Vite dev server is explicitly configured to send `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` headers. 

## 3. Building for Production

When you are ready to deploy the application, you need to create a production-ready build.

1. **Run the build script:**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Output:**
   Vite will bundle all JavaScript, CSS, and WebAssembly chunks into the `dist/` folder. Everything in this folder is optimized, minified, and ready to be served.

3. **Preview Production Build Locally:**
   To test the production build before deploying:
   \`\`\`bash
   npm run preview
   \`\`\`

## 4. Deployment

Because convert.ash is a purely client-side static application (no backend API required), you can deploy the `dist/` folder to any static hosting provider such as:

- **Vercel**
- **Netlify**
- **GitHub Pages**
- **Cloudflare Pages**

### Important Deployment Requirement (CORS / Headers)
To ensure the Audio/Video (FFmpeg) functions work in production, your hosting provider **MUST** be configured to return the following HTTP Response Headers on your domain:

\`\`\`http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
\`\`\`

If you use **Vercel**, you can create a `vercel.json` in the root of your project:
\`\`\`json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
\`\`\`

If you are using **Netlify**, add a `netlify.toml` or `_headers` file with equivalent configurations.
