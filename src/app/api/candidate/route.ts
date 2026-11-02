import { NextRequest, NextResponse } from "next/server";
import { CandidateService } from "@/lib/services/candidate-service";

export async function GET() {
  try {
    const candidate = await CandidateService.getProfile();
    return NextResponse.json({ success: true, candidate });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await CandidateService.updateProfile(body);
    return NextResponse.json({ success: true, candidate: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 400 }
    );
  }
}
