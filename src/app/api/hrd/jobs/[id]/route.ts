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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireHrd();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const job = await prisma.jobPosting.findUnique({
    where: { id: params.id },
  });

  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });

  if (job.status !== "draft") {
    return NextResponse.json({ error: "Only draft jobs can be edited." }, { status: 400 });
  }

  const body = await req.json();
  const { title, description, requirements, min_age, max_age, quota, deadline } = body;

  const updated = await prisma.jobPosting.update({
    where: { id: params.id },
    data: {
      title: title ?? undefined,
      description: description ?? undefined,
      requirements: requirements ?? undefined,
      min_age: min_age !== undefined ? Number(min_age) : undefined,
      max_age: max_age !== undefined ? Number(max_age) : undefined,
      quota: quota !== undefined ? Number(quota) : undefined,
      deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireHrd();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const job = await prisma.jobPosting.findUnique({
    where: { id: params.id },
  });

  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });

  if (job.status !== "draft") {
    return NextResponse.json({ error: "Only draft jobs can be deleted." }, { status: 400 });
  }

  await prisma.jobPosting.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
