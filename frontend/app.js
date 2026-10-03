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
  MEMORY_API:        _n8nBase + '/api/memory',
  PDF_UPLOAD_API:    _n8nBase + '/api/pdf/upload',
  PLAGIARISM_API:    _n8nBase + '/api/plagiarism/check',
  PING_INTERVAL:     _cfg.PING_INTERVAL_MS     || 15000,
  REQUEST_TIMEOUT:   _cfg.REQUEST_TIMEOUT_MS   || 120000,
  IS_RAILWAY:        _n8nBase.includes('railway.app'),
};

// ── Available Modes (Localized) ───────────────
function getModes() {
  const _t = (k, fb) => (window.t ? window.t(k) : fb);
  return [
    { id: 'drafting',     icon: '✍️',  label: _t('chat.mode.drafting.label', 'Drafting'),      desc: _t('chat.mode.drafting.desc', 'Tulis konten akademik baru') },
    { id: 'editing',      icon: '✏️',  label: _t('chat.mode.editing.label', 'Editing'),       desc: _t('chat.mode.editing.desc', 'Review & perbaiki tulisan') },
    { id: 'paraphrasing', icon: '🔄',  label: _t('chat.mode.paraphrasing.label', 'Paraphrasing'),  desc: _t('chat.mode.paraphrasing.desc', 'Parafrase hindari plagiat') },
    { id: 'SLR',          icon: '📚',  label: _t('chat.mode.slr.label', 'SLR'),           desc: _t('chat.mode.slr.desc', 'Systematic Literature Review') },
    { id: 'proposal',     icon: '📋',  label: _t('chat.mode.proposal.label', 'Proposal'),      desc: _t('chat.mode.proposal.desc', 'Buat proposal penelitian') },
    { id: 'abstract',     icon: '📄',  label: _t('chat.mode.abstract.label', 'Abstract'),      desc: _t('chat.mode.abstract.desc', 'Abstrak Indonesia + Inggris') },
    { id: 'statistics',   icon: '📊',  label: _t('chat.mode.statistics.label', 'Statistics'),    desc: _t('chat.mode.statistics.desc', 'Interpretasi hasil SPSS/R') },
  ];
}

let MODES = getModes();

function getGenerateSteps() {
  const _t = (k, fb) => (window.t ? window.t(k) : fb);
  return [
    { id: 'research',   label: _t('step.research', '🔍 Riset\nJurnal') },
    { id: 'abstrak',    label: _t('step.abstrak', '📄\nAbstrak') },
    { id: 'bab1',       label: _t('step.bab1', '📖\nBAB I') },
    { id: 'bab2',       label: _t('step.bab2', '📚\nBAB II') },
    { id: 'bab3',       label: _t('step.bab3', '⚙️\nBAB III') },
    { id: 'bab4',       label: _t('step.bab4', '📊\nBAB IV') },
    { id: 'bab5',       label: _t('step.bab5', '🏁\nBAB V') },
    { id: 'pustaka',    label: _t('step.pustaka', '📑\nDaftar\nPustaka') },
  ];
}

let GENERATE_STEPS = getGenerateSteps();

// ── Application State ────────────────────────
const state = {
  sessionId: null,
  currentMode: 'drafting',
  currentDiscipline: 'general_academic',
  isLoading: false,
  messages: [],
  generatedContent: '',
  isConnected: false,
  memoryDocuments: [],
  useMemory: true,
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
      let html = marked.parse(md);
      
      // Transform Mermaid blocks for dynamic rendering
      html = html.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi, (match, code) => {
        const decoded = code.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        return `<div class="mermaid" style="background:rgba(255,255,255,0.04);padding:16px;border-radius:8px;overflow-x:auto;margin:12px 0;">${decoded}</div>`;
      });

      const sanitized = DOMPurify.sanitize(html, {
        ADD_TAGS: ['svg', 'g', 'rect', 'line', 'text', 'title', 'circle', 'path'],
        ADD_ATTR: ['viewBox', 'width', 'height', 'transform', 'fill', 'stroke', 'font-size', 'font-weight', 'stroke-width', 'stroke-dasharray', 'text-anchor', 'rx', 'class', 'style']
      });

      setTimeout(() => {
        if (window.mermaid) {
          try {
            mermaid.run({ querySelector: '.mermaid' });
          } catch(e) {}
        }
      }, 120);

      return sanitized;
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
  fetchMemoryDocuments();
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
          <button class="msg-action-btn" onclick="saveChatMessageToMemory('${msgId}')" aria-label="Simpan ke memori konteks">🧠 Simpan ke Memori</button>
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
      useMemory: state.useMemory,
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
  const docxBtn = document.getElementById('download-docx-btn');
  if (docxBtn) docxBtn.style.display = '';
  const saveMemBtn = document.getElementById('save-mem-btn');
  const continueBtn = document.getElementById('continue-chat-btn');
  if (saveMemBtn) saveMemBtn.style.display = '';
  if (continueBtn) continueBtn.style.display = '';
  const isEn = window.getLanguage && getLanguage() === 'en';
  document.getElementById('output-title').textContent = isEn ? '📄 Generated Document' : '📄 Dokumen Tergenerate';
}

async function generateFull() {
  const topic = document.getElementById('gen-topic').value.trim();
  if (!topic) {
    const isEn = window.getLanguage && getLanguage() === 'en';
    toast(isEn ? 'Research topic is required!' : 'Topik penelitian wajib diisi!', 'warn');
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
  btn.innerHTML = `<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> ${window.t ? t('gen.btn_generating') : 'Generating…'}`;

  document.getElementById('gen-status-text').textContent = window.t ? t('gen.status_processing') : 'Memproses…';
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

    document.getElementById('gen-status-text').textContent = window.t ? t('gen.status_writing') : '🤖 AI sedang menulis… (estimasi 1-3 menit)';
    const result = await callAcademAI(payload);

    clearInterval(stepInterval);
    buildProgressSteps(-1, GENERATE_STEPS.map((_, i) => i)); // all done

    const content = result?.document?.content
      || result?.output
      || result?.text
      || JSON.stringify(result, null, 2);

    renderOutputContent(content);

    const isEn = window.getLanguage && getLanguage() === 'en';
    const wordCount = result?.document?.wordCount || content.split(/\s+/).length;
    const wordFormatted = wordCount.toLocaleString(isEn ? 'en-US' : 'id-ID');
    document.getElementById('gen-status-text').textContent = window.t
      ? t('gen.status_done', { words: wordFormatted })
      : `✅ Selesai · ${wordFormatted} kata`;
    toast(window.t ? t('toast.memory_saved') : 'Artikel berhasil digenerate & otomatis tersimpan ke Memori!', 'success');
    fetchMemoryDocuments();
  } catch (err) {
    clearInterval(stepInterval);
    buildProgressSteps(-1, []);
    const isEn = window.getLanguage && getLanguage() === 'en';
    const errMd = isEn
      ? `## ❌ Generation Failed\n\n**Error**: ${err.message}\n\n**Troubleshooting steps:**\n1. Ensure local server is running: \`node server.js\`\n2. Verify Gemini API Key quota in \`.env\`\n3. Try again with a more specific topic`
      : `## ❌ Generate Gagal\n\n**Error**: ${err.message}\n\n**Langkah perbaikan:**\n1. Pastikan server lokal berjalan: \`node server.js\`\n2. Cek kuota / API Key Gemini di \`.env\`\n3. Coba ulangi dengan topik yang lebih spesifik`;
    renderOutputContent(errMd);
    document.getElementById('gen-status-text').textContent = window.t ? t('gen.status_failed') : '❌ Generate gagal';
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-14 9V3z"/></svg> <span data-i18n="gen.btn_generate">${window.t ? t('gen.btn_generate') : 'Generate Artikel'}</span>`;
  }
}

function resetGenerate() {
  document.getElementById('gen-topic').value = '';
  document.getElementById('gen-status-text').textContent = '';
  document.getElementById('gen-progress').style.display = 'none';
  document.getElementById('gen-output-body').innerHTML = `
    <div class="output-placeholder">
      <div class="output-placeholder-icon" aria-hidden="true">📄</div>
      <p data-i18n="gen.output_placeholder">${window.t ? t('gen.output_placeholder') : 'Dokumen akan muncul di sini setelah generate selesai'}</p>
    </div>`;
  document.getElementById('copy-btn').style.display = 'none';
  document.getElementById('download-btn').style.display = 'none';
  const docxBtn = document.getElementById('download-docx-btn');
  if (docxBtn) docxBtn.style.display = 'none';
  const saveMemBtn = document.getElementById('save-mem-btn');
  const continueBtn = document.getElementById('continue-chat-btn');
  if (saveMemBtn) saveMemBtn.style.display = 'none';
  if (continueBtn) continueBtn.style.display = 'none';
  document.getElementById('output-title').textContent = window.t ? t('gen.output_title') : 'Output Dokumen';
  generateOutputRaw = '';
  toast(window.t ? t('toast.reset_done') : 'Form di-reset', 'info', 1800);
}

function copyOutput() {
  if (!generateOutputRaw) return;
  navigator.clipboard.writeText(generateOutputRaw)
    .then(() => toast(window.t ? t('toast.copied') : 'Konten disalin ke clipboard!', 'success'))
    .catch(() => toast(window.t ? t('toast.copy_failed') : 'Gagal menyalin', 'error'));
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

async function downloadOutputDocx() {
  if (!generateOutputRaw) return;
  const topic = document.getElementById('gen-topic').value.trim() || 'Naskah_Akademik';
  const cleanTopic = topic.slice(0, 50).replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || 'Dokumen_Skripsi';
  const filename = `AcademAI_${cleanTopic}_${new Date().toISOString().split('T')[0]}.docx`;

  const btn = document.getElementById('download-docx-btn');
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<svg class="spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Membuat Word...`;
  }

  try {
    const res = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: topic,
        content: generateOutputRaw
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast(`📥 Dokumen Word berhasil didownload: ${filename}`, 'success');
  } catch (e) {
    toast(`Gagal download Word: ${e.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
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

// ── Initialization & Localization ─────────────
function refreshLocalizedElements() {
  MODES = getModes();
  GENERATE_STEPS = getGenerateSteps();

  const currentM = MODES.find(m => m.id === state.currentMode) || MODES[0];
  const iconDisplay = document.getElementById('mode-icon-display');
  const labelDisplay = document.getElementById('mode-label-display');
  if (iconDisplay) iconDisplay.textContent = currentM.icon;
  if (labelDisplay) labelDisplay.textContent = currentM.label;

  buildModeDropdown();
  updateMemoryUI();

  // If output placeholder is showing, update text
  const placeholderEl = document.querySelector('#gen-output-body .output-placeholder p');
  if (placeholderEl && window.t) {
    placeholderEl.textContent = t('gen.output_placeholder');
  }

  // Update connection status text if connected
  if (state.isConnected) {
    const text = document.getElementById('status-text');
    if (text && window.t) text.textContent = t('header.online');
  }
}

window.onLanguageSwitched = function(lang) {
  refreshLocalizedElements();
};

function init() {
  initSession();

  // Apply saved language preference
  const savedLang = localStorage.getItem('academ_lang') || 'id';
  if (window.switchLanguage) {
    switchLanguage(savedLang);
  }

  refreshLocalizedElements();
  checkConnection();
  fetchMemoryDocuments();
  setInterval(checkConnection, CONFIG.PING_INTERVAL);

  // Auto-resize chat textarea on load
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('input', () => autoResizeTextarea(chatInput));
  }
}

// ════════════════════════════════════════════════
// ── MEMORY CONTEXT MANAGEMENT SUITE ─────────────
// ════════════════════════════════════════════════

async function fetchMemoryDocuments() {
  if (!state.sessionId) return;
  try {
    const res = await fetch(`${CONFIG.MEMORY_API}/${encodeURIComponent(state.sessionId)}`);
    if (res.ok) {
      const data = await res.json();
      state.memoryDocuments = data.documents || [];
      updateMemoryUI();
    }
  } catch (e) {
    console.warn('[Memory] Gagal mengambil dokumen memori:', e.message);
  }
}

function updateMemoryUI() {
  const count = state.memoryDocuments.length;
  const countBadge = document.getElementById('memory-count-badge');
  if (countBadge) countBadge.textContent = count;

  const banner = document.getElementById('memory-context-banner');
  const bannerText = document.getElementById('memory-banner-text');
  if (banner && bannerText) {
    if (count > 0 && state.useMemory) {
      const latestDoc = state.memoryDocuments[0];
      const previewTitle = latestDoc.title.length > 40 ? latestDoc.title.slice(0, 37) + '...' : latestDoc.title;
      const isEn = window.getLanguage && window.getLanguage() === 'en';
      const label = isEn
        ? `Active Context: <strong>${count} Document${count > 1 ? 's' : ''}</strong> ("${escapeHtml(previewTitle)}")`
        : `Konteks Aktif: <strong>${count} Dokumen</strong> ("${escapeHtml(previewTitle)}")`;
      bannerText.innerHTML = label;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  // If modal is currently open, re-render list
  const modal = document.getElementById('memory-modal');
  if (modal && !modal.classList.contains('hidden')) {
    renderMemoryModalList();
  }
}

function clearMemoryContextBanner() {
  const banner = document.getElementById('memory-context-banner');
  if (banner) banner.classList.add('hidden');
}

function openMemoryModal() {
  const modal = document.getElementById('memory-modal');
  if (!modal) return;
  renderMemoryModalList();
  modal.classList.remove('hidden');
}

function closeMemoryModal() {
  const modal = document.getElementById('memory-modal');
  if (modal) modal.classList.add('hidden');
}

function closeMemoryModalOnBackdrop(e) {
  if (e.target && e.target.id === 'memory-modal') {
    closeMemoryModal();
  }
}

function renderMemoryModalList() {
  const listEl = document.getElementById('memory-docs-list');
  if (!listEl) return;

  const isEn = window.getLanguage && window.getLanguage() === 'en';

  if (state.memoryDocuments.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:32px 16px;color:var(--t-muted);background:rgba(255,255,255,0.02);border-radius:var(--radius-sm);border:1px dashed rgba(255,255,255,0.08);">
        <div style="font-size:2rem;margin-bottom:8px;">🧠</div>
        <p style="font-size:0.9rem;font-weight:500;color:var(--t-secondary);">${window.t ? t('mem.empty_title') : 'Belum ada dokumen dalam memori riset sesi ini.'}</p>
        <p style="font-size:0.8rem;margin-top:4px;">${window.t ? t('mem.empty_sub') : 'Generate artikel pada tab "Generate Artikel" atau klik "Simpan ke Memori" pada respons chat.'}</p>
      </div>`;
    return;
  }

  listEl.innerHTML = state.memoryDocuments.map((doc, idx) => {
    const formattedDate = new Date(doc.timestamp).toLocaleString(isEn ? 'en-US' : 'id-ID', { dateStyle: 'short', timeStyle: 'short' });
    const categoryLabels = isEn ? {
      full_article: '📄 Full Article Draft',
      draft: '✍️ Draft / Chapter',
      bab1: '📖 Chapter I',
      bab2: '📚 Chapter II',
      bab3: '⚙️ Chapter III',
      abstract: '📑 Abstract',
      custom: '📝 Custom Document'
    } : {
      full_article: '📄 Draf Artikel Lengkap',
      draft: '✍️ Draf / Bab',
      bab1: '📖 Bab I',
      bab2: '📚 Bab II',
      bab3: '⚙️ Bab III',
      abstract: '📑 Abstrak',
      custom: '📝 Dokumen Manual'
    };
    const catLabel = categoryLabels[doc.type] || (isEn ? '📄 Research Document' : '📄 Dokumen Riset');

    return `
      <div class="memory-doc-card" id="mem-card-${doc.id}">
        <div class="memory-doc-header">
          <span class="memory-doc-title">${escapeHtml(doc.title)}</span>
          <span class="memory-doc-badge">${catLabel}</span>
        </div>
        <div class="memory-doc-meta">
          <span>📊 ${doc.wordCount.toLocaleString(isEn ? 'en-US' : 'id-ID')} ${isEn ? 'words' : 'kata'}</span>
          <span>🕒 ${formattedDate}</span>
          <span style="color:var(--c-accent)">${isEn ? '✓ Active Context' : '✓ Konteks Aktif'}</span>
        </div>
        <div class="memory-doc-actions">
          <button class="btn btn-accent btn-xs" onclick="useDocAsChatContinuation('${doc.id}', 'bab2')">
            ${window.t ? t('mem.action_continue_bab') : '✍️ Lanjutkan Bab II / III'}
          </button>
          <button class="btn btn-secondary btn-xs" onclick="useDocAsChatContinuation('${doc.id}', 'abstract')">
            ${window.t ? t('mem.action_create_abstract') : '📑 Buat Abstrak'}
          </button>
          <button class="btn btn-primary btn-xs" style="background:#1e40af;border-color:#3b82f6;" onclick="exportMemoryDocToDocx('${doc.id}')" title="Download naskah dalam format Word (.docx) standar 4-3-3-3 cm">
            ${window.t ? t('mem.action_word') : '📥 Word (.docx)'}
          </button>
          <button class="btn btn-ghost btn-xs" onclick="previewMemoryDoc('${doc.id}')">
            ${window.t ? t('mem.action_preview') : '👀 Pratinjau'}
          </button>
          <button class="btn btn-ghost btn-xs" style="color:var(--c-danger);margin-left:auto;" onclick="deleteMemoryDoc('${doc.id}')">
            ${window.t ? t('mem.action_delete') : '🗑️ Hapus'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function saveCurrentOutputToMemory() {
  if (!generateOutputRaw) {
    toast('Tidak ada artikel tergenerate untuk disimpan!', 'warn');
    return;
  }

  const topicInput = document.getElementById('gen-topic');
  const title = (topicInput && topicInput.value.trim()) || 'Draf Artikel Ilmiah Lengkap';

  try {
    const res = await fetch(CONFIG.MEMORY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: state.sessionId,
        title,
        content: generateOutputRaw,
        type: 'full_article'
      })
    });

    if (res.ok) {
      toast('✅ Berhasil disimpan ke Memori Konteks!', 'success');
      fetchMemoryDocuments();
    } else {
      const err = await res.json();
      toast(`Gagal simpan: ${err.error || 'Server error'}`, 'error');
    }
  } catch (e) {
    toast(`Gagal simpan memori: ${e.message}`, 'error');
  }
}

async function continueInChatWithContext() {
  // Ensure document is saved in memory
  if (generateOutputRaw) {
    await saveCurrentOutputToMemory();
  }

  // Switch to Chat tab
  switchTab('chat');

  // Pre-fill chat textarea with continuous prompt
  const topicInput = document.getElementById('gen-topic');
  const topic = (topicInput && topicInput.value.trim()) || 'draf artikel di atas';

  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.value = `Berdasarkan draf dokumen penelitian "${topic}" yang tersimpan di memori, tolong buatkan kelanjutan yang mendalam untuk:
1. Kisi-kisi instrumen observasi aktivitas anak dan guru di kelas.
2. Rubrik penilaian perkembangan anak lengkap dengan indikator BB, MB, BSH, dan BSB.
3. Rencana tindakan siklus I dan siklus II (PTK).`;
    autoResizeTextarea(chatInput);
    chatInput.focus();
  }

  toast('Konteks dokumen diaktifkan di Chat!', 'success', 2500);
}

async function saveChatMessageToMemory(msgId) {
  const row = document.getElementById(msgId);
  if (!row) return;
  const bubble = row.querySelector('.msg-bubble');
  if (!bubble) return;

  const content = bubble.innerText;
  if (!content || content.length < 20) {
    toast('Konten pesan terlalu pendek untuk dijadikan memori dokumen', 'warn');
    return;
  }

  // Extract first heading or first line as title
  const firstLine = content.split('\n')[0].replace(/^[#*\s-]+/, '').trim().slice(0, 50);
  const title = prompt('Masukkan Judul untuk Dokumen Memori ini:', firstLine || 'Draf Bagian Skripsi');
  if (!title) return;

  try {
    const res = await fetch(CONFIG.MEMORY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: state.sessionId,
        title,
        content,
        type: 'draft'
      })
    });

    if (res.ok) {
      toast(`✅ "${title}" tersimpan ke Memori Konteks!`, 'success');
      fetchMemoryDocuments();
    } else {
      toast('Gagal menyimpan ke memori', 'error');
    }
  } catch (e) {
    toast(`Error: ${e.message}`, 'error');
  }
}

async function deleteMemoryDoc(docId) {
  try {
    const res = await fetch(`${CONFIG.MEMORY_API}/${encodeURIComponent(state.sessionId)}/${encodeURIComponent(docId)}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      state.memoryDocuments = state.memoryDocuments.filter(d => d.id !== docId);
      updateMemoryUI();
      toast('Dokumen dihapus dari memori', 'info', 1500);
    }
  } catch (e) {
    toast(`Gagal hapus: ${e.message}`, 'error');
  }
}

async function clearAllSessionMemory() {
  if (!confirm('Yakin ingin mengosongkan seluruh memori dokumen di sesi ini?')) return;
  try {
    const res = await fetch(`${CONFIG.MEMORY_API}/${encodeURIComponent(state.sessionId)}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      state.memoryDocuments = [];
      updateMemoryUI();
      toast('Seluruh memori dokumen telah dikosongkan', 'success', 2000);
    }
  } catch (e) {
    toast(`Gagal mengosongkan memori: ${e.message}`, 'error');
  }
}

function promptAddNewMemoryDoc() {
  const title = prompt('Judul Dokumen Memori:', 'Konteks Latar Belakang / Teori Tambahan');
  if (!title) return;
  const content = prompt('Tempelkan teks dokumen yang ingin dimasukkan ke memori:');
  if (!content || !content.trim()) return;

  fetch(CONFIG.MEMORY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: state.sessionId,
      title,
      content,
      type: 'custom'
    })
  }).then(r => r.json()).then(data => {
    if (data.success) {
      toast('Dokumen berhasil ditambahkan ke memori', 'success');
      fetchMemoryDocuments();
    }
  }).catch(e => toast(e.message, 'error'));
}

function useDocAsChatContinuation(docId, chapterType) {
  const doc = state.memoryDocuments.find(d => d.id === docId);
  if (!doc) return;

  closeMemoryModal();
  switchTab('chat');

  const chatInput = document.getElementById('chat-input');
  if (!chatInput) return;

  if (chapterType === 'bab2') {
    chatInput.value = `Berdasarkan dokumen "${doc.title}" yang tersimpan di memori riset, tolong buatkan BAB II (Kajian Pustaka, Matriks Komparasi 5 Penelitian Terdahulu, dan Kerangka Berpikir) yang selaras dengan variabel penelitian yang sudah ada.`;
  } else if (chapterType === 'abstract') {
    chatInput.value = `Berdasarkan dokumen "${doc.title}" yang tersimpan di memori riset, buatkan ABSTRAK DWIBAHASA (Indonesia & Inggris) sesuai format IMRAD lengkap dengan Kata Kunci / Keywords.`;
  } else {
    chatInput.value = `Berdasarkan dokumen "${doc.title}" di memori, lanjutkan analisis...`;
  }

  autoResizeTextarea(chatInput);
  chatInput.focus();
  toast('Prompt kelanjutan telah disiapkan!', 'info', 2000);
}

function previewMemoryDoc(docId) {
  const doc = state.memoryDocuments.find(d => d.id === docId);
  if (!doc) return;
  alert(`=== ${doc.title} (${doc.wordCount} kata) ===\n\n` + doc.content.substring(0, 1000) + (doc.content.length > 1000 ? '\n\n...(Dipotong untuk pratinjau ringkas)' : ''));
}

async function exportMemoryDocToDocx(docId) {
  const doc = state.memoryDocuments.find(d => d.id === docId);
  if (!doc) return;

  toast(`⏳ Menyusun dokumen Word untuk "${doc.title}"...`, 'info', 2000);
  try {
    const res = await fetch(`/api/export/docx/${encodeURIComponent(state.sessionId)}/${encodeURIComponent(docId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const cleanTitle = (doc.title || 'Dokumen').slice(0, 50).replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
    const filename = `${cleanTitle}.docx`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast(`📥 Dokumen Word berhasil didownload: ${filename}`, 'success');
  } catch (e) {
    toast(`Gagal download Word: ${e.message}`, 'error');
  }
}

// ── PDF Upload & Ingestion Handlers ──────────────

function triggerPdfUpload() {
  const fileInput = document.getElementById('pdf-file-input');
  if (fileInput) {
    fileInput.value = '';
    fileInput.click();
  }
}

async function handlePdfUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    toast('Hanya file berekstensi .pdf yang diperbolehkan!', 'warn');
    return;
  }

  // Max 35MB
  if (file.size > 35 * 1024 * 1024) {
    toast('Ukuran file PDF melebihi batas maksimal 35MB', 'error');
    return;
  }

  toast(`⏳ Mengunggah & mengekstrak teks dari "${file.name}"...`, 'info', 4000);

  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('sessionId', state.sessionId);

  try {
    const response = await fetch(CONFIG.PDF_UPLOAD_API, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Gagal memproses file PDF.');
    }

    const { document: doc, meta } = result;
    toast(`✅ Berhasil ekstrak: ${meta.fileName} (${meta.pageCount} hal, ${meta.wordCount.toLocaleString('id-ID')} kata) tersimpan ke Memori!`, 'success', 4000);

    // Refresh memory list & badge
    await fetchMemoryDocuments();

    // Close modal if open and switch to chat
    closeMemoryModal();
    switchTab('chat');

    // Pre-fill chat with synthesis prompt
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.value = `Berdasarkan dokumen PDF "${doc.title}" yang baru saja saya unggah ke memori riset, tolong rangkumkan:\n1. Masalah utama dan fokus penelitian\n2. Teori dan metodologi yang digunakan\n3. Hasil temuan kunci yang relevan untuk skripsi saya`;
      autoResizeTextarea(chatInput);
      chatInput.focus();
    }
  } catch (err) {
    console.error('[PDF Upload Error]:', err);
    toast(`❌ Gagal memproses PDF: ${err.message}`, 'error', 4500);
  }
}

// ── Plagiarism & Turnitin Similarity Checker ────
let currentPlagiarismResult = null;

async function checkPlagiarism() {
  const inputEl = document.getElementById('plagiarism-input');
  const text = inputEl ? inputEl.value.trim() : '';

  if (!text || text.length < 20) {
    toast('Masukkan teks minimal 20 karakter untuk diperiksa!', 'warn');
    if (inputEl) inputEl.focus();
    return;
  }

  const btn = document.getElementById('plagiarism-btn');
  const statusEl = document.getElementById('plagiarism-status');
  btn.disabled = true;
  btn.innerHTML = `<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Memeriksa Turnitin & Scholar…`;
  if (statusEl) statusEl.textContent = 'Menganalisis kemiripan teks…';

  try {
    const response = await fetch(CONFIG.PLAGIARISM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: state.sessionId,
        text
      })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Gagal memeriksa plagiarisme');
    }

    currentPlagiarismResult = data;
    renderPlagiarismResults(data);

    if (statusEl) statusEl.textContent = `✅ Selesai: Kemiripan ${data.similarityScore}%`;
    toast(`Audit selesai: Kemiripan ${data.similarityScore}% (${data.statusLabel})`, data.similarityScore < 15 ? 'success' : 'warn', 4000);
  } catch (err) {
    console.error('[Plagiarism Error]:', err);
    if (statusEl) statusEl.textContent = '❌ Gagal';
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Cek Kemiripan Sekarang`;
  }
}

function renderPlagiarismResults(data) {
  const summaryEl = document.getElementById('plagiarism-summary');
  const resultsWrapEl = document.getElementById('plagiarism-results-wrap');
  const scoreBox = document.getElementById('similarity-score-box');
  const scoreEl = document.getElementById('stat-similarity');
  const badgeEl = document.getElementById('stat-similarity-badge');
  const totalSentencesEl = document.getElementById('stat-total-sentences');
  const flaggedSentencesEl = document.getElementById('stat-flagged-sentences');
  const uniquePercentageEl = document.getElementById('stat-unique-percentage');
  const listEl = document.getElementById('plagiarism-sentence-list');

  if (!summaryEl || !resultsWrapEl) return;

  const score = data.similarityScore || 0;
  scoreEl.textContent = `${score}%`;
  totalSentencesEl.textContent = data.totalSentences || 1;
  flaggedSentencesEl.textContent = data.flaggedCount || (data.flaggedSentences ? data.flaggedSentences.length : 0);
  uniquePercentageEl.textContent = `${Math.max(0, 100 - score)}%`;

  scoreBox.className = 'similarity-score-box';
  if (score < 15) {
    scoreBox.classList.add('safe');
    badgeEl.textContent = '🟢 Aman (< 15%) Lolos Sidang';
  } else if (score <= 25) {
    scoreBox.classList.add('warning');
    badgeEl.textContent = '🟡 Waspada (15%-25%) Perlu Parafrase';
  } else {
    scoreBox.classList.add('high');
    badgeEl.textContent = '🔴 Tinggi (> 25%) Rawan Plagiat';
  }

  summaryEl.classList.remove('hidden');
  resultsWrapEl.classList.remove('hidden');

  const flagged = data.flaggedSentences || [];
  if (flagged.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:24px 16px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:var(--radius-sm);">
        <div style="font-size:1.8rem;margin-bottom:6px;">✨</div>
        <strong style="color:var(--c-success);font-size:0.95rem;">Luar Biasa! Tidak Ditemukan Kalimat Plagiat Signifikan.</strong>
        <p class="text-sm text-muted" style="margin-top:4px;">Struktur kalimat, diksi ilmiah, dan orisinalitas naskah ini sudah memenuhi standar Turnitin perguruan tinggi Indonesia.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = flagged.map((item, idx) => `
    <div class="plagiarism-item ${item.similarity <= 25 ? 'warning' : ''}">
      <div class="plagiarism-item-header">
        <span class="plagiarism-item-source">🔍 <strong>Indikasi Sumber:</strong> ${escapeHtml(item.potentialSource || 'Literatur / Jurnal Relevan')}</span>
        <span class="plagiarism-item-score">Kemiripan: ~${item.similarity}%</span>
      </div>
      <div class="plagiarism-original">
        <strong>Teks Asli:</strong> "${escapeHtml(item.original)}"
        ${item.reason ? `<div style="font-size:0.78rem;color:var(--t-secondary);margin-top:4px;">⚠️ Catatan: ${escapeHtml(item.reason)}</div>` : ''}
      </div>
      <div class="plagiarism-suggestion-box">
        <div class="plagiarism-suggestion-title">
          <span>💡 Rekomendasi Parafrase Akademik</span>
          <button class="btn btn-ghost btn-xs" onclick="copyParaphrasedSentence('${escapeHtml(item.paraphrasedSuggestion || '')}')" style="color:var(--c-accent);">Salin</button>
        </div>
        <div class="plagiarism-suggestion-text">
          "${escapeHtml(item.paraphrasedSuggestion || item.original)}"
        </div>
      </div>
    </div>
  `).join('');
}

function copyParaphrasedSentence(text) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => toast('Parafrase disalin!', 'success', 2000));
}

function applyFullAutoParaphrase() {
  if (!currentPlagiarismResult || !currentPlagiarismResult.paraphrasedFullText) {
    toast('Tidak ada teks parafrase otomatis yang tersedia', 'warn');
    return;
  }
  const inputEl = document.getElementById('plagiarism-input');
  if (inputEl) {
    inputEl.value = currentPlagiarismResult.paraphrasedFullText;
    toast('✅ Teks telah digantikan dengan versi parafrase bebas plagiat (< 15%)!', 'success', 3500);
    // Re-check automatically
    setTimeout(checkPlagiarism, 500);
  }
}

function clearPlagiarism() {
  const inputEl = document.getElementById('plagiarism-input');
  if (inputEl) inputEl.value = '';
  document.getElementById('plagiarism-summary').classList.add('hidden');
  document.getElementById('plagiarism-results-wrap').classList.add('hidden');
  document.getElementById('plagiarism-status').textContent = '';
  currentPlagiarismResult = null;
  toast('Form cek plagiat dibersihkan', 'info', 1500);
}

function loadFromActiveMemoryForPlagiarism() {
  if (!state.memoryDocuments || state.memoryDocuments.length === 0) {
    toast('Belum ada dokumen tersimpan di memori riset!', 'warn');
    return;
  }
  const latestDoc = state.memoryDocuments[0];
  const inputEl = document.getElementById('plagiarism-input');
  if (inputEl) {
    inputEl.value = latestDoc.content;
    toast(`Memuat "${latestDoc.title}" (${latestDoc.wordCount} kata) dari memori!`, 'success', 2500);
  }
}

function triggerPlagiarismPdfUpload() {
  triggerPdfUpload();
}

// ── Academic Statistics Calculator Handlers ────
let currentStatsResult = null;

function loadSampleStatsData() {
  const varInput = document.getElementById('stat-var-name');
  const maxInput = document.getElementById('stat-max-score');
  const preInput = document.getElementById('stat-pretest');
  const postInput = document.getElementById('stat-posttest');

  if (varInput) varInput.value = 'Keterampilan Motorik Halus Melalui Media Loose Parts';
  if (maxInput) maxInput.value = '100';
  if (preInput) preInput.value = '52, 56, 60, 48, 55, 62, 58, 50, 64, 58, 54, 60, 52, 65, 50, 58, 62, 55, 50, 60';
  if (postInput) postInput.value = '82, 85, 90, 78, 84, 92, 86, 80, 94, 88, 82, 90, 80, 95, 78, 86, 90, 85, 76, 88';

  toast('Contoh data pretest-posttest (N=20) berhasil dimuat!', 'info', 2000);
}

async function runStatsCalculation() {
  const variableName = (document.getElementById('stat-var-name')?.value || 'Kemampuan Siswa').trim();
  const maxScore = Number(document.getElementById('stat-max-score')?.value) || 100;
  const preRaw = document.getElementById('stat-pretest')?.value || '';
  const postRaw = document.getElementById('stat-posttest')?.value || '';

  if (!preRaw.trim() || !postRaw.trim()) {
    toast('Data Pre-test dan Post-test wajib diisi!', 'warn');
    return;
  }

  const btn = document.getElementById('btn-calc-stats');
  const statusEl = document.getElementById('stat-status-text');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Menghitung…`;
  }
  if (statusEl) statusEl.textContent = 'Menganalisis data t-test & N-Gain…';

  try {
    const res = await fetch('/api/stats/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variableName,
        maxScore,
        pretest: preRaw,
        posttest: postRaw
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menghitung statistik');
    }

    currentStatsResult = data;

    // Update UI Summary
    const summaryWrap = document.getElementById('stats-summary-wrap');
    const narrativeCard = document.getElementById('stats-narrative-card');
    const narrativeContent = document.getElementById('stats-narrative-content');

    document.getElementById('stat-res-pre').textContent = data.descriptives.pretest.mean;
    document.getElementById('stat-res-post').textContent = data.descriptives.posttest.mean;
    document.getElementById('stat-res-t').textContent = `t = ${data.tTest.tStat}`;
    document.getElementById('stat-res-p').textContent = `df=${data.tTest.df} (p ${data.tTest.pValue})`;
    document.getElementById('stat-res-gain').textContent = data.nGain.gainPercent;
    document.getElementById('stat-res-gain-cat').textContent = `N-Gain: ${data.nGain.category} (${data.nGain.effectiveness})`;

    if (summaryWrap) summaryWrap.classList.remove('hidden');
    if (narrativeCard) narrativeCard.classList.remove('hidden');
    if (narrativeContent) narrativeContent.innerHTML = renderMarkdown(data.narrative);

    if (statusEl) statusEl.textContent = `✅ Analisis N=${data.N} selesai`;
    toast(`Statistik selesai: N-Gain ${data.nGain.gainPercent} (${data.nGain.effectiveness})`, 'success', 3500);
  } catch (err) {
    if (statusEl) statusEl.textContent = '❌ Gagal';
    toast(err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> ⚡ Hitung t-Test &amp; N-Gain`;
    }
  }
}

function clearStatsForm() {
  const pre = document.getElementById('stat-pretest');
  const post = document.getElementById('stat-posttest');
  if (pre) pre.value = '';
  if (post) post.value = '';
  document.getElementById('stats-summary-wrap')?.classList.add('hidden');
  document.getElementById('stats-narrative-card')?.classList.add('hidden');
  document.getElementById('stat-status-text').textContent = '';
  currentStatsResult = null;
  toast(window.t ? t('toast.cleared') : 'Form statistik dibersihkan', 'info', 1500);
}

function copyStatsNarrative() {
  if (!currentStatsResult || !currentStatsResult.narrative) return;
  navigator.clipboard.writeText(currentStatsResult.narrative)
    .then(() => toast(window.t ? t('toast.stats_copied') : 'Teks pembahasan Bab IV disalin ke clipboard!', 'success', 2500))
    .catch(() => toast(window.t ? t('toast.copy_failed') : 'Gagal menyalin', 'error'));
}

async function saveStatsToMemory() {
  if (!currentStatsResult) {
    toast('Belum ada hasil statistik yang dihitung!', 'warn');
    return;
  }

  const title = `Hasil Uji Statistik & N-Gain: ${currentStatsResult.variableName}`;
  const content = `${currentStatsResult.narrative}\n\n### Rekapitulasi Data Deskriptif:\n- Rata-rata Pretest: ${currentStatsResult.descriptives.pretest.mean} (SD = ${currentStatsResult.descriptives.pretest.sd})\n- Rata-rata Posttest: ${currentStatsResult.descriptives.posttest.mean} (SD = ${currentStatsResult.descriptives.posttest.sd})\n- Paired t-Test: t(${currentStatsResult.tTest.df}) = ${currentStatsResult.tTest.tStat}, p ${currentStatsResult.tTest.pValue}\n- N-Gain Hake (1999): ${currentStatsResult.nGain.meanGain} (${currentStatsResult.nGain.gainPercent}) Kategori ${currentStatsResult.nGain.category} - ${currentStatsResult.nGain.effectiveness}`;

  try {
    const res = await fetch(CONFIG.MEMORY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: state.sessionId,
        title,
        content,
        type: 'draft'
      })
    });

    if (res.ok) {
      toast(`✅ "${title}" tersimpan ke Memori Riset!`, 'success', 3000);
      fetchMemoryDocuments();
    } else {
      toast('Gagal menyimpan ke memori', 'error');
    }
  } catch (e) {
    toast(`Error: ${e.message}`, 'error');
  }
}

// Wait for DOM + scripts
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

