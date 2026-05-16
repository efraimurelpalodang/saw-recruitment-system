import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireHrd() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized.", status: 401 };
  if ((session.user as any).role !== "hrd") return { error: "Forbidden.", status: 403 };
  return { session };
}

export async function GET() {
  const auth = await requireHrd();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const jobs = await prisma.jobPosting.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      requirements: true,
      min_age: true,
      max_age: true,
      quota: true,
      deadline: true,
      status: true,
      created_at: true,
      _count: {
        select: { job_applications: true },
      },
    },
  });

  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const auth = await requireHrd();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const userId = (auth.session!.user as any).id;
  const body = await req.json();
  const { title, description, requirements, min_age, max_age, quota, deadline } = body;

  if (!title || !description || !min_age || !max_age || !quota) {
    return NextResponse.json(
      { error: "Title, description, age range, and quota are required." },
      { status: 400 }
    );
  }

  const job = await prisma.jobPosting.create({
    data: {
      created_by: userId,
      title,
      description,
      requirements: requirements ?? null,
      min_age: Number(min_age),
      max_age: Number(max_age),
      quota: Number(quota),
      deadline: deadline ? new Date(deadline) : null,
      status: "draft",
    },
  });

  return NextResponse.json(job, { status: 201 });
}
