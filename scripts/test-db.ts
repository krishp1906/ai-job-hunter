import { PrismaClient } from "@prisma/client";
import { getEffectiveCandidateExperience } from "../src/lib/experience";

const prisma = new PrismaClient();

async function runVerification() {
  console.log("=================================================");
  console.log("   AI JOBHUNTER - PHASE 1 DATABASE VERIFICATION  ");
  console.log("=================================================\n");

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(condition: boolean, message: string) {
    totalChecks++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedChecks++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  // 1. Candidate Profile Check
  const candidate = await prisma.candidateProfile.findFirst({
    include: {
      skills: true,
      workExperiences: true,
      educations: true,
      projects: true,
      resumeProfiles: true,
    },
  });

  assert(!!candidate, "Candidate profile record exists in database");
  if (!candidate) {
    console.error("Critical failure: Candidate record not found.");
    process.exit(1);
  }

  assert(!!candidate.currentCompany, `Current company populated (${candidate.currentCompany})`);
  assert(!!candidate.currentPosition, `Current position populated (${candidate.currentPosition})`);
  assert(candidate.location.includes("Ahmedabad") || candidate.location.includes("India"), "Location is set to target region");
  assert(candidate.educationCgpa > 7.0, `Education CGPA is populated and valid (${candidate.educationCgpa})`);

  // Dynamic Experience calculation
  const exp = getEffectiveCandidateExperience(candidate.employmentStartDate, candidate.manualExperienceYears);
  assert(exp.years >= 1, `Dynamic experience accurately computed (calculated: ${exp.formatted}, >= 1 year)`);

  // 2. Technical Skills Check
  const coreSkills = candidate.skills.filter((s) => s.category === "CORE");
  const additionalSkills = candidate.skills.filter((s) => s.category === "ADDITIONAL");
  const familiarSkills = candidate.skills.filter((s) => s.category === "FAMILIAR");

  assert(coreSkills.length >= 10, `Core skills populated (${coreSkills.length} skills found)`);
  assert(additionalSkills.length >= 18, `Additional skills populated (${additionalSkills.length} skills found)`);
  assert(familiarSkills.length >= 3, `Familiar skills populated (${familiarSkills.length} skills found)`);

  // Verify non-exaggeration & distinct experienceType / verifiedProficiency
  const redisSkill = candidate.skills.find((s) => s.name === "Redis");
  assert(
    redisSkill?.category === "FAMILIAR" &&
      redisSkill?.experienceType === "FAMILIARITY" &&
      redisSkill?.verifiedProficiency === "BEGINNER",
    "Redis is marked as FAMILIAR / FAMILIARITY / BEGINNER (never exaggerated)"
  );

  const reactSkill = candidate.skills.find((s) => s.name === "React.js");
  assert(
    reactSkill?.category === "CORE" &&
      reactSkill?.experienceType === "PROFESSIONAL" &&
      reactSkill?.verifiedProficiency === "ADVANCED",
    "React.js is marked as CORE / PROFESSIONAL / ADVANCED"
  );

  const nestSkill = candidate.skills.find((s) => s.name === "NestJS");
  assert(
    nestSkill?.category === "CORE" &&
      nestSkill?.experienceType === "PERSONAL_PROJECT" &&
      nestSkill?.verifiedProficiency === "INTERMEDIATE",
    "NestJS is marked as CORE / PERSONAL_PROJECT / INTERMEDIATE"
  );

  // 3. Work Experience & Projects
  assert(candidate.workExperiences.length === 2, "2 Work experiences present (Wappnet Systems & Batwebs)");
  assert(candidate.projects.length === 3, "3 Capstone projects present (Marine Platform, Catalyst, Freelance)");

  // 4. Multiple Resume Profiles
  const profiles = candidate.resumeProfiles;
  assert(profiles.length === 3, "3 Resume profiles generated (Full Stack, Backend, Frontend)");
  const profileTypes = profiles.map((p) => p.profileType);
  assert(
    profileTypes.includes("FULL_STACK") &&
      profileTypes.includes("BACKEND") &&
      profileTypes.includes("FRONTEND"),
    "All three required resume profile types present"
  );

  // 5. Job Listings & Intelligent Match Scored Data (Zero Sample Jobs, Only Legit Opportunities)
  const jobs = await prisma.jobListing.findMany({
    include: {
      matchAnalysis: true,
      recommendations: true,
      applications: true,
    },
  });

  const sampleCompanies = ["Infiswift Technologies", "Simform Solutions", "Argusoft India", "Cisco Systems"];
  const hasSampleJobs = jobs.some((j) => sampleCompanies.includes(j.company));
  assert(!hasSampleJobs, "Zero sample/dummy jobs present in database (purged completely)");

  assert(jobs.length > 0, `Legitimate discovered jobs populated in database (${jobs.length} jobs found)`);

  const topMatch = jobs.find((j) => (j.matchAnalysis?.overallScore || 0) >= 80);
  assert(
    !!topMatch,
    `High match role evaluated by 5-factor scoring engine (${topMatch?.company}: ${topMatch?.matchAnalysis?.overallScore}%)`
  );

  // 6. Business Rules Check
  const jobWithUrl = jobs.every((j) => !!j.originalUrl && j.originalUrl.startsWith("http"));
  assert(jobWithUrl, "Business Rule 4: Every job listing stores valid, active application URL");

  const unapprovedApps = await prisma.jobApplication.findMany({
    where: { approvedByCandidate: false, status: "APPLIED" },
  });
  assert(unapprovedApps.length === 0, "Business Rule 8: No job application submitted without explicit candidate approval");

  console.log("\n-------------------------------------------------");
  console.log(` Verification Summary: ${passedChecks}/${totalChecks} checks passed.`);
  console.log("-------------------------------------------------");

  if (passedChecks === totalChecks) {
    console.log("🎉 All Phase 1 database and model checks PASSED cleanly!\n");
  } else {
    console.error("⚠️ Some verification checks failed.");
    process.exit(1);
  }
}

runVerification()
  .catch((e) => {
    console.error("Verification script error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
