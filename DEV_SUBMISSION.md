---
title: "AcademAI: Building a Private AI Thesis Co-Pilot for My Wife's Early Childhood Education Degree"
published: true
tags: devchallenge, weekendchallenge, hf26challenge, gemini
canonical_url: https://github.com/yandri918/academic_ai
cover_image: https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

---

## What I Built

I built **AcademAI (EduFriend Edition)** — a free, open-agent academic research & thesis co-pilot powered by **Google's frontier model (Gemini 3.8 Flash)**, open agent orchestration (**n8n**), and open academic citation verification (**Semantic Scholar API**).

### Who I Built It For: My Wife
My wife is currently in her final semester of her undergraduate degree in **Early Childhood Education (S1 PAUD - Pendidikan Anak Usia Dini)**. Every day, she juggles family life, caring for our home, and spending hours at a local kindergarten conducting observational field research on toddler cognitive and fine motor skill development.

Writing a comprehensive undergraduate thesis under these conditions is grueling. Whenever she sat down late at night to write her chapters, she hit the same frustrating walls:
1. **The Citation Trap**: Commercial closed AI tools (like free ChatGPT) frequently hallucinated fake journal citations or fabricated author names that would get her disqualified by her thesis advisors.
2. **Subscription Costs**: High-end proprietary models ($20/month for Claude Pro or ChatGPT Plus) are a severe financial burden for student teachers in Indonesia.
3. **The Data Privacy & Child Safety Dilemma**: Her thesis relies on real classroom observation notes, toddler behavioral records, and developmental milestones (STPPA). Uploading sensitive observations of 4-to-6-year-old children to commercial closed AI chatbots raised serious privacy and ethical concerns.

I wanted to build something tailored to educational research that was **cost-free, accurate, and completely under our control**. That is how **AcademAI** was born.

---

## Demo

Here is a quick look at AcademAI in action:

* **Interactive Web Interface**: A sleek, focused workspace with dedicated modes: *Drafting, Proposal Builder, Systematic Literature Review (SLR), Citation Validator*, and *Statistical Interpretation*.
* **Real-time Citation Verification**: Every cited claim is checked against 200M+ real peer-reviewed papers via Semantic Scholar with clickable DOI links.
* **Child Ethics & Privacy Shield**: Student names are automatically anonymized, and all child observation analysis happens with strict privacy safeguards.

### What My Wife Said When She Tried It:
> *"Biasanya nyari jurnal PAUD yang beneran ada DOInya dan nyocokin ke teori Piaget atau Montessori makan waktu seharian. Dengan AcademAI, sekali masukin topik media loose parts dan motorik halus, langsung dapet matriks penelitian terdahulu yang beneran ada jurnalnya dan divalidasi. Ini sangat meringankan beban skripsiku!"*
> 
> *(Translation: "Usually finding Early Childhood Education journals with valid DOIs and connecting them to Piaget or Montessori theories takes all day. With AcademAI, once I typed in loose-parts media and fine motor skills, it gave me a real previous-research matrix with verified papers. This lifted an immense weight off my thesis journey!")*

---

## Code

The entire codebase is open-source under the MIT License:

{% github yandri918/academic_ai %}

**Repository link**: [https://github.com/yandri918/academic_ai](https://github.com/yandri918/academic_ai)

### Tech Stack:
- **Frontier LLM**: **Google Gemini 3.8 Flash** (featuring ultra-fast reasoning, large context window, and generous free-tier API access).
- **Open Agent Harness**: Self-hosted **n8n** workflow orchestrating autonomous tools, mode selectors, and conversational memory.
- **Reference & Citation Sync**: **Zotero Web API** (automatically saves peer-reviewed papers to desktop Zotero collections, ready for 1-click citation in Microsoft Word).
- **Web & Curriculum Extraction**: **Firecrawl API** (scrapes national curriculum standards, STPPA regulations, and open journal papers into clean markdown).
- **Academic Mining**: **Google Scholar** (indexing SINTA, Garuda, and national/international academic papers) + **DuckDuckGo** (real-time data).
- **Document Export Engine**: **Gotenberg** Docker container for pristine PDF & DOCX generation.
- **Frontend**: Lightweight, high-performance vanilla HTML5/CSS3/JavaScript web interface.

---

## How I Built It

```
┌──────────────────────────────────────────────────────────────┐
│                    AcademAI Architecture                     │
├──────────────────────────────────────────────────────────────┤
│  USER (My Wife)                                              │
│    │  (Topic: "Pengaruh Media Loose Parts thd Motorik Anak") │
│    ▼                                                         │
│  Lightweight Web UI (Vanilla JS + Clean CSS)                 │
│    │                                                         │
│    ▼                                                         │
│  Open Agent Harness (n8n Docker)                             │
│    ├── Session Buffer Memory (persists chapter context)      │
│    ├── Mode Selector (Drafting, SLR, Proposal, Validator)    │
│    │                                                         │
│    ├── ✨ Frontier Intelligence: Google Gemini 3.8 Flash    │
│    │     └── Grounded in Early Childhood Pedagogical Theory  │
│    │                                                         │
│    ├── 🎓 Google Scholar Tool (SINTA & Peer-reviewed Papers) │
│    ├── 📚 Zotero Sync Tool (Pushes papers to desktop Zotero) │
│    ├── 🕷️ Firecrawl Tool (Clean markdown web extraction)    │
│    ├── 🦆 DuckDuckGo Tool (Govt Education Standards / STPPA) │
│    └── 🔍 Code-Level APA7 / DOI Citation Validator           │
│                                                              │
│    ▼                                                         │
│  Gotenberg Docker Engine ──► Final Clean DOCX / PDF / MD     │
└──────────────────────────────────────────────────────────────┘
```

1. **Google Gemini as the Frontier Brain**:
   We utilized **Google Gemini 3.8 Flash** because of its lightning-fast speed, high pedagogical reasoning accuracy in Indonesian, and immense token context window—allowing it to cross-reference entire chapter drafts with multiple curriculum standards simultaneously without running out of context.
2. **Pedagogical Prompt Grounding**:
   The agent's system message was specifically infused with early childhood education taxonomies: Jean Piaget's stages of cognitive development, Lev Vygotsky's social constructivism, Ki Hajar Dewantara's *Among* system, and Indonesia's national early childhood developmental standards (STPPA).
3. **Automated Citation Validator Node**:
   Whenever a chapter or literature review is generated, an n8n code node extracts all APA-formatted citations `(Author, Year)` and regex-parsed DOIs, querying Semantic Scholar in real-time. If a citation doesn't match an actual indexed paper, it flags it as `⚠️ PARTIAL` or `❌ INVALID`, eliminating AI hallucinations.

---

## Why Does Open Innovation Matter?

This project proves why open agent architecture combined with accessible frontier AI is transformative for students and educators:

1. **Democratizing Higher Education (Zero Marginal Cost)**:
   A student teacher in a developing country shouldn't have to choose between buying learning materials for their kindergarten class and paying a monthly recurring $20 closed AI subscription. Google Gemini's generous free-tier API coupled with our open self-hosted n8n harness makes high-end AI research 100% accessible to every student.
2. **Transparency and Academic Integrity**:
   Unlike black-box commercial chatbots that produce unverifiable text, AcademAI's open workflow allows students and thesis advisors to inspect every step: from the raw journal API call to the citation validation report.
3. **Flexibility & Extensibility**:
   Because the agent harness is completely open-source (n8n), any student can extend it—adding institutional templates, school-specific observation rubrics, or swapping model endpoints with zero vendor lock-in.

---

## My Agent Session

This project was architected and pair-programmed interactively with **Antigravity (Google Advanced Agentic Coding)**. The agent assisted in scaffolding the multi-node n8n workflow, crafting the regex parsing logic for the APA7/DOI Citation Validator, and integrating the Semantic Scholar open API endpoints.

---

## Prize Categories

- 🏆 **Overall Challenge Winner**: Solving a deeply personal, real-world academic problem for my wife using an open-source agent harness and accessible frontier AI.
