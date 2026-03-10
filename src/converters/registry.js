// ═══════════════════════════════════════════════════════
// Conversion Registry – Central router for all converters
// ═══════════════════════════════════════════════════════

import * as imageConverter from './image.js';
import * as documentConverter from './document.js';
import * as spreadsheetConverter from './spreadsheet.js';
import * as developerConverter from './developer.js';
import * as mediaConverter from './media.js';

const converters = [
  imageConverter,
  documentConverter,
  spreadsheetConverter,
  developerConverter,
  mediaConverter,
];

/**
 * Get all formats that a given input format can be converted to
 */
export function getAvailableOutputFormats(inputFormat) {
  const from = inputFormat.toLowerCase();
  const allFormats = getAllFormats();
  const available = [];

  for (const to of allFormats) {
    if (to === from) continue;
    if (canConvert(from, to)) {
      available.push(to);
    }
  }

  return available;
}

/**
 * Check if a conversion is supported by any converter
 */
export function canConvert(from, to) {
  return converters.some((c) => c.canConvert(from, to));
}

/**
 * Perform a conversion
 */
export async function convert(file, from, to, onProgress) {
  const converter = converters.find((c) => c.canConvert(from, to));
  if (!converter) {
    throw new Error(`No converter found for ${from.toUpperCase()} → ${to.toUpperCase()}`);
  }
  return converter.convert(file, from, to, onProgress);
}

/**
 * Get all unique supported formats
 */
export function getAllFormats() {
  return [
    // Images
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg', 'ico', 'heic',
    // Documents
    'pdf', 'docx', 'txt', 'rtf', 'md', 'html',
    // Spreadsheets
    'xlsx', 'xls', 'csv', 'tsv', 'ods',
    // Developer
    'json', 'xml', 'yaml',
    // Audio
    'mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac',
    // Video
    'mp4', 'webm', 'avi', 'mov', 'mkv',
  ];
}

/**
 * Get all unique input formats (formats that can be converted FROM)
 */
export function getInputFormats() {
  const allFmts = getAllFormats();
  return allFmts.filter((fmt) => {
    // Check if this format can produce at least one output
    return allFmts.some((other) => other !== fmt && canConvert(fmt, other));
  });
}

/**
 * Get the total number of supported conversion paths
 */
export function getConversionCount() {
  const formats = getAllFormats();
  let count = 0;
  for (const from of formats) {
    for (const to of formats) {
      if (from !== to && canConvert(from, to)) count++;
    }
  }
  return count;
}
