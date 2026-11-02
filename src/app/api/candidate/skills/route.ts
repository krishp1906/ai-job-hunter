import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CandidateService, SkillInput } from "@/lib/services/candidate-service";

export async function GET() {
  try {
    const candidate = await prisma.candidateProfile.findFirst();
    if (!candidate) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const skills = await prisma.candidateSkill.findMany({
      where: { candidateId: candidate.id },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, skills });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: SkillInput = await req.json();
    if (!body.name || !body.category || !body.experienceType || !body.verifiedProficiency) {
      return NextResponse.json(
        { success: false, error: "Missing required skill fields: name, category, experienceType, verifiedProficiency" },
        { status: 400 }
      );
    }

    const skill = await CandidateService.upsertSkill(body);
    return NextResponse.json({ success: true, skill });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 400 }
    );
  }
}
