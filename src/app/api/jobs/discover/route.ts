import { NextResponse } from "next/server";
import { JobService } from "@/lib/services/job-service";

export async function POST() {
  try {
    const result = await JobService.discoverBatch();
    return NextResponse.json({
      success: true,
      message: `Successfully discovered ${result.discoveredCount} fresh verified opportunities!`,
      discoveredCount: result.discoveredCount,
      totalJobs: result.totalJobs,
      newJobs: result.newJobs,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
