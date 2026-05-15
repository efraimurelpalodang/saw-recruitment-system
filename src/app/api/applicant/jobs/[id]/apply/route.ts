import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const jobId = params.id;

  // Check if the job exists and is open
  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
  });

  if (!job || job.status !== "open") {
    return NextResponse.json(
      { error: "Job posting not found or no longer open." },
      { status: 404 }
    );
  }

  // Check if applicant has already applied
  const existing = await prisma.jobApplication.findUnique({
    where: {
      user_id_job_posting_id: {
        user_id: userId,
        job_posting_id: jobId,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already applied to this job." },
      { status: 409 }
    );
  }

  // Create the application
  const application = await prisma.jobApplication.create({
    data: {
      user_id: userId,
      job_posting_id: jobId,
      current_stage: "administrasi",
      status: "pending",
    },
  });

  return NextResponse.json(application, { status: 201 });
}
