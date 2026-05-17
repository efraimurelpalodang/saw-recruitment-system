import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if ((session.user as any).role !== "hrd")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await req.json();
  const { decision } = body; // "accepted" | "rejected"

  if (!["accepted", "rejected"].includes(decision)) {
    return NextResponse.json(
      { error: "Decision must be 'accepted' or 'rejected'." },
      { status: 400 }
    );
  }

  const { applicationId } = await params;

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (application.status !== "pending") {
    return NextResponse.json(
      { error: "A decision has already been made for this applicant." },
      { status: 409 }
    );
  }

  const deciderId = (session.user as any).id;

  const updated = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      status: decision as "accepted" | "rejected",
      decided_by: deciderId,
      decided_at: new Date(),
    },
  });

  return NextResponse.json(updated);
}
