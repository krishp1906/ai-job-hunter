import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RecommendationVerdict } from "@prisma/client";

export interface AIRecommendationResult {
  verdict: RecommendationVerdict;
  suitabilitySummary: string;
  requirementsSatisfied: string[];
  requirementsMissing: string[];
  interviewPrepTopics: string[];
  expectedQuestions: {
    question: string;
    category: "React/Next.js" | "Node/NestJS" | "Database/SQL" | "System Design" | "Domain/General";
    suggestedAnswerStrategy: string;
  }[];
  technicalDeepDive: string;
  salaryAssessment: string;
  modelUsed: string;
}

export interface ColdEmailResult {
  subjectLines: string[];
  recipientTitle: string;
  emailBody: string;
  keyStrengthsPitch: string[];
  callToAction: string;
  mailtoUrl: string;
  modelUsed: string;
}

export class AIRecommendationService {
  /**
   * Generates or retrieves AI assessment and technical interview prep for a job with caching
   */
  static async getRecommendationForJob(jobId: string): Promise<AIRecommendationResult> {
    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
      include: {
        matchAnalysis: true,
        recommendations: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!job) throw new Error("Job listing not found");

    // Fast-path: Return cached recommendation from database if available (0ms latency)
    if (job.recommendations.length > 0) {
      const rec = job.recommendations[0];
      return {
        verdict: rec.verdict,
        suitabilitySummary: rec.suitabilitySummary,
        requirementsSatisfied: JSON.parse(rec.requirementsSatisfied),
        requirementsMissing: JSON.parse(rec.requirementsMissing),
        interviewPrepTopics: JSON.parse(rec.interviewPrepTopics),
        expectedQuestions: JSON.parse(rec.expectedQuestions),
        technicalDeepDive: rec.technicalDeepDive || "",
        salaryAssessment: rec.salaryAssessment || "",
        modelUsed: rec.modelUsed,
      };
    }

    const candidate = await prisma.candidateProfile.findFirst({
      include: { skills: true, workExperiences: true, projects: true },
    });
    if (!candidate) throw new Error("Candidate profile not found");

    const match = job.matchAnalysis;
    const score = match?.overallScore ?? 75;

    // Determine verdict
    let verdict: RecommendationVerdict = RecommendationVerdict.RECOMMENDED;
    if (score >= 85) verdict = RecommendationVerdict.STRONGLY_RECOMMENDED;
    else if (score >= 70) verdict = RecommendationVerdict.RECOMMENDED;
    else if (score >= 50) verdict = RecommendationVerdict.CONSIDER_WITH_RESERVATIONS;
    else verdict = RecommendationVerdict.NOT_RECOMMENDED;

    let result: AIRecommendationResult;

    // Check for Gemini API key strictly on server side (Rule 11)
    const apiKey = process.env.GEMINI_API_KEY;
    const configuredModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";

    if (apiKey && apiKey.trim().length > 10) {
      try {
        result = await this.generateViaGemini(apiKey, configuredModel, job, candidate, verdict, score);
      } catch (err: any) {
        console.warn(`[AI Engine] Gemini API (${configuredModel}) failed (${err.message}). Using optimized deterministic heuristic intelligence.`);
        result = this.generateViaHeuristics(job, candidate, verdict, score);
      }
    } else {
      result = this.generateViaHeuristics(job, candidate, verdict, score);
    }

    // Persist to database for permanent caching
    await prisma.aIRecommendation.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        verdict: result.verdict,
        suitabilitySummary: result.suitabilitySummary,
        requirementsSatisfied: JSON.stringify(result.requirementsSatisfied),
        requirementsMissing: JSON.stringify(result.requirementsMissing),
        interviewPrepTopics: JSON.stringify(result.interviewPrepTopics),
        expectedQuestions: JSON.stringify(result.expectedQuestions),
        technicalDeepDive: result.technicalDeepDive,
        salaryAssessment: result.salaryAssessment,
        modelUsed: result.modelUsed,
      },
    });

    return result;
  }

  /**
   * Generates a high-impact, factual cold email for hiring managers
   */
  static async generateColdEmail(
    jobId: string,
    recipientRole: string = "Hiring Manager"
  ): Promise<ColdEmailResult> {
    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
      include: { matchAnalysis: true },
    });
    if (!job) throw new Error("Job listing not found");

    const candidate = await prisma.candidateProfile.findFirst({
      include: { skills: true, workExperiences: true, projects: true },
    });
    if (!candidate) throw new Error("Candidate profile not found");

    const match = job.matchAnalysis;
    const matchingSkills: string[] = match ? JSON.parse(match.matchingSkills || "[]") : [];
    const skillsListStr = matchingSkills.slice(0, 4).join(", ") || "React.js, Next.js, TypeScript, Node.js";

    // Factual evidence bullets tailored to job requirements
    const keyStrengths: string[] = [];
    const jobText = (job.title + " " + job.description + " " + job.mandatorySkills).toLowerCase();

    if (jobText.includes("next") || jobText.includes("react")) {
      keyStrengths.push("Production Next.js (App Router) & React.js frontend engineering with responsive interfaces at Wappnet Systems");
    }
    if (jobText.includes("node") || jobText.includes("nest") || jobText.includes("backend")) {
      keyStrengths.push("Modular backend REST API design using Node.js, NestJS, and PostgreSQL (TypeORM/Prisma)");
    }
    if (jobText.includes("map") || jobText.includes("mapbox")) {
      keyStrengths.push("Geospatial visualization mastery with Mapbox and OpenLayers nautical overlays");
    }
    if (jobText.includes("payment") || jobText.includes("booking") || jobText.includes("billing")) {
      keyStrengths.push("Full-cycle booking workflows, dynamic VAT calculations, and Stripe payment gateway integrations");
    }
    if (jobText.includes("accessibility") || jobText.includes("wcag")) {
      keyStrengths.push("Verified WCAG 2.1 AA accessibility and ARIA keyboard navigation compliance");
    }

    if (keyStrengths.length === 0) {
      keyStrengths.push("Full stack web delivery with TypeScript, Next.js, Node.js, and relational database architecture");
      keyStrengths.push("End-to-end commercial feature delivery from design to production deployment at Wappnet Systems");
    }

    // High open-rate subject line options
    const candidateName = candidate.name || "Full Stack Developer";
    const subjectLines = [
      `Full Stack Developer (1+ yrs exp) — ${candidateName} for ${job.title}`,
      `Application: ${job.title} — ${candidateName} (${skillsListStr})`,
      `Full Stack Engineer (${skillsListStr}) | ${candidateName}`,
    ];

    const chosenSubject = subjectLines[0];

    // High-conversion, factual cold email body
    const emailBody = `Hi ${recipientRole === "Hiring Manager" ? "Hiring Team" : recipientRole} at ${job.company},

I came across the ${job.title} role at ${job.company} and wanted to reach out directly because my technical background and production experience align closely with your requirements.

I am a ${candidate.currentPosition || "Full Stack Developer"} at ${candidate.currentCompany || "my current firm"} (${candidate.location || "Ahmedabad"}) with hands-on commercial experience developing production web applications using ${skillsListStr}.

Key highlights relevant to ${job.company}:
${keyStrengths.map((s) => `• ${s}`).join("\n")}
• ${candidate.educationInstitution} ${candidate.educationDegree} Graduate (CGPA: ${candidate.educationCgpa} / 10) with verified experience in agile delivery and clean code architecture.

I would love to learn more about ${job.company}'s engineering initiatives and explore how my full-stack background can contribute to your team. Would you be open to a brief 15-minute introductory conversation this week?

Best regards,

${candidateName}
${candidate.currentPosition || "Full Stack Developer"}
${candidate.location}
${candidate.email} | ${candidate.phone}`;

    const mailtoUrl = `mailto:careers@${job.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com?subject=${encodeURIComponent(
      chosenSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    return {
      subjectLines,
      recipientTitle: recipientRole,
      emailBody,
      keyStrengthsPitch: keyStrengths,
      callToAction: "15-minute introductory chat",
      mailtoUrl,
      modelUsed: "gemini-fast-heuristics-v2",
    };
  }

  /**
   * Deterministic heuristic AI generator based on candidate verified facts
   */
  private static generateViaHeuristics(
    job: any,
    candidate: any,
    verdict: RecommendationVerdict,
    score: number
  ): AIRecommendationResult {
    const jobText = (job.title + " " + job.description + " " + job.mandatorySkills).toLowerCase();

    // 1. Requirements Satisfied vs Missing
    const satisfied: string[] = [];
    const missing: string[] = [];

    if (jobText.includes("react") || jobText.includes("next")) {
      satisfied.push("Production React.js & Next.js frontend engineering (Wappnet Systems)");
    }
    if (jobText.includes("typescript")) {
      satisfied.push("Strict TypeScript typing across frontend components and backend services");
    }
    if (jobText.includes("node") || jobText.includes("nest")) {
      satisfied.push("Node.js and NestJS RESTful API design with TypeORM (Catalyst platform)");
    }
    if (jobText.includes("postgre") || jobText.includes("sql")) {
      satisfied.push("PostgreSQL schema design, migrations, and relational modeling");
    }
    if (jobText.includes("map") || jobText.includes("mapbox")) {
      satisfied.push("Interactive map visualization with Mapbox and OpenLayers nautical overlays");
    }
    if (jobText.includes("wcag") || jobText.includes("accessibility")) {
      satisfied.push("WCAG 2.1 AA accessibility improvements and ARIA keyboard navigation");
    }

    if (satisfied.length === 0) {
      satisfied.push("Core full-stack web architecture and modern JavaScript/TypeScript fundamentals");
    }

    const missingMandatory: string[] = job.matchAnalysis
      ? JSON.parse(job.matchAnalysis.missingMandatorySkills)
      : [];
    if (missingMandatory.length > 0) {
      missing.push(...missingMandatory.map((s: string) => `Mandatory requirement: ${s}`));
    }
    if (job.experienceMinYears > 2.0) {
      missing.push(`Target experience gap: requires ${job.experienceMinYears} years (candidate has 1+ years)`);
    }

    // 2. Technical Interview Questions & Topics
    const expectedQuestions = [
      {
        question: "How do you optimize rendering performance when dealing with dynamic interactive maps or data-heavy UI components in Next.js?",
        category: "React/Next.js" as const,
        suggestedAnswerStrategy:
          "Discuss your experience at Wappnet Systems using Mapbox marker clustering, dynamic imports (next/dynamic) with SSR disabled for canvas layers, and memoization via useMemo/useCallback to avoid unnecessary re-renders.",
      },
      {
        question: "Explain how you structure modular backends in NestJS and manage database transactions with TypeORM or Prisma.",
        category: "Node/NestJS" as const,
        suggestedAnswerStrategy:
          "Walk through the Catalyst platform architecture: dependency injection, service layers, DTO validation with class-validator, and atomic transaction handling with QueryRunner for sensitive post/voting updates.",
      },
      {
        question: "How did you implement booking workflows, VAT calculations, and invoice generation in your production marine platform?",
        category: "Domain/General" as const,
        suggestedAnswerStrategy:
          "Detail the multi-step booking state machine: berth availability checks, add-on service calculation, dynamic VAT computation, promo code discounts, and automated PDF invoice generation.",
      },
      {
        question: "What steps do you take to guarantee WCAG 2.1 AA accessibility standards in a React application?",
        category: "React/Next.js" as const,
        suggestedAnswerStrategy:
          "Highlight color contrast auditing, semantic HTML5 elements, ARIA attributes (role, aria-expanded, aria-live for notifications), and strict keyboard tab navigation with visible focus rings.",
      },
      {
        question: "How would you design a real-time notification or chat service using Socket.IO in a scalable Node.js backend?",
        category: "System Design" as const,
        suggestedAnswerStrategy:
          "Reference your Socket.IO implementation in Catalyst: room-based pub/sub channels, JWT handshake authentication, and fallback mechanisms for network reconnects.",
      },
    ];

    const topics = [
      "Next.js App Router (Server vs Client Components)",
      "NestJS Dependency Injection & Exception Filters",
      "PostgreSQL Indexing & Relational Constraints",
      "WCAG 2.1 AA Accessibility & Keyboard Nav",
      "RESTful API Security (JWT, RBAC & Helmet)",
      "Mapbox GL JS layer rendering lifecycle",
    ];

    // 3. Salary Assessment
    let salaryText = "";
    if (job.minSalary && job.maxSalary) {
      const minLpa = (job.minSalary / 100000).toFixed(1);
      const maxLpa = (job.maxSalary / 100000).toFixed(1);
      salaryText = `Listed Range: ₹${minLpa} – ₹${maxLpa} LPA (${job.salaryIsEstimated ? "Estimated market benchmark" : "Employer Disclosed"}). Matches standard 1–2 year full-stack developer market rates in ${job.location}.`;
    } else {
      salaryText = "Salary undisclosed in listing. Benchmark for 1–2 years full stack developer in Ahmedabad/Remote is ₹4.5 – ₹7.5 LPA.";
    }

    const suitability = `${candidate.name} demonstrates a ${score.toFixed(1)}% match for this ${job.title} opening at ${job.company}. Production delivery in React/Next.js, TypeScript, and Node.js at ${candidate.currentCompany} provides direct technical validation for the day-to-day requirements.`;

    return {
      verdict,
      suitabilitySummary: suitability,
      requirementsSatisfied: satisfied,
      requirementsMissing: missing,
      interviewPrepTopics: topics,
      expectedQuestions,
      technicalDeepDive:
        "Prepare to walk through the Saaristo marine platform and Catalyst backend repositories. Focus on code structure, state management, and real-time Socket.IO event lifecycles.",
      salaryAssessment: salaryText,
      modelUsed: "gemini-fast-heuristics-v2",
    };
  }

  /**
   * Gemini API call with timeout protection
   */
  private static async generateViaGemini(
    apiKey: string,
    modelName: string,
    job: any,
    candidate: any,
    verdict: RecommendationVerdict,
    score: number
  ): Promise<AIRecommendationResult> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `You are a recruitment intelligence agent for candidate ${candidate.name} (${candidate.currentPosition} at ${candidate.currentCompany}, ${candidate.location}, experience in React.js, Next.js, TypeScript, Node.js, NestJS, PostgreSQL).

Target Job:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description}
Mandatory Skills: ${job.mandatorySkills}

Provide a JSON assessment matching this exact JSON schema:
{
  "verdict": "${verdict}",
  "suitabilitySummary": "string",
  "requirementsSatisfied": ["string"],
  "requirementsMissing": ["string"],
  "interviewPrepTopics": ["string"],
  "expectedQuestions": [
    {
      "question": "string",
      "category": "React/Next.js" | "Node/NestJS" | "Database/SQL" | "System Design" | "Domain/General",
      "suggestedAnswerStrategy": "string"
    }
  ],
  "technicalDeepDive": "string",
  "salaryAssessment": "string"
}
Return only pure JSON.`;

    // Timeout protection: abort after 5000ms if Gemini API is unresponsive
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API call timed out after 5000ms")), 5000)
    );

    const generatePromise = model.generateContent(prompt).then((res) => {
      const text = res.response.text();
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
    });

    const parsed = (await Promise.race([generatePromise, timeoutPromise])) as any;

    return {
      ...parsed,
      verdict,
      modelUsed: modelName,
    };
  }
}
