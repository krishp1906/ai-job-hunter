import prisma from "@/lib/prisma";
import { getEffectiveCandidateExperience } from "@/lib/experience";
import { SkillCategory, ExperienceType, ProficiencyLevel } from "@prisma/client";

export interface UpdateCandidateInput {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  currentPosition?: string;
  currentCompany?: string;
  employmentStartDate?: string;
  manualExperienceYears?: number | null;
  educationDegree?: string;
  educationInstitution?: string;
  educationGraduationYear?: number;
  educationCgpa?: number;
  professionalSummary?: string;
  targetRoles?: string[];
  targetLocations?: string[];
  targetExpMin?: number;
  targetExpMax?: number;
}

export interface SkillInput {
  name: string;
  category: SkillCategory;
  experienceType: ExperienceType;
  verifiedProficiency: ProficiencyLevel;
  yearsOfExperience: number;
  notes?: string;
}

export class CandidateService {
  /**
   * Retrieves candidate profile with all relations and dynamic experience
   */
  static async getProfile() {
    const candidate = await prisma.candidateProfile.findFirst({
      include: {
        skills: {
          orderBy: [{ category: "asc" }, { name: "asc" }],
        },
        workExperiences: {
          orderBy: { startDate: "desc" },
        },
        educations: true,
        projects: true,
        resumeProfiles: true,
      },
    });

    if (!candidate) {
      throw new Error("Candidate profile not found");
    }

    const dynamicExp = getEffectiveCandidateExperience(
      candidate.employmentStartDate,
      candidate.manualExperienceYears
    );

    return {
      ...candidate,
      dynamicExperience: dynamicExp,
      targetRoles: JSON.parse(candidate.targetRoles) as string[],
      targetLocations: JSON.parse(candidate.targetLocations) as string[],
      workExperiences: candidate.workExperiences.map((w) => ({
        ...w,
        responsibilities: JSON.parse(w.responsibilities) as string[],
        technologies: JSON.parse(w.technologies) as string[],
      })),
      projects: candidate.projects.map((p) => ({
        ...p,
        technologies: JSON.parse(p.technologies) as string[],
        capabilities: JSON.parse(p.capabilities) as string[],
      })),
      resumeProfiles: candidate.resumeProfiles.map((r) => ({
        ...r,
        emphasizedSkills: JSON.parse(r.emphasizedSkills) as string[],
        projectIds: JSON.parse(r.projectIds) as string[],
      })),
    };
  }

  /**
   * Updates candidate profile attributes
   */
  static async updateProfile(data: UpdateCandidateInput) {
    const candidate = await prisma.candidateProfile.findFirst();
    if (!candidate) throw new Error("Candidate profile not found");

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.currentPosition !== undefined) updateData.currentPosition = data.currentPosition;
    if (data.currentCompany !== undefined) updateData.currentCompany = data.currentCompany;
    if (data.employmentStartDate !== undefined) updateData.employmentStartDate = new Date(data.employmentStartDate);
    if (data.manualExperienceYears !== undefined) updateData.manualExperienceYears = data.manualExperienceYears;
    if (data.educationDegree !== undefined) updateData.educationDegree = data.educationDegree;
    if (data.educationInstitution !== undefined) updateData.educationInstitution = data.educationInstitution;
    if (data.educationGraduationYear !== undefined) updateData.educationGraduationYear = data.educationGraduationYear;
    if (data.educationCgpa !== undefined) updateData.educationCgpa = data.educationCgpa;
    if (data.professionalSummary !== undefined) updateData.professionalSummary = data.professionalSummary;
    if (data.targetRoles !== undefined) updateData.targetRoles = JSON.stringify(data.targetRoles);
    if (data.targetLocations !== undefined) updateData.targetLocations = JSON.stringify(data.targetLocations);
    if (data.targetExpMin !== undefined) updateData.targetExpMin = data.targetExpMin;
    if (data.targetExpMax !== undefined) updateData.targetExpMax = data.targetExpMax;

    const updated = await prisma.candidateProfile.update({
      where: { id: candidate.id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_CANDIDATE_PROFILE",
        details: JSON.stringify(updateData),
      },
    });

    return this.getProfile();
  }

  /**
   * Adds or updates a candidate technical skill
   */
  static async upsertSkill(skill: SkillInput) {
    const candidate = await prisma.candidateProfile.findFirst();
    if (!candidate) throw new Error("Candidate profile not found");

    const record = await prisma.candidateSkill.upsert({
      where: {
        candidateId_name: {
          candidateId: candidate.id,
          name: skill.name,
        },
      },
      update: {
        category: skill.category,
        experienceType: skill.experienceType,
        verifiedProficiency: skill.verifiedProficiency,
        yearsOfExperience: skill.yearsOfExperience,
        notes: skill.notes,
      },
      create: {
        candidateId: candidate.id,
        name: skill.name,
        category: skill.category,
        experienceType: skill.experienceType,
        verifiedProficiency: skill.verifiedProficiency,
        yearsOfExperience: skill.yearsOfExperience,
        notes: skill.notes,
      },
    });

    return record;
  }

  /**
   * Updates an existing skill by ID
   */
  static async updateSkillById(skillId: string, updates: Partial<SkillInput>) {
    return prisma.candidateSkill.update({
      where: { id: skillId },
      data: updates,
    });
  }

  /**
   * Deletes a skill by ID
   */
  static async deleteSkill(skillId: string) {
    return prisma.candidateSkill.delete({
      where: { id: skillId },
    });
  }
}
