import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const profile = await prisma.applicantProfile.findUnique({
    where: { user_id: (session.user as any).id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const {
    name,
    phone,
    birth_date,
    gender,
    address,
    city,
    province,
    education_level,
    major,
    institution,
    experience_years,
    ipk,
    skills,
  } = body;

  // Update user name and phone
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: name ?? undefined,
      phone: phone ?? undefined,
    },
  });

  // Update applicant profile
  const updated = await prisma.applicantProfile.update({
    where: { user_id: userId },
    data: {
      birth_date: birth_date ? new Date(birth_date) : undefined,
      gender: gender ?? undefined,
      address: address ?? undefined,
      city: city ?? undefined,
      province: province ?? undefined,
      education_level: education_level ?? undefined,
      major: major ?? undefined,
      institution: institution ?? undefined,
      experience_years: experience_years !== undefined ? Number(experience_years) : undefined,
      ipk: ipk !== undefined ? Number(ipk) : undefined,
      skills: skills ?? undefined,
    },
  });

  return NextResponse.json(updated);
}
