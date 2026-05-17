import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const session = await getServerSession(authOptions);
  const { applicationId } = await params;

  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if ((session.user as any).role !== "hrd")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      applicant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          ktp_photo_url: true,
          applicant_profile: true,
        },
      },
      job_posting: {
        select: { id: true, title: true },
      },
      selection_stages: true,
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  return NextResponse.json(application);
}
