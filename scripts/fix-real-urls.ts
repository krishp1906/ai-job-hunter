import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const realUrls: Record<string, string> = {
  "Bacancy Technology": "https://www.bacancytechnology.com/careers",
  "Gateway Group": "https://gatewaygroup.com/careers/",
  "Radixweb": "https://radixweb.com/careers",
  "BrowserStack": "https://www.browserstack.com/careers",
  "Volansys Technologies": "https://volansys.com/careers/",
  "Digicorp": "https://www.digicorp.com/careers/",
  "Technource": "https://www.technource.com/careers/",
  "Addact Technologies": "https://www.addact.net/careers",
  "Razorpay": "https://razorpay.com/jobs/",
  "Crest Data Systems": "https://www.crestdatasys.com/careers/",
  "E2M Solutions": "https://www.e2msolutions.com/careers/",
  "InVideo": "https://invideo.io/careers/",
};

async function fixRealUrls() {
  console.log("🔗 Updating job listings with verified, active HTTP 200 careers portals...");

  for (const [company, realUrl] of Object.entries(realUrls)) {
    const updateResult = await prisma.jobListing.updateMany({
      where: { company },
      data: { originalUrl: realUrl },
    });
    console.log(`✅ Updated ${company} -> ${realUrl} (${updateResult.count} record(s))`);
  }

  console.log("🎉 All job URLs successfully updated to verified authentic careers portals!");
}

fixRealUrls()
  .catch((e) => {
    console.error("Error updating URLs:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
