// ═══════════════════════════════════════════════════════
// Format metadata – categories, extensions, MIME types
// ═══════════════════════════════════════════════════════

export const FORMAT_CATEGORIES = {
  images: {
    name: 'Images',
    icon: '🖼️',
    color: '#ec4899',
    formats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg', 'ico', 'heic'],
  },
  documents: {
    name: 'Documents',
    icon: '📄',
    color: '#7c3aed',
    formats: ['pdf', 'docx', 'txt', 'rtf', 'md', 'html', 'epub'],
  },
  spreadsheets: {
    name: 'Spreadsheets',
    icon: '📊',
    color: '#10b981',
    formats: ['xlsx', 'xls', 'csv', 'tsv', 'ods'],
  },
  presentations: {
    name: 'Presentations',
    icon: '📽️',
    color: '#eab308',
    formats: ['pptx', 'ppt', 'odp'],
  },
  developer: {
    name: 'Developer',
    icon: '💻',
    color: '#06b6d4',
    formats: ['json', 'xml', 'yaml', 'csv', 'html', 'md'],
  },
  audio: {
    name: 'Audio',
    icon: 'music',
    color: '#8b5cf6',
    formats: ['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac'],
  },
  video: {
    name: 'Video',
    icon: 'video',
    color: '#ec4899',
    formats: ['mp4', 'webm', 'avi', 'mov', 'mkv'],
  },
};

export const FORMAT_INFO = {
  // Images
  jpg: { label: 'JPG', mime: 'image/jpeg', category: 'images' },
  jpeg: { label: 'JPEG', mime: 'image/jpeg', category: 'images' },
  png: { label: 'PNG', mime: 'image/png', category: 'images' },
  gif: { label: 'GIF', mime: 'image/gif', category: 'images' },
  bmp: { label: 'BMP', mime: 'image/bmp', category: 'images' },
  webp: { label: 'WEBP', mime: 'image/webp', category: 'images' },
  tiff: { label: 'TIFF', mime: 'image/tiff', category: 'images' },
  svg: { label: 'SVG', mime: 'image/svg+xml', category: 'images' },
  ico: { label: 'ICO', mime: 'image/x-icon', category: 'images' },
  heic: { label: 'HEIC', mime: 'image/heic', category: 'images' },
  // Documents
  pdf: { label: 'PDF', mime: 'application/pdf', category: 'documents' },
  docx: { label: 'DOCX', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'documents' },
  txt: { label: 'TXT', mime: 'text/plain', category: 'documents' },
  rtf: { label: 'RTF', mime: 'application/rtf', category: 'documents' },
  md: { label: 'MD', mime: 'text/markdown', category: 'documents' },
  html: { label: 'HTML', mime: 'text/html', category: 'documents' },
  epub: { label: 'EPUB', mime: 'application/epub+zip', category: 'documents' },
  // Spreadsheets
  xlsx: { label: 'XLSX', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'spreadsheets' },
  xls: { label: 'XLS', mime: 'application/vnd.ms-excel', category: 'spreadsheets' },
  csv: { label: 'CSV', mime: 'text/csv', category: 'spreadsheets' },
  tsv: { label: 'TSV', mime: 'text/tab-separated-values', category: 'spreadsheets' },
  ods: { label: 'ODS', mime: 'application/vnd.oasis.opendocument.spreadsheet', category: 'spreadsheets' },
  // Developer
  json: { label: 'JSON', mime: 'application/json', category: 'developer' },
  xml: { label: 'XML', mime: 'application/xml', category: 'developer' },
  yaml: { label: 'YAML', mime: 'text/yaml', category: 'developer' },
  // Audio
  mp3: { label: 'MP3', mime: 'audio/mpeg', category: 'audio' },
  wav: { label: 'WAV', mime: 'audio/wav', category: 'audio' },
  aac: { label: 'AAC', mime: 'audio/aac', category: 'audio' },
  m4a: { label: 'M4A', mime: 'audio/mp4', category: 'audio' },
  ogg: { label: 'OGG', mime: 'audio/ogg', category: 'audio' },
  flac: { label: 'FLAC', mime: 'audio/flac', category: 'audio' },
  // Video
  mp4: { label: 'MP4', mime: 'video/mp4', category: 'video' },
  webm: { label: 'WEBM', mime: 'video/webm', category: 'video' },
  avi: { label: 'AVI', mime: 'video/x-msvideo', category: 'video' },
  mov: { label: 'MOV', mime: 'video/quicktime', category: 'video' },
  mkv: { label: 'MKV', mime: 'video/x-matroska', category: 'video' },
};

/**
 * Get lucide icon name based on format
 */
export function getFileIcon(format) {
  const cat = FORMAT_INFO[format]?.category;
  const icons = {
    images: 'image',
    documents: 'file-text',
    spreadsheets: 'sheet',
    presentations: 'presentation',
    developer: 'file-code-2',
    audio: 'music',
    video: 'video',
  };
  return icons[cat] || 'file';
}

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Detect format from file extension
 */
export function detectFormat(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (FORMAT_INFO[ext]) return ext;
  // normalize jpeg → jpg
  if (ext === 'jpeg') return 'jpg';
  if (ext === 'yml') return 'yaml';
  return ext;
}
