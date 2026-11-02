import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function purgeSampleJobs() {
  console.log("🧹 Starting purge of mock/sample jobs from database...");

  const sampleCompanies = [
    "Infiswift Technologies",
    "Simform Solutions",
    "Argusoft India",
    "Cisco Systems",
  ];

  // Find sample jobs
  const sampleJobs = await prisma.jobListing.findMany({
    where: {
      company: { in: sampleCompanies },
    },
    select: { id: true, title: true, company: true },
  });

  console.log(`Found ${sampleJobs.length} sample jobs to remove:`, sampleJobs.map((j) => `${j.company} - ${j.title}`));

  if (sampleJobs.length > 0) {
    const ids = sampleJobs.map((j) => j.id);

    // Cascading deletion of applications, recommendations, match analyses
    const deletedApps = await prisma.jobApplication.deleteMany({
      where: { jobId: { in: ids } },
    });
    console.log(`🗑️ Deleted ${deletedApps.count} sample job applications`);

    const deletedRecs = await prisma.aIRecommendation.deleteMany({
      where: { jobId: { in: ids } },
    });
    console.log(`🗑️ Deleted ${deletedRecs.count} sample job recommendations`);

    const deletedMatches = await prisma.jobMatchAnalysis.deleteMany({
      where: { jobId: { in: ids } },
    });
    console.log(`🗑️ Deleted ${deletedMatches.count} sample job match analyses`);

    const deletedJobs = await prisma.jobListing.deleteMany({
      where: { id: { in: ids } },
    });
    console.log(`🗑️ Deleted ${deletedJobs.count} sample job listings`);
  }

  // Check remaining jobs
  const remaining = await prisma.jobListing.findMany({
    select: { id: true, title: true, company: true, originalUrl: true },
  });

  console.log(`\n✅ Purge complete! ${remaining.length} legitimate jobs remaining in database:`);
  remaining.forEach((j, i) => {
    console.log(`  ${i + 1}. [${j.company}] ${j.title} (${j.originalUrl})`);
  });
}

purgeSampleJobs()
  .catch((e) => {
    console.error("Purge error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
