// ═══════════════════════════════════════════════════════
// Developer Format Converter – JSON, XML, YAML, CSV, etc
// ═══════════════════════════════════════════════════════

import jsYaml from 'js-yaml';
import xmlJs from 'xml-js';
import { marked } from 'marked';
import TurndownService from 'turndown';

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

// ─── Helpers ───

/**
 * Flatten a JSON array of objects to CSV
 */
function jsonToCsv(jsonData) {
  if (!Array.isArray(jsonData)) {
    // If single object, wrap in array
    jsonData = [jsonData];
  }

  if (jsonData.length === 0) return '';

  // Collect all unique keys
  const allKeys = new Set();
  jsonData.forEach((obj) => {
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach((k) => allKeys.add(k));
    }
  });

  const headers = [...allKeys];
  const csvRows = [headers.join(',')];

  jsonData.forEach((row) => {
    const values = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      // Escape CSV fields
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Parse CSV to JSON array of objects
 */
function csvToJson(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  // Simple CSV parser (handles quoted fields)
  function parseLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    const values = parseLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || '';
    });
    data.push(obj);
  }

  return data;
}

// ─── Conversion matrix ───

const CONVERSIONS = {
  // JSON ↔ CSV
  'json→csv': async (file, onP) => {
    onP?.(30);
    const text = await file.text();
    const data = JSON.parse(text);
    onP?.(70);
    const csv = jsonToCsv(data);
    onP?.(100);
    return new Blob([csv], { type: 'text/csv' });
  },
  'csv→json': async (file, onP) => {
    onP?.(30);
    const text = await file.text();
    const data = csvToJson(text);
    onP?.(70);
    const json = JSON.stringify(data, null, 2);
    onP?.(100);
    return new Blob([json], { type: 'application/json' });
  },

  // JSON ↔ YAML
  'json→yaml': async (file, onP) => {
    onP?.(30);
    const text = await file.text();
    const data = JSON.parse(text);
    onP?.(70);
    const yaml = jsYaml.dump(data, { indent: 2, lineWidth: 120 });
    onP?.(100);
    return new Blob([yaml], { type: 'text/yaml' });
  },
  'yaml→json': async (file, onP) => {
    onP?.(30);
    const text = await file.text();
    const data = jsYaml.load(text);
    onP?.(70);
    const json = JSON.stringify(data, null, 2);
    onP?.(100);
    return new Blob([json], { type: 'application/json' });
  },

  // JSON ↔ XML
  'json→xml': async (file, onP) => {
    onP?.(30);
    const text = await file.text();
    onP?.(60);
    const xml = xmlJs.json2xml(text, { compact: true, spaces: 2 });
    const xmlDoc = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${xml}\n</root>`;
    onP?.(100);
    return new Blob([xmlDoc], { type: 'application/xml' });
  },
  'xml→json': async (file, onP) => {
    onP?.(30);
    const text = await file.text();
    onP?.(60);
    const json = xmlJs.xml2json(text, { compact: true, spaces: 2 });
    onP?.(100);
    return new Blob([json], { type: 'application/json' });
  },

  // YAML ↔ XML
  'yaml→xml': async (file, onP) => {
    onP?.(20);
    const text = await file.text();
    const data = jsYaml.load(text);
    onP?.(50);
    const jsonStr = JSON.stringify(data);
    const xml = xmlJs.json2xml(jsonStr, { compact: true, spaces: 2 });
    const xmlDoc = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${xml}\n</root>`;
    onP?.(100);
    return new Blob([xmlDoc], { type: 'application/xml' });
  },
  'xml→yaml': async (file, onP) => {
    onP?.(20);
    const text = await file.text();
    const json = xmlJs.xml2json(text, { compact: true });
    onP?.(50);
    const data = JSON.parse(json);
    const yaml = jsYaml.dump(data, { indent: 2 });
    onP?.(100);
    return new Blob([yaml], { type: 'text/yaml' });
  },

  // CSV ↔ YAML
  'csv→yaml': async (file, onP) => {
    onP?.(20);
    const text = await file.text();
    const data = csvToJson(text);
    onP?.(60);
    const yaml = jsYaml.dump(data, { indent: 2 });
    onP?.(100);
    return new Blob([yaml], { type: 'text/yaml' });
  },
  'yaml→csv': async (file, onP) => {
    onP?.(20);
    const text = await file.text();
    const data = jsYaml.load(text);
    onP?.(60);
    const csv = jsonToCsv(Array.isArray(data) ? data : [data]);
    onP?.(100);
    return new Blob([csv], { type: 'text/csv' });
  },

  // CSV ↔ XML
  'csv→xml': async (file, onP) => {
    onP?.(20);
    const text = await file.text();
    const data = csvToJson(text);
    onP?.(50);
    const jsonStr = JSON.stringify({ item: data });
    const xml = xmlJs.json2xml(jsonStr, { compact: true, spaces: 2 });
    const xmlDoc = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${xml}\n</root>`;
    onP?.(100);
    return new Blob([xmlDoc], { type: 'application/xml' });
  },
  'xml→csv': async (file, onP) => {
    onP?.(20);
    const text = await file.text();
    const json = xmlJs.xml2json(text, { compact: true });
    const data = JSON.parse(json);
    onP?.(50);
    // Try to find array in XML data
    const items = findArray(data);
    const csv = jsonToCsv(items);
    onP?.(100);
    return new Blob([csv], { type: 'text/csv' });
  },

  // MD ↔ HTML (developer context)
  'md→html': async (file, onP) => {
    onP?.(30);
    const text = await file.text();
    const html = marked(text);
    onP?.(100);
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Document</title>
<style>body{font-family:system-ui;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#333}code{background:#f4f4f4;padding:2px 6px;border-radius:3px}pre{background:#f4f4f4;padding:1rem;border-radius:6px;overflow-x:auto}</style>
</head>
<body>${html}</body></html>`;
    return new Blob([fullHtml], { type: 'text/html' });
  },
  'html→md': async (file, onP) => {
    onP?.(30);
    const html = await file.text();
    const md = turndown.turndown(html);
    onP?.(100);
    return new Blob([md], { type: 'text/markdown' });
  },
};

/**
 * Find the first array in a nested object (for XML → CSV)
 */
function findArray(obj) {
  if (Array.isArray(obj)) return obj;
  if (typeof obj === 'object' && obj !== null) {
    for (const key of Object.keys(obj)) {
      const result = findArray(obj[key]);
      if (result) return result;
    }
  }
  return [obj]; // fallback: wrap single object
}

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
