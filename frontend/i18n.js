/* ========================================================
   AcademAI — Internationalization (i18n) Engine
   Languages: Indonesian (id) & English (en)
   ======================================================== */

'use strict';

const TRANSLATIONS = {
  id: {
    // Header
    'header.title': 'AcademAI',
    'header.badge': 'v2.0 · Universal Academic Edition',
    'header.connecting': 'Menghubungkan…',
    'header.online': 'AcademAI Online',
    'header.offline': 'Offline',

    // Tab Navigation
    'nav.chat': 'Chat',
    'nav.generate': 'Generate Artikel',
    'nav.validator': 'Validator Sitasi',
    'nav.plagiarism': 'Cek Plagiat',
    'nav.statistics': 'Kalkulator Statistik',

    // Chat Tab - Controls
    'chat.mode.drafting.label': 'Drafting',
    'chat.mode.drafting.desc': 'Tulis konten akademik baru',
    'chat.mode.editing.label': 'Editing',
    'chat.mode.editing.desc': 'Review & perbaiki tulisan',
    'chat.mode.paraphrasing.label': 'Paraphrasing',
    'chat.mode.paraphrasing.desc': 'Parafrase hindari plagiat',
    'chat.mode.slr.label': 'SLR',
    'chat.mode.slr.desc': 'Systematic Literature Review',
    'chat.mode.proposal.label': 'Proposal',
    'chat.mode.proposal.desc': 'Buat proposal penelitian',
    'chat.mode.abstract.label': 'Abstract',
    'chat.mode.abstract.desc': 'Abstrak Indonesia + Inggris',
    'chat.mode.statistics.label': 'Statistics',
    'chat.mode.statistics.desc': 'Interpretasi hasil SPSS/R',

    // Disciplines
    'disc.general_academic': '📚 Umum / Lintas Disiplin',
    'disc.education': '🎓 Ilmu Pendidikan',
    'disc.paud': '🧸 PAUD & Pendidikan Anak',
    'disc.economics': '💰 Ekonomi & Bisnis',
    'disc.law': '⚖️ Hukum',
    'disc.psychology': '🧠 Psikologi',
    'disc.engineering': '⚙️ Teknik & Teknologi',
    'disc.health': '🏥 Kesehatan & Kedokteran',
    'disc.computer_science': '💻 Ilmu Komputer',
    'disc.social': '👥 Ilmu Sosial',
    'disc.agriculture': '🌾 Pertanian',
    'disc.communication': '📡 Komunikasi',

    // Chat Controls Buttons & Context
    'chat.memory_btn': 'Memori',
    'chat.new_session_btn': 'Baru',
    'chat.memory_context_title': 'Konteks Aktif: {count} Dokumen di Memori',
    'chat.memory_context_view': 'Lihat / Kelola',

    // Chat Empty State
    'chat.welcome_title': 'Selamat datang di AcademAI',
    'chat.welcome_subtitle': 'Asisten riset & penulisan artikel ilmiah berbasis AI untuk mahasiswa, dosen, dan peneliti Indonesia.',
    'chat.sug_background': '✍️ Bantu tulis latar belakang penelitian',
    'chat.sug_upload_pdf': '📄 Upload PDF Jurnal / Skripsi',
    'chat.sug_matrix': '📊 Buat tabel penelitian terdahulu',
    'chat.sug_paraphrase': '🔄 Parafrase untuk hindari plagiat',
    'chat.sug_abstract': '📄 Buat abstrak Indonesia & Inggris',
    'chat.sug_spss': '📈 Interpretasikan hasil SPSS saya',

    // Chat Input Area
    'chat.input_placeholder': 'Tulis pesan Anda… (Shift+Enter untuk baris baru)',
    'chat.upload_pdf_title': 'Upload PDF Jurnal / Skripsi untuk memori konteks',
    'chat.send_btn_title': 'Kirim (Enter)',
    'chat.footer_hint': 'AcademAI dapat membuat kesalahan. Selalu verifikasi sitasi & konsultasikan dengan pembimbing Anda.',

    // Generate Tab
    'gen.title': 'Generate Artikel Otomatis',
    'gen.subtitle': 'Isi detail penelitian → AcademAI otomatis menulis seluruh bab (Abstrak → BAB I–V → Daftar Pustaka)',
    'gen.card_title': 'Detail Penelitian',
    'gen.label_topic': 'Topik / Judul Penelitian *',
    'gen.topic_placeholder': 'Cth: Pengaruh Media Sosial terhadap Motivasi Belajar Mahasiswa Generasi Z',
    'gen.label_discipline': 'Disiplin Ilmu *',
    'gen.label_language': 'Bahasa Output',
    'gen.lang_id': '🇮🇩 Bahasa Indonesia',
    'gen.lang_en': '🇬🇧 English',
    'gen.label_journals': 'Jumlah Jurnal',
    'gen.journals_unit': 'jurnal',
    'gen.label_years': 'Filter Tahun',
    'gen.label_citation_format': 'Format Sitasi',
    'gen.checkbox_validate': 'Validasi sitasi otomatis setelah generate',
    'gen.btn_generate': 'Generate Artikel',
    'gen.btn_generating': 'Generating…',
    'gen.btn_reset': 'Reset',
    'gen.output_title': 'Output Dokumen',
    'gen.btn_save_mem': '🧠 Simpan ke Memori',
    'gen.btn_continue_chat': '💬 Lanjutkan di Chat',
    'gen.btn_copy': 'Salin',
    'gen.btn_download_md': 'Download .md',
    'gen.btn_download_docx': '📥 Word (.docx)',
    'gen.output_placeholder': 'Dokumen akan muncul di sini setelah generate selesai',
    'gen.status_processing': 'Memproses…',
    'gen.status_writing': '🤖 AI sedang menulis… (estimasi 1-3 menit)',
    'gen.status_done': '✅ Selesai · {words} kata',
    'gen.status_failed': '❌ Generate gagal',

    // Generate Steps
    'step.research': '🔍 Riset\nJurnal',
    'step.abstrak': '📄\nAbstrak',
    'step.bab1': '📖\nBAB I',
    'step.bab2': '📚\nBAB II',
    'step.bab3': '⚙️\nBAB III',
    'step.bab4': '📊\nBAB IV',
    'step.bab5': '🏁\nBAB V',
    'step.pustaka': '📑\nDaftar\nPustaka',

    // Validator Tab
    'val.title': 'Validator Sitasi',
    'val.subtitle': 'Paste teks berisi sitasi APA/DOI → AcademAI memverifikasi ke Semantic Scholar secara otomatis',
    'val.input_label': 'Teks yang Mengandung Sitasi',
    'val.input_placeholder': 'Cth: Menurut Santoso et al. (2023) digitalisasi UMKM meningkat signifikan. Penelitian oleh Wijaya (2021) juga menunjukkan... (DOI: 10.1234/abc.2023.01)',
    'val.input_hint': 'Mendukung format: (Nama, Tahun), (Nama et al., Tahun), dan DOI. Maks 20 sitasi per validasi.',
    'val.btn_validate': 'Validasi Sekarang',
    'val.btn_clear': 'Hapus',
    'val.stat_total': 'Total Sitasi',
    'val.stat_valid': '✅ Valid',
    'val.stat_partial': '⚠️ Perlu Cek',
    'val.stat_invalid': '❌ Tidak Valid',

    // Plagiarism Tab
    'plag.title': 'Cek Plagiarisme & Skor Kemiripan Turnitin',
    'plag.subtitle': 'Analisis tingkat kemiripan teks dengan indeks jurnal Google Scholar, deteksi kalimat rentan plagiat, dan parafrase instan otomatis (< 15%).',
    'plag.input_label': 'Teks yang Akan Diperiksa',
    'plag.btn_load_mem': '🧠 Muat dari Memori',
    'plag.btn_upload_pdf': '📄 Upload PDF',
    'plag.input_placeholder': 'Paste paragraf, bab skripsi, atau draf artikel Anda di sini... (Maksimal 15.000 karakter)',
    'plag.input_hint': 'Mendukung teks bahasa Indonesia & bahasa Inggris. Diuji silang dengan data Google Scholar dan analisis sintaksis Turnitin.',
    'plag.btn_check': 'Cek Kemiripan Sekarang',
    'plag.btn_clear': 'Hapus',
    'plag.stat_similarity': 'Indeks Kemiripan',
    'plag.badge_safe': '🟢 Aman (< 15%)',
    'plag.badge_warn': '🟡 Sedang (15-25%)',
    'plag.badge_danger': '🔴 Tinggi (> 25%)',
    'plag.stat_total_sentences': 'Total Kalimat',
    'plag.stat_flagged': '⚠️ Perlu Parafrase',
    'plag.stat_originality': '✨ Orisinalitas',
    'plag.section_detection': 'Deteksi Kalimat & Rekomendasi Parafrase Turnitin',
    'plag.btn_auto_paraphrase': '🔄 Terapkan Parafrase Otomatis (< 15%)',

    // Statistics Tab
    'stat.title': 'Kalkulator Statistik Akademik',
    'stat.subtitle': 'Hitung Uji Beda Paired Sample t-Test & N-Gain Score (Hake, 1999) + Narasi Pembahasan BAB IV Otomatis',
    'stat.btn_sample_paud': '🎲 Contoh Data PAUD (N=20)',
    'stat.label_var_name': 'Variabel Penelitian',
    'stat.label_max_score': 'Skor Maksimal Skala',
    'stat.label_pretest': 'Nilai Pre-test (Pisahkan dengan koma atau spasi)',
    'stat.label_posttest': 'Nilai Post-test (Jumlah harus sama dengan Pre-test)',
    'stat.btn_calc': '⚡ Hitung t-Test & N-Gain',
    'stat.btn_clear': 'Hapus',
    'stat.res_pre': 'Rata-rata Pre-test',
    'stat.res_post': 'Rata-rata Post-test',
    'stat.res_t': 't-Hitung (p < .05)',
    'stat.res_gain': 'N-Gain (Efektif)',
    'stat.narrative_title': '📝 Narasi Pembahasan Bab IV (Format Baku Skripsi)',
    'stat.btn_save_mem': '🧠 Simpan ke Memori',
    'stat.btn_copy_bab4': '📋 Salin Teks Bab IV',

    // Memory Modal
    'mem.modal_title': 'Memori Dokumen & Konteks Riset',
    'mem.modal_desc': 'Dokumen di bawah ini otomatis menjadi <strong>konteks aktif</strong>. AcademAI akan merujuk dokumen ini untuk menghasilkan kelanjutan bab, pembahasan, instrumen, maupun abstrak secara sinkron.',
    'mem.upload_title': 'Unggah Jurnal / Dokumen PDF',
    'mem.upload_sub': 'Pilih file PDF (maks. 35MB). Teks diekstrak dan otomatis tersimpan ke Memori Konteks.',
    'mem.btn_select_pdf': 'Pilih PDF',
    'mem.empty_title': 'Belum ada dokumen dalam memori riset sesi ini.',
    'mem.empty_sub': 'Generate artikel pada tab "Generate Artikel" atau klik "Simpan ke Memori" pada respons chat untuk menjadikannya konteks lanjutan.',
    'mem.btn_add_manual': '+ Tambah Dokumen Manual',
    'mem.btn_clear_all': 'Kosongkan',
    'mem.btn_close': 'Tutup',
    'mem.action_continue_bab': '✍️ Lanjutkan Bab II / III',
    'mem.action_create_abstract': '📑 Buat Abstrak',
    'mem.action_word': '📥 Word (.docx)',
    'mem.action_preview': '👀 Pratinjau',
    'mem.action_delete': '🗑️ Hapus',

    // Toasts & Dialogs
    'toast.copied': 'Konten disalin ke clipboard!',
    'toast.copy_failed': 'Gagal menyalin',
    'toast.reset_done': 'Form di-reset',
    'toast.memory_saved': 'Artikel berhasil digenerate & otomatis tersimpan ke Memori!',
    'toast.stats_copied': 'Teks pembahasan Bab IV disalin ke clipboard!',
    'toast.stats_done': 'Statistik selesai dihitung!',
    'toast.cleared': 'Form dibersihkan',
    'toast.lang_switched': 'Bahasa diubah ke Bahasa Indonesia 🇮🇩'
  },

  en: {
    // Header
    'header.title': 'AcademAI',
    'header.badge': 'v2.0 · Universal Academic Edition',
    'header.connecting': 'Connecting…',
    'header.online': 'AcademAI Online',
    'header.offline': 'Offline',

    // Tab Navigation
    'nav.chat': 'Chat',
    'nav.generate': 'Generate Article',
    'nav.validator': 'Citation Validator',
    'nav.plagiarism': 'Plagiarism Check',
    'nav.statistics': 'Statistics Calculator',

    // Chat Tab - Controls
    'chat.mode.drafting.label': 'Drafting',
    'chat.mode.drafting.desc': 'Draft new academic content',
    'chat.mode.editing.label': 'Editing',
    'chat.mode.editing.desc': 'Review & polish academic writing',
    'chat.mode.paraphrasing.label': 'Paraphrasing',
    'chat.mode.paraphrasing.desc': 'Paraphrase to avoid plagiarism',
    'chat.mode.slr.label': 'SLR',
    'chat.mode.slr.desc': 'Systematic Literature Review',
    'chat.mode.proposal.label': 'Proposal',
    'chat.mode.proposal.desc': 'Formulate research proposal',
    'chat.mode.abstract.label': 'Abstract',
    'chat.mode.abstract.desc': 'Bilingual Abstract (ID + EN)',
    'chat.mode.statistics.label': 'Statistics',
    'chat.mode.statistics.desc': 'SPSS/R statistical data interpretation',

    // Disciplines
    'disc.general_academic': '📚 General / Interdisciplinary',
    'disc.education': '🎓 Education Science',
    'disc.paud': '🧸 Early Childhood Education (PAUD)',
    'disc.economics': '💰 Economics & Business',
    'disc.law': '⚖️ Law',
    'disc.psychology': '🧠 Psychology',
    'disc.engineering': '⚙️ Engineering & Technology',
    'disc.health': '🏥 Health & Medicine',
    'disc.computer_science': '💻 Computer Science',
    'disc.social': '👥 Social Sciences',
    'disc.agriculture': '🌾 Agriculture',
    'disc.communication': '📡 Communication',

    // Chat Controls Buttons & Context
    'chat.memory_btn': 'Memory',
    'chat.new_session_btn': 'New',
    'chat.memory_context_title': 'Active Context: {count} Documents in Memory',
    'chat.memory_context_view': 'View / Manage',

    // Chat Empty State
    'chat.welcome_title': 'Welcome to AcademAI',
    'chat.welcome_subtitle': 'AI-powered scientific research & thesis writing companion for students, lecturers, and researchers.',
    'chat.sug_background': '✍️ Help me write the research background',
    'chat.sug_upload_pdf': '📄 Upload Journal / Thesis PDF',
    'chat.sug_matrix': '📊 Build previous research matrix',
    'chat.sug_paraphrase': '🔄 Paraphrase to avoid plagiarism',
    'chat.sug_abstract': '📄 Draft bilingual abstract (ID & EN)',
    'chat.sug_spss': '📈 Interpret my SPSS statistical output',

    // Chat Input Area
    'chat.input_placeholder': 'Type your message… (Shift+Enter for new line)',
    'chat.upload_pdf_title': 'Upload Journal / Thesis PDF for context memory',
    'chat.send_btn_title': 'Send (Enter)',
    'chat.footer_hint': 'AcademAI can make mistakes. Always verify citations and consult with your advisor.',

    // Generate Tab
    'gen.title': 'Automated Article Generator',
    'gen.subtitle': 'Fill research parameters → AcademAI autonomously writes full chapters (Abstract → Chapters I–V → References)',
    'gen.card_title': 'Research Details',
    'gen.label_topic': 'Research Topic / Title *',
    'gen.topic_placeholder': 'e.g., The Impact of Digital Media on Early Childhood Social Skills',
    'gen.label_discipline': 'Academic Discipline *',
    'gen.label_language': 'Output Language',
    'gen.lang_id': '🇮🇩 Indonesian',
    'gen.lang_en': '🇬🇧 English',
    'gen.label_journals': 'Journal Count',
    'gen.journals_unit': 'journals',
    'gen.label_years': 'Year Filter',
    'gen.label_citation_format': 'Citation Format',
    'gen.checkbox_validate': 'Auto-validate citations after generation',
    'gen.btn_generate': 'Generate Article',
    'gen.btn_generating': 'Generating…',
    'gen.btn_reset': 'Reset',
    'gen.output_title': 'Document Output',
    'gen.btn_save_mem': '🧠 Save to Memory',
    'gen.btn_continue_chat': '💬 Continue in Chat',
    'gen.btn_copy': 'Copy',
    'gen.btn_download_md': 'Download .md',
    'gen.btn_download_docx': '📥 Word (.docx)',
    'gen.output_placeholder': 'Document will appear here once generation finishes',
    'gen.status_processing': 'Processing…',
    'gen.status_writing': '🤖 AI is writing… (estimated 1-3 minutes)',
    'gen.status_done': '✅ Completed · {words} words',
    'gen.status_failed': '❌ Generation failed',

    // Generate Steps
    'step.research': '🔍 Journal\nResearch',
    'step.abstrak': '📄\nAbstract',
    'step.bab1': '📖\nChapter I',
    'step.bab2': '📚\nChapter II',
    'step.bab3': '⚙️\nChapter III',
    'step.bab4': '📊\nChapter IV',
    'step.bab5': '🏁\nChapter V',
    'step.pustaka': '📑\nReferences',

    // Validator Tab
    'val.title': 'Citation Validator',
    'val.subtitle': 'Paste text containing APA/DOI citations → AcademAI cross-checks Semantic Scholar live automatically',
    'val.input_label': 'Text Containing Citations',
    'val.input_placeholder': 'e.g., According to Santoso et al. (2023) MSME digitalization increased significantly... (DOI: 10.1234/abc.2023.01)',
    'val.input_hint': 'Supports formats: (Author, Year), (Author et al., Year), and DOI. Max 20 citations per validation.',
    'val.btn_validate': 'Validate Now',
    'val.btn_clear': 'Clear',
    'val.stat_total': 'Total Citations',
    'val.stat_valid': '✅ Valid',
    'val.stat_partial': '⚠️ Needs Review',
    'val.stat_invalid': '❌ Invalid',

    // Plagiarism Tab
    'plag.title': 'Plagiarism Check & Turnitin Similarity Score',
    'plag.subtitle': 'Analyze text similarity against Google Scholar index, identify vulnerable phrases, and apply instant auto-paraphrasing (< 15%).',
    'plag.input_label': 'Text to Analyze',
    'plag.btn_load_mem': '🧠 Load from Memory',
    'plag.btn_upload_pdf': '📄 Upload PDF',
    'plag.input_placeholder': 'Paste paragraph, thesis chapter, or article draft here... (Maximum 15,000 characters)',
    'plag.input_hint': 'Supports Indonesian & English text. Cross-checked with Google Scholar corpus and Turnitin syntax analysis.',
    'plag.btn_check': 'Check Similarity Now',
    'plag.btn_clear': 'Clear',
    'plag.stat_similarity': 'Similarity Index',
    'plag.badge_safe': '🟢 Safe (< 15%)',
    'plag.badge_warn': '🟡 Moderate (15-25%)',
    'plag.badge_danger': '🔴 High (> 25%)',
    'plag.stat_total_sentences': 'Total Sentences',
    'plag.stat_flagged': '⚠️ Needs Paraphrase',
    'plag.stat_originality': '✨ Originality',
    'plag.section_detection': 'Sentence Detection & Turnitin Paraphrase Recommendations',
    'plag.btn_auto_paraphrase': '🔄 Apply Auto-Paraphrase (< 15%)',

    // Statistics Tab
    'stat.title': 'Academic Statistics Calculator',
    'stat.subtitle': 'Calculate Paired Sample t-Test & N-Gain Score (Hake, 1999) + Automated Chapter IV Discussion Narrative',
    'stat.btn_sample_paud': '🎲 Sample PAUD Data (N=20)',
    'stat.label_var_name': 'Research Variable',
    'stat.label_max_score': 'Maximum Scale Score',
    'stat.label_pretest': 'Pre-test Scores (Separated by commas or spaces)',
    'stat.label_posttest': 'Post-test Scores (Count must match Pre-test)',
    'stat.btn_calc': '⚡ Calculate t-Test & N-Gain',
    'stat.btn_clear': 'Clear',
    'stat.res_pre': 'Pre-test Mean',
    'stat.res_post': 'Post-test Mean',
    'stat.res_t': 't-Statistic (p < .05)',
    'stat.res_gain': 'N-Gain (Effective)',
    'stat.narrative_title': '📝 Chapter IV Discussion Narrative (Standard Thesis Format)',
    'stat.btn_save_mem': '🧠 Save to Memory',
    'stat.btn_copy_bab4': '📋 Copy Chapter IV Text',

    // Memory Modal
    'mem.modal_title': 'Document Memory & Research Context',
    'mem.modal_desc': 'The documents below automatically become <strong>active context</strong>. AcademAI references them to synthesize subsequent chapters, discussions, instruments, and abstracts synchronously.',
    'mem.upload_title': 'Upload Journal / PDF Document',
    'mem.upload_sub': 'Select a PDF file (max 35MB). Text is extracted and saved to Context Memory automatically.',
    'mem.btn_select_pdf': 'Select PDF',
    'mem.empty_title': 'No documents in research memory for this session yet.',
    'mem.empty_sub': 'Generate an article in the "Generate Article" tab or click "Save to Memory" on chat responses to add them as context.',
    'mem.btn_add_manual': '+ Add Manual Document',
    'mem.btn_clear_all': 'Clear All',
    'mem.btn_close': 'Close',
    'mem.action_continue_bab': '✍️ Continue Chapter II / III',
    'mem.action_create_abstract': '📑 Create Abstract',
    'mem.action_word': '📥 Word (.docx)',
    'mem.action_preview': '👀 Preview',
    'mem.action_delete': '🗑️ Delete',

    // Toasts & Dialogs
    'toast.copied': 'Content copied to clipboard!',
    'toast.copy_failed': 'Failed to copy',
    'toast.reset_done': 'Form reset successfully',
    'toast.memory_saved': 'Article successfully generated & saved to Memory!',
    'toast.stats_copied': 'Chapter IV discussion narrative copied to clipboard!',
    'toast.stats_done': 'Statistical calculation completed!',
    'toast.cleared': 'Form cleared',
    'toast.lang_switched': 'Language switched to English 🇬🇧'
  }
};

// Global language state
let currentLanguage = localStorage.getItem('academ_lang') || 'id';

function t(key, params = {}) {
  const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.id;
  let text = dict[key] || TRANSLATIONS.id[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return text;
}

function getLanguage() {
  return currentLanguage;
}

function switchLanguage(lang) {
  if (lang !== 'id' && lang !== 'en') return;
  currentLanguage = lang;
  localStorage.setItem('academ_lang', lang);
  document.documentElement.lang = lang;

  // Update switcher buttons UI
  const btnId = document.getElementById('lang-btn-id');
  const btnEn = document.getElementById('lang-btn-en');
  if (btnId && btnEn) {
    if (lang === 'id') {
      btnId.classList.add('active');
      btnEn.classList.remove('active');
      btnId.setAttribute('aria-pressed', 'true');
      btnEn.setAttribute('aria-pressed', 'false');
    } else {
      btnEn.classList.add('active');
      btnId.classList.remove('active');
      btnEn.setAttribute('aria-pressed', 'true');
      btnId.setAttribute('aria-pressed', 'false');
    }
  }

  // Update all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val) {
      if (el.tagName === 'OPTION') {
        el.textContent = val;
      } else if (el.children.length === 0 || el.getAttribute('data-i18n-html') === 'true') {
        el.innerHTML = val;
      } else {
        const spanText = el.querySelector('span[data-i18n]');
        if (spanText) {
          spanText.textContent = val;
        } else {
          el.textContent = val;
        }
      }
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = t(key);
    if (val) el.setAttribute('placeholder', val);
  });

  // Update titles
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const val = t(key);
    if (val) {
      el.setAttribute('title', val);
      if (el.hasAttribute('aria-label')) {
        el.setAttribute('aria-label', val);
      }
    }
  });

  // Sync default output language dropdown in Generate tab
  const genLangSelect = document.getElementById('gen-language');
  if (genLangSelect) {
    genLangSelect.value = lang === 'en' ? 'english' : 'indonesia';
  }

  // Re-build mode dropdown & generate steps if app.js is loaded
  if (typeof window.onLanguageSwitched === 'function') {
    window.onLanguageSwitched(lang);
  }

  if (typeof toast === 'function') {
    toast(t('toast.lang_switched'), 'info', 2000);
  }
}

// Export to window
window.t = t;
window.getLanguage = getLanguage;
window.switchLanguage = switchLanguage;
window.TRANSLATIONS = TRANSLATIONS;
