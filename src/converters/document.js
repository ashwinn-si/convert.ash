// ═══════════════════════════════════════════════════════
// Document Converter – DOCX, PDF, TXT, MD, HTML, RTF
// ═══════════════════════════════════════════════════════

import mammoth from 'mammoth';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker (local via Vite)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

const DOC_FORMATS = ['pdf', 'docx', 'txt', 'rtf', 'md', 'html', 'epub'];

// ─── Conversion helpers ───

async function docxToHtml(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value;
}

async function docxToText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function pdfToText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(' ');
    pages.push(text);
  }
  return pages.join('\n\n');
}

async function pdfToHtml(file) {
  const text = await pdfToText(file);
  const paragraphs = text.split('\n\n').filter(Boolean);
  return paragraphs.map((p) => `<p>${p}</p>`).join('\n');
}

function htmlToPdf(htmlContent) {
  return import('html2pdf.js').then((mod) => {
    const html2pdf = mod.default;
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.cssText = 'font-family: serif; font-size: 14px; line-height: 1.6; padding: 20px; max-width: 800px; color: #000; letter-spacing: 0.05px; font-variant-ligatures: none; word-spacing: 1px;';
    document.body.appendChild(container);

    return html2pdf()
      .from(container)
      .set({
        margin: [15, 15, 15, 15],
        filename: 'converted.pdf',
        html2canvas: { scale: 2, letterRendering: true, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .outputPdf('blob')
      .then((blob) => {
        document.body.removeChild(container);
        return blob;
      });
  });
}

function textToHtml(text) {
  // Escape HTML but preserve whitespace and line breaks
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Split by double newlines for paragraphs
  const paragraphs = escaped.split('\n\n').filter(Boolean);
  // Use <pre> with pre-wrap to preserve whitespace/line breaks and wrap long lines
  return paragraphs.map((p) => `<pre style="white-space: pre-wrap; word-break: break-word;">${p}</pre>`).join('\n');
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

async function textToDocx(text) {
  const lines = text.split('\n');
  const doc = new Document({
    sections: [
      {
        children: lines.map(
          (line) =>
            new Paragraph({
              children: [new TextRun({ text: line, font: 'Calibri', size: 24 })],
            })
        ),
      },
    ],
  });
  const buffer = await Packer.toBlob(doc);
  return buffer;
}

function textToRtf(text) {
  const escaped = text.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
  const lines = escaped.split('\n').join('\\par\n');
  const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}}\\f0\\fs24 ${lines}}`;
  return new Blob([rtf], { type: 'application/rtf' });
}

function rtfToText(rtfContent) {
  // Basic RTF stripping — remove RTF control words
  return rtfContent
    .replace(/\{\\[^}]*\}/g, '')
    .replace(/\\[a-z]+\d*\s?/g, '')
    .replace(/[{}]/g, '')
    .trim();
}

// ─── Conversion matrix ───

const CONVERSIONS = {
  'docx→pdf': async (file, onP) => {
    onP?.(20);
    const html = await docxToHtml(file);
    onP?.(60);
    const result = await htmlToPdf(html);
    onP?.(100);
    return result;
  },
  'docx→html': async (file, onP) => {
    onP?.(30);
    const html = await docxToHtml(file);
    onP?.(100);
    return new Blob([html], { type: 'text/html' });
  },
  'docx→txt': async (file, onP) => {
    onP?.(30);
    const text = await docxToText(file);
    onP?.(100);
    return new Blob([text], { type: 'text/plain' });
  },
  'docx→md': async (file, onP) => {
    onP?.(20);
    const html = await docxToHtml(file);
    onP?.(60);
    const md = turndown.turndown(html);
    onP?.(100);
    return new Blob([md], { type: 'text/markdown' });
  },

  'pdf→txt': async (file, onP) => {
    onP?.(30);
    const text = await pdfToText(file);
    onP?.(100);
    return new Blob([text], { type: 'text/plain' });
  },
  'pdf→html': async (file, onP) => {
    onP?.(30);
    const html = await pdfToHtml(file);
    onP?.(100);
    return new Blob([html], { type: 'text/html' });
  },
  'pdf→md': async (file, onP) => {
    onP?.(20);
    const html = await pdfToHtml(file);
    onP?.(60);
    const md = turndown.turndown(html);
    onP?.(100);
    return new Blob([md], { type: 'text/markdown' });
  },
  'pdf→docx': async (file, onP) => {
    onP?.(20);
    const text = await pdfToText(file);
    onP?.(60);
    const result = await textToDocx(text);
    onP?.(100);
    return result;
  },
  'pdf→rtf': async (file, onP) => {
    onP?.(20);
    const text = await pdfToText(file);
    onP?.(60);
    const result = textToRtf(text);
    onP?.(100);
    return result;
  },

  'txt→pdf': async (file, onP) => {
    onP?.(20);
    const text = await file.text();
    const html = textToHtml(text);
    onP?.(50);
    const result = await htmlToPdf(html);
    onP?.(100);
    return result;
  },
  'txt→html': async (file, onP) => {
    onP?.(30);
    const text = await file.text();
    const html = textToHtml(text);
    onP?.(100);
    return new Blob([html], { type: 'text/html' });
  },
  'txt→docx': async (file, onP) => {
    onP?.(30);
    const text = await file.text();
    const result = await textToDocx(text);
    onP?.(100);
    return result;
  },
  'txt→md': async (file, onP) => {
    onP?.(50);
    const text = await file.text();
    onP?.(100);
    return new Blob([text], { type: 'text/markdown' });
  },
  'txt→rtf': async (file, onP) => {
    onP?.(50);
    const text = await file.text();
    const result = textToRtf(text);
    onP?.(100);
    return result;
  },

  'md→html': async (file, onP) => {
    onP?.(30);
    const text = await file.text();
    const html = marked(text);
    onP?.(100);
    return new Blob([html], { type: 'text/html' });
  },
  'md→pdf': async (file, onP) => {
    onP?.(20);
    const text = await file.text();
    const html = marked(text);
    onP?.(50);
    const result = await htmlToPdf(html);
    onP?.(100);
    return result;
  },
  'md→txt': async (file, onP) => {
    onP?.(30);
    const text = await file.text();
    const html = marked(text);
    onP?.(70);
    const plain = stripHtml(html);
    onP?.(100);
    return new Blob([plain], { type: 'text/plain' });
  },
  'md→docx': async (file, onP) => {
    onP?.(20);
    const text = await file.text();
    const html = marked(text);
    const plain = stripHtml(html);
    onP?.(60);
    const result = await textToDocx(plain);
    onP?.(100);
    return result;
  },

  'html→pdf': async (file, onP) => {
    onP?.(20);
    const html = await file.text();
    onP?.(40);
    const result = await htmlToPdf(html);
    onP?.(100);
    return result;
  },
  'html→md': async (file, onP) => {
    onP?.(30);
    const html = await file.text();
    const md = turndown.turndown(html);
    onP?.(100);
    return new Blob([md], { type: 'text/markdown' });
  },
  'html→txt': async (file, onP) => {
    onP?.(30);
    const html = await file.text();
    const text = stripHtml(html);
    onP?.(100);
    return new Blob([text], { type: 'text/plain' });
  },
  'html→docx': async (file, onP) => {
    onP?.(20);
    const html = await file.text();
    const text = stripHtml(html);
    onP?.(60);
    const result = await textToDocx(text);
    onP?.(100);
    return result;
  },

  'rtf→txt': async (file, onP) => {
    onP?.(30);
    const rtf = await file.text();
    const text = rtfToText(rtf);
    onP?.(100);
    return new Blob([text], { type: 'text/plain' });
  },
  'rtf→pdf': async (file, onP) => {
    onP?.(20);
    const rtf = await file.text();
    const text = rtfToText(rtf);
    const html = textToHtml(text);
    onP?.(50);
    const result = await htmlToPdf(html);
    onP?.(100);
    return result;
  },
  'rtf→html': async (file, onP) => {
    onP?.(30);
    const rtf = await file.text();
    const text = rtfToText(rtf);
    const html = textToHtml(text);
    onP?.(100);
    return new Blob([html], { type: 'text/html' });
  },
  'rtf→docx': async (file, onP) => {
    onP?.(20);
    const rtf = await file.text();
    const text = rtfToText(rtf);
    onP?.(60);
    const result = await textToDocx(text);
    onP?.(100);
    return result;
  },
  'rtf→md': async (file, onP) => {
    onP?.(30);
    const rtf = await file.text();
    const text = rtfToText(rtf);
    onP?.(100);
    return new Blob([text], { type: 'text/markdown' });
  },
};

// ─── Public API ───

export function canConvert(from, to) {
  const key = `${from.toLowerCase()}→${to.toLowerCase()}`;
  return key in CONVERSIONS;
}

export async function convert(file, from, to, onProgress) {
  const key = `${from.toLowerCase()}→${to.toLowerCase()}`;
  const fn = CONVERSIONS[key];
  if (!fn) throw new Error(`Unsupported conversion: ${from} → ${to}`);
  onProgress?.(5);
  return fn(file, onProgress);
}
