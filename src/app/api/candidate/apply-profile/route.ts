import { NextRequest, NextResponse } from "next/server";
import { ResumeParserService } from "@/lib/services/resume-parser-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profileData } = body;

    if (!profileData || !profileData.name || !profileData.skills) {
      return NextResponse.json(
        { success: false, error: "Invalid profile data provided. Name and skills are required." },
        { status: 400 }
      );
    }

    const updatedCandidate = await ResumeParserService.applyProfileData(profileData);

    return NextResponse.json({
      success: true,
      message: `Profile for ${updatedCandidate.name} applied successfully! All job match scores recalculated.`,
      candidate: updatedCandidate,
    });
  } catch (error: any) {
    console.error("Apply profile error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update candidate profile" },
      { status: 500 }
    );
  }
}
