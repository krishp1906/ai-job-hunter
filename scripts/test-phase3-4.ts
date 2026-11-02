import { JobService } from "../src/lib/services/job-service";
import { MatchingEngine } from "../src/lib/services/matching-engine";
import prisma from "../src/lib/prisma";
import { WorkArrangement, CompanyType, ApplicationStatus } from "@prisma/client";

async function testPhase3And4() {
  console.log("=================================================");
  console.log("   AI JOBHUNTER - TEST: PHASES 3 & 4 INGESTION & SCORING ");
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

  // Clean up any lingering test jobs
  await prisma.jobMatchAnalysis.deleteMany({
    where: { job: { originalUrl: { in: ["https://example.com/jobs/unique-test-12345", "https://example.com/jobs/redis-mandate-999"] } } },
  });
  await prisma.jobApplication.deleteMany({
    where: { job: { originalUrl: { in: ["https://example.com/jobs/unique-test-12345", "https://example.com/jobs/redis-mandate-999"] } } },
  });
  await prisma.jobListing.deleteMany({
    where: { originalUrl: { in: ["https://example.com/jobs/unique-test-12345", "https://example.com/jobs/redis-mandate-999"] } },
  });

  // 1. Ingestion & Deduplication
  const initialCount = await prisma.jobListing.count();
  const testJob = await JobService.ingestJob({
    title: "Full Stack Engineer (React / Node)",
    company: "Test Corp Ingestion",
    location: "Ahmedabad, Gujarat",
    workArrangement: WorkArrangement.HYBRID,
    companyType: CompanyType.PRODUCT,
    minSalary: 500000,
    maxSalary: 750000,
    description: "Developing modern web apps with React.js, Next.js and Node.js.",
    originalUrl: "https://example.com/jobs/unique-test-12345",
    source: "Test System",
    experienceMinYears: 1.0,
    mandatorySkills: ["React.js", "Node.js", "TypeScript"],
  });

  assert(!!testJob, "Job ingested successfully");
  const afterFirstIngest = await prisma.jobListing.count();
  assert(afterFirstIngest === initialCount + 1, "Database count incremented by 1");

  // Attempt duplicate ingestion with same URL
  const duplicateJob = await JobService.ingestJob({
    title: "Full Stack Engineer (React / Node)",
    company: "Test Corp Ingestion",
    location: "Ahmedabad, Gujarat",
    workArrangement: WorkArrangement.HYBRID,
    companyType: CompanyType.PRODUCT,
    description: "Duplicate attempt",
    originalUrl: "https://example.com/jobs/unique-test-12345",
    source: "Test System",
    mandatorySkills: ["React.js"],
  });

  const afterDupIngest = await prisma.jobListing.count();
  assert(afterDupIngest === afterFirstIngest, "Deduplication: Duplicate URL was not inserted");
  assert(duplicateJob?.id === testJob?.id, "Returned existing job ID for duplicate URL");

  // 2. Matching Engine & Math Weights Check
  const evalResult = await MatchingEngine.evaluateJob(testJob!.id);
  assert(evalResult.overallScore >= 85, `Overall match score (${evalResult.overallScore}%) correctly reflects high alignment`);
  assert(evalResult.technicalScore >= 90, `Technical score (${evalResult.technicalScore}%) reflects core skills match`);
  assert(evalResult.experienceScore >= 90, `Experience score (${evalResult.experienceScore}%) matches 1-2 yr requirement`);
  assert(evalResult.roleSuitability === "HIGH", "Role suitability evaluated as HIGH");
  assert(evalResult.locationCompatibility === "FULL_MATCH", "Location evaluated as FULL_MATCH for Ahmedabad");

  // Verify math formula: 0.35 * tech + 0.20 * exp + 0.20 * resp + 0.15 * role + 0.10 * loc
  const expectedRaw =
    evalResult.technicalScore * 0.35 +
    evalResult.experienceScore * 0.20 +
    evalResult.responsibilityScore * 0.20 +
    evalResult.roleScore * 0.15 +
    evalResult.locationScore * 0.10;
  const expectedRounded = Math.round(expectedRaw * 10) / 10;
  assert(
    Math.abs(evalResult.overallScore - expectedRounded) < 0.2,
    `5-Factor Mathematical weights verified: calculated ${evalResult.overallScore} matches expected formula ${expectedRounded}`
  );

  // 3. Familiar Skills Penalty Test (Candidate only lists Redis as FAMILIAR)
  const redisMandatedJob = await JobService.ingestJob({
    title: "Senior Caching Engineer",
    company: "Redis Mandate Corp",
    location: "Remote — India",
    workArrangement: WorkArrangement.REMOTE,
    companyType: CompanyType.PRODUCT,
    description: "Deep Redis cluster tuning and internal memory optimization.",
    originalUrl: "https://example.com/jobs/redis-mandate-999",
    source: "Test System",
    experienceMinYears: 2.0,
    mandatorySkills: ["Redis"],
  });

  const redisEval = await MatchingEngine.evaluateJob(redisMandatedJob!.id);
  assert(
    redisEval.technicalScore <= 40,
    `Familiar skill penalty applied: Technical score is only ${redisEval.technicalScore}% (mandatory Redis only familiar to candidate)`
  );
  assert(
    redisEval.reasonsNotToApply.some((r) => r.includes("Redis")),
    "Explanation notes candidate only lists Redis as familiar"
  );

  // 4. Business Rule 8: Application Approval Guard
  let approvalBlocked = false;
  try {
    // Attempt to mark APPLIED without candidate approval
    await JobService.updateApplicationStatus(testJob!.id, ApplicationStatus.APPLIED, false);
  } catch (err: any) {
    approvalBlocked = err.message.includes("Business Rule 8");
  }
  assert(approvalBlocked, "Business Rule 8 enforced: Cannot mark APPLIED without approvedByCandidate: true");

  // Mark applied with explicit approval
  const approvedApp = await JobService.updateApplicationStatus(
    testJob!.id,
    ApplicationStatus.APPLIED,
    true,
    "Candidate reviewed and approved application"
  );
  assert(approvedApp.status === "APPLIED" && approvedApp.approvedByCandidate === true, "Allowed APPLIED status when approvedByCandidate is true");

  // Clean up test jobs
  await prisma.jobMatchAnalysis.deleteMany({ where: { jobId: { in: [testJob!.id, redisMandatedJob!.id] } } });
  await prisma.jobApplication.deleteMany({ where: { jobId: { in: [testJob!.id, redisMandatedJob!.id] } } });
  await prisma.jobListing.deleteMany({ where: { id: { in: [testJob!.id, redisMandatedJob!.id] } } });

  console.log("\n-------------------------------------------------");
  console.log(` Phases 3 & 4 Summary: ${passed}/${total} checks passed.`);
  console.log("-------------------------------------------------");

  if (passed === total) {
    console.log("🎉 Phases 3 & 4 Ingestion, Deduplication, & 5-Factor Scoring verified!\n");
  } else {
    process.exit(1);
  }
}

testPhase3And4()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
