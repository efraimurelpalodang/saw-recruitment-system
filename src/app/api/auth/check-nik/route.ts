import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ktp_number } = body;

    if (!ktp_number) {
      return NextResponse.json(
        { error: "NIK wajib diisi." },
        { status: 400 }
      );
    }

    const existing = await prisma.applicantProfile.findFirst({
      where: { ktp_number },
    });

    if (existing) {
      return NextResponse.json(
        { exists: true, error: "NIK sudah terdaftar di sistem." },
        { status: 409 }
      );
    }

    return NextResponse.json({ exists: false }, { status: 200 });
  } catch (error) {
    console.error("[CHECK-NIK ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memeriksa NIK." },
      { status: 500 }
    );
  }
}
