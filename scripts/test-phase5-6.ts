import { ResumeService } from "../src/lib/services/resume-service";
import { AIRecommendationService } from "../src/lib/services/ai-recommendation-service";
import prisma from "../src/lib/prisma";
import { ResumeProfileType } from "@prisma/client";

async function testPhase5And6() {
  console.log("=================================================");
  console.log("   AI JOBHUNTER - TEST: PHASES 5 & 6 RESUME & AI ");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  function assert(cond: boolean, msg: string) {
    total++;
    if (cond) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
    }
  }

  const job = await prisma.jobListing.findFirst({
    where: { company: "Infiswift Technologies" },
  });
  assert(!!job, "Found test job listing at Infiswift Technologies");

  // 1. Resume Tailoring Tests
  const fullstackResume = await ResumeService.generateTailoredResume(job!.id, ResumeProfileType.FULL_STACK);
  assert(fullstackResume.profileType === "FULL_STACK", "Generated Full Stack profile resume");
  assert(fullstackResume.isFactualVerified === true, "Factual verification flag set to true");
  assert(Boolean(fullstackResume.candidateName), `Preserved candidate name: ${fullstackResume.candidateName}`);
  assert(fullstackResume.tailoredSummary.includes("Full Stack Developer"), "Summary targets Full Stack Developer");
  assert(fullstackResume.education.cgpa >= 8.0, `Preserved authentic CGPA: ${fullstackResume.education.cgpa}`);
  assert(
    fullstackResume.highlightedExperience.length > 0,
    "Preserved real employer history"
  );

  // Backend Profile Tailoring
  const backendResume = await ResumeService.generateTailoredResume(job!.id, ResumeProfileType.BACKEND);
  assert(backendResume.profileType === "BACKEND", "Generated Backend profile resume");
  assert(backendResume.tailoredSummary.includes("Backend Software Developer"), "Summary targets Backend Developer");
  assert(
    backendResume.selectedProjects.some((p) => p.title.includes("Catalyst")),
    "Highlighted Catalyst NestJS platform project for backend profile"
  );

  // Frontend Profile Tailoring
  const frontendResume = await ResumeService.generateTailoredResume(job!.id, ResumeProfileType.FRONTEND);
  assert(frontendResume.profileType === "FRONTEND", "Generated Frontend profile resume");
  assert(
    frontendResume.selectedProjects.some((p) => p.title.includes("Marine")),
    "Highlighted Marine Marketplace & Mapbox project for frontend profile"
  );

  // 2. AI Recommendation & Interview Prep Tests
  const rec = await AIRecommendationService.getRecommendationForJob(job!.id);
  assert(!!rec.verdict, `Verdict generated: ${rec.verdict}`);
  assert(rec.suitabilitySummary.length > 20, "Suitability summary generated");
  assert(rec.requirementsSatisfied.length > 0, `Requirements satisfied generated (${rec.requirementsSatisfied.length} items)`);
  assert(rec.interviewPrepTopics.length > 0, `Interview prep topics generated (${rec.interviewPrepTopics.length} topics)`);
  assert(rec.expectedQuestions.length >= 3, `Job-specific expected interview questions generated (${rec.expectedQuestions.length} questions)`);
  assert(rec.salaryAssessment.length > 10, "Salary assessment generated");

  console.log("\n-------------------------------------------------");
  console.log(` Phases 5 & 6 Summary: ${passed}/${total} checks passed.`);
  console.log("-------------------------------------------------");

  if (passed === total) {
    console.log("🎉 Phases 5 & 6 Multi-Profile Resume & AI Recommendation verified!\n");
  } else {
    process.exit(1);
  }
}

testPhase5And6()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
