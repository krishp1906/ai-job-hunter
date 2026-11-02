import prisma from "../src/lib/prisma";
import { JobService } from "../src/lib/services/job-service";
import { CoverLetterService } from "../src/lib/services/cover-letter-service";
import { ApplicationStatus } from "@prisma/client";

async function verifyDynamicDiscoveryAndApplication() {
  console.log("========================================================================");
  console.log("   AI JOBHUNTER — VERIFICATION: DYNAMIC DISCOVERY & APPLICATION HUB      ");
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

  // 1. Verify Dynamic Discovery Ingestion
  const initialJobCount = await prisma.jobListing.count();
  const discoveryResult = await JobService.discoverBatch();
  const afterJobCount = await prisma.jobListing.count();

  assert(discoveryResult.discoveredCount > 0, `Dynamic discovery added ${discoveryResult.discoveredCount} fresh listings`);
  assert(afterJobCount > initialJobCount, `Total job count dynamically expanded from ${initialJobCount} to ${afterJobCount}`);

  // 2. Verify Freshness of Discovered Jobs (e.g. Digicorp, Technource, Addact, etc.)
  const latestJob = await prisma.jobListing.findFirst({
    orderBy: { postedAt: "desc" },
    include: { matchAnalysis: true },
  });
  assert(!!latestJob, `Latest discovered job retrieved: ${latestJob?.title} at ${latestJob?.company}`);
  assert(latestJob?.matchAnalysis !== null, `Automated 5-factor scoring engine evaluated match: ${latestJob?.matchAnalysis?.overallScore}%`);
  assert(latestJob?.originalUrl.startsWith("http") === true, `Valid official career portal URL: ${latestJob?.originalUrl}`);

  // 3. Verify Tailored Cover Letter Generation
  const candidate = await prisma.candidateProfile.findFirst();
  const coverLetter = await CoverLetterService.generateCoverLetter(latestJob!.id);
  assert(coverLetter.salutation.includes(latestJob!.company), `Cover letter addressed to ${latestJob!.company}`);
  assert(coverLetter.openingParagraph.includes(latestJob!.title), `Cover letter targets ${latestJob!.title}`);
  assert(coverLetter.bodyParagraph.includes(candidate!.currentCompany), `Cover letter cites genuine experience at ${candidate!.currentCompany}`);
  assert(coverLetter.bodyParagraph.includes(String(candidate!.educationCgpa)), `Cover letter accurately cites education CGPA ${candidate!.educationCgpa}`);
  assert(coverLetter.fullLetterText.includes(candidate!.name), `Cover letter signed by ${candidate!.name}`);

  // 4. Verify Complete Application Logging Workflow
  const applicationNotes = "Method: Company Website (Direct Portal) | Quoted CTC: ₹6,50,000 LPA | Notes: Submitted tailored resume & cover letter";
  const application = await JobService.updateApplicationStatus(
    latestJob!.id,
    ApplicationStatus.APPLIED,
    true,
    applicationNotes
  );

  assert(application.status === "APPLIED", "Application status updated to APPLIED");
  assert(application.approvedByCandidate === true, "Candidate approval explicitly authorized");
  assert(application.notes?.includes("₹6,50,000") === true, "Compensation quoted and method recorded in application notes");

  // Verify Application Tracker Query
  const trackerJobs = await prisma.jobListing.findMany({
    where: { applications: { some: { status: "APPLIED" } } },
    include: { applications: true },
  });
  assert(trackerJobs.length > 0, `Application tracker lists ${trackerJobs.length} active submitted applications`);

  console.log("\n========================================================================");
  console.log(` DYNAMIC DISCOVERY & APPLICATION VERIFICATION: ${passed}/${total} PASSED`);
  console.log("========================================================================\n");

  if (passed === total) {
    console.log("🎉 ALL TESTS PASSED: Feed is dynamic and Apply is a full end-to-end workflow!\n");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

verifyDynamicDiscoveryAndApplication()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
