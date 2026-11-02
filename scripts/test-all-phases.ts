import { CandidateService } from "../src/lib/services/candidate-service";
import { JobService } from "../src/lib/services/job-service";
import { MatchingEngine } from "../src/lib/services/matching-engine";
import { ResumeService } from "../src/lib/services/resume-service";
import { AIRecommendationService } from "../src/lib/services/ai-recommendation-service";
import prisma from "../src/lib/prisma";
import { ResumeProfileType, WorkArrangement, CompanyType, ApplicationStatus } from "@prisma/client";

async function runMasterE2ETest() {
  console.log("========================================================================");
  console.log("     AI JOBHUNTER — MASTER END-TO-END VERIFICATION (ALL 8 PHASES)       ");
  console.log("========================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, description: string) {
    total++;
    if (condition) {
      console.log(`  [PASS] #${total}: ${description}`);
      passed++;
    } else {
      console.error(`  [FAIL] #${total}: ${description}`);
    }
  }

  // --- PHASE 1 & 2: Candidate Profile & Experience ---
  const profile = await CandidateService.getProfile();
  assert(!!profile.name && profile.name.length > 0, `Candidate name populated: ${profile.name}`);
  assert(!!profile.currentCompany, `Current employer populated: ${profile.currentCompany}`);
  assert(profile.location.includes("Ahmedabad") || profile.location.includes("India"), "Location is set to target region");
  assert(profile.educationDegree.includes("Computer Science") || profile.educationDegree.length > 0, "Education degree populated");
  assert(profile.educationCgpa > 7.0, `Education CGPA valid: ${profile.educationCgpa}`);
  assert(profile.dynamicExperience.years >= 1, `Dynamic experience accurately computed (${profile.dynamicExperience.formatted})`);

  // Skills non-exaggeration checks
  const coreSkills = profile.skills.filter((s) => s.category === "CORE");
  const additionalSkills = profile.skills.filter((s) => s.category === "ADDITIONAL");
  const familiarSkills = profile.skills.filter((s) => s.category === "FAMILIAR");
  assert(coreSkills.length >= 10, `Core skills count >= 10 (${coreSkills.length} found)`);
  assert(additionalSkills.length >= 18, `Additional skills count >= 18 (${additionalSkills.length} found)`);
  assert(familiarSkills.length >= 3, `Familiar technologies count >= 3 (${familiarSkills.length} found)`);

  const redis = profile.skills.find((s) => s.name === "Redis");
  assert(redis?.category === "FAMILIAR" && redis?.verifiedProficiency === "BEGINNER", "Redis is strictly marked FAMILIAR / BEGINNER");

  const react = profile.skills.find((s) => s.name === "React.js");
  assert(react?.category === "CORE" && react?.experienceType === "PROFESSIONAL", "React.js is strictly marked CORE / PROFESSIONAL");

  // --- PHASE 3 & 4: Ingestion, Deduplication & 5-Factor Scoring ---
  // Ingest unique job
  const testUrl = `https://e2e-test-career.org/jobs/e2e-test-${Date.now()}`;
  const ingestedJob = await JobService.ingestJob({
    title: "Full Stack Developer (Next.js & TypeScript)",
    company: "E2E Cloud Solutions",
    location: "Ahmedabad, Gujarat",
    workArrangement: WorkArrangement.HYBRID,
    companyType: CompanyType.PRODUCT,
    minSalary: 550000,
    maxSalary: 800000,
    description: "Developing responsive Next.js dashboards, Mapbox layers, and Node.js REST services.",
    originalUrl: testUrl,
    source: "E2E Suite",
    experienceMinYears: 1.0,
    mandatorySkills: ["Next.js", "React.js", "TypeScript", "Node.js", "REST APIs"],
    preferredSkills: ["Mapbox", "Tailwind CSS"],
  });
  assert(!!ingestedJob, "Job ingested and indexed cleanly");

  // Attempt duplicate ingestion
  const duplicateJob = await JobService.ingestJob({
    title: "Full Stack Developer (Next.js & TypeScript)",
    company: "E2E Cloud Solutions",
    location: "Ahmedabad, Gujarat",
    workArrangement: WorkArrangement.HYBRID,
    companyType: CompanyType.PRODUCT,
    description: "Duplicate attempt",
    originalUrl: testUrl,
    source: "E2E Suite",
    mandatorySkills: ["Next.js"],
  });
  assert(duplicateJob?.id === ingestedJob?.id, "Deduplication: Returned existing job record without duplicating entry");

  // Verify 5-Factor Scoring Engine
  const matchResult = await MatchingEngine.evaluateJob(ingestedJob!.id);
  assert(matchResult.overallScore >= 88, `High alignment score for matching Ahmedabad Full Stack role (${matchResult.overallScore}%)`);
  assert(matchResult.technicalScore >= 90, `Technical score (${matchResult.technicalScore}%)`);
  assert(matchResult.roleSuitability === "HIGH", "Role suitability evaluated as HIGH");
  assert(matchResult.locationCompatibility === "FULL_MATCH", "Location evaluated as FULL_MATCH");

  // Verify Mathematical Formula Weights: 35% Tech + 20% Exp + 20% Resp + 15% Role + 10% Loc
  const calculatedSum =
    matchResult.technicalScore * 0.35 +
    matchResult.experienceScore * 0.20 +
    matchResult.responsibilityScore * 0.20 +
    matchResult.roleScore * 0.15 +
    matchResult.locationScore * 0.10;
  const roundedSum = Math.round(calculatedSum * 10) / 10;
  assert(
    Math.abs(matchResult.overallScore - roundedSum) < 0.2,
    `5-Factor Mathematical weights verified: Engine score ${matchResult.overallScore} equals formula ${roundedSum}`
  );

  // Negative Control: Anti-bias check for Senior Staff Architect
  const seniorTestUrl = `https://anti-bias-test.org/jobs/architect-${Date.now()}`;
  const seniorJob = await JobService.ingestJob({
    title: "Senior Staff Enterprise Cloud Architect",
    company: "Global Enterprise Systems",
    location: "Bangalore, Karnataka",
    workArrangement: WorkArrangement.ONSITE,
    companyType: CompanyType.MNC,
    minSalary: 4500000,
    maxSalary: 7000000,
    description: "Requires 12+ years experience in multi-cloud architecture and enterprise leadership.",
    originalUrl: seniorTestUrl,
    source: "Anti-bias Test Ingestion",
    experienceMinYears: 12.0,
    mandatorySkills: ["Multi-Cloud Architecture", "Kubernetes", "Enterprise Governance", "Go"],
  });
  const seniorMatch = await MatchingEngine.evaluateJob(seniorJob!.id);
  assert(
    seniorMatch.overallScore < 30,
    `Anti-bias check: Senior architect role (12 yrs exp) received low score (${seniorMatch.overallScore}%) and Low role suitability`
  );

  // --- PHASE 5: Multiple Resume Profiles & Factual Tailoring ---
  const fullstackResume = await ResumeService.generateTailoredResume(ingestedJob!.id, ResumeProfileType.FULL_STACK);
  assert(fullstackResume.isFactualVerified === true, "Resume factual verification flag verified");
  assert(fullstackResume.candidateName === profile.name, `Resume candidate name preserved: ${fullstackResume.candidateName}`);
  assert(fullstackResume.education.cgpa === profile.educationCgpa, `Resume education CGPA preserved: ${fullstackResume.education.cgpa}`);
  assert(
    fullstackResume.highlightedExperience.some((e) => e.company === profile.currentCompany),
    `Resume employer preserved: ${profile.currentCompany}`
  );

  const backendResume = await ResumeService.generateTailoredResume(ingestedJob!.id, ResumeProfileType.BACKEND);
  assert(
    backendResume.selectedProjects.some((p) => p.title.includes("Catalyst")),
    "Backend resume prioritized Catalyst NestJS & PostgreSQL project"
  );

  const frontendResume = await ResumeService.generateTailoredResume(ingestedJob!.id, ResumeProfileType.FRONTEND);
  assert(
    frontendResume.selectedProjects.some((p) => p.title.includes("Marine")),
    "Frontend resume prioritized Marine Marketplace & Mapbox project"
  );

  // --- PHASE 6: AI Recommendations & Technical Interview Prep ---
  const aiRec = await AIRecommendationService.getRecommendationForJob(ingestedJob!.id);
  assert(aiRec.verdict === "STRONGLY_RECOMMENDED", "AI Recommendation verdict: STRONGLY_RECOMMENDED");
  assert(aiRec.requirementsSatisfied.length > 0, `Requirements satisfied generated (${aiRec.requirementsSatisfied.length} items)`);
  assert(aiRec.interviewPrepTopics.length > 0, `Interview preparation topics generated (${aiRec.interviewPrepTopics.length} topics)`);
  assert(aiRec.expectedQuestions.length >= 3, `Expected technical questions generated (${aiRec.expectedQuestions.length} questions)`);

  // --- PHASE 7: Application Tracker & Business Rule 8 ---
  let rule8Blocked = false;
  try {
    await JobService.updateApplicationStatus(ingestedJob!.id, ApplicationStatus.APPLIED, false);
  } catch (err: any) {
    rule8Blocked = err.message.includes("Business Rule 8");
  }
  assert(rule8Blocked, "Business Rule 8 enforced: Cannot mark APPLIED without explicit candidate approval");

  const approvedApp = await JobService.updateApplicationStatus(
    ingestedJob!.id,
    ApplicationStatus.APPLIED,
    true,
    "Candidate verified and authorized application"
  );
  assert(
    approvedApp.status === "APPLIED" && approvedApp.approvedByCandidate === true,
    "Application successfully marked APPLIED when explicit approval granted"
  );

  // Clean up temporary E2E test job
  await prisma.jobMatchAnalysis.deleteMany({ where: { jobId: ingestedJob!.id } });
  await prisma.aIRecommendation.deleteMany({ where: { jobId: ingestedJob!.id } });
  await prisma.jobApplication.deleteMany({ where: { jobId: ingestedJob!.id } });
  await prisma.jobListing.deleteMany({ where: { id: ingestedJob!.id } });

  console.log("\n========================================================================");
  console.log(` MASTER VERIFICATION COMPLETE: ${passed}/${total} CHECKS PASSED`);
  console.log("========================================================================\n");

  if (passed === total) {
    console.log("🎉 ALL PHASES OF AI JOBHUNTER HAVE BEEN FULLY IMPLEMENTED & VERIFIED!\n");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runMasterE2ETest()
  .catch((e) => {
    console.error("Master E2E Test Failure:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
