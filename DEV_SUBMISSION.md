---
title: "AcademAI — An Open-Source Academic Co-Pilot I Built for My Wife's S1 PAUD Thesis"
published: true
tags: hacktoberfest, ai, opensource, webdev
description: "A dual-engine academic co-pilot built with an open-source agent harness, Google Gemma 2 (open-weight), and Google Gemini fallback to help my wife complete her early childhood education thesis."
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

## What I Built

<!-- What does it do, and who is the friend or loved one you built it for?  What problem does it solve for them? -->

I built **AcademAI** for someone very close to my heart: **my wife**. 

She is currently completing her undergraduate degree in **S1 PAUD (Pendidikan Anak Usia Dini — Early Childhood Education)** in Indonesia while also managing our home and daily life. Every evening, I watched her sit at the kitchen table overwhelmed by the sheer friction of academic writing:
1. **AI Hallucinations**: Generic AI models constantly fabricated academic references (e.g., inventing non-existent papers by Jean Piaget and Lev Vygotsky).
2. **Citation Auditing**: Cross-checking citations against genuine journal indices was taking hours of manual work.
3. **Complex Local Standards**: Global AI tools knew nothing about Indonesia's early childhood curriculum standards (STPPA Permendikbudristek No. 5/2022) or national PAUD developmental rubrics (**BB / MB / BSH / BSB**).
4. **Action Research Statistics**: In Classroom Action Research (PTK), calculating paired t-tests and Hake's normalized gain (**N-Gain**) and translating them into academic Indonesian prose caused constant anxiety.
5. **Turnitin Anxiety**: Keeping similarity scores under university-mandated thresholds (<15%) required laborious structural sentence paraphrasing.

### What AcademAI Does
**AcademAI** is an open-source, full-stack academic research and writing co-pilot:
- **Grounds AI in Real Scholarly Papers**: Injects live Google Scholar and Semantic Scholar search results into the prompt context to prevent hallucinated citations.
- **Automated Citation Validator**: A RegEx engine that parses APA 7th / DOI citations and verifies them against open scientific databases (marking items as `VALID`, `PARTIAL`, or `INVALID`).
- **Zero-Dependency Statistics Engine**: Computes Paired t-Tests and Hake (1999) N-Gain scores and outputs publishable Indonesian academic interpretation ready for Chapter IV (Bab IV).
- **Turnitin-Safe Academic Paraphraser**: Applies syntactic nominalization and passive academic transformations to lower similarity scores.
- **Universal Multi-Disciplinary Architecture**: While originally built for my wife's PAUD research, it includes an open **DISCIPLINES Registry** covering **12 academic faculties** (Education, Economics, Law, Health, Computer Science, Engineering, Psychology, Agriculture, etc.).

---

## Demo

<!-- Share a deployed link or a video demo. -->

- 🌐 **Live Web Application**: [https://academicai-production-a41d.up.railway.app](https://academicai-production-a41d.up.railway.app)
- 📡 **Live Health Check**: [https://academicai-production-a41d.up.railway.app/healthz](https://academicai-production-a41d.up.railway.app/healthz)

### How to Explore the Live Demo:
1. **Chat & Drafting (Tab 1)**: Select **Pendidikan Anak Usia Dini (PAUD)** or any of the 12 disciplines, choose a research mode (Drafting, SLR, Proposal, Abstract, or Statistics), and ask a question. Notice how every output cites verified papers retrieved on the fly.
2. **Full Thesis Generator (Tab 2)**: Enter a research topic to generate a comprehensive 5-chapter thesis draft with bilingual abstract, theoretical framework, research matrix, and APA references.
3. **Citation Validator (Tab 3)**: Paste any paragraph containing in-text citations (e.g., `(Piaget, 1976)` or `(Sujiono, 2021)`) to receive an instant verification report.
4. **Plagiarism Auditor (Tab 4)**: Audit paragraphs and generate Turnitin-compliant academic paraphrases.
5. **Statistics Engine (Tab 5)**: Input classroom pretest and posttest scores to generate instant paired t-test results, N-Gain calculations, and formal academic analysis for Bab IV.

```bash
# Verify the live production deployment
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

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│     Client Layer: Vanilla HTML5 · CSS3 · ES2022 (Zero Build)     │
│   5 Academic Tabs: Chat · Generator · Validator · Plag · Stats   │
└────────────────────────────────┬────────────────────────────────┘
                                 │ REST API
┌────────────────────────────────▼────────────────────────────────┐
│             OPEN-SOURCE AGENT HARNESS (Node.js/Express)          │
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
│ │ 4-Model Chain │     │ & Semantic APIs │     │  Auto-Sync    │ │
│ └───────────────┘     └─────────────────┘     └───────────────┘ │
│                                                                 │
│ ┌─────────────────────────────┐   ┌───────────────────────────┐ │
│ │ Pure-JS Statistics Engine   │   │ RegEx Citation Validator  │ │
│ │ Paired t-Test · Hake N-Gain │   │ APA7 / CrossRef Checker   │ │
│ └─────────────────────────────┘   └───────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │ Alternative Workflow
┌────────────────────────────────┴────────────────────────────────┐
│    LOCAL OPEN-WEIGHT ENGINE: n8n LangChain Visual Workflow      │
│     Running Google Gemma 2 (9B via Ollama) 100% Offline         │
│             (/n8n/academ_ai_workflow_gemma.json)                │
└─────────────────────────────────────────────────────────────────┘
```

### Core Code Snippet: The 12-Discipline Prompt Orchestrator

The foundational open-source component is the modular `DISCIPLINES` registry, which injects specialized scientific theories and research methodologies dynamically into the agent prompt:

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
  // 11 other faculties: education, economics, law, computer_science, engineering, health, etc.
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

---

## How I Built It

<!-- Which open-source AI did you use (open-weight models, agent harnesses, frameworks, local inference), and how is your project built around it? -->

To solve my wife's challenge without locking her into an expensive proprietary ecosystem, I architected AcademAI around a **dual-engine approach**:

### 1. Open-Weight AI & Local Inference: Google Gemma 2 (9B)
For users requiring complete data privacy (e.g., handling confidential field data, student assessments, or unpublished research), I built an exportable agent workflow using **Google Gemma 2 (9B)** running locally via **Ollama**:
- **Workflow File**: [`n8n/academ_ai_workflow_gemma.json`](https://github.com/yandri918/academic_ai/blob/main/n8n/academ_ai_workflow_gemma.json)
- **Harness**: n8n visual agent workflow powered by LangChain memory buffers and code nodes.
- **Inference**: 100% local, air-gapped, zero telemetry.
- **Integration**: Connected to the open **Semantic Scholar API** for live peer-reviewed journal retrieval.

### 2. Open-Source Agent Harness: Node.js / Express
For everyday accessibility on lightweight devices, I built a custom, framework-independent agent harness in Node.js (MIT License):
- **Live Search Grounding**: Integrates live Google Scholar and Semantic Scholar search results into the prompt context before inference.
- **Intelligent Fallback Chain**: Features an automated multi-model cascade with Google Gemini (`gemini-3.1-flash-lite` → `gemini-3.5-flash-lite` → `gemini-3.7-flash` → `gemini-3.8-flash`) to ensure zero downtime during traffic spikes or rate limits.
- **Pure JavaScript Statistics Engine**: Calculates sample mean differences, pooled variances, degrees of freedom, t-statistics, and Hake (1999) normalized gain categories (`Tinggi`, `Sedang`, `Rendah`) without any third-party dependencies.
- **Document Exporter**: Compiles structured Markdown research chapters into formatted `.docx` files via the open-source `docx` library.
- **Containerized Deployment**: Packaged in an Alpine Linux Docker container (`node:20-alpine`) deployed to Railway.

---

## Why Does Open Innovation Matter?

<!-- Why does open innovation matter for what you built?  What did it make possible that a closed API wouldn't? -->

### 1. Inclusion Over Gatekeeping: Supporting Developing World Students
There are over **8 million university students across Indonesia**. Most students in regional universities study on 5-to-8-year-old budget laptops or smartphones. 
- Closed, proprietary academic AI tools charge **$20 to $30 per month** — completely prohibitive for students in developing nations.
- At the same time, forcing students to rely *strictly* on local open-weight inference would exclude my wife and millions like her whose hardware cannot run a 7B or 9B model without overheating.
- **Open innovation bridged this divide**: by combining an open-source MIT-licensed agent harness, open academic search APIs (Semantic Scholar / Google Scholar), and Gemini's generous free-tier API, we delivered enterprise-grade research tooling at **zero cost** to the end user.

### 2. Modularity & Zero Vendor Lock-In
Because AcademAI's agent harness, prompt routing, and validation logic are 100% open-source, the project is completely decoupled from any single LLM provider:
- A user can run it completely offline with **Google Gemma 2** on Ollama.
- A user can deploy it to the cloud using **Google Gemini**.
- Anyone can fork the repository and plug in Llama 3, Mistral, or a self-hosted vLLM instance by changing a single endpoint function.

### 3. Transparent, Verifiable Academic Rigor
In academic research, black-box AI is dangerous because it fabricates truth. Open innovation allowed us to write transparent algorithms for citation validation and statistical analysis. Students and academic advisors can inspect every formula, prompt rule, and validation check directly on GitHub.

---

## My Agent Session

<!-- Optional, but judges love it.  Save your session with DevRelay and embed it with the agent_session tag (see the challenge page), or link to it. -->

AcademAI was engineered with the assistance of **Antigravity IDE** (Google DeepMind's agentic pair-programming system). 

Throughout the session, the agent and I:
- Transformed an initial single-file prototype into a multi-disciplinary academic engine supporting 12 faculties.
- Built and debugged the zero-dependency statistical calculation engine for Classroom Action Research (PTK) and Hake's N-Gain formulas.
- Implemented real-time citation extraction and verification algorithms.
- Configured Docker packaging and deployed the service live to Railway with automated health checks.

---

## Prize Categories

<!-- Which partner categories are you entering?  List every one that applies, or remove this section. -->

- **Google Gemini**: AcademAI integrates Google Gemini via a smart 4-tier model fallback chain (`gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.7-flash`, and `gemini-3.8-flash`) combined with the open-weight **Google Gemma 2** model for offline privacy workflows.
- **Best Open Source Tool**: The entire agent harness, 12-discipline prompt registry, citation verification engine, statistics calculator, and vanilla web interface are 100% MIT-licensed, modular, and freely reproducible by students and educators worldwide.

<!-- Team Submissions: Please pick one member to publish the submission and credit teammates by listing their DEV usernames directly in the body of the post. -->

<!-- Thanks for participating! -->
