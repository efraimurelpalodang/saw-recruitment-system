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
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
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
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
