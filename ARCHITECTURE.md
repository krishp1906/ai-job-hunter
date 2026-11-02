# AI JobHunter — Master Architecture & Specification

## 1. Executive Summary

**AI JobHunter** is an autonomous personal recruitment research and application assistant developed for Full Stack Developers.

The system continuously discovers verified, non-fabricated software developer opportunities across Ahmedabad, Gandhinagar, and Remote India, evaluates compatibility using an explainable 5-factor mathematical scoring engine, maintains factual multi-profile resumes, and delivers structured technical interview preparation.

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                        FRONTEND PRESENTATION LAYER                                |
|  Next.js 14 (App Router) | React 18 | TypeScript | Tailwind CSS | Lucide Icons   |
|  - DashboardClient: Real-time candidate stats, multi-axis filters, job feed       |
|  - JobCard: 5-Factor scoring breakdown visualizer, matched & missing skills pills  |
|  - JobDetailModal: AI assessment, interview prep topics & expected questions      |
|  - TailoredResumeModal: Profile A/B/C selector, Markdown & printable exporter     |
|  - CandidateProfileModal: Dynamic experience override, skills manager            |
+------------------------------------------+----------------------------------------+
                                           | HTTP / Server Components / REST APIs
                                           v
+-----------------------------------------------------------------------------------+
|                        BACKEND & APPLICATION CORE                                 |
|  Next.js Route Handlers | Server Actions | Zod | Dynamic Experience Engine         |
|  - CandidateService: Profile & skill CRUD, dynamic experience calculation        |
|  - JobService: Ingestion pipeline, deduplication (URL & title/company), discovery |
|  - MatchingEngine: 5-Factor weighted scoring (35% Tech, 20% Exp, 20% Resp, 15/10)|
|  - ResumeService: Factual tailored resume generator (Full Stack, Backend, Front)  |
|  - AIRecommendationService: Gemini 1.5 + deterministic heuristic fallback engine |
|  - Business Rule 8 Guard: Strict candidate approval gate for applied status      |
+------------------------------------------+----------------------------------------+
                                           | Prisma ORM (Type-Safe Client)
                                           v
+-----------------------------------------------------------------------------------+
|                          PERSISTENCE LAYER (SQLite WAL)                           |
|  - CandidateProfiles, CandidateSkills (Core, Additional, Familiar + Proficiencies)|
|  - WorkExperiences & Projects (Saaristo Marine, Catalyst, Freelance Platform)     |
|  - ResumeProfiles (Profile A: Full Stack, Profile B: Backend, Profile C: Frontend)|
|  - JobListings, JobMatchAnalyses, AIRecommendations, JobApplications, AuditLogs  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Technology Stack & Environment

| Component | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js | v24.14.1 | Execution environment |
| **Framework** | Next.js | 14.2.35 | Full-stack App Router, SSR, Route Handlers |
| **Language** | TypeScript | 5.7.3 | Strict type safety for scoring & candidate models |
| **Styling** | Tailwind CSS | 3.4.17 | Modern responsive UI, accessible design |
| **Database** | SQLite (WAL mode) | SQLite 3 | Zero-friction, file-based, concurrent ACID persistence |
| **ORM** | Prisma ORM | 6.4.1 | Type-safe queries, schema migrations, client generator |
| **AI / LLM** | Google Gemini SDK | 0.24.1 | Interview prep & recommendations (isolated server-side) |

---

## 4. Candidate Model & Technical Skills Structure

### 4.1 Candidate Identity
- **Dynamic Profile**: Populated via 1-click PDF resume parsing or seed template.
- **Experience Calculation**: Dynamically computed from employment start date, with candidate manual override option.
- **Categorized Skills**: Categorized into CORE, ADDITIONAL, and FAMILIAR with verified proficiencies.

### 4.2 Categorized Skills & Anti-Exaggeration
1. **Core Skills**: JavaScript (ES6+), TypeScript, React.js, Next.js, Node.js, NestJS, REST APIs, PostgreSQL, MongoDB, Tailwind CSS.
2. **Additional Skills**: Express.js, Redux Toolkit, TypeORM, Prisma, JWT Authentication, Passport.js, RBAC, Socket.IO, Stripe, Mapbox, OpenLayers, Jest, Vitest, Git, Postman, WCAG, ARIA, Python, SQL.
3. **Familiar Technologies**: GraphQL, Redis, BullMQ.

Separate tracked fields:
- `experienceType`: `PROFESSIONAL` | `PERSONAL_PROJECT` | `FAMILIARITY`
- `verifiedProficiency`: `BEGINNER` | `INTERMEDIATE` | `ADVANCED` | `EXPERT`
- `yearsOfExperience`: Float value

**Rule:** Familiar technologies (e.g. Redis, GraphQL) are capped at Beginner and receive heavy deductions if a job mandates professional mastery.

---

## 5. Explainable 5-Factor Scoring Engine

The scoring engine evaluates every job opportunity against the candidate using 5 weighted criteria:

$$\text{Overall Score} = 0.35 \times S_{\text{tech}} + 0.20 \times S_{\text{exp}} + 0.20 \times S_{\text{resp}} + 0.15 \times S_{\text{role}} + 0.10 \times S_{\text{loc}}$$

Where:
* **$S_{\text{tech}}$ (35%) — Technical Skill Compatibility**:
  - Mandatory skills weighted at 75%, preferred skills at 25%.
  - Verified professional proficiency receives 100% points.
  - Personal project proficiency receives 85% points.
  - Familiarity only receives 20% points on mandatory requirements (penalty applied).
  - Missing mandatory skills receive 0 points and trigger explicit warning flags.
* **$S_{\text{exp}}$ (20%) — Professional Experience Compatibility**:
  - 1–2 years: 95–100% (target match).
  - 0–3 years: 80–90% (accessible target).
  - Senior positions (>5 years): 15–30% (anti-bias penalty prevents false recommendations).
* **$S_{\text{resp}}$ (20%) — Job Responsibilities Compatibility**:
  - Evaluates overlap with proven production capabilities: booking workflows, Mapbox/OpenLayers maps, payments/VAT, WCAG 2.1 AA accessibility, admin dashboards, real-time WebSockets.
* **$S_{\text{role}}$ (15%) — Role Compatibility**:
  - Priority 1 Titles (Full Stack Developer, Node.js Developer, React/Next.js Developer, Software Engineer): 95–100%.
  - Priority 2 Titles (Python Backend Developer, API Developer, AI Application Developer): 80–90%.
  - Senior/Architect/Management roles: 20–35%.
* **$S_{\text{loc}}$ (10%) — Location Compatibility**:
  - Ahmedabad: 100%
  - Gandhinagar: 95%
  - Remote India: 90%
  - Hybrid Ahmedabad: 100%
  - Other cities requiring relocation: 40%.

---

## 6. Multi-Profile Resumes (Factual Preservation)

- **Profile A (Full Stack Developer)**: Emphasizes React.js, Next.js, TypeScript, Node.js, NestJS, PostgreSQL, REST APIs, and end-to-end full-stack architectures.
- **Profile B (Backend Developer)**: Emphasizes Node.js, NestJS, Express.js, PostgreSQL, MongoDB, REST API architecture, TypeORM, Prisma, Socket.IO, and authentication.
- **Profile C (Frontend Developer)**: Emphasizes React.js, Next.js, TypeScript, Redux Toolkit, Tailwind CSS, Responsive UI, WCAG 2.1 AA, ARIA, and Mapbox.

**Zero-Fabrication Contract**: Years of experience, employment history, Silver Oak CGPA (9.22), and capstone project ownership are strictly preserved.

---

## 7. Business & Security Rules

1. **Never fabricate job openings or companies**: All listings verified with authentic URLs.
2. **Never fabricate salary data**: Estimated benchmarks clearly marked with `salaryIsEstimated: true`.
3. **Deduplication**: Prevents duplicate entries via original URL and normalized (title, company) index.
4. **Business Rule 8 (Explicit Candidate Approval)**: No application can be marked `APPLIED` without explicit candidate authorization (`approvedByCandidate: true`).
5. **Credential Isolation**: Gemini API credentials remain strictly server-side (`GEMINI_API_KEY`), never exposed to frontend bundles.
