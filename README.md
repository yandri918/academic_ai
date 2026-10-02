# 🎓 AcademAI — Open-Source Multi-Disciplinary Academic Co-Pilot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Live Demo](https://img.shields.io/badge/demo-online-blue.svg)](https://academicai-production-a41d.up.railway.app)
[![Health Status](https://img.shields.io/badge/health-200%20OK-success.svg)](https://academicai-production-a41d.up.railway.app/healthz)
[![Hacktoberfest 2026](https://img.shields.io/badge/Hacktoberfest-2026%20Submission-orange.svg)](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)

> 🎃 **Submission for [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)**  
> **Dedicated to**: My wife, finishing her undergraduate thesis in **S1 PAUD (Early Childhood Education)** while caring for our family — and expanded into an open-source research partner for university students across **12 academic disciplines**.

---

## 🌐 Live Web Application

- **Live Production URL**: [https://academicai-production-a41d.up.railway.app](https://academicai-production-a41d.up.railway.app)
- **Health Check Endpoint**: [https://academicai-production-a41d.up.railway.app/healthz](https://academicai-production-a41d.up.railway.app/healthz)

---

## 💡 The Story Behind AcademAI

Every evening, I watched my wife sit at our kitchen table overwhelmed by the friction of writing her undergraduate thesis in Early Childhood Education (S1 PAUD). Standard commercial AI tools:
1. **Fabricated academic sources** (inventing fake citations attributed to Piaget, Vygotsky, or Montessori).
2. **Knew nothing about local education standards** like Indonesia's **STPPA (Permendikbudristek No. 5/2022)** or national developmental rubrics (**BB / MB / BSH / BSB**).
3. **Left her stuck on empirical calculations** like Paired Sample t-Tests and Hake's Normalized Gain (**N-Gain**) for Classroom Action Research (PTK).
4. **Charged expensive subscriptions** ($20+/month) that are unaffordable for most Indonesian students.

**AcademAI** was born to solve these hurdles. Once it succeeded for my wife, I refactored the codebase from a single-faculty tool into a **universal 12-discipline open-source academic engine**.

---

## ✨ Key Capabilities

| Module | What It Does |
|---|---|
| 🔍 **Google Scholar Grounding** | Automatically searches authentic scholarly literature via SerpApi and injects verified findings into the prompt context to prevent hallucinations. |
| 🛡️ **Citation Validator** | RegEx-based auditing engine that validates in-text citations (APA 7th) and DOI links against academic indices (`VALID`, `PARTIAL`, `INVALID`). |
| 📊 **PTK Statistics Engine** | Pure JavaScript mathematical engine calculating Paired Sample t-Tests, degrees of freedom, and Hake (1999) N-Gain categories with automated Indonesian pedagogical prose for Bab IV. |
| 🔄 **Plagiarism Auditor** | Turnitin-style similarity auditor with academic sentence restructuring (nominalization, passive-voice conversion) targeting <15% similarity. |
| 📑 **Full Thesis Generator** | Drafts complete 5-chapter research documents with bilingual abstracts (Indonesian + English), research matrix, and APA bibliographies in one request. |
| 💾 **Document Memory** | Local JSON session memory (`./data/memory.json`) preserving research variables, uploaded documents, and hypotheses across sessions. |
| 📄 **Native DOCX Export** | Compiles structured research chapters directly into formatted Microsoft Word (`.docx`) files using the open-source `docx` library. |

---

## 🏛️ Supported Academic Disciplines (12 Faculties)

AcademAI's **DISCIPLINES Registry** dynamically injects domain-specific theories and empirical methodologies:

1. 🧸 **PAUD (Early Childhood Education)**: Piaget, Vygotsky, Montessori, STPPA Permendikbudristek No. 5/2022, PTK Kemmis & McTaggart, BB/MB/BSH/BSB rubrics.
2. 📚 **Education & Teaching (Keguruan)**: Behaviorism (Skinner), Constructivism, Kurikulum Merdeka, Bloom's Taxonomy, R&D ADDIE / 4D.
3. 💼 **Economics & Business**: Agency Theory (Jensen & Meckling), Porter's Five Forces, Kotler & Keller, SEM/SmartPLS, Multiple Regression.
4. ⚖️ **Law & Jurisprudence**: Theories of Justice (Rawls), Legal Certainty (Radbruch), Normative Juridical & Empirical Juridical.
5. 💻 **Computer Science & IT**: IEEE/ACM standards, SDLC (Agile/Waterfall), Algorithmic Complexity, Usability Testing (SUS).
6. 🏥 **Health & Nursing**: Evidence-Based Practice (EBP), Bioethics, Epidemiological Designs (Cross-Sectional, Case-Control, Cohort).
7. 🧠 **Psychology**: Psychometric validation, Social Cognitive Theory, Likert scale construction, Factor Analysis.
8. ⚙️ **Engineering**: SNI / ISO specifications, Finite Element, Technical design and laboratory testing.
9. 🌾 **Agriculture & Agrotechnology**: Agronomy, Soil Fertility, Randomized Block Design (RAK / RAL), ANOVA, Duncan Test.
10. 💬 **Communication Science**: Agenda Setting, Framing Analysis (Entman), Semiotics (Roland Barthes).
11. 🏛️ **Social & Political Science**: Critical Theory (Habermas), Social Capital (Bourdieu), Public Policy Evaluation.
12. 🌐 **General Academic**: Philosophy of Science (Ontology, Epistemology, Axiology), PRISMA protocol for Systematic Literature Reviews (SLR).

---

## 🏗️ System Architecture

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

### 🧠 Gemini 4-Model Smart Fallback Cascade

To ensure high availability during peak thesis deadlines, `server.js` automatically cascades through Google Gemini tiers:
1. `gemini-3.1-flash-lite`: Ultra-low latency for definitions and short queries.
2. `gemini-3.5-flash-lite`: High-efficiency reasoning for literature reviews.
3. `gemini-3.7-flash`: Balanced speed and academic writing depth.
4. `gemini-3.8-flash`: Highest quality academic prose for full 5-chapter generation.

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
- Node.js >= 20.0.0
- A Google Gemini API Key ([Get free tier key from Google AI Studio](https://aistudio.google.com/))
- *(Optional)* SerpApi Key for live Google Scholar queries

### 1. Clone the Repository
```bash
git clone https://github.com/yandri918/academic_ai.git
cd academic_ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=8080
GEMINI_API_KEY=your_gemini_api_key_here
SERPAPI_API_KEY=your_serpapi_key_here       # Optional: for Google Scholar grounding
ZOTERO_API_KEY=your_zotero_key_here         # Optional: for Zotero sync
ZOTERO_USER_ID=your_zotero_user_id          # Optional
```

### 4. Start the Application
```bash
npm start
```
Open your browser at **`http://localhost:8080`**.

---

## 🐳 Docker Deployment

You can also run AcademAI in a self-contained Docker container:

```bash
# Build Docker image
docker build -t academ-ai .

# Run container
docker run -d -p 8080:8080 --env-file .env --name academ-ai-app academ-ai
```

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/healthz` | `GET` | Health check returning status, active features, and model cascade list. |
| `/api/generate` | `POST` | Core generation endpoint for Chat, SLR, Proposal, Abstract, Editing, and Paraphrasing. |
| `/api/citation/validate` | `POST` | Validates in-text citations and DOIs against indexed scholarly databases. |
| `/api/stats/calculate` | `POST` | Computes Paired Sample t-Test and Hake (1999) N-Gain from pretest/posttest arrays. |
| `/api/plagiarism/check` | `POST` | Audits text similarity and generates Turnitin-safe academic rewrites. |
| `/api/export/docx` | `POST` | Converts Markdown research chapters into a downloadable `.docx` file. |
| `/api/memory/:sessionId` | `GET` | Retrieves saved documents from the persistent session memory. |

---

## 📁 Repository Structure

```
academic_ai/
├── frontend/               # Zero-build Web UI (HTML5, Vanilla CSS, ES2022)
│   ├── index.html          # Single Page Application layout (5 Tabs)
│   ├── app.js              # Client-side state & REST API communications
│   └── style.css           # Premium responsive dark/light styling
├── data/                   # Persistent local session memory storage
│   └── memory.json         # Session document persistence
├── uploads/                # Temporary PDF upload storage
├── server.js               # Standalone Node.js Agent Harness (MIT)
├── Dockerfile              # Production Alpine container definition
├── railway.toml            # Railway Cloud deployment configuration
├── package.json            # Node.js project manifest & dependencies
├── DEV_SUBMISSION.md       # Official Hacktoberfest 2026 submission draft
└── README.md               # Project documentation
```

---

## 🏆 Hacktoberfest 2026 Partner Categories

- **Google Gemini**: Powered by Google Gemini with an intelligent 4-model fallback cascade (`gemini-3.1-flash-lite` → `gemini-3.5-flash-lite` → `gemini-3.7-flash` → `gemini-3.8-flash`) and open-source discipline-aware prompt engineering.
- **Best Open Source Tool**: Standalone, 100% MIT-licensed Node.js agent harness, pure JS statistics engine, citation validation parser, and vanilla frontend with zero proprietary lock-in.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for students, teachers, and researchers worldwide.

*Built with ❤️ for my wife — and every student working hard toward their degree.*
