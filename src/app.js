// ═══════════════════════════════════════════════════════
// OmniConvert – Simple App Controller
// ═══════════════════════════════════════════════════════

import { FORMAT_INFO, getFileIcon, formatFileSize, detectFormat } from './utils/formatData.js';
import { getAvailableOutputFormats, canConvert, convert, getInputFormats } from './converters/registry.js';
import { saveAs } from 'file-saver';
import { zip, strToU8 } from 'fflate';
import { createIcons, Zap, Moon, Sun, ArrowRightLeft, FolderOpen, Plus, FileText, Sheet, Presentation, FileCode2, Film, Music, Image as ImageIcon, Video, File, Check, Download, AlertTriangle, X, ShieldCheck } from 'lucide';

const ICONS = {
  Zap, Moon, Sun, ArrowRightLeft, FolderOpen, Plus, FileText, Sheet, Presentation, FileCode2, Film, Music, Image: ImageIcon, Video, File, Check, Download, AlertTriangle, X, ShieldCheck
};
let selectedFiles = [];
let inputFormat = '';
let outputFormat = '';
let convertedBlob = null;
let convertedFilename = '';

export function initApp() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  document.getElementById('app').innerHTML = `
    <div class="top-nav">
      <button class="nav-btn" id="editor-btn" title="Write text">
        <i data-lucide="file-text"></i>
      </button>
      <button class="theme-toggle" id="theme-toggle" title="Toggle Theme">
        <i data-lucide="${savedTheme === 'light' ? 'moon' : 'sun'}"></i>
      </button>
    </div>

    <div class="logo">
      <h1> convert<span>.ash</span></h1>
      <p>Universal file converter — runs entirely in your browser</p>
    </div>

    <div class="card">
      <!-- Format Selectors -->
      <div class="format-row">
        <div class="format-group">
          <label>From</label>
          <select id="input-format">
            <option value="">Select format...</option>
          </select>
        </div>
        <button class="swap-btn" id="swap-btn" title="Swap"><i data-lucide="arrow-right-left" style="width:16px; height:16px;"></i></button>
        <div class="format-group">
          <label>To</label>
          <select id="output-format" disabled>
            <option value="">Select format...</option>
          </select>
        </div>
      </div>

      <!-- Dropzone -->
      <div class="dropzone" id="dropzone">
        <div class="dropzone-icon"><i data-lucide="folder-open" style="width:40px; height:40px;"></i></div>
        <p class="dropzone-text">Drop files here or <strong>browse</strong></p>
        <p class="dropzone-hint">Auto-detects format on upload. Batch conversion supported.</p>
        <input type="file" multiple class="file-input" id="file-input" />
      </div>

      <!-- File List -->
      <div class="file-list" id="file-list" style="display:none; flex-direction:column; gap:8px; margin-bottom:1.25rem; max-height:200px; overflow-y:auto; padding-right:4px;">
        <!-- File items injected here -->
      </div>
      
      <div id="add-more-container" style="display:none; text-align:center; margin-bottom:1.25rem;">
         <button id="add-more-btn" style="background:none; border:none; color:var(--accent); cursor:pointer; font-size:0.8rem; font-weight:600;"><i data-lucide="plus" style="width:14px; height:14px; vertical-align:text-bottom;"></i> Add more files</button>
      </div>

      <!-- Convert -->
      <button class="convert-btn" id="convert-btn" disabled>Convert</button>

      <!-- Progress -->
      <div class="progress-section" id="progress-section">
        <div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div>
        <div class="progress-status">
          <span id="progress-text">Processing...</span>
          <span id="progress-percent">0%</span>
        </div>
      </div>

      <!-- Error -->
      <div class="error-section" id="error-section">
        <span><i data-lucide="alert-triangle" style="width:16px; height:16px;"></i></span>
        <span id="error-text"></span>
      </div>

      <!-- Download -->
      <div class="download-section" id="download-section">
        <div class="download-success"><i data-lucide="check" style="width:18px; height:18px;"></i> Conversion complete</div>
        <button class="download-btn" id="download-btn"><i data-lucide="download" style="width:18px; height:18px;"></i> Download</button>
        <br>
        <button class="convert-another-btn" id="convert-another-btn">Convert another file</button>
      </div>
    </div>

    <div style="text-align: center; margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
      <p class="privacy"><i data-lucide="shield-check" style="width:14px; height:14px; display:inline-block; vertical-align:text-bottom;"></i> Your files never leave your browser</p>
      <p style="font-size: 0.75rem; color: var(--text-dim);">Built by <a href="https://github.com/ashwinn-si" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: none; font-weight: 500;">Ashwin S I</a></p>
    </div>

    <!-- Text Editor Modal -->
    <div class="modal-overlay" id="editor-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Write Document</h2>
          <button class="modal-close" id="editor-close"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body">
          <textarea id="editor-textarea" placeholder="Start typing..."></textarea>
        </div>
        <div class="modal-footer" style="flex-direction: column; align-items: stretch;">
          <div class="modal-progress" id="editor-progress" style="display:none; margin-bottom: 1rem;">
            <div class="progress-track"><div class="progress-fill" id="editor-progress-fill"></div></div>
            <div class="progress-status" style="margin-top: 4px;">
              <span id="editor-progress-text">Converting...</span>
              <span id="editor-progress-percent" style="float: right;">0%</span>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button class="modal-btn outline" id="save-docx-btn"><i data-lucide="file-text" style="width:16px; height:16px;"></i> Save as DOCX</button>
            <button class="modal-btn primary" id="save-pdf-btn"><i data-lucide="file" style="width:16px; height:16px;"></i> Save as PDF</button>
          </div>
        </div>
      </div>
    </div>
  `;

  bindEvents();
  populateInputFormats();
  createIcons({
    icons: ICONS
  });
  // Note: we'll call createIcons() again after dynamic updates
}

// ─── Populate Formats ───

function populateInputFormats() {
  const select = document.getElementById('input-format');
  const formats = getInputFormats();

  const grouped = {};
  formats.forEach(fmt => {
    const info = FORMAT_INFO[fmt];
    if (!info) return;
    const cat = info.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(fmt);
  });

  const catNames = {
    images: 'Images', documents: 'Documents', spreadsheets: 'Spreadsheets',
    developer: 'Developer', audio: 'Audio', video: 'Video',
  };

  select.innerHTML = '<option value="">Select format...</option>';
  for (const [cat, fmts] of Object.entries(grouped)) {
    const group = document.createElement('optgroup');
    group.label = catNames[cat] || cat;
    fmts.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f.toUpperCase();
      group.appendChild(opt);
    });
    select.appendChild(group);
  }
}

function populateOutputFormats() {
  const outputSelect = document.getElementById('output-format');
  if (!inputFormat) {
    outputSelect.disabled = true;
    outputSelect.innerHTML = '<option value="">Select format...</option>';
    outputFormat = '';
    updateBtn();
    return;
  }

  const available = getAvailableOutputFormats(inputFormat);
  outputSelect.disabled = false;
  outputSelect.innerHTML = '<option value="">Select format...</option>';

  const grouped = {};
  available.forEach(fmt => {
    const info = FORMAT_INFO[fmt];
    const cat = info?.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(fmt);
  });

  const catNames = {
    images: 'Images', documents: 'Documents', spreadsheets: 'Spreadsheets',
    developer: 'Developer', audio: 'Audio', video: 'Video', other: 'Other',
  };

  for (const [cat, fmts] of Object.entries(grouped)) {
    const group = document.createElement('optgroup');
    group.label = catNames[cat] || cat;
    fmts.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f.toUpperCase();
      group.appendChild(opt);
    });
    outputSelect.appendChild(group);
  }

  if (available.includes(outputFormat)) {
    outputSelect.value = outputFormat;
  } else {
    outputFormat = '';
  }
  updateBtn();
}

// ─── Events ───

function bindEvents() {
  const $ = id => document.getElementById(id);

  $('input-format').addEventListener('change', e => {
    inputFormat = e.target.value;
    $('file-input').accept = inputFormat ? `.${inputFormat}` : '';
    populateOutputFormats();
  });

  $('output-format').addEventListener('change', e => {
    outputFormat = e.target.value;
    updateBtn();
  });

  $('theme-toggle').addEventListener('click', toggleTheme);

  $('swap-btn').addEventListener('click', () => {
    if (!inputFormat || !outputFormat) return;
    if (!canConvert(outputFormat, inputFormat)) {
      showToast('⚠️ Reverse not available');
      return;
    }
    [inputFormat, outputFormat] = [outputFormat, inputFormat];
    $('input-format').value = inputFormat;
    populateOutputFormats();
    $('output-format').value = outputFormat;
    updateBtn();
  });

  const dropzone = $('dropzone');
  const fileInput = $('file-input');

  dropzone.addEventListener('click', () => fileInput.click());
  $('add-more-btn').addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', e => { e.preventDefault(); dropzone.classList.remove('drag-over'); });
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer?.files?.length) addFiles(Array.from(e.dataTransfer.files));
  });
  fileInput.addEventListener('change', e => {
    if (e.target.files?.length) addFiles(Array.from(e.target.files));
    e.target.value = ''; // reset so same files can be selected again
  });

  $('convert-btn').addEventListener('click', handleConvert);
  $('download-btn').addEventListener('click', handleDownload);
  $('convert-another-btn').addEventListener('click', resetAll);

  // Editor Modal Events
  $('editor-btn').addEventListener('click', () => {
    $('editor-modal').classList.add('active');
    $('editor-textarea').focus();
  });

  $('editor-close').addEventListener('click', () => {
    $('editor-modal').classList.remove('active');
  });

  // Close modal when clicking outside
  $('editor-modal').addEventListener('click', (e) => {
    if (e.target === $('editor-modal')) {
      $('editor-modal').classList.remove('active');
    }
  });

  $('save-pdf-btn').addEventListener('click', () => handleEditorConvert('pdf'));
  $('save-docx-btn').addEventListener('click', () => handleEditorConvert('docx'));
}

// ─── Theme ───

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);

  const toggleBtn = document.getElementById('theme-toggle');
  // Reconstruct the icon element so createIcons can attach to it
  toggleBtn.innerHTML = `<i data-lucide="${next === 'light' ? 'moon' : 'sun'}"></i>`;
  createIcons({
    icons: { Moon, Sun }
  });
}

// ─── File Handling ───

function addFiles(files) {
  if (!files.length) return;

  let validFiles = [];
  let rejectedCount = 0;

  for (const file of files) {
    const format = detectFormat(file);

    // Auto-detect format from the very first valid file
    if (!inputFormat) {
      if (format && FORMAT_INFO[format]) {
        inputFormat = format;
        document.getElementById('input-format').value = format;
        populateOutputFormats();

        // Lock subsequent file uploads to this format via OS dialog
        document.getElementById('file-input').accept = `.${format}`;

        validFiles.push(file);
      } else {
        rejectedCount++;
      }
    } else {
      // Enforce the same format for subsequent files
      if (format === inputFormat) {
        validFiles.push(file);
      } else {
        rejectedCount++;
      }
    }
  }

  if (rejectedCount > 0) {
    showToast(`⚠️ Skipped ${rejectedCount} file(s) with mismatched formats.`);
  }

  if (!validFiles.length) return;

  selectedFiles = [...selectedFiles, ...validFiles];
  renderFileList();

  document.getElementById('dropzone').style.display = 'none';
  document.getElementById('file-list').style.display = 'flex';
  document.getElementById('add-more-container').style.display = 'block';

  hideResults();
  convertedBlob = null;
  updateBtn();
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  if (selectedFiles.length === 0) {
    resetAll();
  } else {
    renderFileList();
    updateBtn();
  }
}

window.removeFileItem = removeFile; // expose for inline onclick

function renderFileList() {
  const list = document.getElementById('file-list');
  list.innerHTML = selectedFiles.map((f, i) => {
    const format = detectFormat(f);
    const iconName = getFileIcon(format || '');
    return `
      <div class="file-info active" style="margin-bottom:0;">
        <div class="file-icon"><i data-lucide="${iconName}"></i></div>
        <div class="file-details">
          <div class="file-name" title="${f.name}">${f.name}</div>
          <div class="file-size">${formatFileSize(f.size)}</div>
        </div>
        <button class="file-remove" onclick="removeFileItem(${i})" title="Remove"><i data-lucide="x" style="width:14px; height:14px;"></i></button>
      </div>
    `;
  }).join('');
  createIcons({ icons: ICONS });
}

// ─── Conversion ───

function updateBtn() {
  const btn = document.getElementById('convert-btn');
  btn.disabled = !(selectedFiles.length > 0 && inputFormat && outputFormat);
  if (selectedFiles.length > 1) {
    btn.textContent = `Convert ${selectedFiles.length} files`;
  } else {
    btn.textContent = 'Convert';
  }
}

async function handleConvert() {
  if (selectedFiles.length === 0 || !inputFormat || !outputFormat) return;

  const btn = document.getElementById('convert-btn');
  const progress = document.getElementById('progress-section');
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  const pct = document.getElementById('progress-percent');

  hideResults();
  progress.classList.add('active');
  btn.disabled = true;
  btn.classList.add('converting');
  btn.textContent = 'Converting...';
  fill.style.width = '0%';

  document.getElementById('add-more-container').style.display = 'none';
  // Hide remove buttons during conversion
  document.querySelectorAll('.file-remove').forEach(el => el.style.display = 'none');

  try {
    if (selectedFiles.length === 1) {
      // Single file conversion
      const file = selectedFiles[0];
      const result = await convert(file, inputFormat, outputFormat, p => {
        fill.style.width = `${p}%`;
        pct.textContent = `${p}%`;
        text.textContent = p < 30 ? 'Reading...' : p < 80 ? 'Converting...' : 'Finishing...';
      });
      convertedBlob = result;
      convertedFilename = file.name.replace(/\.[^.]+$/, '') + '.' + outputFormat;
    } else {
      // Batch conversion
      const zipObj = {};
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Progress for batch: base % + file %
        const basePct = (i / selectedFiles.length) * 100;
        const fileWeight = (1 / selectedFiles.length) * 100;

        text.textContent = `Converting ${i + 1} of ${selectedFiles.length} (${file.name})...`;

        const resultBlob = await convert(file, inputFormat, outputFormat, p => {
          const currentTotalPct = Math.round(basePct + (p / 100) * fileWeight);
          fill.style.width = `${currentTotalPct}%`;
          pct.textContent = `${currentTotalPct}%`;
        });

        const arrayBuffer = await resultBlob.arrayBuffer();
        const baseName = file.name.replace(/\.[^.]+$/, '');
        let newName = `${baseName}.${outputFormat}`;

        // Handle name collisions in the zip
        let counter = 1;
        while (zipObj[newName]) {
          newName = `${baseName} (${counter}).${outputFormat}`;
          counter++;
        }

        zipObj[newName] = new Uint8Array(arrayBuffer);
      }

      text.textContent = 'Zipping files...';

      const zipData = await new Promise((resolve, reject) => {
        zip(zipObj, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      convertedBlob = new Blob([zipData], { type: 'application/zip' });
      convertedFilename = `OmniConvert_Batch_${Date.now()}.zip`;
    }

    fill.style.width = '100%';
    pct.textContent = '100%';

    setTimeout(() => {
      progress.classList.remove('active');
      btn.classList.remove('converting');
      document.getElementById('download-section').classList.add('active');
    }, 400);
  } catch (err) {
    console.error(err);
    progress.classList.remove('active');
    btn.classList.remove('converting');
    document.getElementById('error-section').classList.add('active');
    document.getElementById('error-text').textContent = err.message;
    // Restore remove buttons on error
    document.querySelectorAll('.file-remove').forEach(el => el.style.display = 'flex');
    document.getElementById('add-more-container').style.display = 'block';
  } finally {
    updateBtn(); // resets the text based on selection length
  }
}

async function handleEditorConvert(format) {
  const text = document.getElementById('editor-textarea').value.trim();
  if (!text) {
    showToast('⚠️ Please enter some text first');
    return;
  }

  const pdfBtn = document.getElementById('save-pdf-btn');
  const docxBtn = document.getElementById('save-docx-btn');
  const progress = document.getElementById('editor-progress');
  const fill = document.getElementById('editor-progress-fill');
  const statusText = document.getElementById('editor-progress-text');
  const pct = document.getElementById('editor-progress-percent');

  pdfBtn.disabled = true;
  docxBtn.disabled = true;
  progress.style.display = 'block';
  fill.style.width = '0%';
  pct.textContent = '0%';
  statusText.textContent = `Converting to ${format.toUpperCase()}...`;

  try {
    const file = new Blob([text], { type: "text/plain" });
    file.name = "document.txt";
    const resultBlob = await convert(file, 'txt', format, p => {
      fill.style.width = `${p}%`;
      pct.textContent = `${p}%`;
    });

    fill.style.width = '100%';
    pct.textContent = '100%';
    statusText.textContent = 'Complete!';

    setTimeout(() => {
      saveAs(resultBlob, `document.${format}`);
      progress.style.display = 'none';
      pdfBtn.disabled = false;
      docxBtn.disabled = false;
    }, 500);

  } catch (err) {
    console.error(err);
    statusText.textContent = 'Error: ' + err.message;
    pdfBtn.disabled = false;
    docxBtn.disabled = false;
  }
}

function handleDownload() {
  if (!convertedBlob) return;
  saveAs(convertedBlob, convertedFilename);
  showToast('Downloaded');
}

function resetAll() {
  selectedFiles = [];
  convertedBlob = null;
  convertedFilename = '';
  document.getElementById('file-list').innerHTML = '';
  document.getElementById('file-list').style.display = 'none';
  document.getElementById('dropzone').style.display = '';
  document.getElementById('file-input').value = '';
  document.getElementById('file-input').accept = '';
  document.getElementById('add-more-container').style.display = 'none';

  inputFormat = '';
  outputFormat = '';
  document.getElementById('input-format').value = '';
  document.getElementById('output-format').value = '';
  document.getElementById('output-format').disabled = true;
  document.getElementById('output-format').innerHTML = '<option value="">Select format...</option>';

  hideResults();
  updateBtn();
}

function hideResults() {
  document.getElementById('download-section').classList.remove('active');
  document.getElementById('error-section').classList.remove('active');
  document.getElementById('progress-section').classList.remove('active');
}

function showToast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 300); }, 2500);
}
