import prisma from "@/lib/prisma";
import { getEffectiveCandidateExperience } from "@/lib/experience";
import { WorkArrangement } from "@prisma/client";

export interface MatchResult {
  overallScore: number;
  technicalScore: number;
  experienceScore: number;
  responsibilityScore: number;
  roleScore: number;
  locationScore: number;
  matchingSkills: string[];
  missingMandatorySkills: string[];
  missingPreferredSkills: string[];
  experienceGap: number;
  roleSuitability: "HIGH" | "MEDIUM" | "LOW";
  locationCompatibility: "FULL_MATCH" | "REMOTE_ONLY" | "RELOCATION_REQUIRED" | "INCOMPATIBLE";
  reasonsToApply: string[];
  reasonsNotToApply: string[];
  scoringExplanation: string;
}

export class MatchingEngine {
  /**
   * Evaluates a job listing against candidate profile
   */
  static async evaluateJob(jobId: string, candidateId?: string): Promise<MatchResult> {
    const job = await prisma.jobListing.findUnique({ where: { id: jobId } });
    if (!job) throw new Error("Job listing not found");

    const candidate = candidateId
      ? await prisma.candidateProfile.findUnique({
          where: { id: candidateId },
          include: { skills: true, workExperiences: true, projects: true },
        })
      : await prisma.candidateProfile.findFirst({
          include: { skills: true, workExperiences: true, projects: true },
        });

    if (!candidate) throw new Error("Candidate profile not found");

    const exp = getEffectiveCandidateExperience(
      candidate.employmentStartDate,
      candidate.manualExperienceYears
    );
    const candidateYears = exp.decimalYears;

    const candidateSkillsMap = new Map<string, (typeof candidate.skills)[0]>();
    for (const s of candidate.skills) {
      candidateSkillsMap.set(s.name.toLowerCase().trim(), s);
    }

    // Helper: Normalize skill string for fuzzy matching
    const findSkillMatch = (skillName: string) => {
      const lower = skillName.toLowerCase().trim();
      if (candidateSkillsMap.has(lower)) return candidateSkillsMap.get(lower);

      for (const [key, value] of candidateSkillsMap.entries()) {
        if (key.includes(lower) || lower.includes(key)) return value;
        // Specific aliases
        if (lower === "react" && key.includes("react")) return value;
        if (lower === "next" && key.includes("next")) return value;
        if (lower === "node" && key.includes("node")) return value;
        if (lower === "nest" && key.includes("nest")) return value;
        if (lower === "postgres" && key.includes("postgres")) return value;
        if (lower === "mongo" && key.includes("mongo")) return value;
      }
      return null;
    };

    const mandatorySkillsList: string[] = JSON.parse(job.mandatorySkills || "[]");
    const preferredSkillsList: string[] = JSON.parse(job.preferredSkills || "[]");

    const matchingSkills: string[] = [];
    const missingMandatorySkills: string[] = [];
    const missingPreferredSkills: string[] = [];
    const reasonsToApply: string[] = [];
    const reasonsNotToApply: string[] = [];

    // 1. Technical Score Calculation (35%)
    let mandatoryPoints = 0;
    let mandatoryTotal = mandatorySkillsList.length || 1;
    let preferredPoints = 0;
    let preferredTotal = preferredSkillsList.length || 1;

    for (const skill of mandatorySkillsList) {
      const match = findSkillMatch(skill);
      if (match) {
        matchingSkills.push(match.name);
        // Penalize if candidate only listed it as FAMILIARITY / BEGINNER when mandatory
        if (match.category === "FAMILIAR" || match.verifiedProficiency === "BEGINNER") {
          mandatoryPoints += 0.20; // Heavy reduction for familiar-only on mandatory requirement
          reasonsNotToApply.push(
            `Job mandates '${skill}', but candidate only lists this as familiar/introductory (${match.verifiedProficiency}).`
          );
        } else if (match.experienceType === "PROFESSIONAL") {
          mandatoryPoints += 1.0;
        } else {
          // Personal project experience
          mandatoryPoints += 0.85;
        }
      } else {
        missingMandatorySkills.push(skill);
        reasonsNotToApply.push(`Missing mandatory requirement: ${skill}.`);
      }
    }

    for (const skill of preferredSkillsList) {
      const match = findSkillMatch(skill);
      if (match) {
        if (!matchingSkills.includes(match.name)) matchingSkills.push(match.name);
        if (match.category === "FAMILIAR") {
          preferredPoints += 0.4;
        } else {
          preferredPoints += 1.0;
        }
      } else {
        missingPreferredSkills.push(skill);
      }
    }

    const mandatoryScore = (mandatoryPoints / mandatoryTotal) * 100;
    const preferredScore = preferredSkillsList.length > 0 ? (preferredPoints / preferredTotal) * 100 : mandatoryScore;
    const technicalScore = Math.min(100, Math.round(mandatoryScore * 0.75 + preferredScore * 0.25));

    // 2. Professional Experience Compatibility (20%)
    const minExp = job.experienceMinYears;
    const expGap = Math.max(0, Math.round((minExp - candidateYears) * 10) / 10);
    let experienceScore = 100;

    if (minExp <= 2.0) {
      experienceScore = 95;
      reasonsToApply.push(`Target experience of ${minExp} yrs matches candidate's ${exp.formatted}.`);
    } else if (minExp <= 3.0) {
      experienceScore = 82;
      reasonsToApply.push(`Accessible secondary target: ${minExp} yrs requirement is within reach of candidate's 1+ yrs.`);
    } else if (minExp <= 5.0) {
      experienceScore = 50;
      reasonsNotToApply.push(`Requires ${minExp}+ years experience (${expGap} yr gap). May be mid/senior-level.`);
    } else {
      // Senior positions (>5 years)
      experienceScore = 5;
      reasonsNotToApply.push(`Senior position requiring ${minExp}+ years. Substantial experience gap (${expGap} years).`);
    }

    // 3. Job Responsibilities Compatibility (20%)
    let responsibilityPoints = minExp > 5.0 ? 15 : 70; // lower baseline for senior/executive roles
    const jobText = (job.description + " " + job.responsibilities).toLowerCase();

    // Check capability intersections
    if (jobText.includes("booking") || jobText.includes("reservation") || jobText.includes("payment") || jobText.includes("stripe")) {
      responsibilityPoints += 8;
      reasonsToApply.push("Proven expertise delivering production booking, payment & VAT workflows at Wappnet Systems.");
    }
    if (jobText.includes("map") || jobText.includes("mapbox") || jobText.includes("gis") || jobText.includes("openlayers")) {
      responsibilityPoints += 8;
      reasonsToApply.push("Distinct competitive advantage with Mapbox & OpenLayers interactive map development.");
    }
    if (jobText.includes("accessible") || jobText.includes("accessibility") || jobText.includes("wcag") || jobText.includes("aria")) {
      responsibilityPoints += 8;
      reasonsToApply.push("Direct commercial experience with WCAG 2.1 AA accessibility and screen-reader standards.");
    }
    if (jobText.includes("dashboard") || jobText.includes("admin") || jobText.includes("portal")) {
      responsibilityPoints += 5;
    }
    if (jobText.includes("socket") || jobText.includes("real-time") || jobText.includes("realtime") || jobText.includes("websocket")) {
      responsibilityPoints += 5;
    }

    const responsibilityScore = Math.min(98, Math.max(30, responsibilityPoints));

    // 4. Role Compatibility (15%)
    let roleScore = 75;
    let roleSuitability: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
    const titleLower = job.title.toLowerCase();

    const priority1Titles = [
      "full stack",
      "fullstack",
      "node.js",
      "node developer",
      "backend developer",
      "nestjs",
      "react.js",
      "react developer",
      "next.js",
      "next developer",
      "software engineer",
      "javascript developer",
      "typescript developer",
    ];

    const priority2Titles = [
      "python",
      "api developer",
      "junior software engineer",
      "backend software engineer",
      "ai application",
    ];

    if (priority1Titles.some((t) => titleLower.includes(t))) {
      roleScore = 95;
      roleSuitability = "HIGH";
      reasonsToApply.push(`Role title '${job.title}' directly matches Priority 1 career target.`);
    } else if (priority2Titles.some((t) => titleLower.includes(t))) {
      roleScore = 82;
      roleSuitability = "HIGH";
      reasonsToApply.push(`Role title '${job.title}' aligns with Priority 2 secondary career target.`);
    } else if (titleLower.includes("senior") || titleLower.includes("lead") || titleLower.includes("architect")) {
      roleScore = 30;
      roleSuitability = "LOW";
      reasonsNotToApply.push("Senior/Lead title indicates organizational expectations beyond 1-2 years experience.");
    } else {
      roleScore = 55;
      roleSuitability = "MEDIUM";
    }

    // 5. Location and Work Arrangement Compatibility (10%)
    let locationScore = 60;
    let locationCompatibility: "FULL_MATCH" | "REMOTE_ONLY" | "RELOCATION_REQUIRED" | "INCOMPATIBLE" = "FULL_MATCH";
    const locLower = job.location.toLowerCase();

    if (job.workArrangement === WorkArrangement.REMOTE) {
      locationScore = 95;
      locationCompatibility = "REMOTE_ONLY";
      reasonsToApply.push("Remote work arrangement offers full geographical flexibility.");
    } else if (locLower.includes("ahmedabad")) {
      locationScore = 100;
      locationCompatibility = "FULL_MATCH";
      reasonsToApply.push("Located in Ahmedabad (candidate's home base and #1 location priority).");
    } else if (locLower.includes("gandhinagar")) {
      locationScore = 95;
      locationCompatibility = "FULL_MATCH";
      reasonsToApply.push("Located in Gandhinagar (#2 location priority, easy commute from Ahmedabad).");
    } else {
      locationScore = 40;
      locationCompatibility = "RELOCATION_REQUIRED";
      reasonsNotToApply.push(`Location is in ${job.location} with ${job.workArrangement} arrangement, requiring relocation.`);
    }

    // Overall Weighted Calculation
    // Technical: 35%, Experience: 20%, Responsibilities: 20%, Role: 15%, Location: 10%
    const rawOverall =
      technicalScore * 0.35 +
      experienceScore * 0.20 +
      responsibilityScore * 0.20 +
      roleScore * 0.15 +
      locationScore * 0.10;

    const overallScore = Math.round(rawOverall * 10) / 10;

    // Deduplicate reasons
    const uniqueReasonsToApply = Array.from(new Set(reasonsToApply));
    const uniqueReasonsNotToApply = Array.from(new Set(reasonsNotToApply));

    // Human-Readable Scoring Explanation
    let scoringExplanation = "";
    if (overallScore >= 80) {
      scoringExplanation = `High match (${overallScore}%): Strong compatibility across core technologies (${matchingSkills.slice(0, 4).join(", ")}) and target role level. Candidate satisfies critical requirements with verified experience.`;
    } else if (overallScore >= 65) {
      scoringExplanation = `Moderate match (${overallScore}%): Reasonable technical alignment, but with specific gaps: ${
        missingMandatorySkills.length > 0 ? `missing ${missingMandatorySkills.join(", ")}` : "experience or location adjustments required"
      }.`;
    } else {
      scoringExplanation = `Low match (${overallScore}%): Does not align with candidate's current career trajectory due to ${
        expGap > 2 ? `seniority requirement (${minExp}+ yrs)` : "divergent tech stack or location constraints"
      }. Recommended to bypass.`;
    }

    return {
      overallScore,
      technicalScore,
      experienceScore,
      responsibilityScore,
      roleScore,
      locationScore,
      matchingSkills,
      missingMandatorySkills,
      missingPreferredSkills,
      experienceGap: expGap,
      roleSuitability,
      locationCompatibility,
      reasonsToApply: uniqueReasonsToApply,
      reasonsNotToApply: uniqueReasonsNotToApply,
      scoringExplanation,
    };
  }

  /**
   * Persists or updates match analysis for a job in SQLite
   */
  static async persistMatchAnalysis(jobId: string, match: MatchResult, candidateId?: string) {
    const candidate = candidateId
      ? await prisma.candidateProfile.findUnique({ where: { id: candidateId } })
      : await prisma.candidateProfile.findFirst();

    if (!candidate) throw new Error("Candidate profile not found");

    return prisma.jobMatchAnalysis.upsert({
      where: { jobId },
      update: {
        overallScore: match.overallScore,
        technicalScore: match.technicalScore,
        experienceScore: match.experienceScore,
        responsibilityScore: match.responsibilityScore,
        roleScore: match.roleScore,
        locationScore: match.locationScore,
        matchingSkills: JSON.stringify(match.matchingSkills),
        missingMandatorySkills: JSON.stringify(match.missingMandatorySkills),
        missingPreferredSkills: JSON.stringify(match.missingPreferredSkills),
        experienceGap: match.experienceGap,
        roleSuitability: match.roleSuitability,
        locationCompatibility: match.locationCompatibility,
        reasonsToApply: JSON.stringify(match.reasonsToApply),
        reasonsNotToApply: JSON.stringify(match.reasonsNotToApply),
        scoringExplanation: match.scoringExplanation,
        calculatedAt: new Date(),
      },
      create: {
        jobId,
        candidateId: candidate.id,
        overallScore: match.overallScore,
        technicalScore: match.technicalScore,
        experienceScore: match.experienceScore,
        responsibilityScore: match.responsibilityScore,
        roleScore: match.roleScore,
        locationScore: match.locationScore,
        matchingSkills: JSON.stringify(match.matchingSkills),
        missingMandatorySkills: JSON.stringify(match.missingMandatorySkills),
        missingPreferredSkills: JSON.stringify(match.missingPreferredSkills),
        experienceGap: match.experienceGap,
        roleSuitability: match.roleSuitability,
        locationCompatibility: match.locationCompatibility,
        reasonsToApply: JSON.stringify(match.reasonsToApply),
        reasonsNotToApply: JSON.stringify(match.reasonsNotToApply),
        scoringExplanation: match.scoringExplanation,
      },
    });
  }
}
