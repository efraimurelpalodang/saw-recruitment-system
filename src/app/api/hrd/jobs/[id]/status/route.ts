import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  if ((session.user as any).role !== "hrd") return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  const body = await req.json();
  const { status } = body;

  const validTransitions: Record<string, string> = {
    draft: "open",
    open: "closed",
  };

  const { id } = await params;
  const job = await prisma.jobPosting.findUnique({
    where: { id },
  });

  if (!job) return NextResponse.json({ error: "Lowongan tidak ditemukan." }, { status: 404 });

  if (validTransitions[job.status] !== status) {
    return NextResponse.json(
      { error: `Tidak dapat mengubah status dari "${job.status}" ke "${status}".` },
      { status: 400 }
    );
  }

  const updated = await prisma.jobPosting.update({
    where: { id },
    data: { status: status as any },
  });

  return NextResponse.json(updated);
}
