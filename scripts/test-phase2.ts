import { CandidateService } from "../src/lib/services/candidate-service";
import prisma from "../src/lib/prisma";
import { SkillCategory, ExperienceType, ProficiencyLevel } from "@prisma/client";

async function testPhase2() {
  console.log("=================================================");
  console.log("   AI JOBHUNTER - PHASE 2 TEST: PROFILE & SKILLS ");
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

  // 1. Get Profile
  const profile = await CandidateService.getProfile();
  assert(Boolean(profile.name), `Retrieved profile for candidate: ${profile.name}`);
  assert(profile.dynamicExperience.years >= 1, `Dynamic experience: ${profile.dynamicExperience.formatted}`);

  // 2. Test Manual Experience Override
  await CandidateService.updateProfile({ manualExperienceYears: 2.0 });
  const updatedProfile = await CandidateService.getProfile();
  assert(updatedProfile.dynamicExperience.isManualOverride === true, "Manual experience override applied");
  assert(updatedProfile.dynamicExperience.years === 2, "Manual years set to 2.0");

  // Revert manual override back to dynamic
  await CandidateService.updateProfile({ manualExperienceYears: null });
  const revertedProfile = await CandidateService.getProfile();
  assert(revertedProfile.dynamicExperience.isManualOverride === false, "Reverted back to dynamic calculation");

  // 3. Upsert Skill
  const testSkill = await CandidateService.upsertSkill({
    name: "Docker",
    category: SkillCategory.FAMILIAR,
    experienceType: ExperienceType.FAMILIARITY,
    verifiedProficiency: ProficiencyLevel.BEGINNER,
    yearsOfExperience: 0.5,
    notes: "Containerization fundamentals test entry",
  });
  assert(testSkill.name === "Docker", "Created skill 'Docker'");
  assert(testSkill.verifiedProficiency === "BEGINNER", "Docker proficiency is strictly BEGINNER");

  // Update skill
  const modifiedSkill = await CandidateService.updateSkillById(testSkill.id, {
    verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
  });
  assert(modifiedSkill.verifiedProficiency === "INTERMEDIATE", "Updated skill proficiency to INTERMEDIATE");

  // Delete test skill
  await CandidateService.deleteSkill(testSkill.id);
  const deletedSkill = await prisma.candidateSkill.findUnique({ where: { id: testSkill.id } });
  assert(deletedSkill === null, "Deleted test skill cleanly");

  console.log("\n-------------------------------------------------");
  console.log(` Phase 2 Summary: ${passed}/${total} checks passed.`);
  console.log("-------------------------------------------------");

  if (passed === total) {
    console.log("🎉 Phase 2 Candidate Profile & Skills logic verified!\n");
  } else {
    process.exit(1);
  }
}

testPhase2()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
