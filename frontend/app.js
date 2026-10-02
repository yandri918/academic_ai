/* ============================================
   AcademAI — Frontend Application Logic
   Handles: API calls, state, UI, Markdown render
   ============================================ */

'use strict';

// ── Config ──────────────────────────────────
// Primary config is loaded from config.js (window.ACADEM_CONFIG).
// Falls back to localhost:5678 if config.js is not loaded or URL not set.
const _cfg = window.ACADEM_CONFIG || {};
const _n8nBase = (_cfg.N8N_URL && !_cfg.N8N_URL.includes('GANTI-DENGAN'))
  ? _cfg.N8N_URL.replace(/\/$/, '')
  : 'http://localhost:5678';

const CONFIG = {
  N8N_WEBHOOK:       _n8nBase + (_cfg.WEBHOOK_PATH || '/webhook/academ-ai'),
  N8N_HEALTHCHECK:   _n8nBase + '/healthz',
  PING_INTERVAL:     _cfg.PING_INTERVAL_MS     || 15000,
  REQUEST_TIMEOUT:   _cfg.REQUEST_TIMEOUT_MS   || 120000,
  IS_RAILWAY:        _n8nBase.includes('railway.app'),
};

// ── Available Modes ──────────────────────────
const MODES = [
  { id: 'drafting',     icon: '✍️',  label: 'Drafting',      desc: 'Tulis konten akademik baru' },
  { id: 'editing',      icon: '✏️',  label: 'Editing',       desc: 'Review & perbaiki tulisan' },
  { id: 'paraphrasing', icon: '🔄',  label: 'Paraphrasing',  desc: 'Parafrase hindari plagiat' },
  { id: 'SLR',          icon: '📚',  label: 'SLR',           desc: 'Systematic Literature Review' },
  { id: 'proposal',     icon: '📋',  label: 'Proposal',      desc: 'Buat proposal penelitian' },
  { id: 'abstract',     icon: '📄',  label: 'Abstract',      desc: 'Abstrak Indonesia + Inggris' },
  { id: 'statistics',   icon: '📊',  label: 'Statistics',    desc: 'Interpretasi hasil SPSS/R' },
];

const GENERATE_STEPS = [
  { id: 'research',   label: '🔍 Riset\nJurnal' },
  { id: 'abstrak',    label: '📄\nAbstrak' },
  { id: 'bab1',       label: '📖\nBAB I' },
  { id: 'bab2',       label: '📚\nBAB II' },
  { id: 'bab3',       label: '⚙️\nBAB III' },
  { id: 'bab4',       label: '📊\nBAB IV' },
  { id: 'bab5',       label: '🏁\nBAB V' },
  { id: 'pustaka',    label: '📑\nDaftar\nPustaka' },
];

// ── Application State ────────────────────────
const state = {
  sessionId: null,
  currentMode: 'drafting',
  currentDiscipline: 'general_academic',
  isLoading: false,
  messages: [],
  generatedContent: '',
  isConnected: false,
};

// ── Utility Functions ────────────────────────
function generateSessionId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substr(2, 6);
  return `academ_${ts}_${rand}`;
}

function formatTime(iso = new Date().toISOString()) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function renderMarkdown(md) {
  if (window.marked && window.DOMPurify) {
    try {
      marked.setOptions({ breaks: true, gfm: true });
      const dirty = marked.parse(md);
      return DOMPurify.sanitize(dirty);
    } catch (e) { /* fallback */ }
  }
  // Fallback: basic linebreak handling
  return escapeHtml(md).replace(/\n/g, '<br>');
}

// ── Toast Notification ───────────────────────
function toast(message, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
  const container = document.getElementById('toast-container');

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span>
    <span>${escapeHtml(message)}</span>
  `;
  el.setAttribute('role', 'alert');
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove());
  }, duration);
}

// ── API Call ─────────────────────────────────
async function callAcademAI(payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

  try {
    const response = await fetch(CONFIG.N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('Server AcademAI merespons kosong. Pastikan server lokal berjalan dan API Key Gemini aktif di .env.');
    }

    try {
      const data = JSON.parse(text);
      return data;
    } catch (parseErr) {
      throw new Error(`Gagal parse JSON dari server: ${text.substring(0, 150)}...`);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('Request timeout (2 menit). Server mungkin sedang memproses, coba lagi.');
    throw err;
  }
}

// ── Connection Status Check ──────────────────
async function checkConnection() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  try {
    const r = await fetch(CONFIG.N8N_HEALTHCHECK, {
      method: 'GET',
      signal: AbortSignal.timeout(4000),
    });
    if (r.ok || r.status === 401) {
      dot.className = 'status-dot';
      text.textContent = 'AcademAI Online';
      state.isConnected = true;
      return;
    }
  } catch (_) { /* ignore */ }
  dot.className = 'status-dot offline';
  text.textContent = 'Offline';
  state.isConnected = false;
}

// ── Tab Switching ────────────────────────────
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });

  document.getElementById(`tab-${tabId}`).classList.add('active');
  const activeBtn = document.getElementById(`tab-${tabId}-btn`);
  activeBtn.classList.add('active');
  activeBtn.setAttribute('aria-selected', 'true');
}

// ── Mode Dropdown ────────────────────────────
function buildModeDropdown() {
  const dd = document.getElementById('mode-dropdown');
  dd.innerHTML = MODES.map(m => `
    <div class="mode-option ${m.id === state.currentMode ? 'selected' : ''}"
         role="option" aria-selected="${m.id === state.currentMode}"
         onclick="selectMode('${m.id}')" tabindex="0"
         onkeydown="if(event.key==='Enter')selectMode('${m.id}')">
      <span class="mode-option-icon" aria-hidden="true">${m.icon}</span>
      <div>
        <div>${m.label}</div>
        <span class="mode-option-desc">${m.desc}</span>
      </div>
    </div>
  `).join('');
}

function toggleModeDropdown() {
  const dd = document.getElementById('mode-dropdown');
  const btn = document.getElementById('mode-badge-btn');
  const isHidden = dd.classList.contains('hidden');

  if (isHidden) {
    buildModeDropdown();
    dd.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    // Close on outside click
    setTimeout(() => document.addEventListener('click', closeModeDropdown, { once: true }), 0);
  } else {
    dd.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
  }
}

function closeModeDropdown(e) {
  const wrap = document.getElementById('mode-wrap');
  if (!wrap.contains(e.target)) {
    document.getElementById('mode-dropdown').classList.add('hidden');
    document.getElementById('mode-badge-btn').setAttribute('aria-expanded', 'false');
  }
}

function selectMode(modeId) {
  state.currentMode = modeId;
  const m = MODES.find(x => x.id === modeId);
  document.getElementById('mode-icon-display').textContent = m.icon;
  document.getElementById('mode-label-display').textContent = m.label;
  document.getElementById('mode-dropdown').classList.add('hidden');
  document.getElementById('mode-badge-btn').setAttribute('aria-expanded', 'false');
  toast(`Mode: ${m.label}`, 'info', 2000);
}

// ── Session Management ───────────────────────
function initSession() {
  // Try to restore from localStorage
  const saved = localStorage.getItem('academ_session_id');
  state.sessionId = saved || generateSessionId();
  localStorage.setItem('academ_session_id', state.sessionId);
  document.getElementById('session-id-text').textContent = state.sessionId;
}

function newSession() {
  state.sessionId = generateSessionId();
  localStorage.setItem('academ_session_id', state.sessionId);
  state.messages = [];
  document.getElementById('session-id-text').textContent = state.sessionId;
  clearChatMessages();
  toast('Sesi baru dimulai', 'success', 2000);
}

// ── Chat ─────────────────────────────────────
function clearChatMessages() {
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';
  renderEmptyState();
}

function renderEmptyState() {
  const container = document.getElementById('chat-messages');
  if (state.messages.length === 0) {
    container.innerHTML = `
      <div class="chat-empty" id="chat-empty">
        <div class="chat-empty-icon" aria-hidden="true">🎓</div>
        <h3>Selamat datang di AcademAI</h3>
        <p>Asisten riset & penulisan artikel ilmiah berbasis AI untuk mahasiswa, dosen, dan peneliti Indonesia.</p>
        <div class="chat-suggestions" role="group" aria-label="Saran pertanyaan">
          <button class="suggestion-chip" onclick="sendSuggestion(this)">✍️ Bantu tulis latar belakang penelitian</button>
          <button class="suggestion-chip" onclick="sendSuggestion(this)">📊 Buat tabel penelitian terdahulu</button>
          <button class="suggestion-chip" onclick="sendSuggestion(this)">🔄 Parafrase untuk hindari plagiat</button>
          <button class="suggestion-chip" onclick="sendSuggestion(this)">📄 Buat abstrak Indonesia & Inggris</button>
          <button class="suggestion-chip" onclick="sendSuggestion(this)">📈 Interpretasikan hasil SPSS saya</button>
        </div>
      </div>`;
  }
}

function sendSuggestion(el) {
  const text = el.textContent.replace(/^[^\w]+/, '').trim();
  document.getElementById('chat-input').value = text;
  sendChatMessage();
}

function appendMessage(role, content, timestamp = new Date().toISOString()) {
  const container = document.getElementById('chat-messages');

  // Remove empty state
  const empty = document.getElementById('chat-empty');
  if (empty) empty.remove();

  const isUser = role === 'user';
  const avatarContent = isUser ? '👤' : '🎓';
  const renderedContent = isUser ? escapeHtml(content).replace(/\n/g, '<br>') : renderMarkdown(content);

  const msgId = `msg-${Date.now()}`;
  const row = document.createElement('div');
  row.className = `msg-row ${role}`;
  row.id = msgId;

  row.innerHTML = `
    <div class="msg-avatar ${role}" aria-hidden="true">${avatarContent}</div>
    <div>
      <div class="msg-bubble ${role} md-body">${renderedContent}</div>
      <div class="msg-meta">
        <span>${isUser ? 'Anda' : 'AcademAI'}</span>
        <span>${formatTime(timestamp)}</span>
        ${!isUser ? `
        <div class="msg-actions">
          <button class="msg-action-btn" onclick="copyMessageContent('${msgId}')" aria-label="Salin pesan">📋 Salin</button>
        </div>` : ''}
      </div>
    </div>
  `;

  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
  return msgId;
}

function appendTypingIndicator() {
  const container = document.getElementById('chat-messages');
  const wrap = document.createElement('div');
  wrap.className = 'msg-row';
  wrap.id = 'typing-indicator-row';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar ai';
  avatar.textContent = '🎓';
  avatar.setAttribute('aria-hidden', 'true');

  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.setAttribute('aria-label', 'AcademAI sedang mengetik');
  indicator.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;

  wrap.appendChild(avatar);
  wrap.appendChild(indicator);
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator-row');
  if (el) el.remove();
}

function setInputLoading(isLoading) {
  state.isLoading = isLoading;
  const btn = document.getElementById('chat-send-btn');
  const input = document.getElementById('chat-input');
  btn.disabled = isLoading;
  input.disabled = isLoading;

  if (isLoading) {
    btn.innerHTML = `<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
  } else {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`;
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message || state.isLoading) return;

  const discipline = document.getElementById('chat-discipline').value;

  // Show user message
  appendMessage('user', message);
  state.messages.push({ role: 'user', content: message });
  input.value = '';
  autoResizeTextarea(input);

  setInputLoading(true);
  appendTypingIndicator();

  try {
    const payload = {
      sessionId: state.sessionId,
      mode: state.currentMode,
      discipline,
      message,
      citationFormat: 'APA7',
      language: 'indonesia',
    };

    const result = await callAcademAI(payload);
    removeTypingIndicator();

    // Extract AI response content
    const content = result?.document?.content
      || result?.output
      || result?.text
      || result?.message
      || JSON.stringify(result, null, 2);

    appendMessage('ai', content);
    state.messages.push({ role: 'ai', content });
  } catch (err) {
    removeTypingIndicator();
    const errMsg = `❌ **Gagal memproses permintaan**: ${err.message}\n\nPastikan:\n1. Server AcademAI berjalan di \`http://localhost:3000\`\n2. Koneksi internet stabil\n3. GEMINI_API_KEY valid di file \`.env\``;
    appendMessage('ai', errMsg);
    toast(err.message, 'error');
  } finally {
    setInputLoading(false);
  }
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 150) + 'px';
}

function copyMessageContent(msgId) {
  const row = document.getElementById(msgId);
  if (!row) return;
  const bubble = row.querySelector('.msg-bubble');
  if (!bubble) return;
  const text = bubble.innerText;
  navigator.clipboard.writeText(text).then(() => toast('Pesan disalin!', 'success', 2000)).catch(() => toast('Gagal menyalin', 'error'));
}

// ── Generate Full ────────────────────────────
let generateOutputRaw = '';

function buildProgressSteps(activeIndex = -1, doneIndices = []) {
  const container = document.getElementById('gen-progress');
  container.innerHTML = GENERATE_STEPS.map((s, i) => {
    const isDone = doneIndices.includes(i);
    const isActive = i === activeIndex;
    const cls = isDone ? 'done' : isActive ? 'active' : '';
    const label = s.label.replace('\n', '<br>');
    return `
      <div class="progress-step ${cls}" role="group" aria-label="${s.label.replace('\n', ' ')} ${isDone ? '(selesai)' : isActive ? '(aktif)' : ''}">
        <div class="step-circle">${isDone ? '✓' : i + 1}</div>
        <div class="step-label">${label}</div>
      </div>`;
  }).join('');
  container.style.display = 'flex';
}

function renderOutputSkeleton() {
  const body = document.getElementById('gen-output-body');
  body.innerHTML = Array(8).fill(0).map((_, i) => `
    <div class="skeleton skeleton-line" style="width:${i % 3 === 2 ? '60%' : '100%'};margin-bottom:12px;"></div>
  `).join('');
}

function renderOutputContent(markdown) {
  generateOutputRaw = markdown;
  const body = document.getElementById('gen-output-body');
  body.innerHTML = `<div class="md-body">${renderMarkdown(markdown)}</div>`;

  // Show toolbar actions
  document.getElementById('copy-btn').style.display = '';
  document.getElementById('download-btn').style.display = '';
  document.getElementById('output-title').textContent = '📄 Dokumen Tergenerate';
}

async function generateFull() {
  const topic = document.getElementById('gen-topic').value.trim();
  if (!topic) {
    toast('Topik penelitian wajib diisi!', 'warn');
    document.getElementById('gen-topic').focus();
    return;
  }

  const discipline    = document.getElementById('gen-discipline').value;
  const language      = document.getElementById('gen-language').value;
  const journalCount  = parseInt(document.getElementById('gen-journal-count').value);
  const yearFilter    = document.getElementById('gen-year-filter').value;
  const citationFormat = document.getElementById('gen-citation-format').value;

  // Disable button
  const btn = document.getElementById('gen-btn');
  btn.disabled = true;
  btn.innerHTML = `<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Generating…`;

  document.getElementById('gen-status-text').textContent = 'Memproses…';
  buildProgressSteps(0, []);
  renderOutputSkeleton();
  document.getElementById('copy-btn').style.display = 'none';
  document.getElementById('download-btn').style.display = 'none';

  // Animate progress steps
  const doneIndices = [];
  let stepInterval = setInterval(() => {
    const next = doneIndices.length;
    if (next < GENERATE_STEPS.length) {
      buildProgressSteps(next, [...doneIndices]);
      doneIndices.push(next - 1 < 0 ? -1 : next - 1); // visual only
    }
  }, 8000);

  try {
    const payload = {
      sessionId: state.sessionId,
      action: 'generate_full',
      mode: 'drafting',
      topic,
      discipline,
      language,
      citationFormat,
      options: {
        journalCount,
        yearFilter,
        runCitationValidator: document.getElementById('gen-validate-citations').checked,
      },
    };

    document.getElementById('gen-status-text').textContent = '🤖 AI sedang menulis… (estimasi 1-3 menit)';
    const result = await callAcademAI(payload);

    clearInterval(stepInterval);
    buildProgressSteps(-1, GENERATE_STEPS.map((_, i) => i)); // all done

    const content = result?.document?.content
      || result?.output
      || result?.text
      || JSON.stringify(result, null, 2);

    renderOutputContent(content);

    const wordCount = result?.document?.wordCount || content.split(/\s+/).length;
    document.getElementById('gen-status-text').textContent = `✅ Selesai · ${wordCount.toLocaleString('id-ID')} kata`;
    toast('Artikel berhasil digenerate!', 'success');
  } catch (err) {
    clearInterval(stepInterval);
    buildProgressSteps(-1, []);
    const errMd = `## ❌ Generate Gagal\n\n**Error**: ${err.message}\n\n**Langkah perbaikan:**\n1. Pastikan server lokal berjalan: \`node server.js\`\n2. Cek kuota / API Key Gemini di \`.env\`\n3. Coba ulangi dengan topik yang lebih spesifik`;
    renderOutputContent(errMd);
    document.getElementById('gen-status-text').textContent = '❌ Generate gagal';
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-14 9V3z"/></svg> Generate Artikel`;
  }
}

function resetGenerate() {
  document.getElementById('gen-topic').value = '';
  document.getElementById('gen-status-text').textContent = '';
  document.getElementById('gen-progress').style.display = 'none';
  document.getElementById('gen-output-body').innerHTML = `
    <div class="output-placeholder">
      <div class="output-placeholder-icon" aria-hidden="true">📄</div>
      <p>Dokumen akan muncul di sini setelah generate selesai</p>
    </div>`;
  document.getElementById('copy-btn').style.display = 'none';
  document.getElementById('download-btn').style.display = 'none';
  document.getElementById('output-title').textContent = 'Output Dokumen';
  generateOutputRaw = '';
  toast('Form di-reset', 'info', 1800);
}

function copyOutput() {
  if (!generateOutputRaw) return;
  navigator.clipboard.writeText(generateOutputRaw)
    .then(() => toast('Konten disalin ke clipboard!', 'success'))
    .catch(() => toast('Gagal menyalin', 'error'));
}

function downloadOutput() {
  if (!generateOutputRaw) return;
  const topic = document.getElementById('gen-topic').value.trim().slice(0, 50).replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') || 'artikel';
  const filename = `AcademAI_${topic}_${new Date().toISOString().split('T')[0]}.md`;
  const blob = new Blob([generateOutputRaw], { type: 'text/markdown; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast(`Didownload: ${filename}`, 'success');
}

// ── Citation Validator ───────────────────────
async function validateCitations() {
  const content = document.getElementById('validator-input').value.trim();
  if (!content) {
    toast('Teks kosong! Masukkan teks berisi sitasi.', 'warn');
    document.getElementById('validator-input').focus();
    return;
  }

  const btn = document.getElementById('validate-btn');
  btn.disabled = true;
  btn.innerHTML = `<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Memvalidasi…`;
  document.getElementById('validator-status').textContent = 'Menghubungi Semantic Scholar…';
  document.getElementById('validator-summary').classList.add('hidden');
  document.getElementById('validator-results').innerHTML = renderLoadingItems();

  try {
    const payload = {
      sessionId: state.sessionId,
      action: 'validate_citations',
      content,
    };

    const result = await callAcademAI(payload);
    const summary = result?.summary || { total: 0, valid: 0, partial: 0, invalid: 0 };
    const report = result?.validationReport || '';

    // Parse report text into structured items
    const items = parseValidationReport(report, summary);
    renderValidatorResults(items, summary);

    document.getElementById('validator-status').textContent = `✅ ${summary.total} sitasi divalidasi`;
    toast(`Validasi selesai: ${summary.valid} valid, ${summary.partial} perlu cek, ${summary.invalid} tidak valid`, 'success');
  } catch (err) {
    document.getElementById('validator-results').innerHTML = `
      <div class="citation-result-item">
        <div class="citation-result-header">
          <span class="citation-status-icon">❌</span>
          <span style="color:var(--c-danger)">Validasi gagal: ${escapeHtml(err.message)}</span>
        </div>
        <div class="citation-detail">Pastikan server AcademAI berjalan di http://localhost:3000.</div>
      </div>`;
    document.getElementById('validator-status').textContent = '❌ Gagal';
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Validasi Sekarang`;
  }
}

function renderLoadingItems() {
  return Array(3).fill(0).map(() => `
    <div class="citation-result-item">
      <div class="skeleton skeleton-line" style="width:100%;margin-bottom:8px;"></div>
      <div class="skeleton skeleton-line" style="width:70%;"></div>
    </div>`).join('');
}

function parseValidationReport(report, summary) {
  // Parse the plain-text report from n8n Citation Validator node
  const lines = report.split('\n');
  const items = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const statusMatch = trimmed.match(/^(✅|⚠️|❌|🔴|❓)\s+(.+?)\s+→\s+(\w+)/);
    if (statusMatch) {
      if (current) items.push(current);
      current = {
        icon: statusMatch[1],
        raw: statusMatch[2],
        status: statusMatch[3],
        detail: null,
        suggestion: null,
      };
    } else if (current && trimmed.startsWith('📄')) {
      current.detail = trimmed.replace(/^📄\s*/, '');
    } else if (current && trimmed.startsWith('💬')) {
      current.suggestion = trimmed.replace(/^💬\s*/, '');
    }
  }
  if (current) items.push(current);

  // If parsing failed, create a single raw item
  if (items.length === 0 && report) {
    items.push({ icon: 'ℹ️', raw: 'Hasil Validasi', status: 'INFO', detail: report, suggestion: null });
  }

  return items;
}

function renderValidatorResults(items, summary) {
  // Summary stats
  document.getElementById('stat-total').textContent = summary.total;
  document.getElementById('stat-valid').textContent = summary.valid;
  document.getElementById('stat-partial').textContent = summary.partial;
  document.getElementById('stat-invalid').textContent = summary.invalid;
  document.getElementById('validator-summary').classList.remove('hidden');

  // Item chips
  const statusChip = {
    VALID:   { cls: 'chip-success', label: 'Valid' },
    PARTIAL: { cls: 'chip-warn',    label: 'Perlu Cek' },
    INVALID: { cls: 'chip-danger',  label: 'Tidak Valid' },
    ERROR:   { cls: 'chip-danger',  label: 'Error' },
    INFO:    { cls: 'chip-primary', label: 'Info' },
    UNKNOWN: { cls: 'chip-warn',    label: 'Tidak Diketahui' },
  };

  const container = document.getElementById('validator-results');
  container.innerHTML = items.map(item => {
    const chip = statusChip[item.status] || statusChip.UNKNOWN;
    return `
      <div class="citation-result-item" role="listitem">
        <div class="citation-result-header">
          <span class="citation-status-icon" aria-hidden="true">${item.icon}</span>
          <span class="citation-raw">${escapeHtml(item.raw)}</span>
          <span class="chip ${chip.cls} citation-status-badge">${chip.label}</span>
        </div>
        ${item.detail ? `<div class="citation-detail">📄 ${escapeHtml(item.detail)}</div>` : ''}
        ${item.suggestion ? `<div class="citation-suggestion">💬 ${escapeHtml(item.suggestion)}</div>` : ''}
      </div>`;
  }).join('');
}

function clearValidator() {
  document.getElementById('validator-input').value = '';
  document.getElementById('validator-results').innerHTML = '';
  document.getElementById('validator-summary').classList.add('hidden');
  document.getElementById('validator-status').textContent = '';
  toast('Input dihapus', 'info', 1500);
}

// ── Initialization ───────────────────────────
function init() {
  initSession();
  buildModeDropdown();
  checkConnection();
  setInterval(checkConnection, CONFIG.PING_INTERVAL);

  // Set default mode display
  const defaultMode = MODES.find(m => m.id === state.currentMode);
  if (defaultMode) {
    document.getElementById('mode-icon-display').textContent = defaultMode.icon;
    document.getElementById('mode-label-display').textContent = defaultMode.label;
  }

  // Auto-resize chat textarea on load
  const chatInput = document.getElementById('chat-input');
  chatInput.addEventListener('input', () => autoResizeTextarea(chatInput));
}

// Wait for DOM + scripts
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
