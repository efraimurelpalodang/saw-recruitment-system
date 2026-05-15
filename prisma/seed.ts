import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── 1. Seed HRD account ───────────────────────────────────
  const hashedPassword = await bcrypt.hash("hrd123456", 10);

  await prisma.user.upsert({
    where: { email: "hrd@company.com" },
    update: {
      name: "Admin HRD",
      password: hashedPassword,
      role: "hrd",
    },
    create: {
      name: "Admin HRD",
      email: "hrd@company.com",
      password: hashedPassword,
      role: "hrd",
    },
  });

  console.log("✅ HRD account created");
  console.log("   Email   : hrd@company.com");
  console.log("   Password: hrd123456");

  // ── 2. Seed SAW criteria ──────────────────────────────────
  const criteria = [
    { code: "C1", name: "Pendidikan", weight: 0.20, type: "benefit" as const, order: 1 },
    { code: "C2", name: "Pengalaman Kerja", weight: 0.25, type: "benefit" as const, order: 2 },
    { code: "C3", name: "Tes Teknis", weight: 0.25, type: "benefit" as const, order: 3 },
    { code: "C4", name: "IPK", weight: 0.15, type: "benefit" as const, order: 4 },
    { code: "C5", name: "Usia", weight: 0.15, type: "cost" as const, order: 5 },
  ];

  for (const c of criteria) {
    await prisma.sawCriteria.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }

  console.log("✅ SAW criteria seeded (C1–C5, total weight = 1.00)");

  // ── 3. Seed Sample Job Posting ───────────────────────────
  const hrd = await prisma.user.findFirst({ where: { role: "hrd" } });
  if (hrd) {
    await prisma.jobPosting.create({
      data: {
        title: "Software Engineer",
        description: "Join our dynamic team as a Software Engineer. You will be responsible for developing high-quality web applications using modern technologies.",
        requirements: "Bachelor's degree in Computer Science, 2+ years of experience with React/Next.js.",
        quota: 10,
        min_age: 18,
        max_age: 40,
        status: "open",
        created_by: hrd.id,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    });
    console.log("✅ Sample job posting created");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
