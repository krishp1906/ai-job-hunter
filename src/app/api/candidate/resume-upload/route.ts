import { NextRequest, NextResponse } from "next/server";
import { ResumeParserService } from "@/lib/services/resume-parser-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let rawText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const pastedText = formData.get("text") as string | null;

      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        rawText = await ResumeParserService.extractTextFromPdf(buffer);
      } else if (pastedText && pastedText.trim().length > 0) {
        rawText = pastedText.trim();
      } else {
        return NextResponse.json(
          { success: false, error: "Please upload a valid PDF resume file or paste resume text." },
          { status: 400 }
        );
      }
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.text) {
        rawText = body.text;
      } else {
        return NextResponse.json(
          { success: false, error: "No resume text or file provided." },
          { status: 400 }
        );
      }
    }

    const extractedData = await ResumeParserService.parseResumeText(rawText);

    return NextResponse.json({
      success: true,
      rawTextSnippet: rawText.substring(0, 300),
      extractedData,
    });
  } catch (error: any) {
    console.error("Resume upload/parse error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to parse resume document" },
      { status: 500 }
    );
  }
}
