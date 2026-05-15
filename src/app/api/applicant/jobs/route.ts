import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const userId = (session.user as any).id;

  // Fetch all open jobs
  const jobs = await prisma.jobPosting.findMany({
    where: { status: "open" },
    orderBy: { created_at: "desc" },
  });

  // Fetch this applicant's existing applications
  const applications = await prisma.jobApplication.findMany({
    where: { user_id: userId },
    select: { job_posting_id: true },
  });

  const appliedIds = new Set(applications.map((a) => a.job_posting_id));

  const result = jobs.map((job) => ({
    ...job,
    has_applied: appliedIds.has(job.id),
  }));

  return NextResponse.json(result);
}
