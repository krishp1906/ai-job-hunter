import { NextRequest, NextResponse } from "next/server";
import { ResumeService } from "@/lib/services/resume-service";
import { ResumeProfileType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, profileType } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Missing required field: jobId" }, { status: 400 });
    }

    const tailored = await ResumeService.generateTailoredResume(
      jobId,
      profileType as ResumeProfileType | undefined
    );

    return NextResponse.json({ success: true, resume: tailored });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
