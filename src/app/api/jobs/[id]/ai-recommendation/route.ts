import { NextRequest, NextResponse } from "next/server";
import { AIRecommendationService } from "@/lib/services/ai-recommendation-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const recommendation = await AIRecommendationService.getRecommendationForJob(id);
    return NextResponse.json({ success: true, recommendation });
  } catch (error: any) {
    const isNotFound = error?.message?.includes("not found");
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
