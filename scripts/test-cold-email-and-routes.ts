import prisma from "../src/lib/prisma";
import { AIRecommendationService } from "../src/lib/services/ai-recommendation-service";
import { JobService } from "../src/lib/services/job-service";
import { ApplicationStatus } from "@prisma/client";

async function verifyOptimizations() {
  console.log("========================================================================");
  console.log("   AI JOBHUNTER — VERIFICATION: OPTIMIZED API, ROUTE & COLD EMAIL       ");
  console.log("========================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(cond: boolean, msg: string) {
    total++;
    if (cond) {
      console.log(`  [PASS] #${total}: ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] #${total}: ${msg}`);
    }
  }

  // 1. Verify Job Listing and Correct Route
  const job = await prisma.jobListing.findFirst({
    where: { company: "Bacancy Technology" },
    include: { matchAnalysis: true },
  });
  assert(!!job, "Found Bacancy Technology job listing in database");
  assert(job?.originalUrl.startsWith("http") === true, `Valid official application URL: ${job?.originalUrl}`);
  assert(!!job?.id, `Job ID exists for route /jobs/${job?.id}`);

  // 2. Verify Cold Email Generation & Customization
  const candidate = await prisma.candidateProfile.findFirst();
  const coldEmailHiringMgr = await AIRecommendationService.generateColdEmail(job!.id, "Hiring Manager");
  assert(coldEmailHiringMgr.subjectLines.length >= 3, `Generated ${coldEmailHiringMgr.subjectLines.length} subject line options`);
  assert(coldEmailHiringMgr.emailBody.includes(candidate!.name), `Cold email includes candidate name: ${candidate!.name}`);
  assert(coldEmailHiringMgr.emailBody.includes(candidate!.currentCompany), `Cold email references genuine employer: ${candidate!.currentCompany}`);
  assert(coldEmailHiringMgr.emailBody.includes(candidate!.educationInstitution), `Cold email cites education: ${candidate!.educationInstitution}`);
  assert(coldEmailHiringMgr.mailtoUrl.startsWith("mailto:"), "Generated clickable pre-filled mailto: URL");

  const coldEmailTechLead = await AIRecommendationService.generateColdEmail(job!.id, "Head of Engineering");
  assert(coldEmailTechLead.emailBody.includes("Head of Engineering"), "Cold email customized for Head of Engineering recipient");

  // 3. Verify Quick Apply & Status Update with Candidate Approval Gate
  const appliedRecord = await JobService.updateApplicationStatus(
    job!.id,
    ApplicationStatus.APPLIED,
    true,
    "Applied via Quick Apply on company career site"
  );
  assert(appliedRecord.status === "APPLIED", "Quick Apply marked status as APPLIED");
  assert(appliedRecord.approvedByCandidate === true, "Quick Apply recorded explicit candidate approval");

  // Revert back to SAVED for clean testing
  await JobService.updateApplicationStatus(job!.id, ApplicationStatus.SAVED, false, "Saved in pipeline");

  // 4. Verify Optimized Search / Filter Query
  const filteredJobs = await JobService.getJobListings({
    minMatchScore: 80,
    roleCategory: "FULL_STACK",
  });
  assert(filteredJobs.length > 0, `Optimized filter query returned ${filteredJobs.length} jobs with score >= 80%`);
  assert(
    filteredJobs.every((j) => (j.matchAnalysis?.overallScore || 0) >= 80),
    "All filtered jobs strictly satisfy minMatchScore >= 80%"
  );

  // 5. Verify AI Recommendation Caching & Speed
  // First ensure recommendation is computed/cached
  await AIRecommendationService.getRecommendationForJob(job!.id);

  // Second call must be from DB cache (< 50ms)
  const startTime = Date.now();
  const rec = await AIRecommendationService.getRecommendationForJob(job!.id);
  const elapsedMs = Date.now() - startTime;
  assert(!!rec.verdict, `AI Recommendation retrieved with verdict: ${rec.verdict}`);
  assert(elapsedMs < 100, `Cached AI recommendation returned in ${elapsedMs}ms (< 100ms)`);

  console.log("\n========================================================================");
  console.log(` OPTIMIZATION VERIFICATION COMPLETE: ${passed}/${total} CHECKS PASSED`);
  console.log("========================================================================\n");

  if (passed === total) {
    console.log("🎉 ALL REQUESTED OPTIMIZATIONS & FEATURES VERIFIED SUCCESSFULLY!\n");
  } else {
    process.exit(1);
  }
}

verifyOptimizations()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
