import { NextRequest, NextResponse } from "next/server";
import { CandidateService } from "@/lib/services/candidate-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const updated = await CandidateService.updateSkillById(id, body);
    return NextResponse.json({ success: true, skill: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await CandidateService.deleteSkill(id);
    return NextResponse.json({ success: true, message: "Skill removed successfully" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 400 }
    );
  }
}
