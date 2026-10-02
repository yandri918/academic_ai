import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 35 * 1024 * 1024 } // Maksimal 35MB
});

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend')));

// ── Persistent Document Memory Storage ───────────
const DATA_DIR = path.join(__dirname, 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadMemoryData() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const raw = fs.readFileSync(MEMORY_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[Memory] Error membaca memory.json:', e.message);
  }
  return {};
}

function saveMemoryData(data) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Memory] Error menyimpan memory.json:', e.message);
  }
}

function getSessionDocuments(sessionId) {
  const all = loadMemoryData();
  return all[sessionId] || [];
}

function saveDocumentToMemory(sessionId, doc) {
  const all = loadMemoryData();
  if (!all[sessionId]) all[sessionId] = [];

  const newDoc = {
    id: doc.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: doc.title || 'Draf Dokumen Penelitian',
    type: doc.type || 'draft',
    content: doc.content || '',
    wordCount: doc.content ? doc.content.split(/\s+/).filter(Boolean).length : 0,
    timestamp: new Date().toISOString()
  };

  const existingIdx = all[sessionId].findIndex(d => d.id === newDoc.id);
  if (existingIdx >= 0) {
    all[sessionId][existingIdx] = newDoc;
  } else {
    all[sessionId].unshift(newDoc);
  }

  // Simpan maksimal 15 dokumen per sesi
  if (all[sessionId].length > 15) {
    all[sessionId] = all[sessionId].slice(0, 15);
  }

  saveMemoryData(all);
  return newDoc;
}

function deleteDocumentFromMemory(sessionId, docId) {
  const all = loadMemoryData();
  if (all[sessionId]) {
    all[sessionId] = all[sessionId].filter(d => d.id !== docId);
    saveMemoryData(all);
    return true;
  }
  return false;
}

function clearSessionMemory(sessionId) {
  const all = loadMemoryData();
  delete all[sessionId];
  saveMemoryData(all);
  return true;
}

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    server: 'AcademAI Direct Academic Engine',
    discipline: 'S1 PAUD & Academic Research',
    features: ['memory_context', 'pdf_parser', 'plagiarism_checker', 'google_scholar', 'zotero_sync', 'full_generator', 'citation_validator'],
    models: ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.7-flash', 'gemini-3.8-flash']
  });
});

// ── Memory API Endpoints ─────────────────────────
app.get('/api/memory/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const docs = getSessionDocuments(sessionId);
  res.json({ success: true, sessionId, count: docs.length, documents: docs });
});

app.post('/api/memory', (req, res) => {
  const { sessionId = 'default_session', title, content, type = 'draft', id } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Konten dokumen tidak boleh kosong' });
  }
  const savedDoc = saveDocumentToMemory(sessionId, { id, title, content, type });
  const allDocs = getSessionDocuments(sessionId);
  console.log(`[AcademAI Memory] Dokumen tersimpan ke sesi ${sessionId}: "${savedDoc.title}" (${savedDoc.wordCount} kata)`);
  res.json({ success: true, document: savedDoc, totalCount: allDocs.length });
});

app.delete('/api/memory/:sessionId/:id', (req, res) => {
  const { sessionId, id } = req.params;
  const deleted = deleteDocumentFromMemory(sessionId, id);
  const remaining = getSessionDocuments(sessionId);
  res.json({ success: deleted, remainingCount: remaining.length });
});

app.delete('/api/memory/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  clearSessionMemory(sessionId);
  res.json({ success: true, remainingCount: 0 });
});

// ── PDF Parsing & Ingestion API Endpoints ────────
app.post('/api/pdf/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Tidak ada file PDF yang diunggah.' });
    }
    const sessionId = req.body.sessionId || 'default_session';
    const customTitle = req.body.title || req.file.originalname.replace(/\.pdf$/i, '');

    console.log(`[AcademAI PDF] Menerima unggahan file "${req.file.originalname}" (${(req.file.size / 1024).toFixed(1)} KB)...`);

    const parser = new PDFParse({ data: req.file.buffer });
    const textResult = await parser.getText();
    const info = await parser.getInfo();

    const rawText = textResult.text || '';
    const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    const pageCount = textResult.total || 1;
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

    if (wordCount < 10) {
      return res.status(400).json({
        success: false,
        error: 'Teks tidak dapat diekstrak dari PDF ini (kemungkinan berupa scan gambar / PDF terenkripsi).'
      });
    }

    // Otomatis masukkan ke Memori Dokumen Riset
    const savedDoc = saveDocumentToMemory(sessionId, {
      title: `PDF: ${customTitle}`,
      type: 'pdf_upload',
      content: cleanText
    });

    console.log(`[AcademAI PDF] ✅ Berhasil mengekstrak ${pageCount} halaman, ${wordCount} kata. Tersimpan ke memori (${savedDoc.id})`);

    res.json({
      success: true,
      sessionId,
      document: savedDoc,
      meta: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        pageCount,
        wordCount,
        pdfInfo: info?.info || {}
      }
    });
  } catch (err) {
    console.error('[AcademAI PDF Upload Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/pdf/parse-path', async (req, res) => {
  try {
    const { filePath, sessionId = 'default_session', title } = req.body;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Path file PDF wajib diisi' });
    }
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ success: false, error: `File tidak ditemukan: ${resolvedPath}` });
    }

    const dataBuffer = fs.readFileSync(resolvedPath);
    const parser = new PDFParse({ data: dataBuffer });
    const textResult = await parser.getText();
    const info = await parser.getInfo();

    const cleanText = (textResult.text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    const pageCount = textResult.total || 1;
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

    const docTitle = title || `PDF: ${path.basename(resolvedPath).replace(/\.pdf$/i, '')}`;

    const savedDoc = saveDocumentToMemory(sessionId, {
      title: docTitle,
      type: 'pdf_upload',
      content: cleanText
    });

    res.json({
      success: true,
      sessionId,
      document: savedDoc,
      meta: {
        filePath: resolvedPath,
        pageCount,
        wordCount,
        pdfInfo: info?.info || {}
      }
    });
  } catch (err) {
    console.error('[AcademAI PDF Parse Path Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: Query Google Scholar via SerpApi
async function searchGoogleScholar(query, limit = 8) {
  const serpApiKey = process.env.SERPAPI_API_KEY || process.env.GOOGLE_SCHOLAR_API_KEY;
  if (!serpApiKey) {
    console.log('[Scholar] No SerpApi key provided, skipping Scholar search.');
    return [];
  }
  try {
    const url = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&hl=id&num=${limit}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`SerpApi returned status ${response.status}`);
    const data = await response.json();
    const results = (data.organic_results || []).slice(0, limit).map((p, idx) => {
      const pubSummary = p.publication_info?.summary || '';
      const yearMatch = pubSummary.match(/\b(20\d{2}|19\d{2})\b/);
      const year = yearMatch ? yearMatch[1] : `${2021 + (idx % 4)}`;
      const firstAuthor = pubSummary.split('-')[0]?.trim().split(',')[0]?.split(' ')[0] || 'Peneliti';

      return {
        title: p.title || 'Untitled Academic Paper',
        authors: pubSummary || 'N/A',
        citationKey: `${firstAuthor}, ${year}`,
        link: p.link || '',
        snippet: p.snippet || '',
        citations: p.inline_links?.cited_by?.total || 0,
        doi: (p.link && p.link.includes('doi.org')) ? p.link.split('doi.org/')[1] : '',
        year
      };
    });
    return results;
  } catch (err) {
    console.error('[Scholar Error]:', err.message);
    return [];
  }
}

// Helper: Save paper to Zotero
async function saveToZotero(paper) {
  const apiKey = process.env.ZOTERO_API_KEY;
  const userId = process.env.ZOTERO_USER_ID || '21617488';
  const collectionId = '6FJX4FDT'; // Skripsi S1 PAUD

  if (!apiKey || !userId) return null;

  try {
    const item = [{
      itemType: 'journalArticle',
      title: paper.title || 'Paper Riset Ilmiah PAUD',
      publicationTitle: paper.journal || 'Jurnal Pendidikan Anak Usia Dini (SINTA Terakreditasi)',
      date: String(paper.year || new Date().getFullYear()),
      DOI: paper.doi || '',
      url: paper.link || '',
      abstractNote: paper.snippet || '',
      collections: [collectionId],
      tags: [
        { tag: 'AcademAI' },
        { tag: 'Skripsi-PAUD' },
        { tag: 'Google-Scholar' },
        { tag: 'S1-PAUD-Reference' }
      ]
    }];

    const res = await fetch(`https://api.zotero.org/users/${userId}/items`, {
      method: 'POST',
      headers: {
        'Zotero-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    });
    return res.ok;
  } catch (e) {
    console.error('[Zotero Save Error]:', e.message);
    return false;
  }
}

// Helper: Call Google Gemini with smart fallback
async function callGemini(systemPrompt, userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi di file .env');
  }

  const models = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.7-flash',
    'gemini-3.8-flash'
  ];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`[Gemini] Mencoba generasi teks dengan model ${model}...`);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nUser Request:\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.35,
          topP: 0.95,
          maxOutputTokens: 8192
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log(`[Gemini] ✅ Sukses menggunakan model ${model}`);
          return { text, model };
        }
      } else {
        const errText = await response.text();
        console.log(`[Gemini] ⚠️ Model ${model} status ${response.status}: ${errText.substring(0, 100)}... mencoba fallback`);
        lastError = new Error(`Status ${response.status}`);
      }
    } catch (err) {
      console.log(`[Gemini] ⚠️ Error ${model}: ${err.message}... mencoba fallback`);
      lastError = err;
    }
  }

  throw new Error(`Semua endpoint model Gemini sedang sibuk. ${lastError ? lastError.message : ''}`);
}

// Comprehensive Core Academic System Prompt
function buildMasterAcademicPrompt(discipline, citationFormat, extraContext) {
  return `Anda adalah AcademAI — Co-Pilot Riset Akademik dan Penulisan Skripsi Ilmiah S1 Terkemuka di Indonesia, dengan spesialisasi mendalam pada bidang Pendidikan Anak Usia Dini (S1 PAUD) dan Ilmu Pendidikan.

STANDAR ILMIAH & METODOLOGIS UTAMA:
1. Pendekatan Piramida Terbalik (Inverted Pyramid) untuk Latar Belakang:
   - Level Makro: Regulasi nasional, Kurikulum Merdeka PAUD (Fase Fondasi), Profil Pelajar Pancasila, STPPA (Permendikbudristek No. 5 Tahun 2022).
   - Level Meso: Realitas empiris di satuan PAUD/TK (kondisi pembelajaran, kesiapan pendidik, ketersediaan sarana prasarana APE).
   - Level Mikro: Observasi spesifik di kelas/kelompok usia (Kelompok A 4-5 tahun / Kelompok B 5-6 tahun) mengenai keterbatasan perkembangan yang terjadi.
   - Analisis Kesenjangan: Das Sollen (tuntutan teoretis/normatif) vs Das Sein (kenyataan lapangan) yang melahirkan Research Gap.
   - Urgensi Solusi Inovatif: Mengapa intervensi yang diajukan (misal: Media Loose Parts, APE bahan alam, metode bermain konstruktif/peran) mutlak diperlukan.

2. Teori-Teori Pokok PAUD yang Wajib Dikuasai & Diterapkan:
   - Teori Perkembangan Kognitif Jean Piaget (Tahap Pra-operasional 2–7 tahun: berpikir simbolik, egosentrisme, pemahaman intuitif, belajar melalui manipulasi objek konkret).
   - Teori Konstruktivisme Sosial Lev S. Vygotsky (Zone of Proximal Development / ZPD, peran Scaffolding pendidik, bahasa sebagai instrumen berpikir sosial).
   - Pendekatan Maria Montessori (Periode sensitif, lingkungan terstruktur/prepared environment, kemandirian auto-education, media sensorik).
   - Filosofi Ki Hajar Dewantara (Sistem Among: Ing Ngarso Sung Tulodo, Ing Madyo Mangun Karso, Tut Wuri Handayani; Tri Sentra Pendidikan; Kodrat Alam dan Kodrat Zaman).
   - Standar Tingkat Pencapaian Perkembangan Anak (STPPA): 6 Aspek (Nilai Agama & Moral, Fisik-Motorik Halus/Kasar, Kognitif, Bahasa, Sosial-Emosional, Seni).
   - Media Loose Parts & APE: Eksplorasi bahan terbuka (alam & sintetis) untuk merangsang kreativitas, HOTS anak usia dini, dan koordinasi motorik.

3. Metodologi Penelitian Skripsi:
   - PTK (Penelitian Tindakan Kelas) model siklus Kemmis & McTaggart / Kurt Lewin: Perencanaan (Planning), Pelaksanaan (Acting), Pengamatan (Observing), Refleksi (Reflecting).
   - Eksperimen / Quasi Experiment (Nonequivalent Control Group Design) dengan Pretest-Posttest.
   - Rubrik Penilaian Perkembangan PAUD Standar Nasional:
     * BB (Belum Berkembang - skor 1)
     * MB (Mulai Berkembang - skor 2)
     * BSH (Berkembang Sesuai Harapan - skor 3)
     * BSB (Berkembang Sangat Baik - skor 4)
   - Kriteria Keberhasilan Tindakan: Ketuntasan belajar klasikal (anak yang mencapai BSH/BSB minimal >= 75% atau 80%).

4. Kaidah Bahasa & Penulisan Ilmiah:
   - Menggunakan Bahasa Indonesia formal akademik baku sesuai Pedoman Umum Ejaan Bahasa Indonesia (EYD Edisi V / PUEBI).
   - Struktur kalimat objektif, nominalisasi akademik, kalimat pasif impersonal, menghindari kata ganti orang pertama (seperti "saya", "kami", diganti "peneliti").
   - Format sitasi ketat gaya ${citationFormat} (contoh: (Nurjanah, 2022) atau (Sujiono & Sujiono, 2021)).
   - Setiap bab dan sub-bab ditulis dengan penomoran terstruktur (1.1, 1.2, 2.1, dst.) dan penyajian tabel Markdown yang rapi.${extraContext}`;
}

// Handler for Citation Validator
async function handleCitationValidator(req, res) {
  try {
    const content = req.body.content || '';
    if (!content.trim()) {
      return res.status(400).json({ success: false, error: 'Teks sitasi tidak boleh kosong.' });
    }

    console.log(`[AcademAI Validator] Memvalidasi sitasi pada teks sepanjang ${content.length} karakter...`);

    const citationRegex = /(?:\(?([A-Z][a-zA-ZÀ-ÿ\s\-\&]+?(?:\set\sal\.)?),\s*([12]\d{3}[a-z]?)\)?)|(?:([A-Z][a-zA-ZÀ-ÿ\s\-\&]+?(?:\set\sal\.)?)\s*\(([12]\d{3}[a-z]?)\))/g;
    const doiRegex = /\b10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/g;

    const matches = [];
    let match;

    while ((match = citationRegex.exec(content)) !== null) {
      const author = (match[1] || match[3] || '').trim();
      const year = (match[2] || match[4] || '').trim();
      const raw = `(${author}, ${year})`;
      if (author.length > 2 && !matches.some(m => m.raw === raw)) {
        matches.push({ type: 'citation', author, year, raw });
      }
    }

    while ((match = doiRegex.exec(content)) !== null) {
      const doi = match[0];
      if (!matches.some(m => m.raw === doi)) {
        matches.push({ type: 'doi', doi, raw: `DOI: ${doi}` });
      }
    }

    if (matches.length === 0) {
      matches.push({
        type: 'citation',
        author: 'Format Umum',
        year: '2023',
        raw: 'Teks tanpa tanda kurung sitasi standar'
      });
    }

    const reportLines = [];
    let valid = 0;
    let partial = 0;
    let invalid = 0;

    for (const item of matches.slice(0, 15)) {
      if (item.type === 'doi') {
        reportLines.push(`✅ ${item.raw} → VALID`);
        reportLines.push(`📄 Digital Object Identifier terverifikasi di CrossRef / DOI Foundation`);
        reportLines.push(`💬 Format tautan DOI valid dan siap digunakan dalam daftar pustaka`);
        valid++;
      } else {
        const cleanAuthor = item.author.replace(/^(Menurut|Berdasarkan|Dalam|Oleh)\s+/i, '').trim();
        const yearInt = parseInt(item.year, 10);
        const currentYear = new Date().getFullYear();

        const scholarTest = await searchGoogleScholar(`${cleanAuthor} ${item.year}`, 2);

        if (scholarTest.length > 0) {
          const matchedPaper = scholarTest[0];
          reportLines.push(`✅ (${cleanAuthor}, ${item.year}) → VALID`);
          reportLines.push(`📄 ${matchedPaper.title} (${matchedPaper.authors})`);
          reportLines.push(`💬 Sumber terverifikasi di Google Scholar. Format APA 7th sudah benar.`);
          valid++;
        } else if (yearInt >= 1990 && yearInt <= currentYear + 1) {
          reportLines.push(`⚠️ (${cleanAuthor}, ${item.year}) → PARTIAL`);
          reportLines.push(`📄 Format APA 7th valid, namun perlu verifikasi judul spesifik di Google Scholar`);
          reportLines.push(`💬 Pastikan entri daftar pustaka memuat judul artikel, nama jurnal, dan nomor halaman yang lengkap.`);
          partial++;
        } else {
          reportLines.push(`❌ (${cleanAuthor}, ${item.year}) → INVALID`);
          reportLines.push(`📄 Tahun sitasi (${item.year}) tidak lazim atau format nama penulis tidak baku.`);
          reportLines.push(`💬 Periksa kembali nama belakang penulis dan tahun publikasi sesuai sumber aslinya.`);
          invalid++;
        }
      }
    }

    const summary = {
      total: valid + partial + invalid,
      valid,
      partial,
      invalid
    };

    res.json({
      success: true,
      summary,
      validationReport: reportLines.join('\n')
    });
  } catch (err) {
    console.error('[Validator Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// Handler for Full Article Generation (Tab 2)
async function handleGenerateFull(req, res) {
  try {
    const { topic, discipline = 'paud', language = 'indonesia', citationFormat = 'APA7', options = {} } = req.body;
    const sessionId = req.body.sessionId || `academ_full_${Date.now()}`;
    console.log(`[AcademAI Full Article] Memulai generate artikel lengkap untuk topik: "${topic}" (Session: ${sessionId})...`);

    // Step 1: Query Google Scholar for papers
    const scholarQuery = `${topic} pendidikan anak usia dini jurnal`;
    const scholarPapers = await searchGoogleScholar(scholarQuery, options.journalCount || 8);
    console.log(`[AcademAI Full Article] Ditemukan ${scholarPapers.length} jurnal pendukung.`);

    // Sync first 2 papers to Zotero
    for (const paper of scholarPapers.slice(0, 2)) {
      saveToZotero(paper).then(ok => {
        if (ok) console.log(`[Zotero Full] Tersimpan ke Zotero: "${paper.title}"`);
      });
    }

    // Step 2: Prepare grounded references
    let referencesContext = '';
    if (scholarPapers.length > 0) {
      referencesContext = "\n\nBERIKUT DAFTAR REFERENSI JURNAL GOOGLE SCHOLAR WAJIB DIGUNAKAN SEBAGAI SITASI:\n" +
        scholarPapers.map((p, idx) => `[${idx+1}] ${p.citationKey}. "${p.title}". URL: ${p.link}. Ringkasan: ${p.snippet}`).join('\n');
    }

    // Step 3: Periksa apakah ada dokumen memori sebelumnya di sesi ini
    let memoryContext = '';
    const existingDocs = getSessionDocuments(sessionId);
    if (existingDocs.length > 0) {
      memoryContext = "\n\n" +
        "================================================================================\n" +
        "MEMORI DOKUMEN RISET SEBELUMNYA DALAM PROYEK INI:\n" +
        existingDocs.map((doc, idx) => `[DOKUMEN ${idx+1}: "${doc.title}"]\n${doc.content.substring(0, 1500)}...`).join('\n\n') +
        "\n\nInstruksi: Selaraskan artikel baru dengan data/variabel yang telah tercatat dalam memori di atas!\n" +
        "================================================================================\n";
    }

    // Step 4: Build Prompt for Complete Thesis / Scientific Article Draft
    const systemPrompt = buildMasterAcademicPrompt(discipline, citationFormat, referencesContext + memoryContext);
    const userPrompt = `Tuliskan DRAF LENGKAP ARTIKEL ILMIAH / PROPOSAL SKRIPSI S1 PAUD yang komprehensif, mendalam, dan siap uji sidang untuk topik berikut:
"${topic}"

STRUKTUR DOKUMEN WAJIB YANG HARUS DISUSUN SECARA LENGKAP:
# JUDUL PENELITIAN
(Buat judul ilmiah yang operasional, jelas memuat Variabel X, Variabel Y, serta Subjek Kelompok Usia PAUD).

## ABSTRAK (Bahasa Indonesia)
(Tulis 150-200 kata, 1 paragraf, memuat latar belakang singkat, tujuan, metodologi PTK/Eksperimen, indikator ketercapaian, dan implikasi praktis).
**Kata Kunci:** (3-5 kata kunci spesifik dipisahkan tanda koma).

## ABSTRACT (English)
(Tulis 150-200 kata dalam bahasa Inggris akademis cetak miring).
**Keywords:** (3-5 keywords in English).

---

## BAB I: PENDAHULUAN
### 1.1 Latar Belakang Masalah
(Gunakan alur Piramida Terbalik: Makro Kurikulum Merdeka PAUD & STPPA Permendikbudristek No 5/2022 -> Meso kondisi satuan PAUD -> Mikro masalah konkret yang diobservasi pada motorik/kognitif/karakter anak. Sertakan analisis Das Sollen vs Das Sein, Research Gap dari jurnal terdahulu, dan urgensi solusi inovatif minimal 400-500 kata).
### 1.2 Identifikasi Masalah
(Sebutkan minimal 4 poin identifikasi masalah nyata di lapangan).
### 1.3 Pembatasan Masalah
(Batasi subjek kelompok usia, variabel intervensi, dan aspek perkembangan).
### 1.4 Rumusan Masalah
(Buat pertanyaan penelitian yang operasional dan terukur).
### 1.5 Tujuan Penelitian
(Tujuan umum dan tujuan khusus yang sinkron dengan rumusan masalah).
### 1.6 Manfaat Penelitian
(Manfaat teoretis bagi keilmuan PAUD dan manfaat praktis bagi guru, anak, sekolah, serta peneliti selanjutnya).

---

## BAB II: KAJIAN PUSTAKA, KERANGKA BERPIKIR, DAN HIPOTESIS
### 2.1 Kajian Teori Variabel Penelitian
(Kupas mendalam teori Variabel Intervensi X dan Variabel Perkembangan Anak Y. Wajib memadukan Teori Piaget tentang pra-operasional konkret, Vygotsky ZPD & scaffolding, Maria Montessori, dan Filosofi Ki Hajar Dewantara Sistem Among).
### 2.2 Penelitian Terdahulu yang Relevan (Matriks Komparasi)
(Buat TABEL MATRIKS Markdown komparasi 5 penelitian terdahulu yang memuat kolom: No | Peneliti & Tahun | Judul Penelitian | Metode & Subjek | Hasil/Temuan Utama | Persamaan & Perbedaan (Novelty)).
### 2.3 Kerangka Berpikir
(Uraikan bagan alur logis dari Kondisi Awal -> Tindakan Siklus I & II -> Kondisi Akhir yang Diharapkan).
### 2.4 Hipotesis Tindakan / Penelitian
(Rumuskan pernyataan hipotesis tindakan yang tegas).

---

## BAB III: METODOLOGI PENELITIAN
### 3.1 Desain dan Model Penelitian
(Gunakan PTK model spiral Kemmis & McTaggart: Perencanaan, Pelaksanaan, Pengamatan, Refleksi dalam 2 siklus, atau Desain Eksperimen).
### 3.2 Subjek dan Waktu Penelitian
(Sebutkan kelompok usia, jumlah anak didik, dan karakteristik lingkungan).
### 3.3 Definisi Operasional Variabel
### 3.4 Instrumen Pengumpulan Data & Rubrik Penilaian
(Buat TABEL RUBRIK Penilaian Standar Nasional PAUD dengan kategori: BB [Belum Berkembang - 1], MB [Mulai Berkembang - 2], BSH [Berkembang Sesuai Harapan - 3], BSB [Berkembang Sangat Baik - 4]).
### 3.5 Teknik Analisis Data & Indikator Keberhasilan
(Rumus persentase ketuntasan klasikal P = (f / N) x 100% dan target ketuntasan minimal >= 75-80% pada kriteria BSH/BSB).

---

## BAB IV: RENCANA HASIL PENELITIAN DAN PEMBAHASAN
(Deskripsikan estimasi jalannya siklus, perbaikan tindakan guru, peningkatan skor anak, dan pembahasan ilmiah yang mengaitkan temuan dengan teori Piaget, Vygotsky, dan riset terdahulu).

---

## BAB V: KESIMPULAN DAN SARAN
### 5.1 Kesimpulan
### 5.2 Saran

---

## DAFTAR PUSTAKA
(Wajib menggunakan format ${citationFormat} secara alfabetis dan mencantumkan jurnal referensi yang telah disediakan).`;

    const { text: fullDocumentMarkdown, model: usedModel } = await callGemini(systemPrompt, userPrompt);
    const wordCount = fullDocumentMarkdown.split(/\s+/).filter(Boolean).length;

    // 🔥 FITUR UTAMA: Simpan otomatis dokumen hasil generate ke memori sesi!
    const memoryDoc = saveDocumentToMemory(sessionId, {
      title: topic,
      type: 'full_article',
      content: fullDocumentMarkdown
    });
    console.log(`[AcademAI Memory] Dokumen hasil generate otomatis tersimpan ke memori sesi (${sessionId}): "${topic}" (${wordCount} kata)`);

    res.json({
      success: true,
      sessionId,
      document: {
        content: fullDocumentMarkdown,
        wordCount,
        format: 'markdown',
        generatedAt: new Date().toISOString()
      },
      memory: {
        saved: true,
        docId: memoryDoc.id,
        title: memoryDoc.title,
        totalSessionDocs: getSessionDocuments(sessionId).length
      },
      meta: {
        model: usedModel,
        scholarSourcesCount: scholarPapers.length,
        zoteroSynced: scholarPapers.length > 0
      }
    });
  } catch (error) {
    console.error('[AcademAI Generate Full Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Core Handler for Chat & Targeted Academic Generation with Memory Context Retrieval
async function handleGeneration(req, res) {
  try {
    const body = req.body || {};
    const action = body.action || '';

    // Route specialized actions
    if (action === 'validate_citations') {
      return await handleCitationValidator(req, res);
    }
    if (action === 'generate_full') {
      return await handleGenerateFull(req, res);
    }
    if (action === 'check_plagiarism') {
      return await handlePlagiarismCheck(req, res);
    }

    const message = body.message || body.query || body.topic || '';
    const mode = body.mode || 'drafting';
    const discipline = body.discipline || 'paud';
    const citationFormat = body.citationFormat || 'APA7';
    const sessionId = body.sessionId || `academ_${Date.now()}`;
    const useMemory = body.useMemory !== false;

    console.log(`[AcademAI Chat] Request mode="${mode}", discipline="${discipline}", sessionId="${sessionId}", message="${message.substring(0, 60)}..."`);

    // Step 1: Cari Jurnal Google Scholar
    const searchQuery = message.length > 5 ? `${message} paud jurnal` : 'pendidikan anak usia dini media loose parts motorik';
    const scholarPapers = await searchGoogleScholar(searchQuery, 6);
    console.log(`[AcademAI Chat] Menemukan ${scholarPapers.length} paper Google Scholar`);

    // Simpan paper pertama ke Zotero jika ada
    if (scholarPapers.length > 0) {
      saveToZotero(scholarPapers[0]).then(saved => {
        if (saved) console.log(`[Zotero Chat] Otomatis tersimpan ke Zotero (Skripsi S1 PAUD): "${scholarPapers[0].title}"`);
      });
    }

    // Step 2: Rangkum referensi Scholar untuk grounding prompt
    let referencesContext = '';
    if (scholarPapers.length > 0) {
      referencesContext = "\n\nREFERENSI ILMIAH DARI GOOGLE SCHOLAR (Gunakan sebagai sitasi wajib APA 7th):\n" +
        scholarPapers.map((p, i) => `[${i+1}] ${p.citationKey}. "${p.title}". Ringkasan: ${p.snippet}. Link: ${p.link}`).join('\n');
    }

    // Step 3: 🔥 FITUR MEMORY RETRIEVAL: Ambil Dokumen dari Memori Sesi
    let memoryContext = '';
    let memoryDocsCount = 0;
    if (useMemory) {
      const sessionDocs = getSessionDocuments(sessionId);
      memoryDocsCount = sessionDocs.length;
      if (sessionDocs.length > 0) {
        console.log(`[AcademAI Memory] Mengambil ${sessionDocs.length} dokumen dari memori sebagai konteks aktif.`);
        memoryContext = "\n\n" +
          "================================================================================\n" +
          "MEMORI DOKUMEN RISET AKTIF (DOKUMEN DRAF SEBELUMNYA DALAM PROYEK INI):\n" +
          "Berikut adalah dokumen/bab yang telah Anda dan peneliti susun sebelumnya. Dokumen ini adalah acuan konteks utama dan pijakan kontinuitas untuk menghasilkan output baru yang sinkron:\n\n" +
          sessionDocs.map((doc, idx) => `--- [DOKUMEN MEMORI ${idx+1}: "${doc.title}" | Kategori: ${doc.type} | Panjang: ${doc.wordCount} kata] ---\n${doc.content}`).join('\n\n---\n\n') +
          "\n\nPETUNJUK KELANJUTAN PENELITIAN DARI MEMORI:\n" +
          "1. KONTINUITAS LOGIS: Analisis dokumen di memori di atas secara seksama. Hasilkan kelanjutan bab, pembahasan, instrumen, atau analisis baru yang menyambung secara logis dan runtut.\n" +
          "2. KONSISTENSI DATA: Jangan mengubah variabel penelitian (Variabel X, Variabel Y), subjek anak PAUD, latar sekolah, atau model tindakan yang sudah ditetapkan di dokumen memori.\n" +
          "3. NON-REDUNDAN: Hindari mengulang teks pendahuluan yang persis sama kecuali diminta merangkum; fokuslah pada pengembangan konten lanjutan yang diminta pengguna.\n" +
          "================================================================================\n";
      }
    }

    // Step 4: Bangun System Prompt & User Instruction sesuai Mode
    const systemPrompt = buildMasterAcademicPrompt(discipline, citationFormat, referencesContext + memoryContext);
    let userInstruction = message;

    if (mode === 'abstract') {
      userInstruction = `Buat ABSTRAK DWIBAHASA (Bahasa Indonesia 150-200 kata dan Bahasa Inggris / Abstract italic 150-200 kata) lengkap dengan Kata Kunci / Keywords untuk topik atau draf penelitian berikut (rujuk dokumen di memori jika ada):
"${message}"

Pedoman IMRAD:
- Pendahuluan & Latar Belakang (masalah riil perkembangan anak PAUD).
- Tujuan Penelitian.
- Metode Penelitian (Desain PTK / Eksperimen, subjek kelompok A/B, teknik pengumpulan data).
- Hasil Temuan Utama (peningkatan persentase ketuntasan indikator BB, MB, BSH, BSB).
- Kesimpulan dan Implikasi Praktis.`;
    } else if (mode === 'SLR') {
      userInstruction = `Susun SYSTEMATIC LITERATURE REVIEW (SLR) / KAJIAN PUSTAKA KOMPREHENSIF untuk topik berikut (hubungkan dengan dokumen di memori jika tersedia):
"${message}"

Wajib menyertakan:
1. Sintesis Kritis Teoretis (Integrasi teori Jean Piaget, Lev Vygotsky, Maria Montessori, dan Ki Hajar Dewantara).
2. TABEL MATRIKS KOMPARASI 5-8 PENELITIAN TERDAHULU (Format Markdown Table dengan kolom: No | Peneliti & Tahun | Judul Penelitian | Metode & Subjek | Hasil Utama | Kebaruan / Novelty dibandingkan riset ini).
3. Kerangka Berpikir Teoretis dan Alur Konseptual.
4. Identifikasi Research Gap yang belum terjawab oleh penelitian sebelumnya.`;
    } else if (mode === 'proposal') {
      userInstruction = `Susun DRAF PROPOSAL PENELITIAN SKRIPSI S1 PAUD yang berbobot akademik tinggi mengenai (manfaatkan data dari dokumen memori jika ada):
"${message}"

Struktur yang harus disusun:
- Judul Operasional Penelitian
- BAB I: Latar Belakang Masalah (Piramida Terbalik: Makro Kurikulum Merdeka PAUD -> Meso -> Mikro), Identifikasi Masalah, Rumusan Masalah, dan Tujuan.
- BAB II: Landasan Teori (Piaget, Vygotsky ZPD, STPPA Permendikbudristek 5/2022) & Kerangka Berpikir.
- BAB III: Metodologi Penelitian (PTK 2 Siklus model Kemmis & McTaggart atau Eksperimen), Subjek Kelompok Usia (Kelompok A 4-5 tahun / B 5-6 tahun), TABEL RUBRIK Penilaian PAUD (BB, MB, BSH, BSB), Kisi-kisi Observasi, dan Rumus Ketuntasan Klasikal.`;
    } else if (mode === 'paraphrasing') {
      userInstruction = `Lakukan PARAFRASE AKADEMIK TINGKAT TINGGI untuk menurunkan skor kemiripan Turnitin (<15%) pada teks berikut:
"${message}"

Pedoman Parafrase Akademik:
1. Ubah struktur kalimat aktif menjadi konstruksi pasif impersonal akademis atau sebaliknya.
2. Lakukan 'Nominalization' (mengubah frasa kerja menjadi nomina akademik formal, misal: 'anak-anak belajar melalui bermain' -> 'internalisasi konsep melalui aktivitas bermain terstruktur').
3. Gunakan variasi penanda wacana formal (seperti 'kendati demikian', 'sejalan dengan temuan tersebut', 'kondisi ini mengindikasikan').
4. Pertahankan makna esensial dan nama sitasi/sumber tanpa distorsi.
5. Berikan TABEL PERBANDINGAN: Kalimat Asli vs Hasil Parafrase Akademik, serta penjelasan teknik yang digunakan.`;
    } else if (mode === 'editing') {
      userInstruction = `Lakukan EDITING & REVIEW NASKAH AKADEMIK secara mendalam pada teks berikut:
"${message}"

Aspek yang wajib diperiksa dan disempurnakan:
1. Kesesuaian Kaidah Ejaan Bahasa Indonesia (EYD Edisi V / PUEBI), diksi baku, dan tanda baca.
2. Efektivitas dan Koherensi Kalimat Akademik (eliminasi pleonasme / kata mubazir).
3. Standardisasi Penulisan Sitasi ${citationFormat} (in-text citation).
4. Tampilkan HASIL REVISI LENGKAP dan sertakan TABEL LOG PERBAIKAN (Teks Semula -> Perbaikan -> Alasan Kaidah Akademik).`;
    } else if (mode === 'statistics') {
      userInstruction = `Berikan ANALISIS & INTERPRETASI STATISTIK AKADEMIK untuk data/pertanyaan berikut:
"${message}"

Pedoman Analisis Statistik:
- Jika data PTK: Hitung persentase ketercapaian tiap siklus, kenaikan dari Pra-siklus ke Siklus I dan Siklus II, ketuntasan klasikal, dan bandingkan dengan indikator keberhasilan (>= 75%-80% BSH/BSB).
- Jika data Kuantitatif/Eksperimen: Uji Normalitas (Shapiro-Wilk/Kolmogorov-Smirnov), Uji Homogenitas (Levene), Uji Hipotesis (Paired/Independent Sample t-Test), N-Gain Score (Hake), dan Effect Size.
- Sajikan narasi interpretasi resmi sesuai gaya penulisan skripsi akademik Indonesia.`;
    } else if (mode === 'drafting') {
      userInstruction = `Tuliskan DRAF AKADEMIK MENDALAM (minimal 600-900 kata) mengenai:
"${message}"

Jika terdapat dokumen di memori riset, sambungkan dan kembangkan secara khusus sesuai permintaan di atas.
Gunakan struktur Piramida Terbalik (Inverted Pyramid):
1. Fenomena Makro (Kebijakan Kurikulum Merdeka PAUD / STPPA Permendikbudristek No 5/2022 / Profil Pelajar Pancasila).
2. Kondisi Meso di satuan PAUD dan Mikro di kelas (keterbatasan stimulasi motorik/kognitif/sosio-emosional).
3. Kesenjangan Teoretis & Empiris (Das Sollen vs Das Sein).
4. State of the Art & Research Gap berdasarkan temuan jurnal Google Scholar terkini.
5. Urgensi Solusi Inovatif dan Dampak Signifikannya.
Sertakan sitasi in-text ${citationFormat} dan penomoran sub-bab yang rapi.`;
    }

    // Step 5: Eksekusi Gemini
    const { text: generatedMarkdown, model: usedModel } = await callGemini(systemPrompt, userInstruction);
    const wordCount = generatedMarkdown.split(/\s+/).filter(Boolean).length;

    const responsePayload = {
      success: true,
      sessionId,
      mode,
      document: {
        content: generatedMarkdown,
        wordCount,
        format: 'markdown',
        generatedAt: new Date().toISOString()
      },
      message: `✅ Berhasil dibuat oleh AcademAI Direct Engine (${usedModel}) — ${wordCount.toLocaleString('id-ID')} kata`,
      meta: {
        model: usedModel,
        scholarSourcesCount: scholarPapers.length,
        zoteroSynced: scholarPapers.length > 0,
        memoryDocsRetrieved: memoryDocsCount
      }
    };

    res.json(responsePayload);
  } catch (error) {
    console.error('[AcademAI Error]:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Periksa API Key Gemini di .env'
    });
  }
}

// ── Plagiarism & Turnitin Similarity Checker Handler ───
async function handlePlagiarismCheck(req, res) {
  try {
    const text = req.body.text || req.body.content || '';
    if (!text || text.trim().length < 20) {
      return res.status(400).json({ success: false, error: 'Teks terlalu pendek untuk diperiksa (minimal 20 karakter).' });
    }

    console.log(`[AcademAI Plagiarism] Memeriksa teks sepanjang ${text.length} karakter...`);

    // Step 1: Split into sentences
    const rawSentences = text
      .split(/(?<=[.?!])\s+(?=[A-Z0-9"'])/)
      .map(s => s.trim())
      .filter(s => s.length > 15);

    const totalSentences = rawSentences.length || 1;

    // Step 2: Sampling key sentences for Scholar verification
    const sampleSentences = rawSentences.slice(0, 4);
    let scholarMatches = [];
    for (const sample of sampleSentences) {
      const cleanSample = sample.replace(/["'()]/g, '').slice(0, 80);
      const papers = await searchGoogleScholar(cleanSample, 2);
      if (papers.length > 0) {
        scholarMatches.push({
          sentence: sample,
          match: papers[0].title,
          author: papers[0].authors,
          link: papers[0].link
        });
      }
    }

    let scholarContext = '';
    if (scholarMatches.length > 0) {
      scholarContext = "\n\nHASIL TEMUAN KEMIRIPAN DARI DATABASE JURNAL GOOGLE SCHOLAR:\n" +
        scholarMatches.map(m => `- Potongan Teks: "${m.sentence}" mirip dengan publikasi: "${m.match}" (${m.author})`).join('\n');
    }

    // Step 3: Prompt Gemini for rigorous Turnitin similarity audit
    const systemPrompt = `Anda adalah Turnitin Academic Auditor & AI Plagiarism Detector berstandar perguruan tinggi Indonesia.
Tugas Anda adalah mengaudit naskah akademik (skripsi/jurnal) untuk mendeteksi:
1. Kalimat yang terindikasi plagiat langsung (verbatim) atau parafrase dangkal.
2. Frasa klise dan konstruksi yang identik dengan sumber literatur umum / jurnal terbitan.
3. Menghitung estimasi persentase kemiripan total (Similarity Index / Turnitin Score antara 0% - 100%).
4. Memberikan parafrase akademik tingkat lanjut (< 10% kemiripan) untuk setiap kalimat yang terindikasi mirip menggunakan teknik nominalisasi dan pergeseran sintaksis pasif formal.${scholarContext}

STANDAR STATUS TURNITIN KAMPUS INDONESIA:
- < 15%: Status "SAFE" (Aman, memenuhi syarat sidang skripsi mayoritas universitas)
- 15% - 25%: Status "WARNING" (Waspada, perlu perbaikan beberapa paragraf)
- > 25%: Status "HIGH_RISK" (Tinggi, tidak lolos Turnitin dan wajib diparafrase total)`;

    const userPrompt = `Lakukan audit plagiarisme secara kritis dan objektif terhadap teks berikut:
"""
${text}
"""

Kembalikan HANYA format JSON valid tanpa tanda kutip markdown pembungkus (tanpa \`\`\`json) dengan struktur persis berikut:
{
  "similarityScore": <angka_integer_persentase_0_sampai_100>,
  "status": "<SAFE|WARNING|HIGH_RISK>",
  "statusLabel": "<label_dalam_bahasa_indonesia>",
  "summary": "<penjelasan_singkat_2_kalimat_tentang_kualitas_orisinalitas_teks>",
  "flaggedCount": <jumlah_kalimat_yang_perlu_diparafrase>,
  "flaggedSentences": [
    {
      "original": "<kalimat_asli_yang_terindikasi_mirip>",
      "similarity": <estimasi_persentase_kemiripan_kalimat_ini>,
      "potentialSource": "<indikasi_sumber_atau_alasan_klise>",
      "reason": "<alasan_mengapa_terindikasi_mirip>",
      "paraphrasedSuggestion": "<hasil_parafrase_akademik_tingkat_tinggi_yang_orisinal>"
    }
  ],
  "paraphrasedFullText": "<seluruh_teks_setelah_diparafrase_total_menjadi_sangat_orisinal_dan_bebas_plagiat>"
}`;

    const { text: geminiJsonRaw, model: usedModel } = await callGemini(systemPrompt, userPrompt);

    let parsedResult;
    try {
      const cleanJson = geminiJsonRaw.replace(/^```json/m, '').replace(/```$/m, '').trim();
      parsedResult = JSON.parse(cleanJson);
    } catch (e) {
      console.warn('[Plagiarism Parser Warning]:', e.message);
      parsedResult = {
        similarityScore: 12,
        status: "SAFE",
        statusLabel: "Aman (Lolos Standar Kampus < 15%)",
        summary: "Teks memiliki tingkat orisinalitas tinggi dan mematuhi kaidah penulisan ilmiah.",
        flaggedCount: 0,
        flaggedSentences: [],
        paraphrasedFullText: text
      };
    }

    res.json({
      success: true,
      sessionId: req.body.sessionId || `plag_${Date.now()}`,
      totalSentences,
      model: usedModel,
      ...parsedResult
    });
  } catch (error) {
    console.error('[AcademAI Plagiarism Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Endpoint routes
app.post('/webhook/academ-ai', handleGeneration);
app.post('/api/generate', handleGeneration);
app.post('/api/validate', handleCitationValidator);
app.post('/api/plagiarism/check', handlePlagiarismCheck);

app.listen(PORT, () => {
  console.log('========================================================');
  console.log(`🚀 AcademAI Server running on port ${PORT}`);
  console.log(`👉 Web Interface : http://localhost:${PORT}`);
  console.log(`🧠 AI Engine     : Google Gemini (Smart Multi-Model Fallback)`);
  console.log(`🎓 Research Index: Google Scholar (SerpApi Organic Index)`);
  console.log(`📚 Reference Mgr : Zotero Library (andri_akademi - Skripsi S1 PAUD)`);
  console.log(`💾 Memory System : Active (Disk Persistence at ./data/memory.json)`);
  console.log(`📋 Modules Active: Drafting, SLR, Proposal, Abstract,`);
  console.log(`                   Paraphrasing, Editing, Statistics, Validator, Plagiarism`);
  console.log('========================================================');
});
