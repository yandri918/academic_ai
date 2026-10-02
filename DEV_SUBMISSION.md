---
title: "AcademAI — I Built an Open-Source AI Research Co-Pilot So My Wife Could Finally Finish Her Thesis"
published: true
description: "A multi-disciplinary academic writing assistant built with an open-source Node.js agent harness + Google Gemini — helping Indonesian university students write thesis papers, validate citations, detect plagiarism, and analyze statistics. Built for my wife studying S1 PAUD."
tags: hacktoberfest, ai, opensource, webdev
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

---

## What I Built

**AcademAI** is a full-stack AI-powered academic research co-pilot. The "friend" in my case is someone even closer — **my wife**, who is finishing her **S1 PAUD (Pendidikan Anak Usia Dini — Early Childhood Education)** thesis while also managing our entire household.

Every night I'd come home and see her at the kitchen table: ten browser tabs open, a citation that turned out to be fake (the AI made up a Piaget paper that never existed), and a plagiarism score that wouldn't go below 22%.

> *"It doesn't have to be big. It has to matter to them."*

This matters to her. A lot. So I built it.

### The Problem She Faced

| Her Pain Point | What AcademAI Does |
|---------------|-------------------|
| Spending hours searching for PAUD journals | 🔍 Auto-searches Google Scholar using discipline-aware queries |
| AI hallucinating fake Piaget/Vygotsky citations | ✅ Citation Validator cross-checks every reference against real databases |
| Plagiarism score stuck at 20%+ | 🔄 Academic paraphrasing mode targets <15% Turnitin similarity |
| Can't interpret N-Gain scores from PTK research | 📊 Statistics Engine: Paired t-Test + N-Gain (Hake 1999) with ready-to-paste Indonesian prose |
| Blank page anxiety for Bab I–V | 🏗️ Full thesis generator: complete 5-chapter draft in one request |
| Only useful for PAUD | 🌐 Expanded to 12 disciplines — so any student can use it |

### Who This Is For

Any university student in Indonesia (or anywhere) who needs help with:
- 🎓 Bachelor/Master thesis (Skripsi/Tesis) in any discipline
- 📄 Scientific journal articles (IMRaD format)
- 🔬 Research proposals
- 📋 Systematic Literature Reviews (SLR)
- 📊 Statistical interpretation of classroom research data

---

## Demo

🌐 **Live App**: https://academicai-production-a41d.up.railway.app

**Try it:**

1. **Tab 1 — Chat Mode**: Select a discipline (PAUD, Economics, Law, Computer Science, Health, etc.), type your research question, and get AI-written content grounded in real Google Scholar references.

2. **Tab 2 — Full Article Generator**: Enter a thesis topic → get complete Bab I–V draft with abstract (Indonesian + English), methodology, literature review matrix, and APA 7th bibliography.

3. **Tab 3 — Citation Validator**: Paste any academic paragraph → line-by-line report: ✅ VALID · ⚠️ PARTIAL · ❌ INVALID.

4. **Tab 4 — Plagiarism Auditor**: Paste your draft → Turnitin-style similarity audit with academic paraphrase suggestions.

5. **Tab 5 — Statistics Engine**: Input pretest/posttest scores → get Paired t-Test + N-Gain Score (Hake 1999) with interpretation in proper academic Indonesian, ready to paste into Bab IV.

**Health Check:**
```bash
curl https://academicai-production-a41d.up.railway.app/healthz
```
```json
{
  "status": "ok",
  "server": "AcademAI Universal Academic Engine",
  "discipline": "Universal Academic Research (Multi-Disciplinary)",
  "features": ["memory_context","pdf_parser","plagiarism_checker",
    "google_scholar","zotero_sync","full_generator",
    "citation_validator","academic_stats","dataviz_mcp"]
}
```

---

## Code

{% github yandri918/academic_ai %}

### Architecture: An Open-Source Agent Harness Wrapping Gemini

The core idea: a **fully open-source Node.js/Express agent harness** that orchestrates Google Scholar searches, session memory, and the Gemini API — with every non-LLM component being MIT-licensed and self-hostable.

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Vanilla HTML5 · CSS3 · ES2022)  — zero frameworks │
│  5 Tabs: Chat · Generator · Validator · Plagiarism · Stats  │
└──────────────────────┬──────────────────────────────────────┘
                       │  REST / JSON
┌──────────────────────▼──────────────────────────────────────┐
│  OPEN-SOURCE AGENT HARNESS (Node.js + Express)              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  DISCIPLINES Registry (12 academic fields)           │   │
│  │  Each has: persona · searchSuffix · theoryGuide     │   │
│  │           · methodGuide  ← all open-source config   │   │
│  └────────┬────────────────────────────────────────────┘   │
│           │  buildMasterAcademicPrompt(discipline, ...)     │
│  ┌────────▼──────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Google Gemini    │  │  Google    │  │  Zotero API  │  │
│  │  (partner API)    │  │  Scholar   │  │  auto-sync   │  │
│  │  4-model fallback │  │  SerpApi   │  │  references  │  │
│  └───────────────────┘  └────────────┘  └──────────────┘  │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │  Stats Engine        │  │  DataViz MCP Server          │ │
│  │  Paired t-Test       │  │  Chart.js · Mermaid          │ │
│  │  N-Gain (Hake 1999)  │  │  (both MIT licensed)         │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
│                                                             │
│  express-rate-limit: 30 req/10 min (anti-cost-explosion)   │
└─────────────────────────────────────────────────────────────┘
             Deployed via Dockerfile → Railway (free tier)
```

### The DISCIPLINES Registry — The Core Open-Source Contribution

This is the part I'm most proud of — and it's 100% open-source. A registry of 12 academic disciplines, each with a tailored AI persona, theoretical framework, and research methodology. **Zero cost. Zero dependency. Pure JavaScript object.**

When the user selects a discipline, the entire AI system prompt — persona, canonical theories, accepted methodologies — switches dynamically:

```javascript
// server.js — MIT licensed, fully open-source
const DISCIPLINES = {
  paud: {
    name: 'Pendidikan Anak Usia Dini (PAUD)',
    searchSuffix: 'pendidikan anak usia dini jurnal PAUD',
    persona: 'Co-Pilot Riset Skripsi S1 PAUD Terkemuka di Indonesia',
    theoryGuide: `
   - Piaget: Tahap Pra-operasional 2–7 tahun (berpikir simbolik, ZPD)
   - Vygotsky: Zone of Proximal Development, Scaffolding
   - Montessori: Prepared environment, auto-education, media sensorik
   - Ki Hajar Dewantara: Sistem Among, Tri Sentra Pendidikan
   - STPPA (Permendikbudristek No. 5/2022): 6 aspek perkembangan`,
    methodGuide: `
   - PTK model Kemmis & McTaggart: Planning→Acting→Observing→Reflecting
   - Rubrik PAUD: BB(1) / MB(2) / BSH(3) / BSB(4)
   - Ketuntasan klasikal target >= 75–80% BSH/BSB`
  },
  economics: {
    name: 'Ekonomi & Bisnis',
    searchSuffix: 'jurnal ekonomi bisnis manajemen keuangan',
    persona: 'Co-Pilot Riset Ilmu Ekonomi, Manajemen, Akuntansi...',
    theoryGuide: `Kotler & Keller, Jensen & Meckling, Porter's Five Forces...`,
    methodGuide: `SEM, SmartPLS, Regresi Berganda, Uji Asumsi Klasik...`
  },
  // + 10 more: general_academic, education, computer_science,
  //   engineering, health, law, psychology, social,
  //   agriculture, communication
};

// The magic: one function, 12 completely different AI personas
function buildMasterAcademicPrompt(discipline, citationFormat, extraContext) {
  const disc = DISCIPLINES[discipline] || DISCIPLINES['general_academic'];
  return `Anda adalah AcademAI — ${disc.persona}.

DISIPLIN ILMU AKTIF: ${disc.name}

${disc.theoryGuide}
${disc.methodGuide}

Format sitasi: ${citationFormat}
${extraContext}`;
}
```

### Open-Source Multi-Model Fallback Agent

When one Gemini model is overloaded, the harness automatically falls back — keeping the app alive for students at critical moments (like the night before a thesis deadline):

```javascript
// Fully open-source orchestration logic
const MODELS = [
  'gemini-2.0-flash-lite',   // fastest, cheapest
  'gemini-2.0-flash',        // balanced
  'gemini-2.5-flash',        // high quality
  'gemini-2.5-pro'           // maximum capability
];

async function callGemini(systemPrompt, userPrompt) {
  let lastError;
  for (const model of MODELS) {
    try {
      console.log(`[Gemini] Trying ${model}...`);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
          })
        }
      );
      if (res.ok) {
        const data = await res.json();
        return { text: data.candidates[0].content.parts[0].text, model };
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`All Gemini endpoints busy. ${lastError?.message}`);
}
```

### Statistics Engine — Fully Open-Source, No External Dependencies

The N-Gain calculator is pure JavaScript math — no libraries, no black boxes, no cost:

```javascript
app.post('/api/stats/calculate', async (req, res) => {
  const { pretest, posttest, maxScore, variableName } = req.body;

  const n = pretest.length;
  const diffs = pretest.map((pre, i) => posttest[i] - pre);
  const meanDiff = diffs.reduce((a, b) => a + b) / n;
  const variance = diffs.reduce((sum, d) => sum + (d - meanDiff) ** 2, 0) / (n - 1);
  const tStat = meanDiff / Math.sqrt(variance / n);
  const df = n - 1;

  const preAvg = pretest.reduce((a, b) => a + b) / n;
  const postAvg = posttest.reduce((a, b) => a + b) / n;
  const nGain = (postAvg - preAvg) / (maxScore - preAvg);
  const nGainCategory = nGain >= 0.7 ? 'Tinggi' : nGain >= 0.3 ? 'Sedang' : 'Rendah';

  // Generates ready-to-paste Indonesian academic prose for Bab IV
  const interpretation = generateAcademicInterpretation({
    variableName, tStat, df, nGain, nGainCategory, preAvg, postAvg
  });

  res.json({ tStat, df, nGain, nGainCategory, preAvg, postAvg, interpretation });
});
```

---

## How I Built It

### Dual-Engine Architecture: Cloud Accessibility + Open-Weight Local Inference

AcademAI supports two deployment modes:
1. **Production Web (Cloud)**: Node.js/Express agent harness wrapping **Google Gemini** (with a 4-model fallback chain) — designed for students with older laptops or mobile phones.
2. **Local / Privacy-First (Open-Weight)**: An exportable agent workflow (`n8n/academ_ai_workflow_gemma.json`) running **Google Gemma 2 (9B)** locally via Ollama + Semantic Scholar API — 100% offline, zero data sent to external servers.

| Layer | Tool | Type / License |
|-------|------|----------------|
| **Open-Weight LLM** | Google Gemma 2 (9B via Ollama) | Open-Weight Model |
| **Cloud LLM (Partner)** | Google Gemini API (Flash Lite / Flash / Pro) | Partner Category (Free Tier) |
| **Agent Harness** | Node.js + Express | MIT (100% Open Source) |
| **Visual Workflow Engine**| n8n LangChain Agent Workflows | Fair-code / Open Workflow |
| **Frontend** | Vanilla HTML5 / CSS3 / ES2022 | MIT (Zero build tools) |
| **Academic Search** | SerpApi (Google Scholar) + Semantic Scholar API | Open/Freemium APIs |
| **Citation Validator** | RegEx parser + Cross-database validator | MIT (Pure JS) |
| **Stats Engine** | Paired t-Test & Hake's N-Gain calculator | MIT (Pure JS, zero deps) |
| **Data Visualization** | Chart.js · Mermaid.js | MIT |
| **Containerization** | Docker (`node:20-alpine`) | Apache 2.0 |
| **Deployment** | Railway | Free tier cloud deployment |

### The Build Story — From PAUD to Universal

My wife is completing her **S1 PAUD** thesis on play-based learning methods and their effect on children's motor and cognitive development. She needed to:
- Cite 15+ journals (Piaget, Vygotsky, STPPA Permendikbudristek No. 5/2022) in APA 7th format
- Interpret N-Gain scores from her classroom action research (PTK — Penelitian Tindakan Kelas)
- Keep Turnitin similarity below 15%
- Write a full Bab I–V document, including a rubric using the BB/MB/BSH/BSB national PAUD standard

Every evening I saw the same frustration: AI tools that fabricated Piaget citations, paywalled journals, and statistical output she couldn't translate into academic Indonesian. So I built her a tool.

**Phase 1**: Simple Express server + Gemini, system prompt hardcoded for PAUD (Piaget, Vygotsky, STPPA, PTK methodology, BB/MB/BSH/BSB rubric).

**Phase 2**: Added Google Scholar grounding — every AI response is now anchored in real papers. Added Citation Validator — cross-references every detected APA citation against academic indices.

**Phase 3**: Realized: *if this helps my wife, it could help any student.* Refactored the single hardcoded PAUD prompt into the **DISCIPLINES registry** — 12 disciplines, each with its own persona, theories, and methodology. PAUD is still #1. Eleven more joined it.

**Phase 4**: Added open-weight local inference option using **Google Gemma 2 (9B)** via Ollama in an n8n visual agent workflow (`/n8n/academ_ai_workflow_gemma.json`) for users needing offline privacy.

**Phase 5**: Statistics Engine (PTK Paired t-Test + N-Gain), DOCX exporter, DataViz MCP Server, rate limiting, Docker containerization, and Railway deployment.

### Challenges Overcome

**🔴 AI hallucinating citations**: Every response is grounded in real Google Scholar / Semantic Scholar results injected as context. The Citation Validator then post-processes the output, flagging anything unverified.

**🔴 PAUD-only bias**: Original prompt was perfectly tuned for my wife's needs, but useless for anyone else. The DISCIPLINES registry solved this — now the entire AI context switches dynamically across 12 faculties.

**🔴 Hardware inequality**: Open-weight models are amazing, but running 9B+ parameters locally requires 12GB+ RAM/VRAM. My wife's 5-year-old laptop couldn't handle it. That's why we built a hybrid system: lightweight web client on Gemini for low-end devices, plus a local Gemma 2 workflow for privacy-conscious users with GPUs.

**🔴 Cost explosion risk**: Added `express-rate-limit` (30 requests per 10 minutes per IP). Even during high hackathon traffic, the Gemini API stays well within free quotas.

---

## Why Does Open Innovation Matter?

### Addressing the Core Question: Open-Weight Models vs. Partner APIs

The Hacktoberfest challenge specifically explores how open-source AI empowers builders. Here is our honest, practical philosophy behind AcademAI:

**1. Open-Source Agent Harnesses Democratize Capability**
The real intellectual property of AcademAI isn't a proprietary model — it is the **open-source orchestration logic**:
- The **DISCIPLINES Registry**: 12 modular academic frameworks that transform general LLMs into rigorous academic supervisors.
- The **Citation Validator**: A standalone algorithm that parses APA/DOI citations and audits them against open academic databases.
- The **Statistics Engine**: Pure, dependency-free JavaScript computing Paired t-Tests and Hake (1999) N-Gains with automated Indonesian pedagogical prose.

Because this harness is 100% open-source (MIT), anyone can swap the backend in minutes — whether pointing to Gemini, Claude, OpenAI, or a local **Gemma 2 / Llama 3** instance.

**2. Open-Weight Innovation (Gemma 2)**
For institutions, researchers, or students working with sensitive empirical data (e.g., student assessment scores, confidential survey answers), we built the **Gemma 2 edition** (`n8n/academ_ai_workflow_gemma.json`). Google's open-weight Gemma 2 model can be run entirely air-gapped on consumer hardware via Ollama. No subscription, no telemetry, no leaks.

**3. Pragmatic Inclusivity for Indonesian Students**
Indonesia has **8 million university students**, the vast majority studying on budget laptops or mobile phones without dedicated GPUs. If an academic tool *strictly* required running an open-weight model locally, 90% of students would be excluded. 

By combining:
- A completely open, forkable codebase (MIT),
- An open-weight pipeline (Gemma 2), and
- A cloud deployment powered by Google Gemini's generous free tier,

AcademAI proves that open innovation isn't just about model weights — it's about eliminating gatekeeping so that a student in Banyumas, Surabaya, or Jayapura has the exact same research firepower as an Ivy League scholar.

---

## My Agent Session

AcademAI was built with the help of **Antigravity IDE** (Google DeepMind's agentic coding assistant). The session involved:

- Iteratively refactoring `server.js` from a PAUD-only hardcoded app into a 12-discipline universal academic engine
- Real-time debugging of the multi-model Gemini fallback chain
- Live deployment verification via Railway CLI (`railway up --detach`)
- Each feature built, tested, and deployed incrementally: citation validator → statistics engine → plagiarism checker → DISCIPLINES registry

---

## Prize Categories

- **🤖 Google Gemini**: Built on Google Gemini API with a 4-model fallback chain (Flash Lite → Flash → Flash 2.5 → Pro 2.5) and a fully open-source discipline-aware prompt engineering layer
- **🏆 Best Open Source Tool**: MIT-licensed agent harness, DISCIPLINES registry, Statistics Engine, and full frontend — forkable, self-hostable, and adaptable to any university format in the world

---

> **Deadline**: Submissions close October 5, 2026 at 6:59 AM UTC

---

*Built with ❤️ for my wife — and every student in Indonesia staring at a blank thesis document at 2am.*

**GitHub**: https://github.com/yandri918/academic_ai
**Live Demo**: https://academicai-production-a41d.up.railway.app
