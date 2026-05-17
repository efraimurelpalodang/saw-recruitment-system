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
  const { result, notes } = body;

  // result: "passed" | "failed"
  if (!["passed", "failed"].includes(result)) {
    return NextResponse.json({ error: "Result must be 'passed' or 'failed'." }, { status: 400 });
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (application.current_stage !== "administrasi") {
    return NextResponse.json(
      { error: "This application is no longer at the administrasi stage." },
      { status: 400 }
    );
  }

  // Upsert the selection stage record
  await prisma.selectionStage.upsert({
    where: {
      application_id_stage_name: {
        application_id: applicationId,
        stage_name: "administrasi",
      },
    },
    update: {
      status: result === "passed" ? "passed" : "failed",
      notes: notes ?? null,
      evaluated_at: new Date(),
    },
    create: {
      application_id: applicationId,
      stage_name: "administrasi",
      status: result === "passed" ? "passed" : "failed",
      notes: notes ?? null,
      evaluated_at: new Date(),
    },
  });

  // Update the application
  await prisma.jobApplication.update({
    where: { id: applicationId },
    data:
      result === "passed"
        ? { current_stage: "tes_teknis" }
        : { current_stage: "selesai", status: "rejected" },
  });

  return NextResponse.json({ success: true });
}
