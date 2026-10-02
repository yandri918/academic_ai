---
title: "AcademAI — An Open-Source Research Companion Built for My Wife's PAUD Thesis"
published: true
tags: hacktoberfest, ai, opensource, webdev
description: "Helping students find traceable sources, understand their data, and develop research drafts they can review and defend. Powered by Google Gemma & SerpApi."
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

## What I Built

<!-- What does it do, and who is the friend or loved one you built it for?  What problem does it solve for them? -->

I built **AcademAI** for someone very close to my heart: **my wife**.

She is currently completing her undergraduate thesis in **S1 PAUD (Pendidikan Anak Usia Dini — Early Childhood Education)** in Indonesia while also managing our home and daily family life. Her research investigates how natural loose-parts media affects fine motor development in children aged 5–6 years.

Every evening, I would sit beside her at our kitchen table and watch the real, human friction of academic research:

1. **The Fear of Fabricated Sources**: General AI assistants frequently invent scientific literature. When she asked for early childhood learning frameworks, chatbots confidently generated non-existent papers attributed to Jean Piaget, Lev Vygotsky, and Maria Montessori.
2. **Disconnection from Local Curriculum Standards**: Global AI models have no working knowledge of Indonesian statutory early childhood frameworks, particularly **STPPA (Permendikbudristek No. 5/2022)** or the national developmental rubrics (**BB** = *Belum Berkembang*, **MB** = *Mulai Berkembang*, **BSH** = *Berkembang Sesuai Harapan*, **BSB** = *Berkembang Sangat Baik*).
3. **Translating Classroom Statistics into Academic Prose**: In her Classroom Action Research (PTK — *Penelitian Tindakan Kelas*), computing paired sample t-tests and Hake's Normalized Gain (**N-Gain**), then articulating what those numbers actually mean in formal Indonesian academic prose for Chapter IV (Bab IV), was a constant bottleneck.
4. **Drafting Anxiety and Revision Fatigue**: Staring at a blank document trying to structure an inverted-pyramid background (*Latar Belakang*) while juggling household duties drained her energy.

### What AcademAI Does

**AcademAI** is an open-source research companion designed to keep the student firmly in control while removing mechanical roadblocks:

- **Traceable Literature Search via SerpApi**: Searches Google Scholar in real time for genuine, peer-reviewed articles and supplies verified titles, authors, and links so the student can inspect the original text before citing it.
- **Citation Format & Metadata Inspection**: Audits in-text citations (APA 7th) and DOI identifiers against retrieved paper metadata to help students catch misattributed quotes or missing publication years.
- **PTK Statistics & Interpretation**: Takes raw pretest and posttest developmental assessment scores, calculates Paired Sample t-Tests and Hake (1999) N-Gain categories (`Tinggi`, `Sedang`, `Rendah`), and generates a transparent narrative draft explaining the pedagogical implications for Bab IV.
- **Academic Restructuring & Paraphrasing**: Provides syntactic transformations (such as nominalization and formal impersonal passive voice) to help students convey their own arguments clearly and maintain formal academic tone.
- **Modular Knowledge Framework**: Built and tested primarily around my wife's PAUD research, with an extensible **DISCIPLINES Registry** that provides foundational theory templates for 11 other faculties (Education, Economics, Law, Health, Computer Science, etc.).

> *"Having an assistant that actually finds real Indonesian journals and explains what my pretest-posttest N-Gain scores mean in proper academic wording saved me hours of second-guessing at night."*  
> — **My wife**, testing the first working draft of AcademAI.

---

## Demo

<!-- Share a deployed link or a video demo. -->

- 🌐 **Live Web Application**: [https://academicai-production-a41d.up.railway.app](https://academicai-production-a41d.up.railway.app)
- 📡 **Live Health Endpoint**: [https://academicai-production-a41d.up.railway.app/healthz](https://academicai-production-a41d.up.railway.app/healthz)

### The Five-Step Research Flow (Demonstrated in Early Childhood Education)

To see how the application works in practice, follow this real research flow:

1. **Step 1: Enter Topic & Friction Point (Tab 1 — Chat)**  
   Select **Pendidikan Anak Usia Dini (PAUD)**. Enter the research question: *"Bagaimana pemanfaatan media loose parts berbasis alam untuk menstimulasi motorik halus anak usia 5-6 tahun?"*
2. **Step 2: Inspect Traceable Literature**  
   AcademAI queries Google Scholar via **SerpApi**. Before answering, it lists the discovered peer-reviewed articles with direct links, authors, and publication years so the user can verify them.
3. **Step 3: Analyze Classroom Data (Tab 5 — Statistics)**  
   Enter classroom action research scores (e.g., Pretest: `[50, 55, 60, 52, 58]`, Posttest: `[78, 85, 82, 80, 88]`, Max Score: `100`). AcademAI computes the mean difference, t-statistic, and Hake N-Gain (e.g., `0.58` — Category *Sedang*).
4. **Step 4: Draft Empirical Discussion (Bab IV)**  
   The system generates an initial academic discussion linking the statistical gains back to Piaget's sensorimotor/pre-operational theory and the STPPA motor milestones.
5. **Step 5: Review & Export to Word (Tab 2 / DOCX Export)**  
   The student reviews, refines, and exports the formatted document as a `.docx` file for offline editing and thesis advisor review.

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
    "gemma-4-26b-a4b-it",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.7-flash"
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
│   5 Research Tabs: Chat · Generator · Validator · Audit · Stats  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ REST API
┌────────────────────────────────▼────────────────────────────────┐
│      OPEN-SOURCE AGENT HARNESS (Standalone Node.js / Express)   │
│                                                                 │
│   ┌────────────────────────────────────────────────────────┐    │
│   │  DISCIPLINES Registry (PAUD Focused + 11 Frameworks)   │    │
│   │  Canonical Theories · Pedagogical Rubrics (BB/MB/BSH)  │    │
│   └────────────────────────────┬───────────────────────────┘    │
│                                │                                │
│        ┌───────────────────────┼────────────────────────┐       │
│        ▼                       ▼                        ▼       │
│ ┌────────────────┐    ┌─────────────────┐      ┌──────────────┐ │
│ │  Google Gemma  │    │ SerpApi Engine  │      │ Zotero REST  │ │
│ │  (Open-Weight) │    │ Google Scholar  │      │ Reference    │ │
│ │  Primary Model │    │ Live Index      │      │ Sync         │ │
│ └────────┬───────┘    └─────────────────┘      └──────────────┘ │
│          │ (Automatic Fallback if Busy)                         │
│          ▼                                                      │
│ ┌────────────────┐    ┌─────────────────┐      ┌──────────────┐ │
│ │ Gemini Fallback│    │ Pure-JS Stats   │      │ DOCX Exporter│ │
│ │ Flash Cascade  │    │ Paired t-Test   │      │ Formatted    │ │
│ │ 3.1/3.5/3.7    │    │ Hake N-Gain     │      │ Word Output  │ │
│ └────────────────┘    └─────────────────┘      └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
             Deployed via Dockerfile → Railway Cloud
```

### Core Code Snippet 1: Grounded Literature Retrieval with SerpApi

To ensure every factual claim has an inspectable source, `server.js` queries Google Scholar via SerpApi before composing the prompt:

```javascript
// server.js (MIT Licensed)
async function searchGoogleScholar(query, limit = 6) {
  const serpApiKey = process.env.SERPAPI_API_KEY;
  if (!serpApiKey) {
    console.log('[Scholar] No SerpApi key provided, continuing without live search.');
    return [];
  }
  try {
    const url = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&hl=id&num=${limit}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`SerpApi returned status ${response.status}`);
    const data = await response.json();
    
    return (data.organic_results || []).slice(0, limit).map((p, idx) => ({
      title: p.title || 'Untitled Academic Paper',
      authors: p.publication_info?.summary || 'N/A',
      link: p.link || '',
      snippet: p.snippet || '',
      citations: p.inline_links?.cited_by?.total || 0,
      year: (p.publication_info?.summary || '').match(/\b(20\d{2}|19\d{2})\b/)?.[1] || '2023'
    }));
  } catch (err) {
    console.error('[SerpApi Error]:', err.message);
    return [];
  }
}
```

### Core Code Snippet 2: Transparent PTK Statistics Engine

The statistical engine runs directly in Node.js using pure mathematics, ensuring full visibility into every step of the calculation:

```javascript
// server.js — Transparent calculation of Paired t-Test and Hake (1999) Normalized Gain
app.post('/api/stats/calculate', (req, res) => {
  const { pretest, posttest, maxScore = 100, variableName = 'Perkembangan Motorik Halus' } = req.body;
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

AcademAI is architected around **Google Gemma** (open-weight model), **SerpApi** for grounded scholarly search, and an open-source Node.js agent harness:

### 1. Open-Weight Model: Google Gemma
- **Primary Inference Model**: Google's open-weight **Gemma** model (`gemma-4-26b-a4b-it`) serves as the default reasoning engine for literature synthesis, theory matching, and discussion drafting.
- **Why Open-Weight Matters**: Because Gemma is an open-weight model family, institutions and students can run Gemma weights locally (e.g., via Ollama on consumer workstations) or access hosted endpoints without being locked into proprietary closed-model ecosystems.

### 2. Scholarly Grounding via SerpApi
- Generic LLMs invent citations because they predict tokens without index verification.
- We integrate **SerpApi** to query the live **Google Scholar** index, fetching real publication titles, snippets, citation counts, and direct links.
- These verified references are injected into the agent prompt, drastically reducing the risk of phantom citations.

### 3. Open-Source Agent Harness (`server.js`)
Instead of bloated multi-container microservices, AcademAI runs as a single, lightweight Node.js service (MIT License):
- **Domain Knowledge Engine**: Injects foundational theories (Piaget, Vygotsky, Montessori) and curriculum rubrics (STPPA, BB/MB/BSH/BSB) into the context based on user input.
- **Error Fallback Cascade**: If the primary Gemma endpoint experiences server load or temporary rate limits, the harness automatically cascades to lightweight fallback models (`gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.7-flash`) so the student's late-night writing session is never abruptly halted.
- **Pure JavaScript Math**: Implements t-tests and Hake's N-gain without external proprietary statistical packages.
- **DOCX Word Exporter**: Uses the open-source `docx` library to compile structured thesis drafts into standard `.docx` files for advisor review.
- **Session Memory**: Uses isolated session identifiers to persist research documents locally in `./data/memory.json`.

---

## Why Does Open Innovation Matter?

<!-- Why does open innovation matter for what you built?  What did it make possible that a closed API wouldn't? -->

### 1. Removing Financial Barriers for Developing World Students
There are over **8 million university students across Indonesia**. Most students in regional teacher-training colleges (*LPTK*) study on budget laptops or mobile devices. 
- Commercial AI tools charge **$20 to $30 per month** — often equivalent to several weeks of a student's living budget in regional Indonesia.
- Open innovation — combining open-weight models like **Google Gemma**, accessible search APIs like **SerpApi**, and self-hostable MIT-licensed code — proves that state-of-the-art research support can be made freely accessible without subscription gatekeeping.

### 2. Transparent, Defendable Academic Rigor
In a university thesis defence, a student cannot say: *"the AI told me this was true."* They must defend their sources, explain their data, and verify their citations. 
- With open innovation, every algorithm in AcademAI is transparent.
- The student can inspect the exact mathematics of their t-test, click the direct link provided by SerpApi to verify a paper's existence, and inspect the prompt rules on GitHub. Open innovation preserves human agency and academic integrity.

### 3. Self-Hostable and Customizable
Because the application code is open-source (MIT), any university department or student union can clone the repository, customize the `DISCIPLINES` registry to match their local faculty guidelines, and host it independently on their own infrastructure.

---

## My Agent Session

<!-- Optional, but judges love it.  Save your session with DevRelay and embed it with the agent_session tag (see the challenge page), or link to it. -->

AcademAI was engineered with the assistance of **Antigravity IDE** (Google DeepMind's agentic pair-programming system). 

Throughout the session, the agent and I:
- Consolidated the prototype into a clean, standalone `server.js` agent harness to eliminate container bloat and ensure fast cold starts.
- Connected SerpApi for live Google Scholar index querying and grounded literature injection.
- Built and verified the pure JavaScript statistical engine for Classroom Action Research (PTK) and Hake's N-Gain formulas.
- Configured Google Gemma as the primary open-weight engine with an automated fallback cascade.
- Packaged the application with Docker and verified the live cloud deployment on Railway with automated `/healthz` monitoring.

---

## Prize Categories

<!-- Which partner categories are you entering?  List every one that applies, or remove this section. -->

- **Best Use of Gemma**: AcademAI uses Google's open-weight **Gemma** (`gemma-4-26b-a4b-it`) as its core reasoning engine to power literature synthesis, pedagogical framework alignment (Piaget/Vygotsky/STPPA), and academic discussion drafting.
- **Best Use of SerpApi**: AcademAI deeply integrates **SerpApi** to query the live **Google Scholar** index, grounding thesis writing in verified, peer-reviewed publications and providing students with traceable citation links.

<!-- Team Submissions: Please pick one member to publish the submission and credit teammates by listing their DEV usernames directly in the body of the post. -->

<!-- Thanks for participating! -->
