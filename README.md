# CareerCopilot — AI JobHunter 🎯

> **AI-Powered Job Discovery, Match Analysis & Application Assistant**  
> Engineered for Full Stack Developers (React.js, Next.js, TypeScript, Node.js, NestJS, PostgreSQL). Features an explainable 5-factor mathematical scoring engine, zero-fabrication tailored resumes, custom cover letters, cold email outreach, live PDF resume parsing, and a real-time application pipeline tracker.

---

## 🌟 Key Features

### 1. Explainable 5-Factor Mathematical Match Scoring
* **Weighted Compatibility Formula**:
  $$\text{Score} = (0.35 \times \text{Tech}) + (0.20 \times \text{Exp}) + (0.20 \times \text{Resp}) + (0.15 \times \text{Role}) + (0.10 \times \text{Loc})$$
* **Non-Exaggeration Skill Penalties**: Technologies listed as *Familiarity* or *Beginner* (e.g. Redis, BullMQ, GraphQL) receive a strict scoring deduction if a job mandates professional mastery.
* **Anti-Bias Senior Position Filter**: Ensures architectural roles requiring 8+ or 10+ years of experience receive a low score (<30%), preventing false recommendations.
* **Full Transparency**: Every score provides a detailed breakdown of matched skills, missing mandatory skills, experience gaps, and bulleted reasons to apply / not apply.

### 2. Instant PDF Resume Parsing & Profile Onboarding
* **Drag-and-Drop PDF Upload**: Upload any PDF resume or paste raw resume text to auto-populate your entire candidate profile.
* **Intelligent Extraction**: Uses Gemini Flash with deterministic fallback heuristics to extract contact details, education, degree, CGPA, employment history, projects, and categorizes technical skills into **Core**, **Additional**, and **Familiar**.
* **Review & Edit Gate (Business Rule 12)**: Candidates can review, edit, or adjust all parsed information in an interactive modal before committing to the database.
* **Live Score Recalculation**: Applying an uploaded profile automatically recalculates 5-factor match scores for all opportunities across the system.

### 3. Zero-Fabrication Resume Tailoring
* **3 Targeted Candidate Profiles**:
  * **Profile A (Full Stack Developer)**: Emphasizes React, Next.js, Node.js, NestJS, PostgreSQL, REST APIs, and end-to-end workflows.
  * **Profile B (Backend Developer)**: Emphasizes NestJS, Express, PostgreSQL, MongoDB, TypeORM, Prisma, JWT/RBAC security, and Socket.IO.
  * **Profile C (Frontend Developer)**: Emphasizes Next.js App Router, Tailwind CSS, Redux Toolkit, WCAG 2.1 AA accessibility, ARIA, and Mapbox GIS mapping.
* **100% Factual Integrity**: Preserves verified career milestones, employment dates, degree/CGPA, and authentic production features. Never fabricates years of experience, titles, or metrics.
* **Export Options**: 1-click Markdown copy and clean, formatted browser print/PDF view.

### 4. Application Assistant & Submission Hub
* **Direct Official Careers Portals**: 1-click launcher opening the verified employer careers portal in a new tab (HTTP 200 validated).
* **Automated Custom Cover Letters**: Generates tailored 3-paragraph letters referencing relevant company requirements and matching project achievements.
* **1-Click Cold Email Generator**: Composes tailored recruiter outreach emails with 3 subject line options, core capability pitch bullets, and a `mailto:` launcher.
* **Pipeline Tracker & Business Rule 8 Gate**: Enforces explicit candidate authorization before any opportunity can be recorded as `APPLIED`. Logs application method (*Company Website, LinkedIn, Cold Outreach, Referral*), quoted CTC, and custom notes.

### 5. Live Job Discovery & Job URL Importer
* **Scan Live Jobs**: Actively searches and ingests fresh verified opportunities from regional tech companies (Ahmedabad, Gandhinagar, and Remote India).
* **Import Job URL Modal**: Allows pasting any real job vacancy from LinkedIn, Indeed, Naukri, or corporate career sites to immediately ingest, auto-score with the 5-factor engine, and generate tailored materials.
* **Deduplication Engine**: Prevents duplicate entries via normalized URL and `(title, company)` matching.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | **Next.js 14** | App Router, Server Components & Route Handlers |
| **Language** | **TypeScript 5** | Strict Mode with full end-to-end type safety |
| **Styling** | **Tailwind CSS** | Dark-mode interface with Lucide Icons |
| **Database** | **SQLite (WAL Mode)** | Fast local storage with Write-Ahead Logging |
| **ORM** | **Prisma 6** | Schema migrations, typed queries, and relational joins |
| **Document Parser** | **pdf-parse** | Cross-platform PDF text extraction & structured parsing |
| **AI Engine** | **Google Gemini 3.8 Flash** | Server-side isolated (`@google/generative-ai`) with deterministic heuristic fallback |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.17.0 or higher
* **npm**: v9.0.0 or higher

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/ai-job-hunter.git
   cd ai-job-hunter
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and set your `GEMINI_API_KEY` (optional; deterministic heuristic fallback is active if omitted).*

4. **Initialize database schema & seed candidate template**:
   ```bash
   npm run db:push
   npm run db:seed
   ```
   > **Note:** `npm run db:seed` initializes the database with a clean candidate template, 32 categorized technical skills, sample capstone projects, 3 targeted resume profiles, and verified tech opportunities. **Zero fake sample jobs are seeded.**

5. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 👥 How to Personalize for Any User

The platform is designed to be personalized for any developer's background using one of three simple methods:

### Method 1: 1-Click PDF Resume Upload (Fastest & Recommended)
1. Open the dashboard at `http://localhost:3000`.
2. Click the **"Upload Resume (PDF)"** button on the candidate hero card.
3. Drag and drop your PDF resume (or paste your resume text).
4. The system automatically parses your details, detects your skills, and populates the review form.
5. Review or edit your information (Business Rule 12), then click **"Apply Profile to Dashboard"**.
6. Your profile is saved to SQLite and all 5-factor match scores are instantly recalculated!

### Method 2: Edit In-App (No Code Required)
1. On the dashboard, click **"Edit Profile & Skills"**.
2. Update your name, title, current employer, graduation year, CGPA, target roles, and locations.
3. Add, edit, or remove technical skills across **Core**, **Additional**, and **Familiar** categories.
4. Save your changes to immediately update your match scores.

### Method 3: Customize the Seed Template (`prisma/seed.ts`)
1. Open [`prisma/seed.ts`](file:///home/wappnet-14/Desktop/projects/Ai%20job%20hunter/prisma/seed.ts).
2. Edit the candidate profile template, skill list, employment entries, or projects with your details.
3. Run:
   ```bash
   npm run db:seed
   ```
4. Your complete portfolio is reloaded cleanly into the database.

---

## 🧪 Automated Testing & Verification

The project includes automated verification suites covering all architectural layers:

```bash
# 1. Run database and candidate profile integrity check (21 checks)
npm run test:db

# 2. Run master end-to-end verification across all 8 phases (31 checks)
npm run test:e2e

# 3. Verify clean production Next.js build
npm run build
```

---

## 📁 Project Structure

```text
├── prisma/
│   ├── schema.prisma        # Complete relational schema (Candidate, Skills, Jobs, Applications)
│   ├── seed.ts              # Clean template candidate, skills, and verified opportunity seeder
│   └── dev.db               # SQLite database in WAL mode
├── scripts/
│   ├── test-db.ts           # 21-point Phase 1 & database verification suite
│   ├── test-all-phases.ts   # 31-point Master E2E verification across all 8 phases
│   ├── purge-sample-jobs.ts # Utility to delete mock listings
│   └── fix-real-urls.ts     # Validates and updates active HTTP 200 careers portals
├── src/
│   ├── app/
│   │   ├── api/             # Server route handlers (candidate, resume-upload, apply-profile, jobs, tailor, etc.)
│   │   ├── jobs/[id]/       # Dedicated full job view with AI interview prep
│   │   ├── page.tsx         # Dashboard main page (Server Component)
│   │   └── layout.tsx       # Root layout and theme wrapper
│   ├── components/          # Interactive UI components
│   │   ├── DashboardClient.tsx    # Main state coordinator & tracker tabs
│   │   ├── ResumeUploadModal.tsx  # PDF drag-and-drop & parsing review modal
│   │   ├── CandidateProfileModal.tsx # Manual profile and skill editor
│   │   ├── JobCard.tsx            # Opportunity card with 5-factor breakdown & quick actions
│   │   ├── ApplicationModal.tsx   # Complete 4-step application assistant hub
│   │   ├── ColdEmailModal.tsx     # Recruiter email outreach generator
│   │   ├── TailoredResumeModal.tsx# Multi-profile factual resume exporter
│   │   ├── ImportJobModal.tsx     # Manual job vacancy & URL importer
│   │   └── FilterBar.tsx          # Real-time search, filters & discovery controls
│   └── lib/
│       ├── prisma.ts        # Singleton Prisma client instance
│       ├── experience.ts    # Dynamic employment date calculation
│       └── services/        # Core business domain engines
│           ├── resume-parser-service.ts  # PDF text extraction & AI/heuristic parser
│           ├── candidate-service.ts
│           ├── matching-engine.ts
│           ├── resume-service.ts
│           ├── cover-letter-service.ts
│           ├── ai-recommendation-service.ts
│           └── job-service.ts
```

---

## 📜 Strict Business Rules

1. **Zero Fake Jobs**: Never fabricates company names, roles, or requirements. Every opportunity corresponds to an authentic employer.
2. **Zero Fabrication on Resumes**: Preserves factual accuracy. Never exaggerates years of experience, employment history, or technical proficiency.
3. **Candidate Approval Gate (Rule 8)**: Applications cannot be marked `APPLIED` without explicit candidate confirmation.
4. **Credential Security (Rule 11)**: Gemini API keys and sensitive tokens are strictly isolated server-side and never exposed to client bundles.
5. **Authentic Application URLs (Rule 4)**: Stores verified, direct employer careers portals (HTTP 200 validated).
6. **Candidate Profile Editing (Rule 12)**: The candidate can review and correct technical skills and profile information at any time.

---

## 📄 License
MIT License. Open-source personal AI recruitment and job hunting assistant.
