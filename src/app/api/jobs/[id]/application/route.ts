import { NextRequest, NextResponse } from "next/server";
import { JobService } from "@/lib/services/job-service";
import { ApplicationStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const status = body.status as ApplicationStatus;
    const approvedByCandidate = Boolean(body.approvedByCandidate);
    const notes = body.notes as string | undefined;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Missing required field: status" },
        { status: 400 }
      );
    }

    const application = await JobService.updateApplicationStatus(
      id,
      status,
      approvedByCandidate,
      notes
    );

    return NextResponse.json({ success: true, application });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 400 }
    );
  }
}
