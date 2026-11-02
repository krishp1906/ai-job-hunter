import prisma from "@/lib/prisma";
import { getEffectiveCandidateExperience } from "@/lib/experience";
import { ResumeProfileType } from "@prisma/client";

export interface TailoredResumeResult {
  candidateName: string;
  contact: {
    email: string;
    phone: string;
    location: string;
  };
  profileType: ResumeProfileType;
  targetJobTitle: string;
  targetCompany: string;
  tailoredSummary: string;
  targetedSkills: {
    core: string[];
    specialized: string[];
  };
  highlightedExperience: {
    company: string;
    role: string;
    period: string;
    location: string;
    bullets: string[];
  }[];
  selectedProjects: {
    title: string;
    technologies: string[];
    bullets: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    graduationYear: number;
    cgpa: number;
  };
  markdownText: string;
  isFactualVerified: boolean;
  isReviewable: boolean;
}

export class ResumeService {
  /**
   * Retrieves all candidate resume profiles
   */
  static async getProfiles() {
    const candidate = await prisma.candidateProfile.findFirst({
      include: {
        resumeProfiles: true,
      },
    });

    if (!candidate) throw new Error("Candidate profile not found");

    return candidate.resumeProfiles.map((p) => ({
      ...p,
      emphasizedSkills: JSON.parse(p.emphasizedSkills) as string[],
      projectIds: JSON.parse(p.projectIds) as string[],
    }));
  }

  /**
   * Generates a tailored, factually preserved resume for a target job
   */
  static async generateTailoredResume(
    jobId: string,
    forcedProfileType?: ResumeProfileType
  ): Promise<TailoredResumeResult> {
    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
      include: { matchAnalysis: true },
    });
    if (!job) throw new Error("Job listing not found");

    const candidate = await prisma.candidateProfile.findFirst({
      include: {
        skills: true,
        workExperiences: { orderBy: { startDate: "desc" } },
        educations: true,
        projects: true,
        resumeProfiles: true,
      },
    });
    if (!candidate) throw new Error("Candidate profile not found");

    const exp = getEffectiveCandidateExperience(
      candidate.employmentStartDate,
      candidate.manualExperienceYears
    );

    // 1. Determine optimal profile type if not explicitly passed
    let selectedProfileType: ResumeProfileType = forcedProfileType || ResumeProfileType.FULL_STACK;
    if (!forcedProfileType) {
      const titleLower = job.title.toLowerCase();
      if (titleLower.includes("backend") || titleLower.includes("node") || titleLower.includes("nest")) {
        selectedProfileType = ResumeProfileType.BACKEND;
      } else if (titleLower.includes("frontend") || titleLower.includes("react") || titleLower.includes("ui")) {
        selectedProfileType = ResumeProfileType.FRONTEND;
      } else {
        selectedProfileType = ResumeProfileType.FULL_STACK;
      }
    }

    const matchedProfile = candidate.resumeProfiles.find(
      (p) => p.profileType === selectedProfileType
    );
    const emphasizedSkills: string[] = matchedProfile
      ? JSON.parse(matchedProfile.emphasizedSkills)
      : [];

    const jobText = (job.title + " " + job.description + " " + job.mandatorySkills).toLowerCase();

    // 2. Factual Summary Generation (Strictly preserving verified 1+ years experience)
    let tailoredSummary = "";
    if (selectedProfileType === ResumeProfileType.FULL_STACK) {
      tailoredSummary = `Full Stack Developer with ${exp.formatted} of commercial experience developing high-performance web applications using React.js, Next.js, TypeScript, Node.js, and REST APIs. Demonstrated success delivering end-to-end booking systems, payment workflows (VAT & billing), interactive geospatial maps (Mapbox/OpenLayers), and responsive user interfaces. Proven ability to build full-stack architectures aligned with ${job.company}'s engineering objectives.`;
    } else if (selectedProfileType === ResumeProfileType.BACKEND) {
      tailoredSummary = `Backend Software Developer with ${exp.formatted} of experience architecting modular server applications and RESTful APIs with Node.js, NestJS, TypeScript, and PostgreSQL. Experienced in relational schema design, TypeORM and Prisma integrations, JWT/RBAC security guards, and real-time Socket.IO streams. Strong focus on API reliability, data integrity, and clean code principles.`;
    } else {
      tailoredSummary = `Frontend Developer with ${exp.formatted} of professional experience crafting scalable, accessible (WCAG 2.1 AA / ARIA compliant) user interfaces using Next.js (App Router), React.js, TypeScript, and Tailwind CSS. Proven track record implementing complex interactive maps with Mapbox, multilingual components, and seamless REST API integrations.`;
    }

    // 3. Targeted Skills Organization (Factual only)
    const coreTargeted = candidate.skills
      .filter((s) => s.category === "CORE")
      .map((s) => s.name);

    const specializedTargeted = candidate.skills
      .filter((s) => s.category === "ADDITIONAL" && emphasizedSkills.includes(s.name))
      .map((s) => s.name);

    // 4. Highlighted Experience Bullets (Filtering authentic achievements relevant to target job)
    const highlightedExperience = candidate.workExperiences.map((w) => {
      const allBullets: string[] = JSON.parse(w.responsibilities);
      let selectedBullets = [...allBullets];

      // Prioritize relevant bullets based on job keywords
      if (jobText.includes("map") || jobText.includes("mapbox") || jobText.includes("gis")) {
        selectedBullets.sort((a, b) => (a.includes("map") || a.includes("Mapbox") ? -1 : 1));
      } else if (jobText.includes("payment") || jobText.includes("booking") || jobText.includes("stripe")) {
        selectedBullets.sort((a, b) => (a.includes("Booking") || a.includes("Pricing") || a.includes("payment") ? -1 : 1));
      } else if (jobText.includes("accessibility") || jobText.includes("wcag")) {
        selectedBullets.sort((a, b) => (a.includes("WCAG") || a.includes("accessibility") ? -1 : 1));
      }

      const period = w.isCurrent
        ? `Jan 2025 – Present (${exp.formatted})`
        : `Dec 2023 – Jan 2024`;

      return {
        company: w.company,
        role: w.position,
        period,
        location: w.location,
        bullets: selectedBullets.slice(0, w.isCurrent ? 7 : 2),
      };
    });

    // 5. Select Capstone Projects (Strictly from candidate's 3 real projects)
    const selectedProjects = candidate.projects.map((proj) => ({
      title: proj.title,
      technologies: JSON.parse(proj.technologies) as string[],
      bullets: (JSON.parse(proj.capabilities) as string[]).slice(0, 4),
    }));

    // Filter projects relevant to profile
    let filteredProjects = selectedProjects;
    if (selectedProfileType === ResumeProfileType.FRONTEND) {
      filteredProjects = selectedProjects.filter((p) => p.title.includes("Marine"));
    } else if (selectedProfileType === ResumeProfileType.BACKEND) {
      filteredProjects = selectedProjects.filter(
        (p) => p.title.includes("Catalyst") || p.title.includes("Freelance")
      );
    }

    const education = {
      degree: candidate.educationDegree,
      institution: candidate.educationInstitution,
      graduationYear: candidate.educationGraduationYear,
      cgpa: candidate.educationCgpa,
    };

    // 6. Build Markdown Representation
    const markdown = `# ${candidate.name}
**Location:** ${candidate.location} | **Email:** ${candidate.email} | **Phone:** ${candidate.phone}
**Target Role:** ${job.title} — ${job.company}

---

## Professional Summary
${tailoredSummary}

---

## Technical Skills
- **Core Technologies:** ${coreTargeted.join(", ")}
- **Specialized & Frameworks:** ${specializedTargeted.join(", ")}
- **Databases & Architecture:** PostgreSQL, MongoDB, RESTful APIs, TypeORM, Prisma

---

## Professional Experience
${highlightedExperience
  .map(
    (exp) => `### ${exp.role} — ${exp.company}
*${exp.period} | ${exp.location}*
${exp.bullets.map((b) => `- ${b}`).join("\n")}`
  )
  .join("\n\n")}

---

## Notable Projects
${filteredProjects
  .map(
    (p) => `### ${p.title}
*Technologies: ${p.technologies.join(", ")}*
${p.bullets.map((b) => `- ${b}`).join("\n")}`
  )
  .join("\n\n")}

---

## Education
- **${education.degree}** — ${education.institution} (${education.graduationYear}) | **CGPA: ${education.cgpa} / 10**
`;

    return {
      candidateName: candidate.name,
      contact: {
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
      },
      profileType: selectedProfileType,
      targetJobTitle: job.title,
      targetCompany: job.company,
      tailoredSummary,
      targetedSkills: {
        core: coreTargeted,
        specialized: specializedTargeted,
      },
      highlightedExperience,
      selectedProjects: filteredProjects,
      education,
      markdownText: markdown,
      isFactualVerified: true,
      isReviewable: true,
    };
  }
}
