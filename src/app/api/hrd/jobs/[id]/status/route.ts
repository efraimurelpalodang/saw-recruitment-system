import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if ((session.user as any).role !== "hrd") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await req.json();
  const { status } = body;

  const validTransitions: Record<string, string> = {
    draft: "open",
    open: "closed",
  };

  const job = await prisma.jobPosting.findUnique({
    where: { id: params.id },
  });

  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });

  if (validTransitions[job.status] !== status) {
    return NextResponse.json(
      { error: `Cannot transition from "${job.status}" to "${status}".` },
      { status: 400 }
    );
  }

  const updated = await prisma.jobPosting.update({
    where: { id: params.id },
    data: { status: status as any },
  });

  return NextResponse.json(updated);
}
