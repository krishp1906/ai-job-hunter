import { NextRequest, NextResponse } from "next/server";
import { CoverLetterService } from "@/lib/services/cover-letter-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const coverLetter = await CoverLetterService.generateCoverLetter(id);
    return NextResponse.json({ success: true, coverLetter });
  } catch (error: any) {
    const isNotFound = error?.message?.includes("not found");
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
