import { NextRequest, NextResponse } from "next/server";
import { JobService } from "@/lib/services/job-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await JobService.getJobById(params.id);
    if (!job) {
      return NextResponse.json({ success: false, error: "Job listing not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, job });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
