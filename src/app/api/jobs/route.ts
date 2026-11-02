import { NextRequest, NextResponse } from "next/server";
import { JobService, JobFilterParams, IngestJobInput } from "@/lib/services/job-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const filters: JobFilterParams = {
      roleCategory: (searchParams.get("roleCategory") as any) || "ALL",
      location: (searchParams.get("location") as any) || "ALL",
      minMatchScore: searchParams.get("minMatchScore") ? Number(searchParams.get("minMatchScore")) : undefined,
      companyType: (searchParams.get("companyType") as any) || "ALL",
      status: (searchParams.get("status") as any) || undefined,
      searchQuery: searchParams.get("searchQuery") || undefined,
    };

    const jobs = await JobService.getJobListings(filters);
    return NextResponse.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: IngestJobInput = await req.json();

    if (!body.title || !body.company || !body.location || !body.originalUrl || !body.description || !body.mandatorySkills) {
      return NextResponse.json(
        { success: false, error: "Missing required job fields: title, company, location, originalUrl, description, mandatorySkills" },
        { status: 400 }
      );
    }

    const job = await JobService.ingestJob(body);
    return NextResponse.json({ success: true, job });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 400 }
    );
  }
}
