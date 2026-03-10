// ═══════════════════════════════════════════════════════
// OmniConvert – Conversion Tester
// Tests all conversion paths by creating synthetic files
// Access at: http://localhost:5173/tester.html
// ═══════════════════════════════════════════════════════

import { getAllFormats, canConvert, convert, getConversionCount } from './converters/registry.js';

// ─── Synthetic Test File Generators ───

function createTextFile(content, name, type) {
  return new File([content], name, { type });
}

function createImageFile() {
  // Create a tiny valid PNG (1x1 red pixel)
  const canvas = document.createElement('canvas');
  canvas.width = 50;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ff6347';
  ctx.fillRect(0, 0, 50, 50);
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText('T', 15, 35);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], 'test.png', { type: 'image/png' }));
    }, 'image/png');
  });
}

function createJpgFile() {
  const canvas = document.createElement('canvas');
  canvas.width = 50;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4682b4';
  ctx.fillRect(0, 0, 50, 50);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], 'test.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  });
}

function createWebpFile() {
  const canvas = document.createElement('canvas');
  canvas.width = 50;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#32cd32';
  ctx.fillRect(0, 0, 50, 50);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], 'test.webp', { type: 'image/webp' }));
    }, 'image/webp', 0.9);
  });
}

const TEST_FILES = {
  // Text-based
  txt: () => createTextFile('Hello World!\nThis is a test file.\nLine 3.', 'test.txt', 'text/plain'),
  md: () => createTextFile('# Hello World\n\nThis is **bold** and *italic*.\n\n- Item 1\n- Item 2\n\n```js\nconsole.log("hi");\n```', 'test.md', 'text/markdown'),
  html: () => createTextFile('<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello</h1><p>This is a <strong>test</strong> document.</p><ul><li>Item 1</li><li>Item 2</li></ul></body></html>', 'test.html', 'text/html'),
  rtf: () => createTextFile('{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}}\\f0\\fs24 Hello World!\\par This is a test RTF file.}', 'test.rtf', 'application/rtf'),
  csv: () => createTextFile('name,age,city\nAlice,30,NYC\nBob,25,LA\nCharlie,35,Chicago', 'test.csv', 'text/csv'),
  tsv: () => createTextFile('name\tage\tcity\nAlice\t30\tNYC\nBob\t25\tLA\nCharlie\t35\tChicago', 'test.tsv', 'text/tab-separated-values'),
  json: () => createTextFile(JSON.stringify([
    { name: 'Alice', age: 30, city: 'NYC' },
    { name: 'Bob', age: 25, city: 'LA' },
    { name: 'Charlie', age: 35, city: 'Chicago' }
  ], null, 2), 'test.json', 'application/json'),
  xml: () => createTextFile('<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item><name>Alice</name><age>30</age></item>\n  <item><name>Bob</name><age>25</age></item>\n</root>', 'test.xml', 'application/xml'),
  yaml: () => createTextFile('users:\n  - name: Alice\n    age: 30\n  - name: Bob\n    age: 25', 'test.yaml', 'text/yaml'),
  svg: () => createTextFile('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#7c3aed"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="16">Test</text></svg>', 'test.svg', 'image/svg+xml'),

  // Binary images (created async)
  png: () => createImageFile(),
  jpg: () => createJpgFile(),
  jpeg: () => createJpgFile(),
  webp: () => createWebpFile(),
  gif: () => createImageFile().then(f => new File([f], 'test.gif', { type: 'image/gif' })),
  bmp: () => createImageFile().then(f => new File([f], 'test.bmp', { type: 'image/bmp' })),
  ico: () => createImageFile().then(f => new File([f], 'test.ico', { type: 'image/x-icon' })),
};

// Formats we CAN'T easily create synthetic files for in the browser
const SKIP_INPUT = new Set(['pdf', 'docx', 'xlsx', 'xls', 'ods', 'tiff', 'heic', 'zip', 'tar', 'gz', 'epub', 'pptx', 'ppt', 'odp']);

// ─── Test Runner ───

async function runTests() {
  const results = document.getElementById('results');
  const summary = document.getElementById('summary');
  const formats = getAllFormats();

  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  // Count testable conversions
  const testPairs = [];
  for (const from of formats) {
    if (SKIP_INPUT.has(from)) continue;
    if (!TEST_FILES[from]) continue;
    for (const to of formats) {
      if (from === to) continue;
      if (canConvert(from, to)) {
        testPairs.push([from, to]);
      }
    }
  }

  summary.innerHTML = `<div class="test-running">🔄 Running ${testPairs.length} tests...</div>`;
  results.innerHTML = '';

  for (const [from, to] of testPairs) {
    total++;
    const row = document.createElement('div');
    row.className = 'test-row';
    row.innerHTML = `<span class="test-pair">${from.toUpperCase()} → ${to.toUpperCase()}</span><span class="test-status running">⏳</span>`;
    results.appendChild(row);

    // Scroll to bottom
    results.scrollTop = results.scrollHeight;

    try {
      const fileGen = TEST_FILES[from];
      const file = await Promise.resolve(fileGen());

      const blob = await convert(file, from, to, () => { });

      if (blob && blob.size > 0) {
        row.querySelector('.test-status').className = 'test-status pass';
        row.querySelector('.test-status').textContent = `✅ ${formatSize(blob.size)}`;
        passed++;
      } else {
        row.querySelector('.test-status').className = 'test-status fail';
        row.querySelector('.test-status').textContent = '❌ Empty output';
        failed++;
      }
    } catch (err) {
      row.querySelector('.test-status').className = 'test-status fail';
      row.querySelector('.test-status').textContent = `❌ ${err.message.slice(0, 60)}`;
      failed++;
    }

    // Update summary
    summary.innerHTML = `Running... ${total}/${testPairs.length} | ✅ ${passed} | ❌ ${failed}`;
  }

  // Count skipped (conversions we can't test because we can't create input files)
  for (const from of formats) {
    if (!SKIP_INPUT.has(from)) continue;
    for (const to of formats) {
      if (from !== to && canConvert(from, to)) skipped++;
    }
  }

  const percent = total > 0 ? Math.round((passed / total) * 100) : 0;
  summary.innerHTML = `
    <div class="test-summary ${failed === 0 ? 'all-pass' : 'has-fail'}">
      <div class="summary-title">${failed === 0 ? '🎉 All Testable Conversions Passed!' : '⚠️ Some Conversions Failed'}</div>
      <div class="summary-stats">
        <span>Total: <strong>${total}</strong></span>
        <span>✅ Passed: <strong>${passed}</strong></span>
        <span>❌ Failed: <strong>${failed}</strong></span>
        <span>⏭️ Skipped (no synthetic input): <strong>${skipped}</strong></span>
        <span>Pass Rate: <strong>${percent}%</strong></span>
      </div>
      <div class="summary-note">Skipped tests require real files (PDF, DOCX, XLSX, archives, etc.) that can't be easily synthesized in-browser.</div>
    </div>
  `;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  return (bytes / 1024).toFixed(1) + ' KB';
}

// ─── UI ───

function initTester() {
  document.getElementById('app').innerHTML = `
    <div style="max-width: 900px; margin: 0 auto; padding: 2rem; font-family: 'Inter', system-ui, sans-serif; color: #f0f0ff; background: #0a0a1a; min-height: 100vh;">
      <h1 style="font-family: 'Outfit', sans-serif; font-size: 2rem; margin-bottom: 0.5rem;">
        ⚡ OmniConvert Conversion Tester
      </h1>
      <p style="color: rgba(240,240,255,0.6); margin-bottom: 1.5rem;">
        Automatically tests all conversion paths with synthetic test files.
        <br><a href="/" style="color: #a78bfa;">← Back to App</a>
      </p>
      
      <button id="run-btn" style="
        background: linear-gradient(135deg, #7c3aed, #06b6d4); 
        border: none; color: white; padding: 12px 32px; border-radius: 10px; 
        font-size: 1rem; font-weight: 700; cursor: pointer; margin-bottom: 1.5rem;
        font-family: 'Outfit', sans-serif;
      ">▶ Run All Tests</button>
      
      <div id="summary" style="margin-bottom: 1rem;"></div>
      
      <div id="results" style="
        max-height: 600px; overflow-y: auto; 
        border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; 
        background: rgba(255,255,255,0.03);
      "></div>
    </div>
    
    <style>
      .test-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 8px 16px; border-bottom: 1px solid rgba(255,255,255,0.05);
        font-size: 0.85rem;
      }
      .test-row:hover { background: rgba(255,255,255,0.03); }
      .test-pair { font-weight: 600; font-family: monospace; font-size: 0.9rem; }
      .test-status { font-size: 0.8rem; }
      .test-status.pass { color: #34d399; }
      .test-status.fail { color: #f87171; }
      .test-status.running { color: #fbbf24; }
      .test-running { color: #fbbf24; font-weight: 600; font-size: 1rem; }
      .test-summary { 
        padding: 16px 20px; border-radius: 12px; 
        border: 1px solid rgba(255,255,255,0.1);
      }
      .test-summary.all-pass { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); }
      .test-summary.has-fail { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); }
      .summary-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
      .summary-stats { display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.9rem; color: rgba(240,240,255,0.7); }
      .summary-stats strong { color: #f0f0ff; }
      .summary-note { font-size: 0.75rem; color: rgba(240,240,255,0.4); margin-top: 8px; }
    </style>
  `;

  document.getElementById('run-btn').addEventListener('click', async () => {
    const btn = document.getElementById('run-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Running...';
    await runTests();
    btn.disabled = false;
    btn.textContent = '▶ Run All Tests Again';
  });
}

// Init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTester);
} else {
  initTester();
}
