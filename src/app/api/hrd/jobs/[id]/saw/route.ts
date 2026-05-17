import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateSaw, SawInput, EducationLevel } from "@/lib/saw";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if ((session.user as any).role !== "hrd")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id: jobId } = await params;

  // Fetch all completed applicants for this job
  const applications = await prisma.jobApplication.findMany({
    where: {
      job_posting_id: jobId,
      current_stage: "selesai",
      status: "pending", // not yet decided
    },
    include: {
      applicant: {
        select: {
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
      selection_stages: {
        where: { stage_name: "tes_teknis" },
        select: { score: true },
      },
    },
  });

  if (applications.length === 0) {
    return NextResponse.json(
      { error: "No completed applicants found for this job posting." },
      { status: 400 }
    );
  }

  // Build SAW inputs
  const inputs: SawInput[] = applications.map((app) => {
    const profile = app.applicant.applicant_profile;
    const teStage = app.selection_stages[0];

    return {
      applicationId: app.id,
      jobPostingId: jobId,
      educationLevel: (profile?.education_level as EducationLevel) ?? null,
      experienceYears: profile?.experience_years ?? 0,
      technicalScore: teStage?.score ?? 0,
      ipk: profile?.ipk ?? null,
      birthDate: profile?.birth_date ?? null,
    };
  });

  // Run SAW calculation
  const results = calculateSaw(inputs);

  // Save results to saw_scores (upsert to allow re-calculation)
  await Promise.all(
    results.map((r) =>
      prisma.sawScore.upsert({
        where: { application_id: r.applicationId },
        update: {
          c1_education: r.c1_education,
          c2_experience: r.c2_experience,
          c3_technical: r.c3_technical,
          c4_ipk: r.c4_ipk,
          c5_age: r.c5_age,
          final_score: r.finalScore,
          rank: r.rank,
          calculated_at: new Date(),
        },
        create: {
          application_id: r.applicationId,
          job_posting_id: r.jobPostingId,
          c1_education: r.c1_education,
          c2_experience: r.c2_experience,
          c3_technical: r.c3_technical,
          c4_ipk: r.c4_ipk,
          c5_age: r.c5_age,
          final_score: r.finalScore,
          rank: r.rank,
        },
      })
    )
  );

  return NextResponse.json(results);
}
