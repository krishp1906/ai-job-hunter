import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Quick DB check
    const candidate = await prisma.candidateProfile.findFirst({
      select: {
        id: true,
        name: true,
        currentPosition: true,
        currentCompany: true,
      },
    });

    const jobsCount = await prisma.jobListing.count();
    const skillsCount = await prisma.candidateSkill.count();

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        database: "SQLite (Prisma ORM)",
        databaseConnected: true,
        geminiConfigured: !!process.env.GEMINI_API_KEY,
      },
      stats: {
        candidateLoaded: !!candidate,
        candidateName: candidate?.name,
        skillsCount,
        jobsCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        databaseConnected: false,
      },
      { status: 500 }
    );
  }
}
