import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if ((session.user as any).role !== "hrd")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const applications = await prisma.jobApplication.findMany({
    where: { job_posting_id: id },
    orderBy: { applied_at: "asc" },
    include: {
      applicant: {
        select: {
          id: true,
          name: true,
          email: true,
          applicant_profile: {
            select: {
              education_level: true,
              experience_years: true,
              ipk: true,
              birth_date: true,
            },
          },
        },
      },
      selection_stages: true,
    },
  });

  return NextResponse.json(applications);
}
