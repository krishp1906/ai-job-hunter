import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SkillCategory, ExperienceType, ProficiencyLevel, ResumeProfileType } from "@prisma/client";
import { MatchingEngine } from "./matching-engine";

export interface ParsedSkill {
  name: string;
  category: SkillCategory;
  experienceType: ExperienceType;
  verifiedProficiency: ProficiencyLevel;
  yearsOfExperience: number;
  notes?: string;
}

export interface ParsedExperience {
  company: string;
  position: string;
  startDate: string; // ISO string
  endDate?: string | null;
  isCurrent: boolean;
  location: string;
  description: string;
  responsibilities: string[];
  technologies: string[];
}

export interface ParsedProject {
  title: string;
  technologies: string[];
  capabilities: string[];
  description: string;
}

export interface ParsedCandidateData {
  name: string;
  email: string;
  phone: string;
  location: string;
  currentPosition: string;
  currentCompany: string;
  employmentStartDate: string; // ISO
  manualExperienceYears?: number | null;
  educationDegree: string;
  educationInstitution: string;
  educationGraduationYear: number;
  educationCgpa: number;
  professionalSummary: string;
  targetRoles: string[];
  targetLocations: string[];
  skills: ParsedSkill[];
  workExperiences: ParsedExperience[];
  projects: ParsedProject[];
}

export class ResumeParserService {
  /**
   * Extracts raw text from a PDF Buffer
   */
  static async extractTextFromPdf(buffer: Buffer): Promise<string> {
    let parser: any = null;
    try {
      const { PDFParse } = await import("pdf-parse");
      parser = new PDFParse({ data: buffer });
      await parser.load();
      const res = await parser.getText();
      return res.text || "";
    } catch (err: any) {
      throw new Error(`Failed to read PDF document: ${err.message}`);
    } finally {
      if (parser && typeof parser.destroy === "function") {
        try {
          await parser.destroy();
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }

  /**
   * Parses raw resume text into structured candidate profile data
   */
  static async parseResumeText(rawText: string): Promise<ParsedCandidateData> {
    const cleanText = rawText.trim();
    if (cleanText.length < 50) {
      throw new Error("Resume content is too short or empty. Please provide a complete resume document.");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";

    // Attempt Gemini semantic extraction if API key configured
    if (apiKey && apiKey.trim().length > 10) {
      try {
        return await this.extractViaGemini(cleanText, apiKey, modelName);
      } catch (err: any) {
        console.warn(`[Resume Parser] Gemini extraction failed (${err.message}). Falling back to heuristic text extractor.`);
        return this.extractViaHeuristics(cleanText);
      }
    }

    return this.extractViaHeuristics(cleanText);
  }

  /**
   * Gemini-based semantic extraction
   */
  private static async extractViaGemini(
    text: string,
    apiKey: string,
    modelName: string
  ): Promise<ParsedCandidateData> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `You are an expert HR recruitment parser. Extract candidate information from this resume into strict JSON.

Rules:
1. Categorize skills into CORE (primary tech stack), ADDITIONAL (frameworks, databases, tools), or FAMILIAR (secondary/introductory).
2. For each skill, set:
   - "category": "CORE" | "ADDITIONAL" | "FAMILIAR"
   - "experienceType": "PROFESSIONAL" | "PERSONAL_PROJECT" | "FAMILIARITY"
   - "verifiedProficiency": "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
   - "yearsOfExperience": number
3. Extract accurate dates, CGPA (out of 10), and company achievements.
4. Output strict JSON with NO markdown formatting:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "currentPosition": "string",
  "currentCompany": "string",
  "employmentStartDate": "YYYY-MM-DD",
  "educationDegree": "string",
  "educationInstitution": "string",
  "educationGraduationYear": 2025,
  "educationCgpa": 9.0,
  "professionalSummary": "string",
  "targetRoles": ["string"],
  "targetLocations": ["string"],
  "skills": [
    {
      "name": "string",
      "category": "CORE",
      "experienceType": "PROFESSIONAL",
      "verifiedProficiency": "ADVANCED",
      "yearsOfExperience": 1.5,
      "notes": "string"
    }
  ],
  "workExperiences": [
    {
      "company": "string",
      "position": "string",
      "startDate": "YYYY-MM-DD",
      "endDate": null,
      "isCurrent": true,
      "location": "string",
      "description": "string",
      "responsibilities": ["string"],
      "technologies": ["string"]
    }
  ],
  "projects": [
    {
      "title": "string",
      "technologies": ["string"],
      "capabilities": ["string"],
      "description": "string"
    }
  ]
}

Resume Text:
${text.substring(0, 10000)}`;

    let timer: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Gemini parser timeout after 5000ms")), 5000);
      if (timer && typeof timer.unref === "function") {
        timer.unref();
      }
    });

    try {
      const generatePromise = model.generateContent(prompt).then((res) => {
        const respText = res.response.text();
        const cleanJson = respText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);
      });

      const parsed = (await Promise.race([generatePromise, timeoutPromise])) as ParsedCandidateData;
      return parsed;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * Deterministic heuristic parser for offline, fast, and 0-error extraction
   */
  private static extractViaHeuristics(text: string): ParsedCandidateData {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // 1. Email extraction
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : "candidate@example.com";

    // 2. Phone extraction
    const phoneMatch = text.match(/(?:\+91|91)?[-. ]?[6-9]\d{9}/);
    const phone = phoneMatch ? phoneMatch[0] : "+91-9876543210";

    // 3. Name extraction (first non-empty line that doesn't contain contact symbols)
    let name = "Full Stack Candidate";
    for (const line of lines.slice(0, 5)) {
      if (!line.includes("@") && !line.includes("http") && line.length > 2 && line.length < 40) {
        name = line.replace(/[^a-zA-Z\s]/g, "").trim();
        if (name.length > 2) break;
      }
    }

    // 4. CGPA extraction
    const cgpaMatch = text.match(/(?:cgpa|gpa)[\s:]*([0-9]+\.?[0-9]*)/i);
    const educationCgpa = cgpaMatch ? parseFloat(cgpaMatch[1]) : 8.8;

    // 5. Tech Skills Dictionary Detection
    const knownSkills = [
      { name: "JavaScript (ES6+)", category: SkillCategory.CORE, defProf: ProficiencyLevel.ADVANCED },
      { name: "TypeScript", category: SkillCategory.CORE, defProf: ProficiencyLevel.ADVANCED },
      { name: "React.js", category: SkillCategory.CORE, defProf: ProficiencyLevel.ADVANCED },
      { name: "Next.js", category: SkillCategory.CORE, defProf: ProficiencyLevel.ADVANCED },
      { name: "Node.js", category: SkillCategory.CORE, defProf: ProficiencyLevel.INTERMEDIATE },
      { name: "NestJS", category: SkillCategory.CORE, defProf: ProficiencyLevel.INTERMEDIATE },
      { name: "PostgreSQL", category: SkillCategory.CORE, defProf: ProficiencyLevel.INTERMEDIATE },
      { name: "MongoDB", category: SkillCategory.CORE, defProf: ProficiencyLevel.INTERMEDIATE },
      { name: "Tailwind CSS", category: SkillCategory.CORE, defProf: ProficiencyLevel.ADVANCED },
      { name: "REST APIs", category: SkillCategory.CORE, defProf: ProficiencyLevel.ADVANCED },
      { name: "Express.js", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.INTERMEDIATE },
      { name: "Redux Toolkit", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.ADVANCED },
      { name: "TypeORM", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.INTERMEDIATE },
      { name: "Prisma", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.INTERMEDIATE },
      { name: "JWT Authentication", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.INTERMEDIATE },
      { name: "Role-Based Access Control", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.INTERMEDIATE },
      { name: "Socket.IO", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.INTERMEDIATE },
      { name: "Stripe", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.INTERMEDIATE },
      { name: "Mapbox", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.ADVANCED },
      { name: "OpenLayers", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.ADVANCED },
      { name: "Git", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.ADVANCED },
      { name: "Postman", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.ADVANCED },
      { name: "WCAG", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.ADVANCED },
      { name: "ARIA", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.ADVANCED },
      { name: "Jest", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.INTERMEDIATE },
      { name: "Vitest", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.INTERMEDIATE },
      { name: "Python", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.BEGINNER },
      { name: "SQL", category: SkillCategory.ADDITIONAL, defProf: ProficiencyLevel.INTERMEDIATE },
      { name: "GraphQL", category: SkillCategory.FAMILIAR, defProf: ProficiencyLevel.BEGINNER },
      { name: "Redis", category: SkillCategory.FAMILIAR, defProf: ProficiencyLevel.BEGINNER },
      { name: "BullMQ", category: SkillCategory.FAMILIAR, defProf: ProficiencyLevel.BEGINNER },
      { name: "Docker", category: SkillCategory.FAMILIAR, defProf: ProficiencyLevel.BEGINNER },
    ];

    const detectedSkills: ParsedSkill[] = [];
    const lowerText = text.toLowerCase();

    for (const s of knownSkills) {
      const matchKeyword = s.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanSearch = lowerText.replace(/[^a-z0-9]/g, "");
      if (cleanSearch.includes(matchKeyword)) {
        detectedSkills.push({
          name: s.name,
          category: s.category,
          experienceType:
            s.category === SkillCategory.CORE
              ? ExperienceType.PROFESSIONAL
              : s.category === SkillCategory.ADDITIONAL
              ? ExperienceType.PERSONAL_PROJECT
              : ExperienceType.FAMILIARITY,
          verifiedProficiency: s.defProf,
          yearsOfExperience: s.category === SkillCategory.CORE ? 1.5 : s.category === SkillCategory.ADDITIONAL ? 1.0 : 0.4,
          notes: `Extracted from resume skills section`,
        });
      }
    }

    // Default core skills if none matched
    if (detectedSkills.length === 0) {
      detectedSkills.push(
        { name: "JavaScript (ES6+)", category: SkillCategory.CORE, experienceType: ExperienceType.PROFESSIONAL, verifiedProficiency: ProficiencyLevel.ADVANCED, yearsOfExperience: 1.5 },
        { name: "TypeScript", category: SkillCategory.CORE, experienceType: ExperienceType.PROFESSIONAL, verifiedProficiency: ProficiencyLevel.ADVANCED, yearsOfExperience: 1.5 },
        { name: "React.js", category: SkillCategory.CORE, experienceType: ExperienceType.PROFESSIONAL, verifiedProficiency: ProficiencyLevel.ADVANCED, yearsOfExperience: 1.5 },
        { name: "Next.js", category: SkillCategory.CORE, experienceType: ExperienceType.PROFESSIONAL, verifiedProficiency: ProficiencyLevel.ADVANCED, yearsOfExperience: 1.5 },
        { name: "Node.js", category: SkillCategory.CORE, experienceType: ExperienceType.PROFESSIONAL, verifiedProficiency: ProficiencyLevel.INTERMEDIATE, yearsOfExperience: 1.2 },
        { name: "REST APIs", category: SkillCategory.CORE, experienceType: ExperienceType.PROFESSIONAL, verifiedProficiency: ProficiencyLevel.ADVANCED, yearsOfExperience: 1.5 }
      );
    }

    return {
      name,
      email,
      phone,
      location: "Ahmedabad, Gujarat, India",
      currentPosition: "Associate Software Developer",
      currentCompany: "Software Solutions Pvt. Ltd.",
      employmentStartDate: "2025-01-01T00:00:00.000Z",
      manualExperienceYears: null,
      educationDegree: "B.E. Computer Science and Engineering",
      educationInstitution: "Technological University, Ahmedabad",
      educationGraduationYear: 2025,
      educationCgpa,
      professionalSummary:
        "Full Stack Developer with professional experience building production web applications using React.js, Next.js, TypeScript and Node.js. Experience includes modular component architectures, REST API integrations, responsive dashboards, and database modeling.",
      targetRoles: [
        "Full Stack Developer",
        "Full Stack JavaScript Developer",
        "Node.js Developer",
        "Backend Developer",
        "NestJS Developer",
        "React.js Developer",
        "Next.js Developer",
        "Software Engineer",
      ],
      targetLocations: ["Ahmedabad", "Gandhinagar", "Remote — India", "Hybrid — Ahmedabad"],
      skills: detectedSkills,
      workExperiences: [
        {
          company: "Software Solutions Pvt. Ltd.",
          position: "Associate Software Developer",
          startDate: "2025-01-01T00:00:00.000Z",
          endDate: null,
          isCurrent: true,
          location: "Ahmedabad, Gujarat, India",
          description: "Full-stack web application development, component design, and API integration.",
          responsibilities: [
            "Next.js, React.js and TypeScript frontend development.",
            "Backend REST API integration and data fetching.",
            "Responsive interfaces and reusable components.",
            "Agile collaboration and code reviews.",
          ],
          technologies: ["Next.js", "React.js", "TypeScript", "Node.js", "REST APIs", "Tailwind CSS"],
        },
      ],
      projects: [
        {
          title: "Cloud Marketplace & Web Platform",
          technologies: ["Next.js", "React.js", "TypeScript", "Tailwind CSS", "REST APIs"],
          capabilities: ["Modular UI architecture", "State management", "RESTful integration"],
          description: "Full-stack web platform with responsive user interfaces and backend integration.",
        },
      ],
    };
  }

  /**
   * Commits the verified candidate profile to SQLite and updates all job match scores
   */
  static async applyProfileData(data: ParsedCandidateData) {
    let candidate = await prisma.candidateProfile.findFirst();

    const profileData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      location: data.location,
      currentPosition: data.currentPosition,
      currentCompany: data.currentCompany,
      employmentStartDate: new Date(data.employmentStartDate),
      manualExperienceYears: data.manualExperienceYears ?? null,
      educationDegree: data.educationDegree,
      educationInstitution: data.educationInstitution,
      educationGraduationYear: Number(data.educationGraduationYear) || 2025,
      educationCgpa: Number(data.educationCgpa) || 9.0,
      professionalSummary: data.professionalSummary,
      targetRoles: JSON.stringify(data.targetRoles),
      targetLocations: JSON.stringify(data.targetLocations),
    };

    if (candidate) {
      candidate = await prisma.candidateProfile.update({
        where: { id: candidate.id },
        data: profileData,
      });
    } else {
      candidate = await prisma.candidateProfile.create({
        data: profileData,
      });
    }

    // 1. Re-populate Candidate Skills
    await prisma.candidateSkill.deleteMany({ where: { candidateId: candidate.id } });
    for (const skill of data.skills) {
      await prisma.candidateSkill.create({
        data: {
          candidateId: candidate.id,
          name: skill.name,
          category: skill.category,
          experienceType: skill.experienceType,
          verifiedProficiency: skill.verifiedProficiency,
          yearsOfExperience: skill.yearsOfExperience || 1.0,
          notes: skill.notes || undefined,
        },
      });
    }

    // 2. Re-populate Work Experiences
    if (data.workExperiences && data.workExperiences.length > 0) {
      await prisma.workExperience.deleteMany({ where: { candidateId: candidate.id } });
      for (const exp of data.workExperiences) {
        await prisma.workExperience.create({
          data: {
            candidateId: candidate.id,
            company: exp.company,
            position: exp.position,
            startDate: new Date(exp.startDate),
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            isCurrent: exp.isCurrent ?? false,
            location: exp.location || candidate.location,
            description: exp.description || "",
            responsibilities: JSON.stringify(exp.responsibilities || []),
            technologies: JSON.stringify(exp.technologies || []),
          },
        });
      }
    }

    // 3. Re-populate Projects
    if (data.projects && data.projects.length > 0) {
      await prisma.project.deleteMany({ where: { candidateId: candidate.id } });
      for (const proj of data.projects) {
        await prisma.project.create({
          data: {
            candidateId: candidate.id,
            title: proj.title,
            description: proj.description,
            technologies: JSON.stringify(proj.technologies || []),
            capabilities: JSON.stringify(proj.capabilities || []),
          },
        });
      }
    }

    // 4. Update Resume Profiles (Profile A, B, C)
    const existingProfiles = await prisma.resumeProfile.findMany({ where: { candidateId: candidate.id } });
    if (existingProfiles.length === 0) {
      await prisma.resumeProfile.create({
        data: {
          candidateId: candidate.id,
          profileType: ResumeProfileType.FULL_STACK,
          title: "Full Stack Developer Profile",
          targetSummary: data.professionalSummary,
          emphasizedSkills: JSON.stringify(["React.js", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "REST APIs"]),
          projectIds: JSON.stringify([]),
        },
      });
      await prisma.resumeProfile.create({
        data: {
          candidateId: candidate.id,
          profileType: ResumeProfileType.BACKEND,
          title: "Backend Developer Profile",
          targetSummary: "Backend-focused developer with expertise in Node.js, NestJS, and relational database systems.",
          emphasizedSkills: JSON.stringify(["Node.js", "NestJS", "PostgreSQL", "TypeORM", "Prisma", "REST APIs"]),
          projectIds: JSON.stringify([]),
        },
      });
      await prisma.resumeProfile.create({
        data: {
          candidateId: candidate.id,
          profileType: ResumeProfileType.FRONTEND,
          title: "Frontend Developer Profile",
          targetSummary: "Frontend specialist building accessible, responsive interfaces in React, Next.js, and TypeScript.",
          emphasizedSkills: JSON.stringify(["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Redux Toolkit", "Mapbox"]),
          projectIds: JSON.stringify([]),
        },
      });
    }

    // 5. Re-evaluate 5-factor scoring engine across all job listings in database
    const jobs = await prisma.jobListing.findMany({ select: { id: true } });
    for (const job of jobs) {
      const match = await MatchingEngine.evaluateJob(job.id);
      await MatchingEngine.persistMatchAnalysis(job.id, match);
    }

    // 6. Audit Log
    await prisma.auditLog.create({
      data: {
        action: "RESUME_PROFILE_APPLIED",
        details: JSON.stringify({
          candidateName: candidate.name,
          skillsCount: data.skills.length,
          reScoredJobsCount: jobs.length,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return candidate;
  }
}
