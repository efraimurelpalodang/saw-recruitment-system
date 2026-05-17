import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
}

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding dummy data for HRD testing...")
  console.log("Using DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 30) + '...');

  // Check if HRD exists
  let hrdUser = await prisma.user.findFirst({ where: { role: 'hrd' } });
  if (!hrdUser) {
     const hashedPassword = await bcrypt.hash("password123", 10);
     hrdUser = await prisma.user.create({
       data: {
         name: "HRD Dummy",
         email: "hrd.dummy@example.com",
         password: hashedPassword,
         role: "hrd",
       }
     });
     console.log("Created HRD user: hrd.dummy@example.com (password: password123)");
  }

  // Check if jobs exist, otherwise create them
  let job1 = await prisma.jobPosting.findFirst({ where: { title: "Software Engineer - Frontend (Dummy)" }});
  if (!job1) {
    job1 = await prisma.jobPosting.create({
      data: {
        created_by: hrdUser.id,
        title: "Software Engineer - Frontend (Dummy)",
        description: "Develop user interfaces and ensure excellent user experience.",
        requirements: "React, Next.js, TypeScript",
        min_age: 20,
        max_age: 30,
        quota: 5,
        status: "open",
      }
    });
    console.log("Created Job 1: Frontend");
  }

  let job2 = await prisma.jobPosting.findFirst({ where: { title: "Software Engineer - Backend (Dummy)" }});
  if (!job2) {
    job2 = await prisma.jobPosting.create({
      data: {
        created_by: hrdUser.id,
        title: "Software Engineer - Backend (Dummy)",
        description: "Develop robust API and manage database.",
        requirements: "Node.js, PostgreSQL, Prisma",
        min_age: 22,
        max_age: 35,
        quota: 3,
        status: "open",
      }
    });
    console.log("Created Job 2: Backend");
  }

  console.log("Creating 25 applicants...");
  
  // Prepare passwords
  const applicantPassword = await bcrypt.hash("password123", 10);
  const educationLevels: ("sma_smk" | "d3" | "s1_d4" | "s2" | "s3")[] = ["sma_smk", "d3", "s1_d4", "s2", "s3"];

  for (let i = 1; i <= 25; i++) {
    const email = `pelamar${i}@example.com`;
    
    // check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({
            data: {
            name: `Pelamar Dummy ${i}`,
            email: email,
            password: applicantPassword,
            role: "applicant",
            applicant_profile: {
                create: {
                education_level: educationLevels[i % educationLevels.length],
                experience_years: i % 5,
                ipk: 3.0 + (i % 10) * 0.1,
                birth_date: new Date(1995 + (i % 5), (i % 12), 1)
                }
            }
            }
        });
    }

    // Assign to jobs (15 for Job 1, 10 for Job 2)
    const targetJob = i <= 15 ? job1 : job2;

    const existingApplication = await prisma.jobApplication.findUnique({
        where: {
            user_id_job_posting_id: {
                user_id: user.id,
                job_posting_id: targetJob.id
            }
        }
    });

    if (!existingApplication) {
        await prisma.jobApplication.create({
            data: {
            user_id: user.id,
            job_posting_id: targetJob.id,
            current_stage: "administrasi",
            status: "pending"
            }
        });
    }
  }

  console.log("Dummy data seeded successfully. 15 applicants in Job 1, 10 applicants in Job 2.");
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
