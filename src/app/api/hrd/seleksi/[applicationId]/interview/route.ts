import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const session = await getServerSession(authOptions);
  const { applicationId } = await params;

  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if ((session.user as any).role !== "hrd")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await req.json();
  const { score, notes } = body;

  if (score === undefined || score === null) {
    return NextResponse.json({ error: "Score is required." }, { status: 400 });
  }

  const numScore = Number(score);
  if (isNaN(numScore) || numScore < 0 || numScore > 100) {
    return NextResponse.json({ error: "Score must be between 0 and 100." }, { status: 400 });
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (application.current_stage !== "interview") {
    return NextResponse.json(
      { error: "This application is not at the interview stage." },
      { status: 400 }
    );
  }

  // Save the interview score
  await prisma.selectionStage.upsert({
    where: {
      application_id_stage_name: {
        application_id: applicationId,
        stage_name: "interview",
      },
    },
    update: {
      score: numScore,
      status: "passed",
      notes: notes ?? null,
      evaluated_at: new Date(),
    },
    create: {
      application_id: applicationId,
      stage_name: "interview",
      score: numScore,
      status: "passed",
      notes: notes ?? null,
      evaluated_at: new Date(),
    },
  });

  // All stages complete — move to selesai
  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { current_stage: "selesai" },
  });

  return NextResponse.json({ success: true });
}
