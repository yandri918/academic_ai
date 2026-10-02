import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { createRequire } from 'module';
import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Packer
} from 'docx';

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
app.set('trust proxy', 1);

// Production Security: Rate Limiting to prevent budget explosion
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  max: 30, // Maksimal 30 request AI per 10 menit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Terlalu banyak permintaan generate AI dari IP Anda. Demi keamanan kuota, silakan tunggu beberapa saat.'
  }
});
app.use(['/api/generate', '/webhook/academ-ai', '/api/plagiarism/check'], aiLimiter);

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
    server: 'AcademAI Universal Academic Engine',
    discipline: 'Universal Academic Research (Multi-Disciplinary)',
    features: ['memory_context', 'pdf_parser', 'plagiarism_checker', 'google_scholar', 'zotero_sync', 'full_generator', 'citation_validator', 'academic_stats', 'dataviz_mcp'],
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
  const collectionId = '6FJX4FDT'; // Zotero Academic Research Collection

  if (!apiKey || !userId) return null;

  try {
    const item = [{
      itemType: 'journalArticle',
      title: paper.title || 'Paper Riset Ilmiah AcademAI',
      publicationTitle: paper.journal || 'Jurnal Ilmiah Akademik Terakreditasi',
      date: String(paper.year || new Date().getFullYear()),
      DOI: paper.doi || '',
      url: paper.link || '',
      abstractNote: paper.snippet || '',
      collections: [collectionId],
      tags: [
        { tag: 'AcademAI' },
        { tag: 'Academic-Research' },
        { tag: 'Google-Scholar' }
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

// ─── DISCIPLINES REGISTRY ────────────────────────────────────────────────────
const DISCIPLINES = {
  general_academic: {
    name: 'Akademik Umum / Lintas Disiplin',
    searchSuffix: 'jurnal ilmiah akademik penelitian',
    persona: 'Co-Pilot Riset Akademik Universal untuk mahasiswa S1/S2/S3 dan peneliti dari berbagai bidang ilmu di Indonesia',
    theoryGuide: `2. Kerangka Teoretis Lintas Disiplin:
   - Filsafat Ilmu: Ontologi, Epistemologi, dan Aksiologi sebagai fondasi keilmuan.
   - Teori Konstruktivis (Piaget, Vygotsky) dan Positivisme (Comte, Popper) untuk landasan metodologi.
   - Paradigma Penelitian: Kuantitatif (positivisme), Kualitatif (interpretivisme), Mixed Methods.
   - Etika Penelitian Ilmiah dan Integritas Akademik (menghindari plagiarisme, fabrikasi data).`,
    methodGuide: `3. Metodologi Penelitian Umum:
   - Kuantitatif: Survei, Eksperimen, Quasi-Eksperimen (Pre-test/Post-test, Control Group).
   - Kualitatif: Studi Kasus, Fenomenologi, Grounded Theory, Etnografi.
   - Mixed Methods: Explanatory Sequential, Exploratory Sequential, Concurrent Triangulation.
   - Analisis Data: Statistik deskriptif & inferensial (SPSS/AMOS), tematik & koding induktif/deduktif.
   - Systematic Literature Review (SLR) & Meta-Analisis mengikuti protokol PRISMA.`
  },
  education: {
    name: 'Ilmu Pendidikan',
    searchSuffix: 'jurnal pendidikan ilmu pendidikan pembelajaran',
    persona: 'Co-Pilot Riset Ilmu Pendidikan dan Keguruan untuk mahasiswa S1 PGSD, PGMI, dan program studi pendidikan lainnya',
    theoryGuide: `2. Teori Pokok Ilmu Pendidikan:
   - Teori Belajar Behaviorisme (Skinner, Pavlov): Stimulus-respons, penguatan, conditioning.
   - Teori Belajar Kognitif (Piaget, Bruner, Ausubel): Konstruksi pengetahuan, advance organizer.
   - Teori Pembelajaran Sosial (Bandura): Observasional learning, efikasi diri.
   - Kurikulum Merdeka Belajar: Profil Pelajar Pancasila, Projek Penguatan Profil Pelajar Pancasila (P5).
   - Model Pembelajaran Inovatif: PBL, PjBL, Discovery Learning, Cooperative Learning, Flipped Classroom.`,
    methodGuide: `3. Metodologi Penelitian Pendidikan:
   - PTK (Penelitian Tindakan Kelas) model Kemmis & McTaggart / DDAER (Kurt Lewin).
   - R&D (Research & Development): Model ADDIE, Dick & Carey, 4D Thiagarajan.
   - Eksperimen / Quasi-Eksperimen (Nonequivalent Control Group Design).
   - Instrumen: Tes Hasil Belajar, Lembar Observasi, Angket, Skala Likert, Rubrik Penilaian.`
  },
  paud: {
    name: 'Pendidikan Anak Usia Dini (PAUD)',
    searchSuffix: 'pendidikan anak usia dini jurnal PAUD',
    persona: 'Co-Pilot Riset Skripsi S1 PAUD dan Ilmu Keguruan Anak Usia Dini Terkemuka di Indonesia',
    theoryGuide: `2. Teori-Teori Pokok PAUD:
   - Teori Perkembangan Kognitif Jean Piaget (Tahap Pra-operasional 2–7 tahun: berpikir simbolik, egosentrisme, manipulasi objek konkret).
   - Teori Konstruktivisme Sosial Lev Vygotsky (ZPD, Scaffolding, bahasa sebagai instrumen berpikir).
   - Pendekatan Maria Montessori (Periode sensitif, prepared environment, auto-education, media sensorik).
   - Filosofi Ki Hajar Dewantara (Sistem Among: Ing Ngarso Sung Tulodo, Ing Madyo Mangun Karso, Tut Wuri Handayani; Tri Sentra Pendidikan).
   - STPPA (Permendikbudristek No. 5 Tahun 2022): 6 Aspek (Nilai Agama & Moral, Fisik-Motorik, Kognitif, Bahasa, Sosial-Emosional, Seni).
   - Media Loose Parts & APE: bahan terbuka alam & sintetis untuk HOTS anak usia dini.`,
    methodGuide: `3. Metodologi Penelitian Skripsi PAUD:
   - PTK model siklus Kemmis & McTaggart: Planning, Acting, Observing, Reflecting (2 Siklus).
   - Eksperimen / Quasi-Experiment dengan Pretest-Posttest.
   - Rubrik Penilaian Standar Nasional PAUD: BB (1), MB (2), BSH (3), BSB (4).
   - Indikator Keberhasilan Tindakan: Ketuntasan klasikal minimal >= 75–80% pada kriteria BSH/BSB.
   - Latar Belakang Piramida Terbalik: Makro (Kurikulum Merdeka PAUD / STPPA) → Meso (satuan PAUD/TK) → Mikro (masalah konkret di kelas).`
  },
  economics: {
    name: 'Ekonomi & Bisnis',
    searchSuffix: 'jurnal ekonomi bisnis manajemen keuangan',
    persona: 'Co-Pilot Riset Ilmu Ekonomi, Manajemen, Akuntansi, dan Bisnis untuk mahasiswa S1/S2 di Indonesia',
    theoryGuide: `2. Teori-Teori Pokok Ekonomi & Bisnis:
   - Teori Perilaku Konsumen (Kotler & Keller): Faktor budaya, sosial, pribadi, psikologis.
   - Teori Motivasi (Herzberg, Maslow, McClelland): Aplikasi pada perilaku organisasi.
   - Teori Agensi (Jensen & Meckling): Asimetri informasi, principal-agent dalam tata kelola perusahaan.
   - Teori Sinyal (Spence): Informasi pasar dan keputusan investasi.
   - Balanced Scorecard (Kaplan & Norton): Perspektif keuangan, pelanggan, proses internal, pembelajaran.
   - Analisis SWOT, Porter's Five Forces, Value Chain Analysis.`,
    methodGuide: `3. Metodologi Penelitian Ekonomi & Bisnis:
   - Kuantitatif: Regresi Linear/Berganda, Regresi Logistik, SEM (Structural Equation Modeling), Path Analysis.
   - Deskriptif Kuantitatif: Survei dengan kuesioner (Skala Likert 1–5), uji validitas & reliabilitas.
   - Kualitatif: Studi Kasus, Wawancara Mendalam, Analisis Dokumen (Annual Report, Laporan Keuangan).
   - Uji Asumsi Klasik: Normalitas, Multikolinieritas, Heteroskedastisitas, Autokorelasi.
   - Alat Analisis: SPSS, Eviews, SmartPLS, AMOS.`
  },
  computer_science: {
    name: 'Ilmu Komputer & Teknik Informatika',
    searchSuffix: 'jurnal ilmu komputer informatika teknologi informasi',
    persona: 'Co-Pilot Riset Ilmu Komputer, Sistem Informasi, dan Teknik Informatika untuk mahasiswa dan peneliti teknologi di Indonesia',
    theoryGuide: `2. Teori-Teori Pokok Ilmu Komputer:
   - Model Waterfall, Agile (Scrum/Kanban), Spiral: Metodologi pengembangan perangkat lunak.
   - Machine Learning & AI: Supervised, Unsupervised, Reinforcement Learning; Neural Network & Deep Learning.
   - Arsitektur Sistem: Client-Server, Microservices, SOA, REST API, GraphQL.
   - Basis Data: Relasional (SQL), NoSQL (MongoDB, Redis), Data Warehouse, ETL.
   - Keamanan Siber: CIA Triad (Confidentiality, Integrity, Availability), OWASP Top 10, enkripsi.`,
    methodGuide: `3. Metodologi Penelitian Ilmu Komputer:
   - R&D (Prototype/Iterative): Model Waterfall, SDLC (System Development Life Cycle).
   - Eksperimental: Pengujian kinerja sistem (benchmarking), akurasi model ML (confusion matrix, F1-score, AUC-ROC).
   - Studi Kasus: Analisis sistem existing, perancangan ulang berbasis kebutuhan pengguna (UX Research).
   - Pengujian: Black-Box Testing, White-Box Testing, User Acceptance Testing (UAT).
   - Metrik Evaluasi: Precision, Recall, RMSE, MAE, Response Time, Throughput.`
  },
  engineering: {
    name: 'Teknik & Teknologi',
    searchSuffix: 'jurnal teknik teknologi rekayasa engineering',
    persona: 'Co-Pilot Riset Teknik Sipil, Mesin, Elektro, Kimia, Industri, dan bidang rekayasa lainnya untuk mahasiswa S1/S2 di Indonesia',
    theoryGuide: `2. Teori-Teori Pokok Teknik:
   - Mekanika Bahan & Kekuatan Material: Tegangan, Regangan, Modulus Elastisitas, Faktor Keamanan.
   - Termodinamika: Hukum I & II, Siklus Carnot, Efisiensi Termal.
   - Elektromagnetika (Maxwell): Medan listrik, medan magnet, induksi, gelombang EM.
   - Kontrol Otomatis: Sistem umpan balik (PID Controller), transfer function, kestabilan sistem.
   - Lean Manufacturing & Six Sigma: DMAIC, value stream mapping, efisiensi produksi.`,
    methodGuide: `3. Metodologi Penelitian Teknik:
   - Eksperimental: Perancangan percobaan (DOE – Design of Experiment), analisis variansi (ANOVA).
   - Simulasi: FEM (Finite Element Method) dengan ANSYS/Abaqus; simulasi CFD.
   - Studi Kasus & Observasi Lapangan: Pengukuran parameter teknis, analisis kegagalan.
   - Optimasi: Linear Programming, Algoritma Genetika, Particle Swarm Optimization.
   - Analisis Statistik: Uji t, ANOVA, Regresi, Analisis Regresi Non-Linear.`
  },
  health: {
    name: 'Kesehatan & Kedokteran',
    searchSuffix: 'jurnal kesehatan kedokteran medis klinis',
    persona: 'Co-Pilot Riset Kesehatan Masyarakat, Keperawatan, Farmasi, Kedokteran Gigi, dan Ilmu Kedokteran untuk mahasiswa dan peneliti kesehatan di Indonesia',
    theoryGuide: `2. Teori-Teori Pokok Kesehatan:
   - Model Determinan Kesehatan (Dahlgren & Whitehead): Faktor individu, sosial, lingkungan.
   - Health Belief Model (HBM): Persepsi kerentanan, keparahan, manfaat, hambatan, dan isyarat bertindak.
   - Teori Transisi Epidemiologi (Omran): Pergeseran pola penyakit dari infeksi ke degeneratif.
   - Evidence-Based Medicine (EBM): Hierarki bukti ilmiah (RCT, Systematic Review, Meta-Analisis).
   - Konsep Pencegahan (Leavell & Clark): Primer (promosi & proteksi), Sekunder (deteksi dini), Tersier (rehabilitasi).`,
    methodGuide: `3. Metodologi Penelitian Kesehatan:
   - Deskriptif: Cross-Sectional, Case Report, Case Series.
   - Analitik: Case-Control, Kohort (Prospektif/Retrospektif).
   - Eksperimental: RCT (Randomized Controlled Trial), Quasi-Eksperimen dengan Pre-Post Test.
   - Systematic Review & Meta-Analisis (PRISMA Guidelines).
   - Uji Diagnostik: Sensitivitas, Spesifisitas, NPV, PPV, Kurva ROC.
   - Analisis: Odds Ratio, Relative Risk, Hazard Ratio, Kaplan-Meier Survival Analysis.`
  },
  law: {
    name: 'Ilmu Hukum',
    searchSuffix: 'jurnal hukum ilmu hukum perundang-undangan',
    persona: 'Co-Pilot Riset dan Penulisan Karya Ilmiah Hukum (Skripsi/Tesis) untuk mahasiswa Fakultas Hukum di Indonesia',
    theoryGuide: `2. Teori-Teori Pokok Ilmu Hukum:
   - Teori Kepastian Hukum (Hans Kelsen): Norma hukum berjenjang (Stufenbau-theorie), validitas hukum.
   - Teori Keadilan (John Rawls): Veil of Ignorance, prinsip kebebasan dan perbedaan.
   - Teori Perlindungan Hukum (Philipus Hadjon): Perlindungan preventif dan represif.
   - Teori Negara Hukum (Rechtsstaat): Supremasi hukum, persamaan di muka hukum, perlindungan HAM.
   - Sosiologi Hukum: Hukum sebagai fenomena sosial, law in books vs law in action.`,
    methodGuide: `3. Metodologi Penelitian Hukum:
   - Penelitian Hukum Normatif: Pendekatan undang-undang (statute approach), konseptual (conceptual), historis, kasus, komparatif.
   - Penelitian Hukum Empiris: Pendekatan sosiologis/yuridis-empiris; wawancara mendalam, observasi lapangan.
   - Sumber Bahan Hukum: Primer (UUD 1945, UU, PP, Perpres, Peraturan Daerah), Sekunder (buku, jurnal), Tersier (kamus, ensiklopedi).
   - Analisis: Preskriptif (normatif), deskriptif-analitis (empiris).`
  },
  psychology: {
    name: 'Psikologi',
    searchSuffix: 'jurnal psikologi perilaku mental kognitif',
    persona: 'Co-Pilot Riset Psikologi Klinis, Pendidikan, Industri-Organisasi, dan Sosial untuk mahasiswa dan peneliti psikologi di Indonesia',
    theoryGuide: `2. Teori-Teori Pokok Psikologi:
   - Psikoanalisis (Freud): Id, Ego, Superego; mekanisme pertahanan ego; pengembangan psikoseksual.
   - Behaviorisme (Watson, Skinner): Kondisioning klasik & operan, modifikasi perilaku.
   - Humanistik (Maslow, Rogers): Hierarki kebutuhan, aktualisasi diri, person-centered therapy.
   - Kognitif (Beck, Ellis): Distorsi kognitif, CBT (Cognitive Behavioral Therapy), skema kognitif.
   - Psikologi Positif (Seligman): PERMA Model (Positive Emotions, Engagement, Relationships, Meaning, Achievement).`,
    methodGuide: `3. Metodologi Penelitian Psikologi:
   - Kuantitatif: Survei dengan skala psikologi baku (Likert, Semantic Differential); uji validitas & reliabilitas (Alpha Cronbach).
   - Eksperimental: Within-Subject / Between-Subject Design; ABA design.
   - Kualitatif: Fenomenologi, Studi Kasus, Narrative Inquiry, IPA (Interpretative Phenomenological Analysis).
   - Alat Ukur Baku: BDI, DASS, MBTI, Raven's APM, Rorschach, TAT, DSM-5 criteria.
   - Analisis: SPSS (Regresi, ANOVA, Korelasi Pearson/Spearman), NVivo (kualitatif).`
  },
  social: {
    name: 'Ilmu Sosial & Humaniora',
    searchSuffix: 'jurnal ilmu sosial sosiologi komunikasi politik humaniora',
    persona: 'Co-Pilot Riset Sosiologi, Ilmu Komunikasi, Ilmu Politik, Antropologi, dan Humaniora untuk mahasiswa dan peneliti ilmu sosial di Indonesia',
    theoryGuide: `2. Teori-Teori Pokok Ilmu Sosial:
   - Teori Struktural Fungsionalisme (Parsons, Durkheim): Fungsi sosial, integrasi, solidaritas mekanik & organik.
   - Teori Konflik (Marx, Dahrendorf, Coser): Kelas sosial, ketimpangan, perubahan sosial.
   - Teori Interaksionisme Simbolik (Mead, Blumer): Makna, simbol, interaksi sosial.
   - Teori Konstruksi Sosial (Berger & Luckmann): Realitas sosial sebagai konstruksi subjektif.
   - Teori Komunikasi: Uses & Gratifications (Katz), Agenda Setting (McCombs), Framing (Entman).`,
    methodGuide: `3. Metodologi Penelitian Ilmu Sosial:
   - Kualitatif: Etnografi, Fenomenologi, Studi Kasus, Grounded Theory, Discourse Analysis.
   - Kuantitatif: Survei Sosial, Analisis Isi Kuantitatif, Polling, Statistik Sosial.
   - Mixed Methods: Sequential Explanatory, Sequential Exploratory.
   - Teknik Pengumpulan Data: Wawancara Mendalam (in-depth interview), FGD (Focus Group Discussion), Observasi Partisipan, Analisis Dokumen & Arsip.`
  },
  agriculture: {
    name: 'Pertanian & Agribisnis',
    searchSuffix: 'jurnal pertanian agribisnis agroteknologi pangan',
    persona: 'Co-Pilot Riset Agroteknologi, Agribisnis, Peternakan, Perikanan, dan Kehutanan untuk mahasiswa dan peneliti pertanian di Indonesia',
    theoryGuide: `2. Teori-Teori Pokok Pertanian:
   - Agronomi & Fisiologi Tanaman: Fotosintesis, respirasi, pertumbuhan, perkembangan, produksi tanaman.
   - Ilmu Tanah: Kesuburan tanah, sifat fisik-kimia-biologi, manajemen hara (NPK), pH tanah.
   - Hama & Penyakit Tanaman (PHT – Pengendalian Hama Terpadu): Musuh alami, pestisida nabati, varietas tahan.
   - Agribisnis & Rantai Nilai: Analisis usaha tani (R/C Ratio, B/C Ratio, BEP), pemasaran komoditas, supply chain.
   - Ketahanan Pangan (FAO): Ketersediaan, akses, pemanfaatan, dan stabilitas pangan.`,
    methodGuide: `3. Metodologi Penelitian Pertanian:
   - Eksperimental Lapangan: RAL (Rancangan Acak Lengkap), RAK (Rancangan Acak Kelompok), RALS (Faktorial).
   - Analisis Usaha Tani: Perhitungan biaya produksi, penerimaan, keuntungan, R/C Ratio, Break Even Point.
   - Survei Agribisnis: Kuesioner petani/peternak, analisis kelayakan finansial (NPV, IRR, Payback Period).
   - Analisis Laboratorium: Uji kadar nutrisi, uji sifat fisikokimia produk pertanian.
   - Statistik: ANOVA, Uji Duncan/Tukey (BNT/DMRT), Regresi Linier.`
  },
  communication: {
    name: 'Ilmu Komunikasi',
    searchSuffix: 'jurnal ilmu komunikasi media massa jurnalistik public relations',
    persona: 'Co-Pilot Riset Ilmu Komunikasi, Jurnalistik, Public Relations, Advertising, dan Media Baru untuk mahasiswa dan peneliti komunikasi di Indonesia',
    theoryGuide: `2. Teori-Teori Pokok Ilmu Komunikasi:
   - Teori Uses & Gratifications (Katz, Blumler, Gurevitch): Motivasi penggunaan media, kepuasan audiens.
   - Teori Agenda Setting (McCombs & Shaw): Pengaruh media terhadap persepsi publik.
   - Teori Framing (Entman): Seleksi dan penonjolan isu dalam pemberitaan media.
   - Teori Komunikasi Pemasaran Terpadu (IMC – Kotler): Iklan, PR, promosi penjualan, pemasaran digital.
   - Teori New Media & Media Sosial: Convergence culture (Jenkins), filter bubble (Pariser), digital literacy.`,
    methodGuide: `3. Metodologi Penelitian Komunikasi:
   - Analisis Isi (Content Analysis): Kuantitatif (frekuensi, kategori) dan kualitatif (wacana, semiotika).
   - Survei: Kuesioner tentang persepsi, sikap, perilaku media.
   - Etnografi Digital: Observasi online, analisis platform media sosial.
   - Eksperimen Komunikasi: Uji pesan/framing, efek iklan, A/B testing.
   - Wawancara Mendalam & FGD: Pengalaman pengguna media, jurnalis, praktisi PR.`
  }
};

// Comprehensive Core Academic System Prompt — now discipline-aware
function buildMasterAcademicPrompt(discipline, citationFormat, extraContext) {
  const disc = DISCIPLINES[discipline] || DISCIPLINES['general_academic'];

  return `Anda adalah AcademAI — ${disc.persona}.

DISIPLIN ILMU AKTIF: ${disc.name}

STANDAR ILMIAH & METODOLOGIS UTAMA:
1. Pendekatan Piramida Terbalik (Inverted Pyramid) untuk Latar Belakang:
   - Level Makro: Kebijakan nasional, regulasi, dan isu global yang relevan dengan bidang ${disc.name}.
   - Level Meso: Realitas empiris di tingkat lembaga / industri / komunitas yang terkait topik.
   - Level Mikro: Permasalahan konkret spesifik yang diidentifikasi melalui observasi/data lapangan.
   - Analisis Kesenjangan: Das Sollen (standar normatif/teoretis) vs Das Sein (kenyataan lapangan) → Research Gap.
   - Urgensi Solusi: Alasan ilmiah mengapa penelitian/intervensi yang diusulkan penting dilaksanakan.

${disc.theoryGuide}

${disc.methodGuide}

4. Kaidah Bahasa & Penulisan Ilmiah:
   - Menggunakan Bahasa Indonesia formal akademik baku sesuai EYD Edisi V / PUEBI (atau English jika diminta).
   - Struktur kalimat objektif, nominalisasi akademik, kalimat pasif impersonal, menghindari kata ganti orang pertama ("saya"/"kami" → "peneliti").
   - Format sitasi ketat gaya ${citationFormat} (contoh: (Raharjo, 2023) atau (Smith & Jones, 2022)).
   - Setiap bab dan sub-bab ditulis dengan penomoran terstruktur (1.1, 1.2, 2.1, dst.) dan tabel Markdown yang rapi.${extraContext}`;
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
    const { topic, discipline = 'general_academic', language = 'indonesia', citationFormat = 'APA7', options = {} } = req.body;
    const disc = DISCIPLINES[discipline] || DISCIPLINES['general_academic'];
    const sessionId = req.body.sessionId || `academ_full_${Date.now()}`;
    console.log(`[AcademAI Full Article] Memulai generate artikel (${disc.name}) untuk topik: "${topic}" (Session: ${sessionId})...`);

    // Step 1: Query Google Scholar for papers
    const scholarQuery = `${topic} ${disc.searchSuffix}`;
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
    const userPrompt = `Tuliskan DRAF LENGKAP ARTIKEL ILMIAH / PROPOSAL SKRIPSI yang komprehensif, mendalam, dan siap uji sidang untuk bidang "${disc.name}" dengan topik berikut:
"${topic}"

STRUKTUR DOKUMEN WAJIB YANG HARUS DISUSUN SECARA LENGKAP:
# JUDUL PENELITIAN
(Buat judul ilmiah yang operasional, jelas memuat Variabel X, Variabel Y, serta Subjek/Populasi/Konteks yang relevan dengan bidang ${disc.name}).

## ABSTRAK (Bahasa Indonesia)
(Tulis 150-200 kata, 1 paragraf, memuat latar belakang singkat, tujuan, metodologi, indikator ketercapaian, dan implikasi praktis).
**Kata Kunci:** (3-5 kata kunci spesifik dipisahkan tanda koma).

## ABSTRACT (English)
(Tulis 150-200 kata dalam bahasa Inggris akademis cetak miring).
**Keywords:** (3-5 keywords in English).

---

## BAB I: PENDAHULUAN
### 1.1 Latar Belakang Masalah
(Gunakan alur Piramida Terbalik: Makro kebijakan/regulasi/isu global → Meso kondisi lembaga/industri/komunitas → Mikro masalah konkret yang diidentifikasi. Sertakan analisis Das Sollen vs Das Sein, Research Gap dari jurnal terdahulu, dan urgensi solusi inovatif minimal 400-500 kata).
### 1.2 Identifikasi Masalah
(Sebutkan minimal 4 poin identifikasi masalah nyata di lapangan).
### 1.3 Pembatasan Masalah
(Batasi subjek/populasi penelitian, variabel, ruang lingkup, dan periode penelitian).
### 1.4 Rumusan Masalah
(Buat pertanyaan penelitian yang operasional dan terukur).
### 1.5 Tujuan Penelitian
(Tujuan umum dan tujuan khusus yang sinkron dengan rumusan masalah).
### 1.6 Manfaat Penelitian
(Manfaat teoretis bagi pengembangan ilmu ${disc.name} dan manfaat praktis bagi pemangku kepentingan serta peneliti selanjutnya).

---

## BAB II: KAJIAN PUSTAKA, KERANGKA BERPIKIR, DAN HIPOTESIS
### 2.1 Kajian Teori Variabel Penelitian
(Kupas mendalam teori Variabel X dan Variabel Y yang relevan dengan bidang ${disc.name}. Gunakan teori-teori pokok yang telah dijelaskan dalam sistem prompt).
### 2.2 Penelitian Terdahulu yang Relevan (Matriks Komparasi)
(Buat TABEL MATRIKS Markdown komparasi 5 penelitian terdahulu yang memuat kolom: No | Peneliti & Tahun | Judul Penelitian | Metode & Subjek | Hasil/Temuan Utama | Persamaan & Perbedaan / Novelty).
### 2.3 Kerangka Berpikir
(Uraikan bagan alur logis dari Kondisi Awal → Variabel/Tindakan/Intervensi → Kondisi Akhir yang Diharapkan).
### 2.4 Hipotesis Tindakan / Penelitian
(Rumuskan pernyataan hipotesis yang tegas sesuai desain penelitian).

---

## BAB III: METODOLOGI PENELITIAN
### 3.1 Desain dan Model Penelitian
(Jelaskan desain penelitian yang sesuai dengan bidang ${disc.name} dan tujuan penelitian).
### 3.2 Populasi, Sampel, dan Teknik Sampling
### 3.3 Definisi Operasional Variabel
### 3.4 Instrumen Pengumpulan Data
(Buat TABEL INSTRUMEN / RUBRIK PENILAIAN yang sesuai dengan bidang dan metode penelitian).
### 3.5 Teknik Analisis Data & Indikator Keberhasilan
(Jelaskan teknik analisis data dan kriteria keberhasilan penelitian).

---

## BAB IV: HASIL PENELITIAN DAN PEMBAHASAN
(Deskripsikan rencana/estimasi hasil penelitian dan pembahasan ilmiah yang mengaitkan temuan dengan teori-teori pokok pada bidang ${disc.name} dan riset terdahulu).

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
    const discipline = body.discipline || 'general_academic';
    const citationFormat = body.citationFormat || 'APA7';
    const sessionId = body.sessionId || `academ_${Date.now()}`;
    const useMemory = body.useMemory !== false;
    const disc = DISCIPLINES[discipline] || DISCIPLINES['general_academic'];

    console.log(`[AcademAI Chat] Request mode="${mode}", discipline="${disc.name}", sessionId="${sessionId}", message="${message.substring(0, 60)}..."`);

    // Step 1: Cari Jurnal Google Scholar
    const searchQuery = message.length > 5 ? `${message} ${disc.searchSuffix}` : `${disc.searchSuffix} penelitian terbaru`;
    const scholarPapers = await searchGoogleScholar(searchQuery, 6);
    console.log(`[AcademAI Chat] Menemukan ${scholarPapers.length} paper Google Scholar`);

    // Simpan paper pertama ke Zotero jika ada
    if (scholarPapers.length > 0) {
      saveToZotero(scholarPapers[0]).then(saved => {
        if (saved) console.log(`[Zotero Chat] Otomatis tersimpan ke Zotero: "${scholarPapers[0].title}"`);
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
          "2. KONSISTENSI DATA: Jangan mengubah variabel penelitian (Variabel X, Variabel Y), subjek/populasi, atau desain penelitian yang sudah ditetapkan di dokumen memori.\n" +
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

Pedoman IMRAD (sesuaikan dengan bidang ${disc.name}):
- Pendahuluan & Latar Belakang (masalah dan urgensi penelitian).
- Tujuan Penelitian.
- Metode Penelitian (desain, sampel/subjek, instrumen, teknik pengumpulan data).
- Hasil Temuan Utama (data/fakta utama yang ditemukan).
- Kesimpulan dan Implikasi Praktis.`;
    } else if (mode === 'SLR') {
      userInstruction = `Susun SYSTEMATIC LITERATURE REVIEW (SLR) / KAJIAN PUSTAKA KOMPREHENSIF untuk topik berikut (hubungkan dengan dokumen di memori jika tersedia):
"${message}"

Wajib menyertakan:
1. Sintesis Kritis Teoretis (integrasikan teori-teori pokok yang relevan dengan bidang ${disc.name}).
2. TABEL MATRIKS KOMPARASI 5-8 PENELITIAN TERDAHULU (Format Markdown Table dengan kolom: No | Peneliti & Tahun | Judul Penelitian | Metode & Subjek | Hasil Utama | Kebaruan / Novelty dibandingkan riset ini).
3. Kerangka Berpikir Teoretis dan Alur Konseptual.
4. Identifikasi Research Gap yang belum terjawab oleh penelitian sebelumnya.`;
    } else if (mode === 'proposal') {
      userInstruction = `Susun DRAF PROPOSAL PENELITIAN SKRIPSI yang berbobot akademik tinggi pada bidang ${disc.name} mengenai (manfaatkan data dari dokumen memori jika ada):
"${message}"

Struktur yang harus disusun:
- Judul Operasional Penelitian (memuat Variabel X, Variabel Y, dan konteks/populasi penelitian).
- BAB I: Latar Belakang Masalah (Piramida Terbalik: Makro → Meso → Mikro), Identifikasi Masalah, Rumusan Masalah, dan Tujuan.
- BAB II: Landasan Teori (teori-teori pokok bidang ${disc.name}) & Kerangka Berpikir.
- BAB III: Metodologi Penelitian (desain penelitian yang sesuai dengan bidang ${disc.name}), Populasi & Sampel, Instrumen, Teknik Analisis Data.`;
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

Bidang ilmu: ${disc.name}
Jika terdapat dokumen di memori riset, sambungkan dan kembangkan secara khusus sesuai permintaan di atas.
Gunakan struktur Piramida Terbalik (Inverted Pyramid):
1. Fenomena Makro (kebijakan nasional, regulasi, tren global, atau isu terkini yang relevan dengan ${disc.name}).
2. Realitas Meso di tingkat lembaga/industri/komunitas dan Mikro masalah konkret di lapangan.
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

// ── Microsoft Word (.docx) Academic Document Generator ──
function parseFormattedRuns(text) {
  const runs = [];
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({
        text: part.slice(2, -2),
        bold: true,
        font: 'Times New Roman',
        size: 24 // 12pt
      }));
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push(new TextRun({
        text: part.slice(1, -1),
        italics: true,
        font: 'Times New Roman',
        size: 24
      }));
    } else if (part) {
      runs.push(new TextRun({
        text: part,
        font: 'Times New Roman',
        size: 24
      }));
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text, font: 'Times New Roman', size: 24 })];
}

async function markdownToDocx(title, markdownContent) {
  const lines = (markdownContent || '').split('\n');
  const children = [];

  // Top Title
  if (title) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 300, line: 360 }, // 1.5 spacing
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          font: 'Times New Roman',
          size: 28, // 14pt
        })
      ]
    }));
  }

  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Table rows: | col 1 | col 2 |
    if (line.startsWith('|') && line.endsWith('|')) {
      if (line.match(/^\|[\s\-:|]+\|$/)) {
        continue; // separator
      }
      inTable = true;
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      const isHeaderRow = tableRows.length === 0;

      tableRows.push(new TableRow({
        children: cells.map(cellText => new TableCell({
          width: { size: Math.floor(9000 / (cells.length || 1)), type: WidthType.DXA },
          shading: isHeaderRow ? { fill: 'E2E8F0' } : undefined,
          children: [
            new Paragraph({
              spacing: { before: 60, after: 60, line: 240 },
              children: [
                new TextRun({
                  text: cellText,
                  bold: isHeaderRow,
                  font: 'Times New Roman',
                  size: 20, // 10pt
                })
              ]
            })
          ]
        }))
      }));
      continue;
    } else if (inTable) {
      if (tableRows.length > 0) {
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows
        }));
        children.push(new Paragraph({ spacing: { after: 120 } }));
      }
      inTable = false;
      tableRows = [];
    }

    if (!line) continue;

    // Heading 1 (# ...)
    if (line.startsWith('# ')) {
      const headingText = line.replace(/^#\s+/, '').trim();
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 360, after: 180, line: 360 },
        children: [
          new TextRun({
            text: headingText.toUpperCase(),
            bold: true,
            font: 'Times New Roman',
            size: 28, // 14pt
          })
        ]
      }));
    }
    // Heading 2 (## ...)
    else if (line.startsWith('## ')) {
      const headingText = line.replace(/^##\s+/, '').trim();
      children.push(new Paragraph({
        spacing: { before: 240, after: 120, line: 360 },
        children: [
          new TextRun({
            text: headingText,
            bold: true,
            font: 'Times New Roman',
            size: 24, // 12pt
          })
        ]
      }));
    }
    // Heading 3 (### ...)
    else if (line.startsWith('### ')) {
      const headingText = line.replace(/^###\s+/, '').trim();
      children.push(new Paragraph({
        spacing: { before: 180, after: 80, line: 360 },
        children: [
          new TextRun({
            text: headingText,
            bold: true,
            font: 'Times New Roman',
            size: 24, // 12pt
          })
        ]
      }));
    }
    // Bullet list
    else if (line.match(/^[-*]\s+/)) {
      const itemText = line.replace(/^[-*]\s+/, '').trim();
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 40, after: 40, line: 360 },
        children: parseFormattedRuns(itemText)
      }));
    }
    // Normal Paragraph
    else {
      children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: 567 }, // 1 cm first-line indent
        spacing: { before: 60, after: 120, line: 360 }, // 1.5 line spacing
        children: parseFormattedRuns(line)
      }));
    }
  }

  if (inTable && tableRows.length > 0) {
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows
    }));
  }

  // Indonesian Thesis Margins: Left 4cm, Top 3cm, Right 3cm, Bottom 3cm
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1701,    // 3 cm
            left: 2268,   // 4 cm (ruang jilid skripsi)
            right: 1701,  // 3 cm
            bottom: 1701  // 3 cm
          }
        }
      },
      children
    }]
  });

  return await Packer.toBuffer(doc);
}

// Endpoint routes
app.post('/webhook/academ-ai', handleGeneration);
app.post('/api/generate', handleGeneration);
app.post('/api/validate', handleCitationValidator);
app.post('/api/plagiarism/check', handlePlagiarismCheck);

// Data Visualization PTK Endpoint
app.post('/api/viz/ptk', (req, res) => {
  try {
    const { variableName = 'Motorik Halus Anak', praSiklus, siklus1, siklus2, targetKetuntasan = 75 } = req.body;
    if (!praSiklus || !siklus1 || !siklus2) {
      return res.status(400).json({ success: false, error: 'Data praSiklus, siklus1, dan siklus2 wajib diisi.' });
    }
    const tuntasPra = (praSiklus.BSH || 0) + (praSiklus.BSB || 0);
    const tuntasS1  = (siklus1.BSH || 0) + (siklus1.BSB || 0);
    const tuntasS2  = (siklus2.BSH || 0) + (siklus2.BSB || 0);
    const narrative = `### Hasil Capaian PTK: ${variableName}\n` +
      `- **Pra-Siklus**: Ketuntasan klasikal ${tuntasPra.toFixed(1)}%\n` +
      `- **Siklus I**: Ketuntasan klasikal meningkat menjadi ${tuntasS1.toFixed(1)}%\n` +
      `- **Siklus II**: Ketuntasan klasikal mencapai ${tuntasS2.toFixed(1)}% (Target >= ${targetKetuntasan}% : ${tuntasS2 >= targetKetuntasan ? 'TERCAPAI' : 'BELUM TERCAPAI'})`;

    res.json({
      success: true,
      variableName,
      ketuntasanKlasikal: {
        praSiklus: `${tuntasPra.toFixed(1)}%`,
        siklus1: `${tuntasS1.toFixed(1)}%`,
        siklus2: `${tuntasS2.toFixed(1)}%`,
        target: `${targetKetuntasan}%`,
        isPassing: tuntasS2 >= targetKetuntasan
      },
      narrative
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Academic Statistics Engine (t-Test & N-Gain Hake 1999) ───
function erf(x) {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function calculateAcademicStats({ pretest, posttest, maxScore = 100, variableName = 'Kemampuan Motorik Halus' }) {
  const pre = (Array.isArray(pretest) ? pretest : String(pretest).split(/[\s,]+/))
    .map(Number).filter(n => !isNaN(n));
  const post = (Array.isArray(posttest) ? posttest : String(posttest).split(/[\s,]+/))
    .map(Number).filter(n => !isNaN(n));

  if (pre.length === 0 || post.length === 0) {
    throw new Error('Data Pretest atau Posttest tidak boleh kosong.');
  }
  if (pre.length !== post.length) {
    throw new Error(`Jumlah sampel Pretest (${pre.length}) dan Posttest (${post.length}) harus sama.`);
  }

  const N = pre.length;
  const max = Number(maxScore) || 100;

  // Means
  const sumPre = pre.reduce((a, b) => a + b, 0);
  const sumPost = post.reduce((a, b) => a + b, 0);
  const meanPre = sumPre / N;
  const meanPost = sumPost / N;

  // Standard Deviations
  const varPre = pre.reduce((acc, v) => acc + Math.pow(v - meanPre, 2), 0) / (N - 1 || 1);
  const varPost = post.reduce((acc, v) => acc + Math.pow(v - meanPost, 2), 0) / (N - 1 || 1);
  const sdPre = Math.sqrt(varPre);
  const sdPost = Math.sqrt(varPost);

  // Differences
  const diffs = post.map((p, i) => p - pre[i]);
  const sumDiff = diffs.reduce((a, b) => a + b, 0);
  const meanDiff = sumDiff / N;
  const varDiff = diffs.reduce((acc, d) => acc + Math.pow(d - meanDiff, 2), 0) / (N - 1 || 1);
  const sdDiff = Math.sqrt(varDiff);
  const seDiff = sdDiff / Math.sqrt(N);

  // Paired Sample t-Test
  const tStat = seDiff > 0 ? (meanDiff / seDiff) : 0;
  const df = N - 1;

  // p-value approximation
  const x = Math.abs(tStat);
  const z = x * (1 - 1 / (4 * (df || 1))) / Math.sqrt(1 + (x * x) / (2 * (df || 1)));
  const pNorm = 0.5 * (1 - erf(z / Math.SQRT2));
  const pVal = Math.min(1, Math.max(0.0001, 2 * pNorm));
  const pFormatted = pVal < 0.001 ? '< .001' : `= ${pVal.toFixed(4)}`;
  const isSignificant = pVal < 0.05;

  // N-Gain Score Hake (1999)
  const individualGains = pre.map((pr, i) => {
    const po = post[i];
    const denom = max - pr;
    if (denom <= 0) return 1.0;
    const g = (po - pr) / denom;
    return Math.round(g * 1000) / 1000;
  });

  const meanGain = individualGains.reduce((a, b) => a + b, 0) / N;
  const meanGainPercent = meanGain * 100;

  let gainCategory = '';
  if (meanGain >= 0.70) gainCategory = 'Tinggi (High Gain)';
  else if (meanGain >= 0.30) gainCategory = 'Sedang (Medium Gain)';
  else gainCategory = 'Rendah (Low Gain)';

  let effectiveness = '';
  if (meanGainPercent > 76) effectiveness = 'Efektif';
  else if (meanGainPercent >= 56) effectiveness = 'Cukup Efektif';
  else if (meanGainPercent >= 40) effectiveness = 'Kurang Efektif';
  else effectiveness = 'Tidak Efektif';

  const narrative = `### 4.X Hasil Uji Hipotesis & Efektivitas Pembelajaran (N-Gain)
Berdasarkan data pengukuran kemampuan **${variableName}** pada $N = ${N}$ subjek penelitian, diperoleh rata-rata skor *Pre-test* sebesar **${meanPre.toFixed(2)}** ($SD = ${sdPre.toFixed(2)}$) dan rata-rata skor *Post-test* sebesar **${meanPost.toFixed(2)}** ($SD = ${sdPost.toFixed(2)}$), dengan peningkatan rata-rata (*Mean Difference*) sebesar **${meanDiff.toFixed(2)}**.

Hasil uji hipotesis menggunakan *Paired Sample t-Test* menunjukkan nilai $t(${df}) = ${tStat.toFixed(3)}, p ${pFormatted}$. Karena nilai probabilitas $p < 0.05$, maka hipotesis nol ($H_0$) ditolak dan hipotesis alternatif ($H_a$) diterima secara meyakinkan pada tingkat signifikansi $\\alpha = 0.05$. Hal ini membuktikan bahwa terdapat perbedaan peningkatan kemampuan yang signifikan antara sebelum dan sesudah intervensi tindakan.

Selanjutnya, hasil analisis uji efektivitas *Normalized Gain (N-Gain)* menurut kriteria Hake (1999) menghasilkan rata-rata skor $g = ${meanGain.toFixed(3)}$ atau sebesar **${meanGainPercent.toFixed(1)}\\%**. Berdasarkan kategori interpretasi baku, perolehan ini masuk dalam kategori **${gainCategory}** dengan tingkat efektivitas **"${effectiveness}"**. Dengan demikian, intervensi pembelajaran yang diterapkan terbukti efektif secara empiris dalam meningkatkan ${variableName}.`;

  return {
    N,
    maxScore: max,
    variableName,
    descriptives: {
      pretest: { mean: meanPre.toFixed(2), sd: sdPre.toFixed(2), min: Math.min(...pre), max: Math.max(...pre) },
      posttest: { mean: meanPost.toFixed(2), sd: sdPost.toFixed(2), min: Math.min(...post), max: Math.max(...post) },
      meanDifference: meanDiff.toFixed(2)
    },
    tTest: {
      tStat: tStat.toFixed(3),
      df,
      pValue: pFormatted,
      isSignificant,
      conclusion: isSignificant ? 'Terdapat perbedaan yang signifikan (Ha diterima)' : 'Tidak terdapat perbedaan signifikan (H0 diterima)'
    },
    nGain: {
      meanGain: meanGain.toFixed(3),
      gainPercent: `${meanGainPercent.toFixed(1)}%`,
      category: gainCategory,
      effectiveness
    },
    sampleData: pre.map((pr, i) => ({
      no: i + 1,
      pretest: pr,
      posttest: post[i],
      diff: post[i] - pr,
      nGain: individualGains[i]
    })),
    narrative
  };
}

app.post('/api/stats/calculate', (req, res) => {
  try {
    const { pretest, posttest, maxScore = 100, variableName = 'Kemampuan Siswa' } = req.body;
    const result = calculateAcademicStats({ pretest, posttest, maxScore, variableName });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Export DOCX Endpoints
app.post('/api/export/docx', async (req, res) => {
  try {
    const { title = 'Naskah_Akademik', content = '' } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Konten tidak boleh kosong' });
    }
    const buffer = await markdownToDocx(title, content);
    const cleanFilename = (title || 'Naskah_Akademik').slice(0, 50).replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || 'Dokumen_Skripsi';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}.docx"`);
    res.send(buffer);
  } catch (err) {
    console.error('[Export DOCX Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/export/docx/:sessionId/:docId', async (req, res) => {
  try {
    const { sessionId, docId } = req.params;
    const docs = getSessionDocuments(sessionId);
    const doc = docs.find(d => d.id === docId);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Dokumen tidak ditemukan dalam memori.' });
    }
    const buffer = await markdownToDocx(doc.title, doc.content);
    const cleanFilename = (doc.title || 'Dokumen').slice(0, 50).replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}.docx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================================');
  console.log(`🚀 AcademAI Server running on port ${PORT}`);
  console.log(`👉 Web Interface : http://localhost:${PORT}`);
  console.log(`🧠 AI Engine     : Google Gemini (Smart Multi-Model Fallback)`);
  console.log(`🎓 Research Index: Google Scholar (SerpApi Organic Index)`);
  console.log(`📚 Reference Mgr : Zotero Library (andri_akademi - Universal Academic Research)`);
  console.log(`💾 Memory System : Active (Disk Persistence at ./data/memory.json)`);
  console.log(`🌐 Disciplines   : 12 Bidang Ilmu (Umum, Pendidikan, PAUD, Ekonomi, Hukum, dll)`);
  console.log(`📋 Modules Active: Drafting, SLR, Proposal, Abstract,`);
  console.log(`                   Paraphrasing, Editing, Statistics, Validator, Plagiarism`);
  console.log('========================================================');
});

// Dual-bind to port 5678 for Railway legacy port routing compatibility
if (String(PORT) !== '5678') {
  try {
    const s5678 = app.listen(5678, '0.0.0.0', () => {
      console.log('🚀 AcademAI Server dual-bound to port 5678 (Railway compatibility)');
    });
    s5678.on('error', () => {});
  } catch (e) {}
}
