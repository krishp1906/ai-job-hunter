import { NextRequest, NextResponse } from "next/server";
import { AIRecommendationService } from "@/lib/services/ai-recommendation-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const recipientRole = searchParams.get("recipientRole") || "Hiring Manager";

    const coldEmail = await AIRecommendationService.generateColdEmail(id, recipientRole);
    return NextResponse.json({ success: true, coldEmail });
  } catch (error: any) {
    const isNotFound = error?.message?.includes("not found");
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: isNotFound ? 404 : 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const recipientRole = body.recipientRole || "Hiring Manager";

    const coldEmail = await AIRecommendationService.generateColdEmail(id, recipientRole);
    return NextResponse.json({ success: true, coldEmail });
  } catch (error: any) {
    const isNotFound = error?.message?.includes("not found");
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
