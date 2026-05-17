import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if ((session.user as any).role !== "hrd")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;

  const scores = await prisma.sawScore.findMany({
    where: { job_posting_id: id },
    orderBy: { rank: "asc" },
    include: {
      application: {
        select: {
          id: true,
          status: true,
          applicant: {
            select: {
              name: true,
              email: true,
              applicant_profile: {
                select: {
                  education_level: true,
                  experience_years: true,
                  ipk: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(scores);
}
