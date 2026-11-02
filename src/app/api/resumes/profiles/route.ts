import { NextResponse } from "next/server";
import { ResumeService } from "@/lib/services/resume-service";

export async function GET() {
  try {
    const profiles = await ResumeService.getProfiles();
    return NextResponse.json({ success: true, profiles });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
