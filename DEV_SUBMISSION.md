---
title: "AcademAI — An Open-Source Academic Co-Pilot I Built for My Wife's S1 PAUD Thesis"
published: true
tags: hacktoberfest, ai, opensource, webdev
description: "A lightweight, standalone open-source agent harness built with Node.js and Google Gemini to help my wife complete her early childhood education (S1 PAUD) undergraduate thesis."
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

## What I Built

<!-- What does it do, and who is the friend or loved one you built it for?  What problem does it solve for them? -->

I built **AcademAI** for someone very close to my heart: **my wife**. 

She is currently finishing her undergraduate thesis in **S1 PAUD (Pendidikan Anak Usia Dini — Early Childhood Education)** in Indonesia while managing our home and daily family life. Every evening, I would sit beside her at the kitchen table and watch her struggle with the overwhelming friction of academic writing:

- **AI Hallucinations**: General AI chatbots repeatedly hallucinated scientific literature — inventing non-existent papers attributed to Jean Piaget, Lev Vygotsky, and Maria Montessori.
- **Painful Citation Cross-Checking**: Verifying whether citations were genuine and formatted properly in APA 7th took hours of manual cross-referencing across journals.
- **Lack of Local Pedagogical Context**: Commercial AI tools had zero understanding of Indonesian national early childhood education frameworks, such as **STPPA (Permendikbudristek No. 5/2022)** or the standard developmental assessment rubrics (**BB / MB / BSH / BSB**).
- **Classroom Action Research (PTK) Statistics**: In her action research, computing paired sample t-tests and Hake's Normalized Gain (**N-Gain**), then translating numeric output into formal Indonesian academic prose for Chapter IV (Bab IV) was a constant source of stress.
- **Turnitin Anxiety**: Meeting strict university plagiarism thresholds (<15%) required exhausting manual structural paraphrasing.

### What AcademAI Does to Solve This

**AcademAI** is an open-source, multi-disciplinary academic research and writing co-pilot:

1. **Grounding in Real Scientific Literature**: Rather than letting the LLM invent sources, AcademAI performs real-time queries against **Google Scholar**, grounding generated text in verified, indexed publications.
2. **Automated Citation Validator**: A built-in auditing engine parses in-text citations and DOI links, cross-checking them against scholarly databases and outputting clear verification badges (`VALID`, `PARTIAL`, or `INVALID`).
3. **Zero-Dependency Statistics Engine**: Computes Paired t-Tests and Hake (1999) N-Gain categories (`Tinggi`, `Sedang`, `Rendah`) from raw pretest/posttest scores and automatically generates publishable Indonesian academic analysis ready to insert into Bab IV.
4. **Academic Paraphrasing & Plagiarism Auditor**: Employs syntactic nominalization and passive-voice academic transformations to safely lower Turnitin similarity while preserving original scientific meaning.
5. **From PAUD to 12 Disciplines**: While born out of my wife's PAUD thesis, I open-sourced the underlying **DISCIPLINES Registry** with 12 distinct academic faculties (PAUD, Education, Economics, Law, Health, Computer Science, Engineering, Psychology, Agriculture, etc.), empowering any university student to conduct rigorous research.

---

## Demo

<!-- Share a deployed link or a video demo. -->

- 🌐 **Live Web Application**: [https://academicai-production-a41d.up.railway.app](https://academicai-production-a41d.up.railway.app)
- 📡 **Live Health Endpoint**: [https://academicai-production-a41d.up.railway.app/healthz](https://academicai-production-a41d.up.railway.app/healthz)

### How to Explore the 5 Dedicated Academic Modules:

1. **Tab 1 — Chat & Drafting**: Select **Pendidikan Anak Usia Dini (PAUD)** or any of the 12 disciplines, choose your research workflow (*Drafting, Systematic Literature Review, Proposal, Abstract, or Statistics*), and ask a question. Notice how every output cites real, indexed papers retrieved on the fly.
2. **Tab 2 — Full Thesis Generator**: Input a thesis topic (e.g., *"Efektivitas Media Loose Parts terhadap Kemampuan Berpikir Kritis Anak Usia 5-6 Tahun"*). AcademAI produces a complete 5-chapter draft with a bilingual abstract, theoretical framework, research synthesis matrix, and APA 7th bibliography.
3. **Tab 3 — Citation Validator**: Paste any academic paragraph containing in-text citations (such as `(Piaget, 1976)` or `(Sujiono, 2021)`) to receive an instant line-by-line validation audit (`VALID`, `PARTIAL`, or `INVALID`).
4. **Tab 4 — Plagiarism Auditor**: Paste existing text to inspect potential similarity hotspots and generate Turnitin-compliant academic paraphrasing.
5. **Tab 5 — Statistics Engine**: Enter classroom pretest and posttest scores to compute Paired Sample t-Tests, degrees of freedom, and Hake (1999) N-Gain categories, accompanied by formal Indonesian academic prose ready for Bab IV.

**Health Check Verification:**
```bash
curl -s https://academicai-production-a41d.up.railway.app/healthz
```

```json
{
  "status": "ok",
  "server": "AcademAI Universal Academic Engine",
  "discipline": "Universal Academic Research (Multi-Disciplinary)",
  "features": [
    "memory_context",
    "pdf_parser",
    "plagiarism_checker",
    "google_scholar",
    "zotero_sync",
    "full_generator",
    "citation_validator",
    "academic_stats",
    "dataviz_mcp"
  ],
  "models": [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.7-flash",
    "gemini-3.8-flash"
  ]
}
```

---

## Code

<!-- Show us the code!  You can embed a GitHub repo directly into your post. -->

{% github yandri918/academic_ai %}

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│     Client Layer: Vanilla HTML5 · CSS3 · ES2022 (Zero Build)     │
│   5 Academic Tabs: Chat · Generator · Validator · Plag · Stats   │
└────────────────────────────────┬────────────────────────────────┘
                                 │ REST API
┌────────────────────────────────▼────────────────────────────────┐
│      OPEN-SOURCE AGENT HARNESS (Standalone Node.js / Express)   │
│                                                                 │
│   ┌────────────────────────────────────────────────────────┐    │
│   │  DISCIPLINES Registry (12 Faculties, MIT License)       │    │
│   │  Dynamic Personas · Theory Guides · Methodology Models │    │
│   └────────────────────────────┬───────────────────────────┘    │
│                                │                                │
│        ┌───────────────────────┼────────────────────────┐       │
│        ▼                       ▼                        ▼       │
│ ┌───────────────┐     ┌─────────────────┐     ┌───────────────┐ │
│ │ Google Gemini │     │ Google Scholar  │     │  Zotero REST  │ │
│ │ 4-Model Chain │     │ & SerpApi Index │     │  Auto-Sync    │ │
│ └───────────────┘     └─────────────────┘     └───────────────┘ │
│                                                                 │
│ ┌─────────────────────────────┐   ┌───────────────────────────┐ │
│ │ Pure-JS Statistics Engine   │   │ RegEx Citation Validator  │ │
│ │ Paired t-Test · Hake N-Gain │   │ APA7 / CrossRef Checker   │ │
│ └─────────────────────────────┘   └───────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────┐   ┌───────────────────────────┐ │
│ │ Persistent Document Memory  │   │ DOCX Academic Exporter    │ │
│ │ Local JSON Session Storage  │   │ Formatted Word Packaging  │ │
│ └─────────────────────────────┘   └───────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
             Deployed via Dockerfile → Railway Cloud
```

### Core Code Snippet: The 12-Discipline Prompt Orchestrator

The foundational open-source component in `server.js` is the modular `DISCIPLINES` registry, which switches scientific personas and research methodologies on the fly:

```javascript
// server.js (MIT Licensed)
const DISCIPLINES = {
  paud: {
    name: 'Pendidikan Anak Usia Dini (PAUD)',
    searchSuffix: 'pendidikan anak usia dini jurnal PAUD',
    persona: 'Co-Pilot Riset Skripsi S1 PAUD dan Ilmu Keguruan Anak Usia Dini Terkemuka di Indonesia',
    theoryGuide: `Teori Pokok: Piaget (Pra-operasional 2–7 tahun), Vygotsky (ZPD & Scaffolding), 
Montessori (Prepared environment, media sensorik), Ki Hajar Dewantara (Sistem Among), 
STPPA (Permendikbudristek No. 5/2022: 6 Aspek Perkembangan).`,
    methodGuide: `Metodologi: PTK model Kemmis & McTaggart (Planning, Acting, Observing, Reflecting), 
Rubrik Standar: BB(1), MB(2), BSH(3), BSB(4). Target ketuntasan klasikal >= 75-80%.`
  },
  // + 11 other faculties: education, economics, law, computer_science, engineering, health, etc.
};

function buildMasterAcademicPrompt(discipline, citationFormat, extraContext) {
  const disc = DISCIPLINES[discipline] || DISCIPLINES['general_academic'];
  return `Anda adalah AcademAI — ${disc.persona}.
DISIPLIN ILMU AKTIF: ${disc.name}

${disc.theoryGuide}
${disc.methodGuide}

Format Sitasi Wajib: ${citationFormat}
${extraContext}`;
}
```

### Pure JavaScript Statistics & N-Gain Calculation

```javascript
// server.js — Zero external statistical dependencies
app.post('/api/stats/calculate', (req, res) => {
  const { pretest, posttest, maxScore = 100, variableName = 'Variabel Penelitian' } = req.body;
  const n = pretest.length;

  const diffs = pretest.map((pre, i) => posttest[i] - pre);
  const meanDiff = diffs.reduce((a, b) => a + b, 0) / n;
  const variance = diffs.reduce((sum, d) => sum + Math.pow(d - meanDiff, 2), 0) / (n - 1);
  const standardError = Math.sqrt(variance / n);
  const tStat = standardError === 0 ? 0 : meanDiff / standardError;
  const df = n - 1;

  const preAvg = pretest.reduce((a, b) => a + b, 0) / n;
  const postAvg = posttest.reduce((a, b) => a + b, 0) / n;
  const nGain = (maxScore - preAvg === 0) ? 0 : (postAvg - preAvg) / (maxScore - preAvg);
  const nGainCategory = nGain >= 0.7 ? 'Tinggi' : nGain >= 0.3 ? 'Sedang' : 'Rendah';

  res.json({
    success: true,
    tStat: tStat.toFixed(4),
    df,
    nGain: nGain.toFixed(4),
    nGainPercent: (nGain * 100).toFixed(2) + '%',
    nGainCategory,
    preAvg: preAvg.toFixed(2),
    postAvg: postAvg.toFixed(2),
    interpretation: generateAcademicProse({ variableName, tStat, df, nGain, nGainCategory, preAvg, postAvg })
  });
});
```

---

## How I Built It

<!-- Which open-source AI did you use (open-weight models, agent harnesses, frameworks, local inference), and how is your project built around it? -->

To build a reliable academic co-pilot for my wife without forcing her to use clunky software or pay steep monthly subscriptions, I engineered AcademAI as a **lightweight, standalone open-source agent harness built with Node.js and Express** (`server.js`), powered by **Google Gemini** (with a 4-tier model fallback chain).

### 1. The Open-Source Agent Harness (`server.js`)
Instead of relying on heavy visual workflow engines that consume massive server memory, AcademAI runs as a single, ultra-fast Node.js service (MIT License):

- **Modular DISCIPLINES Registry**: An open-source routing engine containing 12 distinct academic faculties. When a student chooses a discipline, the harness dynamically injects the appropriate scientific theories and empirical methodologies into the prompt context.
- **Dynamic Research Grounding**: Before sending any request to the LLM, the harness queries Google Scholar via SerpApi for recent peer-reviewed literature. It injects these authentic findings directly into the prompt context so the AI never hallucinates citations.
- **Automated Citation Validator**: A custom RegEx engine that audits in-text citations (such as `(Piaget, 1976)` or `(Sujiono, 2021)`) and DOI links against Google Scholar results, labeling each reference as `VALID`, `PARTIAL`, or `INVALID`.
- **Pure JavaScript Statistics Engine**: Computes classroom action research (PTK) statistics — including Paired Sample t-Tests and Hake (1999) Normalized Gain (**N-Gain**) — using pure math with zero external libraries. It outputs ready-to-paste formal Indonesian academic prose for Chapter IV (Bab IV).
- **Session Memory Persistence**: Stores session context locally on disk (`./data/memory.json`) so students can iteratively build their thesis across multiple days without losing research state.
- **Academic DOCX Exporter**: Converts structured Markdown chapters into formatted Microsoft Word (`.docx`) files using the open-source `docx` npm library.

### 2. The AI Engine: Google Gemini 4-Model Fallback Chain
We utilize the official **Google Gemini API** (an official Hacktoberfest challenge partner) for its state-of-the-art academic prose and generous free tier:
- `gemini-3.1-flash-lite`: Ultra-low latency for quick inquiries and definitions.
- `gemini-3.5-flash-lite`: Efficient reasoning for literature synthesis.
- `gemini-3.7-flash`: Balanced speed and academic writing depth.
- `gemini-3.8-flash`: Highest quality for comprehensive 5-chapter thesis generation.

If one model encounters a rate limit or server load, the harness automatically cascades to the next tier without interrupting the student's writing flow.

---

## Why Does Open Innovation Matter?

<!-- Why does open innovation matter for what you built?  What did it make possible that a closed API wouldn't? -->

### 1. Inclusion Over Gatekeeping: Supporting Developing World Students
There are over **8 million university students across Indonesia**. Most students in regional universities study on 5-to-8-year-old budget laptops or smartphones. 
- Closed, proprietary academic AI tools charge **$20 to $30 per month** — completely prohibitive for students in developing nations.
- At the same time, forcing students to run massive multi-gigabyte models locally would exclude my wife and millions like her whose hardware cannot run heavy models without overheating.
- **Open innovation bridged this divide**: by combining a clean, open-source MIT-licensed agent harness, open academic search APIs (Google Scholar / SerpApi), and Gemini's generous free-tier API, we delivered enterprise-grade research tooling at **zero cost** to the end user.

### 2. Modularity & Zero Vendor Lock-In
Because AcademAI's agent harness, prompt routing, and validation logic are 100% open-source in `server.js`, the project is completely decoupled from any single LLM provider:
- Anyone can clone the repository, install dependencies via `npm install`, and start it with `npm start`.
- The open architecture allows developers to easily swap or extend the LLM backend to any provider with minimal code adjustments.

### 3. Transparent, Verifiable Academic Rigor
In academic research, black-box AI is dangerous because it fabricates truth. Open innovation allowed us to write transparent algorithms for citation validation and statistical analysis. Students and academic advisors can inspect every formula, prompt rule, and validation check directly on GitHub.

---

## My Agent Session

<!-- Optional, but judges love it.  Save your session with DevRelay and embed it with the agent_session tag (see the challenge page), or link to it. -->

AcademAI was engineered with the assistance of **Antigravity IDE** (Google DeepMind's agentic pair-programming system). 

Throughout the session, the agent and I:
- Consolidated the application into a single, clean, standalone `server.js` agent harness to maximize performance and simplify deployment.
- Refactored the core logic into a universal multi-disciplinary academic engine supporting 12 faculties.
- Built and tested the zero-dependency statistical calculation engine for Classroom Action Research (PTK) and Hake's N-Gain formulas.
- Implemented real-time citation extraction and verification algorithms.
- Packaged the application with Docker and verified the live cloud deployment on Railway with automated `/healthz` monitoring.

---

## Prize Categories

<!-- Which partner categories are you entering?  List every one that applies, or remove this section. -->

- **Google Gemini**: AcademAI is powered by the Google Gemini API, utilizing a 4-tier model fallback chain (`gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.7-flash`, and `gemini-3.8-flash`) combined with an open-source prompt routing engine tailored for academic research.
- **Best Open Source Tool**: The entire agent harness (`server.js`), 12-discipline prompt registry, citation verification engine, statistics calculator, and vanilla web frontend are 100% MIT-licensed, completely standalone, and freely available for students and educators worldwide.

<!-- Team Submissions: Please pick one member to publish the submission and credit teammates by listing their DEV usernames directly in the body of the post. -->

<!-- Thanks for participating! -->
