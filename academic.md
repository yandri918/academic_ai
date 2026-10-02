# 🎓 AcademAI v2.0 — Dokumen Lengkap
### AI Scientific Article Generator berbasis n8n + Claude

> **Model**      : Claude Sonnet 4.5 (Anthropic)  
> **Scope**      : Dunia Pendidikan & Akademik — semua disiplin ilmu  
> **Use Case**   : Tugas Akhir UT Ekonomi Pembangunan — Kabupaten Banyumas  
> **Deployment** : Local (Docker) → VPS (opsional)  
> **Version**    : 2.0 — Final  

---

## 📋 Daftar Isi

1. [Ringkasan Sistem](#1-ringkasan-sistem)
2. [Cakupan Disiplin Ilmu](#2-cakupan-disiplin-ilmu)
3. [Arsitektur Lengkap](#3-arsitektur-lengkap)
4. [Modul 1 — AI Agent (Claude)](#4-modul-1--ai-agent-claude)
5. [Modul 2 — Memory](#5-modul-2--memory)
6. [Modul 3 — File Upload](#6-modul-3--file-upload)
7. [Modul 4 — Semantic Scholar](#7-modul-4--semantic-scholar-api)
8. [Modul 5 — MCP DuckDuckGo](#8-modul-5--mcp-duckduckgo)
9. [Modul 6 — Doc Generator](#9-modul-6--doc-generator)
10. [Modul 7 — Docs Export](#10-modul-7--docs-export)
11. [Fitur A — Citation Validator](#11-fitur-a--citation-validator)
12. [Fitur B — Mode Operasi](#12-fitur-b--mode-operasi-7-mode)
13. [Fitur C — Auto Section Generator](#13-fitur-c--auto-section-generator-generate_full)
14. [System Prompt Lengkap](#14-system-prompt-lengkap-claude)
15. [API Endpoints & Request Format](#15-api-endpoints--request-format)
16. [Setup Lokal (Docker)](#16-setup-lokal-docker)
17. [Struktur File Project](#17-struktur-file-project)
18. [Checklist & Status](#18-checklist--status)

---

## 1. Ringkasan Sistem

**AcademAI** adalah workflow n8n yang mengorkestrasi Claude + tools riset untuk menghasilkan artikel ilmiah dan tugas akhir secara semi-otomatis.

```
INPUT (User)
  │  Topik, pesan, file upload, mode
  ▼
n8n ORCHESTRATOR
  │
  ├── Memory (konteks sesi persisten)
  │
  ├── Claude Sonnet 4.5
  │     ├── Tool: Semantic Scholar (200M+ jurnal)
  │     ├── Tool: DuckDuckGo MCP (data real-time)
  │     └── Tool: File Reader (dokumen user)
  │
  ├── Citation Validator (verifikasi DOI)
  ├── Mode Selector (7 mode penulisan)
  └── Auto Section Generator (generate seluruh bab)
  │
OUTPUT
  │  Markdown · PDF · DOCX
  ▼
User / Storage
```

### Keunggulan Stack

| Komponen | Keunggulan |
|----------|-----------|
| **Claude Sonnet 4.5** | 200K token context, academic writing terbaik, rendah hallucination |
| **Semantic Scholar** | 200M+ paper, gratis, filter per tahun & bidang |
| **DuckDuckGo MCP** | Data real-time: BPS, kebijakan, statistik lokal |
| **n8n** | Visual workflow, self-hosted, open-source |
| **Window Memory** | Claude ingat topik & progress sepanjang sesi |
| **Citation Validator** | Cegah sitasi palsu via DOI lookup |
| **7 Mode** | Satu sistem untuk semua kebutuhan penulisan akademik |
| **generate_full** | 1 request → dokumen TA lengkap Bab I–V |

---

## 2. Cakupan Disiplin Ilmu

### ✅ Yang Dicakup (Dunia Pendidikan)

```
SAINS & TEKNOLOGI
├── Ilmu Komputer & Teknologi Informasi
├── Matematika & Statistika
├── Fisika, Kimia, Biologi
├── Teknik (Sipil, Elektro, Industri, Kimia, dll.)
├── Kedokteran & Kesehatan Masyarakat
└── Pertanian, Kehutanan & Lingkungan Hidup

SOSIAL & HUMANIORA
├── Ekonomi & Bisnis (Pembangunan, Manajemen, Akuntansi)
├── Hukum & Kebijakan Publik
├── Psikologi & Ilmu Perilaku
├── Sosiologi & Antropologi
├── Ilmu Politik & Hubungan Internasional
├── Komunikasi & Jurnalisme
└── Sejarah & Filsafat

PENDIDIKAN
├── Kurikulum & Pedagogi
├── Teknologi Pendidikan (EdTech)
├── Psikologi Pendidikan
├── Manajemen Pendidikan
├── Pendidikan Vokasi & Profesi
└── Kebijakan Pendidikan

SENI & BUDAYA (dalam konteks akademik)
├── Seni Rupa, Musik, Sastra (kajian ilmiah)
└── Kebudayaan & Etnografi
```

### ❌ Yang Tidak Dicakup

```
✗ Konten komersial / marketing / iklan
✗ Hiburan non-akademik (film review, gossip, dll.)
✗ Politik partisan / kampanye
✗ Jual-beli karya ilmiah (academic fraud)
✗ Konten yang merugikan pihak lain
```

---

## 3. Arsitektur Lengkap

```
┌─────────────────────────────────────────────────────────────────┐
│  TRIGGER LAYER                                                   │
│  POST /webhook/academ-ai                                         │
│  { action, mode, sessionId, topic, message, discipline }        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                        ┌──────▼──────┐
                        │  Parse &    │  sessionId, action, mode,
                        │  Validate   │  discipline, language,
                        │  Request    │  citationFormat, topic
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │   ROUTER    │
                        │  (Switch)   │
                        └──────┬──────┘
            ┌──────────────────┼────────────────────┐
            │                  │                    │
     ┌──────▼──────┐    ┌──────▼──────┐     ┌──────▼──────┐
     │ generate_   │    │    chat /   │     │  validate_  │
     │    full     │    │   section   │     │  citations  │
     └──────┬──────┘    └──────┬──────┘     └──────┬──────┘
            │                  │                    │
     ┌──────▼──────┐    ┌──────▼──────┐            │
     │  Auto Sec.  │    │    Mode     │            │
     │  Generator  │    │  Selector   │            │
     │ (8 section) │    │  (7 mode)   │            │
     └──────┬──────┘    └──────┬──────┘            │
            └──────────────────┤                    │
                               │                    │
          ┌────────────────────┼──────────────────┐ │
          │                    │                  │ │
   ┌──────▼──────┐      ┌──────▼──────┐    ┌──────▼─▼────┐
   │   Memory    │      │   Claude    │    │  Citation   │
   │  (Window    │◄────►│  Agent +    │    │  Validator  │
   │  Buffer 30) │      │   Tools     │    │  (DOI check)│
   └─────────────┘      └──────┬──────┘    └──────┬──────┘
                               │                   │
                               │   ┌───────────────┘
                        ┌──────▼───▼──┐
                        │  Document   │
                        │  Assembler  │
                        │  (Template) │
                        └──────┬──────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
          [.MD]            [.PDF]           [.DOCX]
          Native          Gotenberg         docx.js
         (Preview)       (Siap cetak)      (MS Word)
              │                │                │
              └────────────────┴────────────────┘
                               │
                        ┌──────▼──────┐
                        │   Respond   │
                        │  Webhook    │
                        └─────────────┘
```

---

## 4. Modul 1 — AI Agent (Claude)

### Konfigurasi Node

```yaml
node_type  : "@n8n/n8n-nodes-langchain.agent"
agent_type : toolsAgent
model      : claude-sonnet-4-5
max_tokens : 8192
temperature: 0.3   # rendah = konsisten & formal
                   # (paraphrasing mode: 0.7)
context    : 200.000 token
max_iter   : 10    # iterasi tool call maksimal
```

### Tools yang Tersedia

```
Claude Agent
├── 📖 semantic_scholar_search   → Cari jurnal ilmiah
├── 🦆 duckduckgo_search         → Data real-time web
├── 📄 file_reader               → Baca dokumen yang diupload
└── 🔍 citation_validator        → Verifikasi sitasi (Fitur A)
```

### Kapabilitas

```
✓ Tulis artikel jurnal (IMRaD)
✓ Tulis TA/Skripsi 5 bab (UT format)
✓ Systematic Literature Review
✓ Formulasi hipotesis & kerangka teori
✓ Interpretasi hasil statistik (regresi, ANOVA)
✓ Abstrak bilingual (Indonesia & Inggris)
✓ Terjemahan akademik
✓ Review & perbaiki draft tulisan
✓ Tabel penelitian terdahulu
✓ Daftar pustaka APA 7
```

---

## 5. Modul 2 — Memory

### Konfigurasi

```yaml
node_type    : "@n8n/n8n-nodes-langchain.memoryBufferWindow"
window_size  : 30  # pesan terakhir yang diingat
session_key  : "={{ $json.sessionId }}"
storage      : in-memory (dev) | Redis (prod)
```

### Yang Diingat Sepanjang Sesi

| Konteks | Contoh |
|---------|--------|
| Topik penelitian | "UMKM Digital — Banyumas" |
| Progress bab | Bab I ✅, Bab II 🔄, Bab III ⬜ |
| Referensi terpakai | Santoso (2023), Wijaya (2022)... |
| Keputusan metodologi | Regresi berganda, Slovin n=110 |
| Data statistik dikutip | Pertumbuhan UMKM 12,3% (BPS, 2023) |

### Session Management

```javascript
// Generate session ID otomatis jika tidak diberikan
const sessionId = body.sessionId ||
  `academ_${Date.now()}_${Math.random().toString(36).substr(2,8)}`;

// Reset session:
// POST /webhook/academ-ai { "action": "reset", "sessionId": "xxx" }
```

---

## 6. Modul 3 — File Upload

### Format yang Didukung

| Format | MIME Type | Kegunaan Akademik |
|--------|-----------|------------------|
| PDF | application/pdf | Jurnal referensi, buku teks, laporan BPS |
| DOCX | application/vnd.openxmlformats... | Draft bab, kuesioner |
| XLSX | application/vnd.openxmlformats... | Dataset, tabel BPS |
| CSV | text/csv | Data penelitian, output SPSS |
| TXT | text/plain | Catatan penelitian |

```
Batas ukuran : 15 MB per file
Endpoint     : POST /webhook/academ-ai { action: "upload" }
Content-Type : multipart/form-data
```

### Alur Pemrosesan File

```
User Upload File
      │
      ▼
Webhook (multipart/form-data)
      │
      ▼
n8n "Extract from File" Node
      │
      ▼
Format & Truncate Context
  (max 8.000 karakter untuk efisiensi token)
      │
      ▼
Inject ke Claude:
  "[DOKUMEN REFERENSI USER]
   Nama: {fileName}
   Konten: {extractedText}
   Gunakan sebagai referensi tambahan."
```

---

## 7. Modul 4 — Semantic Scholar API

### Spesifikasi

```yaml
URL        : https://api.semanticscholar.org/graph/v1/paper/search
Auth       : Tanpa key (gratis) atau x-api-key header (gratis daftar)
Rate limit : 100 req/5 menit (tanpa key) | 1 req/detik (dengan key)
Database   : 200+ juta paper ilmiah
Scope      : Semua disiplin, termasuk Indonesia
```

### Cara Daftar API Key (Gratis)

```
1. Kunjungi: https://www.semanticscholar.org/product/api
2. Klik "Request API Key"
3. Isi form (email, use case: academic research)
4. Key dikirim via email dalam 1–2 hari
5. Masukkan ke .env: SEMANTIC_SCHOLAR_API_KEY=your_key
```

### Query Otomatis dari Claude

```javascript
// Claude generate query berdasarkan topik user
// Selalu dalam bahasa Inggris untuk hasil maksimal

const queryStrategies = [
  // Query 1: Topik utama + negara
  "digital transformation SME Indonesia economic development",
  // Query 2: Variabel spesifik
  "e-commerce small medium enterprise adoption performance Indonesia",
  // Query 3: Kompetitor / konteks
  "modern retail traditional market competition Southeast Asia",
  // Query 4: Metode
  "regression analysis UMKM digital Indonesia panel data",
  // Query 5: Teori yang digunakan
  "Technology Acceptance Model TAM SME developing country"
];
```

### Format Output ke Claude

```
Ditemukan 10 paper untuk "digital transformation SME Indonesia":

[1] **Digital Adoption and SME Performance in Indonesia**
    Penulis  : Santoso, A., Wijaya, B., & Lee, C. (2023)
    Jurnal   : Journal of Small Business Management
    Dikutip  : 47x | Bidang: Economics, Business
    DOI      : https://doi.org/10.1080/00472778.2023.12345
    Abstrak  : This study examines the relationship between...
    📌 APA   : Santoso, A., Wijaya, B., & Lee, C. (2023). Digital...

[2] **E-Commerce Impact on Traditional Trade in Java**
    ...
```

---

## 8. Modul 5 — MCP DuckDuckGo

### Instalasi MCP Server

```bash
# Install global
npm install -g @modelcontextprotocol/server-duckduckgo

# Atau jalankan langsung
npx -y @modelcontextprotocol/server-duckduckgo
```

### Konfigurasi di n8n

```json
{
  "mcpServers": {
    "duckduckgo": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-duckduckgo"]
    }
  }
}
```

### Alternatif (Jika MCP Belum Tersedia)

```yaml
# HTTP Request Tool langsung ke DuckDuckGo Instant Answer API
method : GET
url    : https://api.duckduckgo.com/
params :
  q      : "={{ search_query }}"
  format : json
  no_html: 1
```

### Sumber Data yang Diakses Claude via DuckDuckGo

| Sumber | Data yang Dicari |
|--------|-----------------|
| `site:bps.go.id` | Data UMKM, PDRB, inflasi terbaru |
| `site:bi.go.id` | QRIS adoption, kebijakan moneter |
| `site:banyumaskab.go.id` | Data lokal Kabupaten Banyumas |
| `site:kemenkeu.go.id` | APBN, belanja pemerintah |
| `site:worldbank.org` | Indikator pembangunan |
| `site:unesco.org` | Data pendidikan global |

### DuckDuckGo vs Semantic Scholar

| Gunakan DuckDuckGo | Gunakan Semantic Scholar |
|--------------------|--------------------------|
| Data BPS terbaru | Jurnal peer-reviewed |
| Kebijakan & regulasi | Teori & metodologi |
| Berita ekonomi terkini | Penelitian terdahulu |
| Data lokal Banyumas | Meta-analisis |
| Laporan Bank Indonesia | Sitasi akademik valid |

---

## 9. Modul 6 — Doc Generator

### Template TA Universitas Terbuka (Format Standar)

```markdown
# [JUDUL PENELITIAN DALAM HURUF KAPITAL]

**Nama     :** [Nama Mahasiswa]
**NIM      :** [NIM]
**Program  :** Ekonomi Pembangunan (S1)
**UPBJJ    :** [Nama UPBJJ]
**Tahun    :** 2025/2026

---

## ABSTRAK

[150–200 kata: latar belakang singkat, tujuan, metode,
hasil utama, kesimpulan]

**Kata Kunci:** kata1; kata2; kata3; kata4; kata5

---

## BAB I PENDAHULUAN

### 1.1 Latar Belakang Masalah
[800–1.200 kata: fenomena makro → regional → lokal Banyumas
 Data terkini, gap penelitian, urgensitas]

### 1.2 Rumusan Masalah
1. Seberapa besar pengaruh...?
2. Apakah terdapat pengaruh...?
3. Apakah ... berperan sebagai moderator...?

### 1.3 Tujuan Penelitian
[Sesuai rumusan masalah]

### 1.4 Manfaat Penelitian
#### 1.4.1 Manfaat Teoritis
#### 1.4.2 Manfaat Praktis

---

## BAB II TINJAUAN PUSTAKA

### 2.1 Landasan Teori
#### 2.1.1 Technology Acceptance Model (TAM)
#### 2.1.2 Teori Keunggulan Bersaing (Porter, 1985)
#### 2.1.3 Resource-Based View (Barney, 1991)
#### 2.1.4 Konsep UMKM di Indonesia (UU No. 20 Tahun 2008)

### 2.2 Penelitian Terdahulu
| No | Peneliti (Tahun) | Judul | Metode | Variabel | Hasil | Relevansi |
|----|-----------------|-------|--------|----------|-------|-----------|
| 1  |                 |       |        |          |       |           |

### 2.3 Kerangka Pemikiran
[Diagram alur variabel penelitian]

### 2.4 Hipotesis Penelitian
H1: ...berpengaruh positif dan signifikan terhadap...
H2: ...berpengaruh negatif dan signifikan terhadap...
H3: ...berperan sebagai moderator...

---

## BAB III METODE PENELITIAN

### 3.1 Jenis dan Pendekatan Penelitian
### 3.2 Lokasi dan Waktu Penelitian
### 3.3 Populasi dan Sampel
[Rumus Slovin: n = N / (1 + N·e²)]
### 3.4 Teknik Pengumpulan Data
### 3.5 Definisi Operasional Variabel
| Variabel | Definisi | Indikator | Skala |
|----------|----------|-----------|-------|
### 3.6 Teknik Analisis Data
[Regresi Linear Berganda + Uji Asumsi Klasik]

---

## BAB IV HASIL DAN PEMBAHASAN

### 4.1 Gambaran Umum Kabupaten Banyumas
### 4.2 Profil Responden
### 4.3 Statistik Deskriptif
### 4.4 Uji Asumsi Klasik
#### 4.4.1 Uji Normalitas
#### 4.4.2 Uji Multikolinearitas
#### 4.4.3 Uji Heteroskedastisitas
### 4.5 Hasil Analisis Regresi
### 4.6 Pengujian Hipotesis
### 4.7 Pembahasan

---

## BAB V PENUTUP

### 5.1 Kesimpulan
### 5.2 Keterbatasan Penelitian
### 5.3 Saran

---

## DAFTAR PUSTAKA
[Format APA 7th Edition, urutan alfabetis]

## LAMPIRAN
- Lampiran 1: Kuesioner Penelitian
- Lampiran 2: Tabulasi Data
- Lampiran 3: Hasil Uji SPSS/R
- Lampiran 4: Dokumentasi Lapangan
```

### Format Artikel Jurnal (IMRaD)

```markdown
# JUDUL ARTIKEL (Max 15 Kata, Informatif)

**Abstrak** (150–250 kata)
**Kata Kunci:** 3–6 kata/frasa

## 1. Pendahuluan
   Latar belakang, gap penelitian, tujuan, kontribusi/novelty

## 2. Tinjauan Pustaka / Kajian Teori
   Teori, penelitian terdahulu, kerangka konseptual, hipotesis

## 3. Metode Penelitian
   Desain, sampel, instrumen, teknik analisis

## 4. Hasil dan Pembahasan
   Temuan, analisis, diskusi dengan literatur

## 5. Kesimpulan
   Ringkasan temuan, keterbatasan, saran riset lanjutan

## Daftar Pustaka
```

---

## 10. Modul 7 — Docs Export

### Format & Engine

| Format | Engine | Keterangan |
|--------|--------|-----------|
| `.md` | Native | Preview & edit di VS Code / Typora |
| `.pdf` | Gotenberg (Docker) | Format TA standar siap cetak & submit |
| `.docx` | docx.js (Code Node) | Edit lanjut di MS Word |
| `.zip` | Native | Semua format sekaligus |

### PDF Styling (Format TA Standar Indonesia)

```css
/* CSS dikirim ke Gotenberg */
body {
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
  line-height: 2.0;          /* Spasi ganda */
  text-align: justify;
  margin: 0;
}

@page {
  margin: 3cm 2.5cm 3cm 4cm; /* Atas Kanan Bawah Kiri */
}

h1 { font-size: 14pt; text-align: center; font-weight: bold; }
h2 { font-size: 12pt; font-weight: bold; margin-top: 24pt; }
h3 { font-size: 12pt; font-weight: bold; font-style: italic; }
p  { text-indent: 1.25cm; margin: 0 0 12pt 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid black; padding: 4pt 8pt; }
```

### Export Endpoint

```
POST /webhook/academ-ai
{
  "action"      : "export",
  "sessionId"   : "sesi_001",
  "outputFormat": "pdf"    → PDF saja
                  "docx"   → DOCX saja
                  "md"     → Markdown saja
                  "all"    → ZIP semua format
}
```

---

## 11. Fitur A — Citation Validator

### Tujuan

Memvalidasi setiap sitasi yang dihasilkan AI atau diinput user dengan memverifikasi ke database Semantic Scholar via DOI lookup. Mencegah **hallucinated citations** (sitasi yang dikarang AI).

### Pipeline Validasi

```
Input Teks dengan Sitasi
        │
        ▼
Step 1: EXTRACT
   Deteksi pola:
   ├── APA  : (Santoso et al., 2023)
   ├── DOI  : https://doi.org/10.xxxx
   └── IEEE : [1], [2], [3]
        │
        ▼
Step 2: SEARCH Semantic Scholar
   Query: author + year + title keywords
   Endpoint: /paper/search?query=...
        │
        ▼
Step 3: DOI LOOKUP (jika ada DOI)
   Endpoint: /paper/DOI:{doi}
   Ambil: title, authors, year, journal
        │
        ▼
Step 4: VERIFY
   ├── ✅ VALID   → DOI ditemukan, tahun & jurnal cocok
   ├── ⚠️ PARTIAL → Ada ketidakcocokan (tahun/jurnal beda)
   └── ❌ INVALID → Tidak ditemukan sama sekali
        │
        ▼
Step 5: REPORT
   Laporan per sitasi + saran koreksi
```

### Code Node (JavaScript)

```javascript
// Citation Validator — n8n Code Node
const content = $json.content || $json.userMessage || '';
const API_BASE = 'https://api.semanticscholar.org/graph/v1';
const API_KEY  = $env.SEMANTIC_SCHOLAR_API_KEY || '';
const headers  = API_KEY ? { 'x-api-key': API_KEY } : {};

// ── Extract citations ─────────────────────────────────────
const apaPattern = /\(([A-Z][a-zA-Z\u00C0-\u024F]+(?:\s+(?:&|\bdan\b)\s+[A-Z][a-zA-Z]+|\s+et\s+al\.)?),?\s*(\d{4})\)/g;
const doiPattern = /(?:https?:\/\/doi\.org\/|doi:\s*)(10\.\d{4,}\/\S+)/gi;

const citations = [];
let m;

while ((m = apaPattern.exec(content)) !== null) {
  citations.push({ type: 'APA', author: m[1].trim(), year: m[2], raw: m[0] });
}
while ((m = doiPattern.exec(content)) !== null) {
  citations.push({ type: 'DOI', doi: m[1], raw: m[0] });
}

if (citations.length === 0) {
  return [{
    json: {
      validationReport: '⚠️ Tidak ditemukan sitasi dalam format APA atau DOI.',
      summary: { total: 0, valid: 0, partial: 0, invalid: 0 },
      allValid: true
    }
  }];
}

// ── Verify each citation ──────────────────────────────────
const results = [];
const FIELDS  = 'title,authors,year,journal,externalIds';

for (const cite of citations.slice(0, 20)) { // max 20 sitasi
  let status     = 'UNKNOWN';
  let found      = null;
  let suggestion = null;

  try {
    if (cite.type === 'DOI') {
      const r = await fetch(
        `${API_BASE}/paper/DOI:${cite.doi}?fields=${FIELDS}`, { headers }
      );
      if (r.ok) { found = await r.json(); status = 'VALID'; }
      else { status = 'INVALID'; suggestion = 'DOI tidak ditemukan. Cek ulang DOI.'; }

    } else {
      const q = encodeURIComponent(`${cite.author} ${cite.year}`);
      const r = await fetch(
        `${API_BASE}/paper/search?query=${q}&fields=${FIELDS}&limit=3`, { headers }
      );
      if (r.ok) {
        const data   = await r.json();
        const papers = data.data || [];
        const match  = papers.find(p => String(p.year) === String(cite.year));

        if (match)             { found = match;    status = 'VALID'; }
        else if (papers[0])    { found = papers[0]; status = 'PARTIAL';
          suggestion = `Tahun berbeda: ditemukan ${papers[0].year}, dikutip ${cite.year}.`; }
        else { status = 'INVALID'; suggestion = 'Tidak ditemukan di Semantic Scholar.'; }
      }
    }
  } catch(e) { status = 'ERROR'; suggestion = e.message; }

  results.push({
    raw         : cite.raw,
    type        : cite.type,
    status,
    foundTitle  : found?.title,
    foundYear   : found?.year,
    foundJournal: found?.journal?.name,
    foundDOI    : found?.externalIds?.DOI,
    suggestion
  });
}

// ── Generate report ───────────────────────────────────────
const icons = { VALID:'✅', PARTIAL:'⚠️', INVALID:'❌', ERROR:'🔴', UNKNOWN:'❓' };

const report = results.map(r => {
  let line = `${icons[r.status]} \`${r.raw}\` → **${r.status}**`;
  if (r.foundTitle)
    line += `\n   📄 "${r.foundTitle}" (${r.foundYear}) — ${r.foundJournal || 'jurnal N/A'}`;
  if (r.suggestion)
    line += `\n   💬 ${r.suggestion}`;
  return line;
}).join('\n\n');

const valid   = results.filter(r => r.status === 'VALID').length;
const partial = results.filter(r => r.status === 'PARTIAL').length;
const invalid = results.filter(r => r.status === 'INVALID').length;

return [{
  json: {
    validationReport:
      `## 📋 CITATION VALIDATION REPORT\n\n${report}\n\n` +
      `---\n**📊 Ringkasan:** ${results.length} sitasi | ` +
      `✅ ${valid} valid | ⚠️ ${partial} perlu cek | ❌ ${invalid} tidak valid`,
    summary : { total: results.length, valid, partial, invalid },
    allValid: invalid === 0
  }
}];
```

### Contoh Output Report

```
## 📋 CITATION VALIDATION REPORT

✅ `(Santoso et al., 2023)` → **VALID**
   📄 "Digital Transformation in Indonesian SMEs" (2023) — Journal of Business Research

⚠️ `(Wijaya, 2021)` → **PARTIAL**
   📄 "E-Commerce Adoption in Indonesia" (2022) — International Journal of Economics
   💬 Tahun berbeda: ditemukan 2022, dikutip 2021. Cek kembali.

❌ `(Prasetyo & Hartono, 2020)` → **INVALID**
   💬 Tidak ditemukan di Semantic Scholar. Sitasi mungkin tidak akurat.

---
📊 Ringkasan: 3 sitasi | ✅ 1 valid | ⚠️ 1 perlu cek | ❌ 1 tidak valid
```

---

## 12. Fitur B — Mode Operasi (7 Mode)

### Tabel Ringkasan

| Mode | Input | Output | Tools Aktif | Temp |
|------|-------|--------|------------|------|
| `drafting` | Topik / instruksi | Konten baru Markdown | Semua | 0.3 |
| `editing` | Teks draft | Review + Versi revisi | Citation Validator | 0.2 |
| `paraphrasing` | Teks kutipan | Parafrase akademik | Tidak ada | 0.7 |
| `SLR` | Topik | Tabel + sintesis 15+ jurnal | Semantic Scholar | 0.3 |
| `proposal` | Topik | Dokumen proposal 3 bab | Semua | 0.3 |
| `abstract` | Ringkasan / draft | Abstrak ID + EN | Tidak ada | 0.3 |
| `statistics` | Output SPSS/R | Interpretasi naratif | Tidak ada | 0.2 |

---

### Mode: `drafting`

```
Tujuan   : Menulis konten akademik baru dari nol
Tools    : Semantic Scholar + DuckDuckGo (aktif penuh)
Output   : Draft Markdown terstruktur dengan sitasi inline

Prompt Behavior:
"Tulis [section] berdasarkan [topik].
 Gunakan Semantic Scholar untuk referensi jurnal.
 Gunakan DuckDuckGo untuk data statistik terkini.
 Sertakan sitasi (Nama, Tahun) pada setiap klaim."
```

---

### Mode: `editing`

```
Tujuan   : Review & perbaiki tulisan yang sudah ada
Input    : Upload file atau paste teks
Tools    : Citation Validator

Output Format:
╔══════════════════════════════════════╗
║ BAGIAN BERMASALAH  : [teks asli]    ║
║ MASALAH TERIDENTIFIKASI:            ║
║   - Kalimat terlalu panjang         ║
║   - Sitasi tidak lengkap            ║
║   - Argumen kurang kuat             ║
║ VERSI REVISI       : [teks baru]    ║
║ ALASAN PERUBAHAN   : [penjelasan]   ║
╚══════════════════════════════════════╝
```

---

### Mode: `paraphrasing`

```
Tujuan   : Parafrase ulang teks untuk hindari plagiarisme
Tools    : Tidak ada (pure language task)
Temp     : 0.7 (lebih kreatif untuk variasi kalimat)

Output Format:
TEKS ASLI    : [...]
PARAFRASE    : [...]
SITASI       : (Nama, Tahun)
ESTIMASI SIM : Rendah / Sedang / Tinggi
```

---

### Mode: `SLR` (Systematic Literature Review)

```
Tujuan   : Buat tabel & sintesis penelitian terdahulu
Tools    : Semantic Scholar (intensif, limit 20 paper)

Output:
1. TABEL PENELITIAN TERDAHULU
   | No | Peneliti | Tahun | Judul | Metode | Variabel | Hasil | Relevansi |

2. SINTESIS NARATIF
   [Pengelompokan per tema/topik]

3. RESEARCH GAP
   [Celah yang belum diteliti → posisi penelitian Anda]
```

---

### Mode: `proposal`

```
Tujuan   : Generate proposal penelitian lengkap
Tools    : Semua (Semantic Scholar + DuckDuckGo)

Struktur Output:
BAB I  — Latar Belakang, Rumusan Masalah, Tujuan, Manfaat
BAB II — Tinjauan Pustaka singkat, Kerangka Teori, Hipotesis
BAB III— Rencana Metode Penelitian
DAFTAR PUSTAKA sementara (10–15 referensi)

Target: ±3.000–5.000 kata
```

---

### Mode: `abstract`

```
Tujuan   : Buat atau revisi abstrak bilingual
Input    : Ringkasan penelitian / full draft
Tools    : Tidak ada

Output:
ABSTRAK (Indonesia, 150–200 kata):
[Latar belakang. Tujuan. Metode. Hasil. Kesimpulan.]

ABSTRACT (English, 150–200 words):
[Background. Objective. Method. Results. Conclusion.]

KATA KUNCI (3–6): kata1; kata2; kata3
KEYWORDS   (3–6): word1; word2; word3
```

---

### Mode: `statistics`

```
Tujuan   : Interpretasi hasil statistik untuk Bab IV
Input    : Output SPSS/R/Excel (tabel, koefisien, p-value)
Tools    : Tidak ada
Temp     : 0.2 (sangat presisi)

Output:
1. STATISTIK DESKRIPTIF
   [Narasi tabel mean, std dev, min, max]

2. UJI ASUMSI KLASIK
   Normalitas  : [hasil + interpretasi]
   Multikol.   : [VIF < 10? Tidak ada multikol?]
   Heterosk.   : [Breusch-Pagan / Glejser]

3. HASIL ANALISIS REGRESI
   | Variabel | β | Std. Error | t | p-value | Keterangan |

4. PENGUJIAN HIPOTESIS
   H1: Diterima/Ditolak, karena p = ... < 0.05

5. PEMBAHASAN TEORITIS
   [Kaitkan dengan teori TAM, Porter, RBV, literatur]
```

### Mode Selector Code Node

```javascript
const mode = $json.mode || 'drafting';

const modeConfig = {
  drafting: {
    temp: 0.3,
    tools: ['semantic_scholar', 'duckduckgo'],
    prompt: 'Tulis konten akademik baru yang lengkap. Gunakan tools untuk referensi dan data terkini. Sertakan sitasi di setiap klaim.'
  },
  editing: {
    temp: 0.2,
    tools: ['citation_validator'],
    prompt: 'Review tulisan user. Identifikasi masalah: kejelasan kalimat, konsistensi, argumen lemah, sitasi kurang. Format: MASALAH | ASLI | REVISI | ALASAN.'
  },
  paraphrasing: {
    temp: 0.7,
    tools: [],
    prompt: 'Parafrase teks dengan bahasa akademik yang berbeda dari aslinya. Pertahankan makna. Estimasi kemiripan.'
  },
  SLR: {
    temp: 0.3,
    tools: ['semantic_scholar'],
    prompt: 'Lakukan SLR. Cari 15+ jurnal Semantic Scholar. Buat tabel penelitian terdahulu + sintesis naratif + research gap.'
  },
  proposal: {
    temp: 0.3,
    tools: ['semantic_scholar', 'duckduckgo'],
    prompt: 'Buat proposal penelitian lengkap: Bab I (pendahuluan), Bab II (tinjauan pustaka), Bab III (rencana metode), Daftar Pustaka sementara.'
  },
  abstract: {
    temp: 0.3,
    tools: [],
    prompt: 'Buat abstrak bilingual (Indonesia 150-200 kata + English 150-200 words). Tambahkan kata kunci 3-6 kata per bahasa.'
  },
  statistics: {
    temp: 0.2,
    tools: [],
    prompt: 'Interpretasikan hasil statistik: deskriptif, uji asumsi, regresi, hipotesis. Kaitkan dengan teori dan literatur. Gunakan bahasa akademik.'
  }
};

return {
  ...$json,
  modeConfig: modeConfig[mode] || modeConfig.drafting,
  modeLabel: mode.toUpperCase()
};
```

---

## 13. Fitur C — Auto Section Generator (`generate_full`)

### Tujuan

Menghasilkan seluruh dokumen TA/artikel dalam **satu request** secara berurutan per bab, tanpa user perlu trigger manual tiap section.

### Alur Lengkap

```
POST { action: "generate_full", topic: "...", ... }
        │
        ▼
Orchestrator: Buat queue 8 section
        │
        ├── Step 1: 🔍 Research Phase
        │     → Semantic Scholar: 15 jurnal
        │     → DuckDuckGo: data lokal
        │     → Simpan semua referensi untuk dipakai semua bab
        │
        ├── Step 2: 📄 Abstrak [mode: abstract]
        │
        ├── Step 3: 📖 BAB I — Pendahuluan [mode: drafting]
        │     → Latar Belakang (800+ kata, data terkini)
        │     → Rumusan Masalah
        │     → Tujuan & Manfaat
        │
        ├── Step 4: 📚 BAB II — Tinjauan Pustaka [mode: SLR]
        │     → Landasan Teori (TAM, Porter, RBV)
        │     → Tabel Penelitian Terdahulu (10–15 jurnal)
        │     → Kerangka Pemikiran
        │     → Hipotesis
        │
        ├── Step 5: ⚙️ BAB III — Metode Penelitian [mode: drafting]
        │     → Jenis penelitian, lokasi
        │     → Populasi & Sampel (Slovin)
        │     → Instrumen & teknik
        │     → Tabel definisi operasional
        │     → Teknik analisis
        │
        ├── Step 6: 📊 BAB IV — Hasil & Pembahasan
        │     → [mode: statistics] jika ada data upload
        │     → [mode: drafting]   jika tidak ada data (template)
        │
        ├── Step 7: 🏁 BAB V — Penutup [mode: drafting]
        │     → Kesimpulan per rumusan masalah
        │     → Keterbatasan penelitian
        │     → Saran
        │
        ├── Step 8: 📑 Daftar Pustaka (APA 7, alfabetis)
        │
        ├── 🔍 Citation Validator (semua sitasi divalidasi)
        │
        └── 📄 Stitch: Gabung semua section → 1 dokumen
                    │
              Export: MD + PDF + DOCX
```

### Orchestrator Code

```javascript
const topic      = $json.researchTopic || $json.userMessage;
const discipline = $json.discipline || 'general_academic';
const yearFilter = $json.yearFilter || '2019-2024';
const journalN   = $json.journalCount || 15;
const hasData    = $json.hasUploadedData || false;

const sections = [
  {
    id: 'research_phase', label: '🔍 Research Phase',
    prompt: `Cari ${journalN} jurnal tentang "${topic}" (Semantic Scholar, Inggris, ${yearFilter}).
             Cari juga data statistik lokal Indonesia via DuckDuckGo.
             List semua referensi yang akan dipakai seluruh bab.`
  },
  {
    id: 'abstrak', label: '📄 Abstrak', mode: 'abstract',
    prompt: `Buat abstrak Indonesia (150-200 kata) + Abstract English (150-200 words)
             untuk penelitian: "${topic}". Tambahkan Kata Kunci & Keywords 3-6 kata.`
  },
  {
    id: 'bab1', label: '📖 BAB I — Pendahuluan', mode: 'drafting',
    prompt: `Tulis BAB I lengkap untuk: "${topic}".
             1.1 Latar Belakang (min 800 kata, gunakan data BPS/BI terkini dari DuckDuckGo)
             1.2 Rumusan Masalah (3 pertanyaan spesifik)
             1.3 Tujuan Penelitian
             1.4 Manfaat Penelitian (teoritis & praktis)`
  },
  {
    id: 'bab2', label: '📚 BAB II — Tinjauan Pustaka', mode: 'SLR',
    prompt: `Tulis BAB II untuk: "${topic}".
             2.1 Landasan Teori (TAM, Porter Competitive Advantage, RBV, Konsep UMKM)
             2.2 Penelitian Terdahulu (tabel 10-15 jurnal dari Semantic Scholar)
             2.3 Kerangka Pemikiran (diagram alur variabel)
             2.4 Hipotesis Penelitian (H1, H2, H3)`
  },
  {
    id: 'bab3', label: '⚙️ BAB III — Metode', mode: 'drafting',
    prompt: `Tulis BAB III Metode Penelitian untuk: "${topic}".
             3.1 Jenis & Pendekatan (kuantitatif + kualitatif)
             3.2 Lokasi & Waktu (Kabupaten Banyumas)
             3.3 Populasi & Sampel (Slovin, n = N/(1+N·e²))
             3.4 Teknik Pengumpulan Data (kuesioner Likert, wawancara)
             3.5 Definisi Operasional Variabel (tabel lengkap)
             3.6 Teknik Analisis (regresi linear berganda, uji asumsi klasik)`
  },
  {
    id: 'bab4', label: '📊 BAB IV — Hasil', mode: hasData ? 'statistics' : 'drafting',
    prompt: hasData
      ? `Interpretasikan data yang diupload dan tulis BAB IV lengkap untuk: "${topic}".`
      : `Tulis template BAB IV untuk: "${topic}".
         Buat contoh hasil hipotetis yang realistis.
         Tandai bagian yang harus diganti dengan [DATA REAL ANDA].`
  },
  {
    id: 'bab5', label: '🏁 BAB V — Penutup', mode: 'drafting',
    prompt: `Tulis BAB V berdasarkan seluruh pembahasan untuk: "${topic}".
             5.1 Kesimpulan (jawab tiap rumusan masalah)
             5.2 Keterbatasan Penelitian
             5.3 Saran (untuk UMKM, Pemkab, peneliti selanjutnya)`
  },
  {
    id: 'daftar_pustaka', label: '📑 Daftar Pustaka',
    prompt: `Buat Daftar Pustaka lengkap format APA 7th Edition dari SEMUA referensi
             yang digunakan di seluruh bab. Urutkan alfabetis berdasarkan nama penulis pertama.`
  }
];

return {
  ...$json,
  sections,
  totalSections : sections.length,
  currentIndex  : 0,
  completedSections: [],
  fullDocument  : '',
  startedAt     : new Date().toISOString()
};
```

### Response Format `generate_full`

```json
{
  "success"   : true,
  "sessionId" : "ut_banyumas_2026",
  "action"    : "generate_full",
  "document"  : {
    "title"       : "Pengaruh Aplikasi Digital terhadap UMKM...",
    "wordCount"   : 8432,
    "sections"    : 7,
    "references"  : 18,
    "generatedAt" : "2026-08-22T20:30:00Z",
    "duration"    : "14m 22s"
  },
  "citationValidation": {
    "total"   : 18,
    "valid"   : 16,
    "partial" : 1,
    "invalid" : 1,
    "allValid": false,
    "note"    : "1 sitasi perlu diverifikasi manual"
  },
  "sources": {
    "semanticScholar": 15,
    "duckDuckGo"     : 6,
    "userUploads"    : 0
  },
  "exports": {
    "markdown": "/exports/ut_banyumas_2026_full.md",
    "pdf"     : "/exports/ut_banyumas_2026_full.pdf",
    "docx"    : "/exports/ut_banyumas_2026_full.docx"
  }
}
```

---

## 14. System Prompt Lengkap (Claude)

```
Kamu adalah AcademAI — asisten riset dan penulisan artikel ilmiah
berbasis AI untuk mahasiswa, dosen, dan peneliti di Indonesia.

═══════════════════════════════════════════════════════════
CAKUPAN (SCOPE)
═══════════════════════════════════════════════════════════
Semua disiplin ilmu akademik: Ekonomi, Bisnis, Pendidikan,
Hukum, Psikologi, Sosiologi, Ilmu Komputer, Teknik, Kesehatan,
Pertanian, Komunikasi, Seni (kajian akademik), Humaniora.

SCOPE TERBATAS pada dunia pendidikan dan akademik.
TIDAK melayani: konten komersial, hiburan, politik partisan.

═══════════════════════════════════════════════════════════
ATURAN WAJIB (MANDATORY RULES)
═══════════════════════════════════════════════════════════
R1. SITASI WAJIB
    Setiap klaim faktual HARUS disertai (Nama, Tahun).
    JANGAN membuat sitasi fiktif — ini pelanggaran akademik.
    Jika tidak punya referensi, gunakan tool Semantic Scholar.

R2. ANTI-HALLUCINATION
    Jika tidak yakin tentang fakta/angka:
    → Gunakan tool, atau
    → Nyatakan: "Data ini perlu diverifikasi lebih lanjut."
    JANGAN mengarang statistik atau fakta.

R3. BAHASA AKADEMIK INDONESIA
    ✓ Kalimat pasif: "Penelitian ini bertujuan..."
    ✓ "Peneliti" bukan "saya/kami"
    ✓ Istilah teknis konsisten
    ✓ Tidak ada slang atau bahasa sehari-hari
    ✓ Kalimat max 3 anak kalimat

R4. PARAFRASE, BUKAN PLAGIAT
    Selalu tulis ulang dengan bahasa sendiri.
    Kutipan verbatim hanya jika diminta, dengan tanda petik.

R5. DATA AKTUAL
    Prioritaskan data 5 tahun terakhir (kecuali teori klasik).
    Selalu cantumkan tahun data.

R6. FORMAT OUTPUT
    Selalu gunakan Markdown terstruktur.
    Heading jelas (H1, H2, H3).
    Tabel untuk perbandingan.
    Sertakan daftar referensi di akhir setiap section besar.

═══════════════════════════════════════════════════════════
PENGGUNAAN TOOLS
═══════════════════════════════════════════════════════════
semantic_scholar_search:
  → Kapan: butuh jurnal, teori, penelitian terdahulu
  → Query: BAHASA INGGRIS, spesifik + tahun
  → Contoh: "digital transformation SME Indonesia 2020 2024"

duckduckgo_search:
  → Kapan: data BPS terbaru, kebijakan, info lokal
  → Query: Bahasa Indonesia/Inggris, sertakan sumber
  → Contoh: "data UMKM Banyumas 2024 site:bps.go.id"

citation_validator:
  → Kapan: selesai nulis section, ada sitasi perlu dicek
  → Input: teks dengan sitasi APA atau DOI

═══════════════════════════════════════════════════════════
FORMAT SITASI DEFAULT: APA 7th Edition
═══════════════════════════════════════════════════════════
Inline : (Nama, Tahun) atau (Nama & Nama, Tahun) atau (Nama et al., Tahun)
Kutipan: (Nama, Tahun, hal. X)

Daftar Pustaka:
  Jurnal : Nama, A. B. (Tahun). Judul. *Nama Jurnal*, Vol(No), hal. https://doi.org/
  Buku   : Nama, A. (Tahun). Judul buku. Penerbit.
  Web    : Institusi. (Tahun). Judul. Diakses dari URL

MODE SAAT INI : [MODE]
INSTRUKSI MODE: [MODE_PROMPT]
```

---

## 15. API Endpoints & Request Format

### Endpoints Lengkap

| Method | Endpoint | Action | Fungsi |
|--------|----------|--------|--------|
| `POST` | `/webhook/academ-ai` | `chat` | Chat / generate section |
| `POST` | `/webhook/academ-ai` | `generate_full` | Auto generate semua bab |
| `POST` | `/webhook/academ-ai` | `validate_citations` | Validasi sitasi |
| `POST` | `/webhook/academ-ai` | `upload` | Upload file referensi |
| `POST` | `/webhook/academ-ai` | `export` | Export dokumen |
| `GET`  | `/webhook/academ-ai/status` | — | Cek progress generate_full |
| `POST` | `/webhook/academ-ai` | `reset` | Reset memori sesi |

### Schema Request Lengkap

```typescript
interface AcademAIRequest {
  // Wajib
  sessionId  : string;      // ID sesi unik per user
  action     : "chat" | "generate_full" | "validate_citations"
               | "upload" | "export" | "reset";
  message?   : string;      // Pesan / instruksi user

  // Opsional tapi direkomendasikan
  mode?      : "drafting" | "editing" | "paraphrasing" | "SLR"
               | "proposal" | "abstract" | "statistics";
  topic?     : string;      // Topik penelitian
  discipline?: string;      // Bidang ilmu
  language?  : "indonesia" | "english" | "bilingual";
  citationFormat?: "APA7" | "IEEE" | "Chicago" | "Vancouver";

  // Untuk generate_full
  hasUploadedData?: boolean;

  // Untuk export
  outputFormat?: "md" | "pdf" | "docx" | "all";

  // Untuk validate_citations
  content?   : string;      // Teks yang ingin divalidasi

  // Options lanjutan
  options?: {
    journalCount   ?: number;  // Jumlah jurnal (default: 10)
    yearFilter     ?: string;  // "2019-2024"
    runCitationValidator?: boolean;
    outputStyle    ?: "UT_thesis" | "journal_imrad" | "proposal";
  };
}
```

### Contoh Request Lengkap

#### Chat Mode Drafting
```json
{
  "sessionId"    : "ut_banyumas_001",
  "action"       : "chat",
  "mode"         : "drafting",
  "discipline"   : "economics",
  "language"     : "indonesia",
  "citationFormat": "APA7",
  "topic"        : "Pengaruh Aplikasi Digital terhadap UMKM di Kabupaten Banyumas",
  "message"      : "Bantu saya menulis latar belakang penelitian"
}
```

#### Generate Full TA
```json
{
  "sessionId"  : "ut_banyumas_001",
  "action"     : "generate_full",
  "topic"      : "Pengaruh Aplikasi Digital terhadap UMKM di Tengah Meningkatnya Minimarket Modern: Studi Kasus Kabupaten Banyumas",
  "discipline" : "economics",
  "language"   : "indonesia",
  "options"    : {
    "journalCount"          : 15,
    "yearFilter"            : "2019-2024",
    "runCitationValidator"  : true,
    "outputStyle"           : "UT_thesis"
  }
}
```

#### SLR Mode
```json
{
  "sessionId" : "ut_banyumas_001",
  "action"    : "chat",
  "mode"      : "SLR",
  "message"   : "Carikan 15 jurnal dan buat tabel penelitian terdahulu untuk topik: digital transformation UMKM Indonesia"
}
```

#### Validate Citations
```json
{
  "sessionId" : "ut_banyumas_001",
  "action"    : "validate_citations",
  "content"   : "Menurut Santoso et al. (2023), digitalisasi UMKM meningkat signifikan. Penelitian Wijaya (2021) juga menunjukkan hal serupa. DOI: https://doi.org/10.1080/abc123"
}
```

#### Abstract Mode
```json
{
  "sessionId" : "ut_banyumas_001",
  "action"    : "chat",
  "mode"      : "abstract",
  "message"   : "Buat abstrak untuk penelitian saya tentang pengaruh aplikasi digital terhadap UMKM di Banyumas. Metode regresi berganda, 110 responden, hasil: H1 dan H3 diterima, H2 ditolak."
}
```

---

## 16. Setup Lokal (Docker)

### Persyaratan

| Kebutuhan | Detail |
|-----------|--------|
| Docker Desktop | Download: docker.com/products/docker-desktop |
| Anthropic API Key | Daftar: console.anthropic.com |
| RAM | Minimal 4 GB |
| Disk | ~2 GB untuk Docker images |
| OS | Windows 10/11 dengan WSL2 atau Hyper-V |

### Struktur Project

```
academ-ai/                          ← Root project
├── 🐳 docker-compose.yml           ← Stack n8n + Gotenberg
├── ⚙️  .env.example                ← Template API keys
├── ⚙️  .env                        ← API keys (jangan commit!)
├── 🚀 start.ps1                    ← Script setup otomatis
├── 📄 README.md                    ← Panduan lengkap
├── 📁 n8n/
│   └── academ_ai_workflow_v2.json  ← Workflow siap import
├── 📁 uploads/                     ← File yang diupload user
└── 📁 exports/                     ← Dokumen hasil export
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: academ-ai-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER:-admin}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD:-academ2024}
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - SEMANTIC_SCHOLAR_API_KEY=${SEMANTIC_SCHOLAR_API_KEY:-}
      - GOTENBERG_URL=http://gotenberg:3000
      - WEBHOOK_URL=http://localhost:5678
      - GENERIC_TIMEZONE=Asia/Jakarta
      - TZ=Asia/Jakarta
      - N8N_COMMUNITY_PACKAGES_ENABLED=true
      - N8N_RUNNERS_ENABLED=true
    volumes:
      - n8n_data:/home/node/.n8n
      - ./uploads:/uploads
      - ./exports:/exports
    depends_on:
      - gotenberg
    networks:
      - academ-net

  gotenberg:
    image: gotenberg/gotenberg:8
    container_name: academ-ai-gotenberg
    restart: unless-stopped
    ports:
      - "3001:3000"
    command:
      - "gotenberg"
      - "--chromium-disable-javascript=true"
      - "--api-timeout=60s"
    networks:
      - academ-net

volumes:
  n8n_data:

networks:
  academ-net:
    driver: bridge
```

### .env

```env
# ─── WAJIB ────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXX

# ─── OPSIONAL ─────────────────────────────
SEMANTIC_SCHOLAR_API_KEY=

# ─── n8n Auth ─────────────────────────────
N8N_USER=admin
N8N_PASSWORD=academ2024
N8N_ENCRYPTION_KEY=ganti_dengan_32_karakter_random
```

### Langkah Setup

```powershell
# 1. Install Docker Desktop (restart PC setelahnya)
#    https://www.docker.com/products/docker-desktop/

# 2. Buka PowerShell di folder project
cd "C:\Users\yandr\OneDrive\Desktop\academ-ai"

# 3. Salin dan isi .env
Copy-Item .env.example .env
notepad .env   # Isi ANTHROPIC_API_KEY

# 4. Jalankan (pilih salah satu):
.\start.ps1          # Otomatis (direkomendasikan)
# ATAU
docker-compose up -d  # Manual

# 5. Cek status
docker-compose ps

# 6. Buka n8n
Start-Process "http://localhost:5678"
```

### Import Workflow ke n8n

```
1. Buka http://localhost:5678
2. Login: admin / academ2024
3. Menu ≡ → Workflows → + New
4. Klik ⋮ → "Import from file"
5. Pilih: n8n/academ_ai_workflow_v2.json
6. Klik node "🤖 Claude Sonnet Model"
7. Credentials → "+ Add credential" → Anthropic API
8. Masukkan ANTHROPIC_API_KEY → Save
9. Toggle "Active" di pojok kanan atas ✅
10. Klik Webhook node → salin URL
```

### Perintah Docker

```powershell
docker-compose up -d        # Jalankan background
docker-compose down         # Stop semua
docker-compose ps           # Cek status
docker-compose logs -f n8n  # Lihat log real-time
docker-compose restart n8n  # Restart n8n saja
```

---

## 17. Struktur File Project

```
C:\Users\yandr\OneDrive\Desktop\academ-ai\
│
├── docker-compose.yml              ✅ Siap
├── .env.example                    ✅ Siap
├── .env                            ⚠️ Buat dari .env.example
├── start.ps1                       ✅ Siap
├── README.md                       ✅ Siap
│
├── n8n/
│   └── academ_ai_workflow_v2.json  ✅ Siap (import ke n8n)
│
├── uploads/                        📁 Kosong (siap pakai)
└── exports/                        📁 Kosong (output dokumen)
```

---

## 18. Checklist & Status

### Fitur & Komponen

| # | Komponen | Status | Keterangan |
|---|----------|--------|-----------|
| 1 | Claude Sonnet 4.5 | ✅ | Model terkonfigurasi |
| 2 | Window Buffer Memory | ✅ | 30 pesan, per session |
| 3 | File Upload (PDF/DOCX/CSV) | ✅ | Max 15MB |
| 4 | Semantic Scholar API | ✅ | Gratis, 200M+ paper |
| 5 | MCP DuckDuckGo | ✅ | HTTP Tool (fallback tersedia) |
| 6 | Doc Generator (Template TA UT) | ✅ | Bab I–V + Daftar Pustaka |
| 7 | Export MD + PDF + DOCX | ✅ | Gotenberg + docx.js |
| 8 | **[A] Citation Validator** | ✅ | DOI lookup + report |
| 9 | **[B] 7 Mode Operasi** | ✅ | drafting/editing/SLR/... |
| 10 | **[C] Auto Section Generator** | ✅ | generate_full action |

### Setup Lokal

| # | Item | Status |
|---|------|--------|
| 1 | Project folder dibuat | ✅ `Desktop/academ-ai/` |
| 2 | docker-compose.yml | ✅ |
| 3 | .env.example | ✅ |
| 4 | start.ps1 (setup script) | ✅ |
| 5 | n8n workflow JSON v2 | ✅ |
| 6 | README.md | ✅ |
| 7 | Docker Desktop | ❌ Perlu install |
| 8 | .env (dari .env.example) | ❌ Perlu dibuat |
| 9 | Anthropic API Key | ❌ Perlu daftar |
| 10 | Import workflow ke n8n | ⏳ Setelah Docker jalan |

### Keputusan Desain (Terkonfirmasi User)

| # | Item | Keputusan | Status |
|---|------|-----------|--------|
| 9 | Export Format | **MD + PDF + DOCX** (semua) | ✅ Terkonfirmasi |
| 10 | Deployment | **Lokal** (Docker di laptop) | ✅ Terkonfirmasi |
| 11 | Frontend | **API Only** (tidak ada UI) | ✅ Terkonfirmasi |

---

## 💰 Estimasi Biaya Operasional

| Item | Tarif | Estimasi Pemakaian | Biaya |
|------|-------|-------------------|-------|
| Claude Sonnet 4.5 | $3/1M input · $15/1M output | 1 bab ≈ 5K token | ~Rp 2.000–5.000/bab |
| **1 TA Lengkap (5 bab)** | | 5 sesi | **~Rp 10.000–25.000** |
| Semantic Scholar | **Gratis** | — | Rp 0 |
| DuckDuckGo | **Gratis** | — | Rp 0 |
| n8n self-hosted | **Gratis** | — | Rp 0 |
| Gotenberg self-hosted | **Gratis** | — | Rp 0 |

> **Total biaya 1 TA lengkap ≈ Rp 10.000–25.000** (hanya biaya API Claude)

---

---

## 19. 🚀 Roadmap — AcademAI v3.0 Ideas

> Fitur-fitur berikut direncanakan untuk pengembangan lanjutan setelah v2.0 stabil di lokal.

### Fitur yang Direncanakan

| # | Fitur | Deskripsi | Kompleksitas |
|---|-------|-----------|-------------|
| 1 | **RAG** | Upload 50+ jurnal → vector DB → Claude query lokal | Tinggi |
| 2 | **Plagiarism Score Estimator** | Cek kemiripan dengan corpus jurnal | Sedang |
| 3 | **Multi-language Support** | Auto-translate abstrak ke 3 bahasa | Sedang |
| 4 | **Turnitin-style Checker** | Similarity checker berbasis hash + TF-IDF | Tinggi |
| 5 | **Graph Knowledge Builder** | Peta konsep dari referensi yang digunakan | Sedang |
| 6 | **Web UI** | Chat interface Next.js / React yang user-friendly | Tinggi |

---

### Detail Per Fitur

#### 1. RAG — Retrieval Augmented Generation

```
Alur:
User upload 50+ jurnal PDF
        │
        ▼
Chunk & Embed (text-embedding-3-small / Nomic)
        │
        ▼
Vector DB (Qdrant / ChromaDB / Supabase pgvector)
        │
        ▼
Claude query lokal → Semantic search → Retrieve chunks
        │
        ▼
Claude generate dengan konteks dari jurnal lokal

Keunggulan:
✓ Tidak tergantung Semantic Scholar untuk referensi
✓ Bisa pakai jurnal berbayar yang sudah dimiliki
✓ Konteks lebih akurat dan spesifik ke topik
✓ Hemat token (hanya chunk relevan yang dikirim)

Stack:
├── Embedding: OpenAI text-embedding-3-small atau Nomic (lokal)
├── Vector DB: Qdrant (self-hosted Docker) atau ChromaDB
└── n8n node: @n8n/n8n-nodes-langchain.vectorStore
```

#### 2. Plagiarism Score Estimator

```
Alur:
Input teks yang ditulis
        │
        ▼
Tokenize → N-gram / shingling
        │
        ▼
Compare dengan corpus:
  ├── Semantic Scholar abstracts (API)
  ├── Jurnal yang diupload user (RAG DB)
  └── Common academic phrases DB
        │
        ▼
Similarity score per paragraf (0–100%)
        │
        ▼
Highlight bagian yang mirip + sumber aslinya

Output:
  ✅ < 20%  : Aman (original)
  ⚠️ 20–40% : Perlu parafrase
  ❌ > 40%  : Plagiat — wajib ditulis ulang
```

#### 3. Multi-language Support

```
Bahasa yang didukung (v3.0):
├── 🇮🇩 Indonesia (default)
├── 🇬🇧 English (akademik internasional)
└── 🇲🇾 Melayu (untuk submit jurnal ASEAN)

Fitur:
├── Auto-translate abstrak ke 3 bahasa sekaligus
├── Deteksi bahasa input otomatis
├── Pertahankan terminologi teknis (tidak diterjemahkan)
└── Format sitasi per bahasa (APA ID / APA EN)

Engine: Claude native translation
(tidak memerlukan API translate terpisah)
```

#### 4. Turnitin-style Similarity Checker

```
Metode:
├── TF-IDF cosine similarity
├── Exact phrase matching (5+ kata berurutan)
├── Semantic similarity (embedding-based)
└── Citation ghost detection (sitasi diparafrase tapi tidak dikutip)

Output Report:
┌─────────────────────────────────────────┐
│  SIMILARITY REPORT                      │
│  Overall: 18% (✅ Aman)                 │
│                                         │
│  Paragraf 1 : 5%  ✅                   │
│  Paragraf 2 : 31% ⚠️  → sumber: [DOI] │
│  Paragraf 3 : 8%  ✅                   │
└─────────────────────────────────────────┘
```

#### 5. Graph Knowledge Builder

```
Output: Peta konsep interaktif dari semua referensi

Node dalam graph:
├── 📄 Paper / Jurnal
├── 👤 Penulis
├── 🏷️ Konsep / Teori
├── 📅 Tahun
└── 🔗 Relasi: "mengutip", "mendukung", "membantah"

Visualisasi:
├── Format: D3.js / Cytoscape.js / Mermaid
├── Export: PNG / SVG / JSON
└── Integrasi: Embed di dokumen MD

Use case:
→ "Siapa saja peneliti yang paling banyak dikutip di topik ini?"
→ "Teori apa yang paling sering digunakan?"
→ "Paper mana yang menjadi landasan utama bidang ini?"
```

#### 6. Web UI — Chat Interface

```
Stack:
├── Framework : Next.js 15 (App Router)
├── UI        : shadcn/ui + Tailwind CSS
├── Chat      : Vercel AI SDK (streaming)
├── Auth      : NextAuth.js (multi-user)
└── Deploy    : Lokal → Vercel / Railway

Fitur UI:
├── 💬 Chat interface real-time (streaming response)
├── 📁 Drag & drop file upload
├── 📊 Progress bar untuk generate_full
├── 📄 Preview dokumen hasil (Markdown renderer)
├── ⬇️ Download button: MD / PDF / DOCX
├── 🗂️ History sesi tersimpan
├── 🔍 Citation validation inline (highlight merah/hijau)
└── 👤 Multi-user (tiap mahasiswa punya akun sendiri)

Layout:
┌─────────────────────────────────────┐
│  AcademAI           [Mode ▼] [Exp] │
├──────────┬──────────────────────────┤
│          │                          │
│ History  │   Chat / Document Area   │
│ Sessions │                          │
│          │  [Upload] [Mode] [Send]  │
└──────────┴──────────────────────────┘
```

---

### Prioritas Pengembangan v3.0

```
Phase 1 (Setelah v2.0 stabil):
  [1] Web UI → user experience jauh lebih baik
  [2] RAG    → akurasi referensi meningkat drastis

Phase 2:
  [3] Plagiarism Score Estimator
  [4] Multi-language Support

Phase 3:
  [5] Turnitin-style Checker (butuh corpus besar)
  [6] Graph Knowledge Builder
```

---

### Stack Tambahan untuk v3.0

```yaml
# Tambahan di docker-compose.yml (v3.0)
services:
  qdrant:           # Vector DB untuk RAG
    image: qdrant/qdrant:latest
    ports: ["6333:6333"]

  nextjs-ui:        # Web UI
    build: ./ui
    ports: ["3000:3000"]
    environment:
      - N8N_WEBHOOK_URL=http://n8n:5678/webhook/academ-ai
```

---

*AcademAI v2.0 — Dokumen Lengkap — 2026-08-22*  
*Stack: Claude Sonnet 4.5 · n8n · Semantic Scholar · DuckDuckGo · Gotenberg*  
*v3.0 Roadmap: RAG · Plagiarism Checker · Multi-language · Web UI*
