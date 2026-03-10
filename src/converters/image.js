// ═══════════════════════════════════════════════════════
// Image Converter – Canvas API + PDF integration
// ═══════════════════════════════════════════════════════

import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker (local via Vite)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const RASTER_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'ico'];
const ALL_IMAGE_FORMATS = [...RASTER_FORMATS, 'svg', 'tiff', 'heic'];

// Map format to canvas MIME type
const CANVAS_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  bmp: 'image/bmp',
  gif: 'image/gif',
  ico: 'image/png', // ICO will be generated as PNG (limited canvas support)
};

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img);
      // Don't revoke yet — may need the image
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Draw an image onto a canvas and export as blob
 */
function imageToBlob(img, mimeType, quality = 0.92) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');

    // For JPG/BMP, fill white background (no alpha support)
    if (mimeType === 'image/jpeg' || mimeType === 'image/bmp') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas export failed'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Convert SVG file to raster via canvas
 */
async function svgToRaster(file, targetMime) {
  const text = await file.text();
  const blob = new Blob([text], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        // Use larger dimensions for SVG quality
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = (img.naturalWidth || 800) * scale;
        canvas.height = (img.naturalHeight || 600) * scale;
        const ctx = canvas.getContext('2d');

        if (targetMime === 'image/jpeg' || targetMime === 'image/bmp') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) resolve(blob);
            else reject(new Error('SVG rasterization failed'));
          },
          targetMime,
          0.95
        );
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };
    img.src = url;
  });
}

/**
 * Convert HEIC to a target format (via heic2any)
 */
async function heicToTarget(file, targetMime) {
  const heic2any = (await import('heic2any')).default;
  const toType = targetMime === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  const resultBlob = await heic2any({ blob: file, toType, quality: 0.92 });

  // If target is directly JPG or PNG, we're done
  if (targetMime === toType) return resultBlob;

  // Otherwise, convert through canvas
  const img = await loadImage(new File([resultBlob], 'temp.png', { type: toType }));
  return imageToBlob(img, targetMime);
}

/**
 * Convert image to PDF
 */
async function imageToPdf(file) {
  const img = await loadImage(file);
  const pdfDoc = await PDFDocument.create();

  const arrayBuffer = await file.arrayBuffer();
  let pdfImage;

  const type = file.type;
  if (type === 'image/png') {
    pdfImage = await pdfDoc.embedPng(arrayBuffer);
  } else {
    // Convert to PNG first via canvas, then embed
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const pngBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const pngBuffer = await pngBlob.arrayBuffer();
    pdfImage = await pdfDoc.embedPng(pngBuffer);
  }

  const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
  page.drawImage(pdfImage, {
    x: 0,
    y: 0,
    width: pdfImage.width,
    height: pdfImage.height,
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Convert PDF to image (renders first page)
 */
async function pdfToImage(file, targetMime) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  const scale = 2;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');

  if (targetMime === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  await page.render({ canvasContext: ctx, viewport }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('PDF to image failed'));
      },
      targetMime,
      0.95
    );
  });
}

// ─── Public API ───

export function canConvert(from, to) {
  const f = from.toLowerCase();
  const t = to.toLowerCase();

  // Image ↔ Image
  if (ALL_IMAGE_FORMATS.includes(f) && RASTER_FORMATS.includes(t)) return true;
  // SVG → raster
  if (f === 'svg' && RASTER_FORMATS.includes(t)) return true;
  // Image → PDF
  if (ALL_IMAGE_FORMATS.includes(f) && t === 'pdf') return true;
  // PDF → Image
  if (f === 'pdf' && RASTER_FORMATS.includes(t)) return true;

  return false;
}

export async function convert(file, from, to, onProgress) {
  const f = from.toLowerCase();
  const t = to.toLowerCase();

  onProgress?.(10);

  // HEIC → anything
  if (f === 'heic') {
    onProgress?.(30);
    if (t === 'pdf') {
      const result = await heicToTarget(file, 'image/png');
      onProgress?.(60);
      const pngFile = new File([result], 'temp.png', { type: 'image/png' });
      const pdf = await imageToPdf(pngFile);
      onProgress?.(100);
      return pdf;
    }
    const targetMime = CANVAS_MIME[t] || 'image/png';
    const result = await heicToTarget(file, targetMime);
    onProgress?.(100);
    return result;
  }

  // SVG → raster
  if (f === 'svg' && RASTER_FORMATS.includes(t)) {
    onProgress?.(30);
    const targetMime = CANVAS_MIME[t] || 'image/png';
    const result = await svgToRaster(file, targetMime);
    onProgress?.(100);
    return result;
  }

  // Image → PDF
  if (ALL_IMAGE_FORMATS.includes(f) && t === 'pdf') {
    onProgress?.(30);
    const result = await imageToPdf(file);
    onProgress?.(100);
    return result;
  }

  // PDF → Image
  if (f === 'pdf' && RASTER_FORMATS.includes(t)) {
    onProgress?.(30);
    const targetMime = CANVAS_MIME[t] || 'image/png';
    const result = await pdfToImage(file, targetMime);
    onProgress?.(100);
    return result;
  }

  // Raster ↔ Raster via Canvas
  onProgress?.(30);
  const img = await loadImage(file);
  onProgress?.(60);
  const targetMime = CANVAS_MIME[t] || 'image/png';
  const result = await imageToBlob(img, targetMime);
  onProgress?.(100);
  return result;
}
