import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend')));

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', server: 'AcademAI Direct Engine', model: 'gemini-3.8-flash' });
});

// Helper: Query Google Scholar via SerpApi
async function searchGoogleScholar(query) {
  const serpApiKey = process.env.SERPAPI_API_KEY || process.env.GOOGLE_SCHOLAR_API_KEY;
  if (!serpApiKey) {
    console.log('[Scholar] No SerpApi key provided, skipping Scholar search.');
    return [];
  }
  try {
    const url = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&hl=id`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`SerpApi returned status ${response.status}`);
    const data = await response.json();
    const results = (data.organic_results || []).slice(0, 5).map(p => ({
      title: p.title || 'Untitled',
      authors: p.publication_info?.summary || 'N/A',
      link: p.link || '',
      snippet: p.snippet || '',
      citations: p.inline_links?.cited_by?.total || 0,
      doi: (p.link && p.link.includes('doi.org')) ? p.link.split('doi.org/')[1] : ''
    }));
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
      title: paper.title || 'Paper Penelitian PAUD',
      publicationTitle: paper.journal || 'Jurnal Ilmiah Pendidikan Anak Usia Dini',
      date: String(new Date().getFullYear()),
      DOI: paper.doi || '',
      url: paper.link || '',
      abstractNote: paper.snippet || '',
      collections: [collectionId],
      tags: [{ tag: 'AcademAI' }, { tag: 'Skripsi-PAUD' }, { tag: 'Google-Scholar' }]
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
          temperature: 0.3,
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

// Core Handler for AcademAI Generation
async function handleGeneration(req, res) {
  try {
    const body = req.body || {};
    const message = body.message || body.query || body.topic || '';
    const mode = body.mode || 'drafting';
    const discipline = body.discipline || 'paud';
    const citationFormat = body.citationFormat || 'APA7';
    const sessionId = body.sessionId || `academ_${Date.now()}`;

    console.log(`[AcademAI] Menerima request mode="${mode}", discipline="${discipline}", message="${message.substring(0, 50)}..."`);

    // Step 1: Cari Jurnal Google Scholar
    const searchQuery = message.length > 5 ? message : 'pendidikan anak usia dini media loose parts motorik';
    const scholarPapers = await searchGoogleScholar(searchQuery);
    console.log(`[AcademAI] Menemukan ${scholarPapers.length} paper Google Scholar`);

    // Simpan paper pertama ke Zotero jika ada
    if (scholarPapers.length > 0) {
      saveToZotero(scholarPapers[0]).then(saved => {
        if (saved) console.log(`[Zotero] Otomatis tersimpan ke Zotero (Skripsi S1 PAUD): "${scholarPapers[0].title}"`);
      });
    }

    // Step 2: Rangkum referensi untuk grounding prompt
    let referencesContext = '';
    if (scholarPapers.length > 0) {
      referencesContext = "\n\nBERIKUT ADALAH HASIL RISET JURNAL DARI GOOGLE SCHOLAR UNTUK DIGUNAKAN SEBAGAI REFERENSI SITASI WAJIB:\n" +
        scholarPapers.map((p, i) => `[${i+1}] ${p.title} (${p.authors}). Sumber/Link: ${p.link}. Ringkasan: ${p.snippet}`).join('\n\n');
    }

    // Step 3: Bangun System Prompt
    const systemPrompt = `Anda adalah AcademAI — Co-Pilot Riset Akademik dan Penulisan Skripsi Ilmiah S1 PAUD (Pendidikan Anak Usia Dini).
Tugas Anda adalah membantu mahasiswa/peneliti menyusun teks akademik berkualitas tinggi, berbobot, berbasis teori ilmiah, dan mematuhi kaidah penulisan ilmiah.

PEDOMAN TEORI PAUD WAJIB DIGUNAKAN:
- Teori Perkembangan Kognitif Jean Piaget
- Teori Konstruktivisme Sosial Lev Vygotsky
- Pendekatan Montessori dan Filosofi Ki Hajar Dewantara (Sistem Among)
- Standar Tingkat Pencapaian Perkembangan Anak (STPPA) Permendikbud / Kurikulum Merdeka PAUD
- Penggunaan Alat Permainan Edukatif (APE), loose parts, stimulasi sensorik-motorik.

ATURAN PENULISAN:
1. Format sitasi wajib menggunakan gaya ${citationFormat} secara ketat, contoh: (Nurjanah, 2022) atau (Sujiono, 2021).
2. Tulis secara mendalam, terstruktur dengan sub-bab heading yang jelas (Markdown).
3. Hindari kalimat klise atau mengarang fakta. Cantumkan referensi yang relevan di akhir teks.
4. Gaya bahasa: Formal, akademik, ilmiah, objektif, dan menggunakan bahasa Indonesia yang baik dan benar.${referencesContext}`;

    let userInstruction = message;
    if (mode === 'abstract') {
      userInstruction = `Buat Abstrak lengkap dalam DUA bahasa (Bahasa Indonesia 150-200 kata dan Bahasa Inggris 150-200 kata), lengkap dengan Kata Kunci / Keywords untuk topik: "${message}". Sertakan latar belakang, tujuan, metode, hasil, dan kesimpulan.`;
    } else if (mode === 'drafting') {
      userInstruction = `Tulis Latar Belakang dan Pembahasan ilmiah yang komprehensif (minimal 500-800 kata) mengenai: "${message}". Uraikan fenomena lapangan, kesenjangan riset (research gap), kajian teori relevan, dan urgensi penelitian.`;
    }

    // Step 4: Eksekusi Gemini
    const { text: generatedMarkdown, model: usedModel } = await callGemini(systemPrompt, userInstruction);
    const wordCount = generatedMarkdown.split(/\s+/).length;

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
      message: `✅ Berhasil dibuat oleh Google Gemini (${usedModel}) — ${wordCount} kata`,
      meta: {
        model: usedModel,
        scholarSourcesCount: scholarPapers.length,
        zoteroSynced: scholarPapers.length > 0
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

// Endpoint routes
app.post('/webhook/academ-ai', handleGeneration);
app.post('/api/generate', handleGeneration);

app.listen(PORT, () => {
  console.log('========================================================');
  console.log(`🚀 AcademAI Server running on port ${PORT}`);
  console.log(`👉 Web Interface : http://localhost:${PORT}`);
  console.log(`🧠 AI Engine     : Google Gemini 3.8 Flash`);
  console.log(`🎓 Research Index: Google Scholar (SerpApi)`);
  console.log(`📚 Reference Mgr : Zotero Library (andri_akademi)`);
  console.log('========================================================');
});
