// ═══════════════════════════════════════════════════════
// Spreadsheet Converter – SheetJS (xlsx)
// ═══════════════════════════════════════════════════════

import * as XLSX from 'xlsx';

const SHEET_FORMATS = ['xlsx', 'xls', 'csv', 'tsv', 'ods'];

// Map our format names to SheetJS bookType
const BOOK_TYPES = {
  xlsx: 'xlsx',
  xls: 'xls',
  csv: 'csv',
  tsv: 'csv', // TSV is CSV with tab delimiter
  ods: 'ods',
};

const MIME_TYPES = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
};

// ─── Public API ───

export function canConvert(from, to) {
  return SHEET_FORMATS.includes(from.toLowerCase()) && SHEET_FORMATS.includes(to.toLowerCase()) && from !== to;
}

export async function convert(file, from, to, onProgress) {
  const f = from.toLowerCase();
  const t = to.toLowerCase();

  onProgress?.(10);

  // Read the file
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(30);

  // Parse with SheetJS
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  onProgress?.(60);

  let output;

  if (t === 'tsv') {
    // Special handling for TSV — CSV with tab separator
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const tsvContent = XLSX.utils.sheet_to_csv(sheet, { FS: '\t' });
    output = new Blob([tsvContent], { type: MIME_TYPES.tsv });
  } else if (t === 'csv') {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const csvContent = XLSX.utils.sheet_to_csv(sheet);
    output = new Blob([csvContent], { type: MIME_TYPES.csv });
  } else {
    // Binary formats (xlsx, xls, ods)
    const bookType = BOOK_TYPES[t];
    const wbout = XLSX.write(workbook, { bookType, type: 'array' });
    output = new Blob([wbout], { type: MIME_TYPES[t] });
  }

  onProgress?.(100);
  return output;
}
