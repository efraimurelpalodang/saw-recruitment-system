import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      ktp_number,
      birth_date,
      gender,
      address,
      ktp_photo_url,
    } = body;

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Kata sandi harus minimal 8 karakter." },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan gunakan email lain." },
        { status: 409 }
      );
    }

    // Check for duplicate NIK
    if (ktp_number) {
      const existingNik = await prisma.applicantProfile.findFirst({
        where: { ktp_number },
      });

      if (existingNik) {
        return NextResponse.json(
          { error: "NIK sudah terdaftar di sistem." },
          { status: 409 }
        );
      }
    }

    // Hash password and create user with applicant profile
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate birth_date
    let validatedBirthDate = null;
    if (birth_date && birth_date.trim() !== "") {
      const d = new Date(birth_date);
      if (!isNaN(d.getTime())) {
        validatedBirthDate = d;
      }
    }

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "applicant",
        ktp_photo_url: ktp_photo_url ?? null,
        applicant_profile: {
          create: {
            ktp_number: ktp_number ?? null,
            birth_date: validatedBirthDate,
            gender: gender ?? null,
            address: address ?? null,
          },
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
