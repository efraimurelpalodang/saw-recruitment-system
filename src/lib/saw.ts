// ── Types ─────────────────────────────────────────────────────────────────
export type EducationLevel = "sma_smk" | "d3" | "s1_d4" | "s2" | "s3";

export interface SawInput {
  applicationId: string;
  jobPostingId: string;
  educationLevel: EducationLevel | null;
  experienceYears: number;
  technicalScore: number; // C3: tes teknis score (0–100)
  ipk: number | null;
  birthDate: Date | null;
}

export interface SawResult {
  applicationId: string;
  jobPostingId: string;
  c1_education: number;
  c2_experience: number;
  c3_technical: number;
  c4_ipk: number;
  c5_age: number;
  finalScore: number;
  rank: number;
}

// ── Constants ──────────────────────────────────────────────────────────────
const EDUCATION_VALUE: Record<EducationLevel, number> = {
  sma_smk: 1,
  d3: 2,
  s1_d4: 3,
  s2: 4,
  s3: 5,
};

const WEIGHTS = {
  c1: 0.20,
  c2: 0.25,
  c3: 0.25,
  c4: 0.15,
  c5: 0.15,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function getAgeInYears(birthDate: Date | null): number {
  if (!birthDate) return 0;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
}

function safeMax(values: number[]): number {
  const max = Math.max(...values);
  return max === 0 ? 1 : max; // avoid division by zero
}

function safeMin(values: number[]): number {
  const min = Math.min(...values);
  return min === 0 ? 0 : min;
}

// ── Main function ──────────────────────────────────────────────────────────
export function calculateSaw(inputs: SawInput[]): SawResult[] {
  if (inputs.length === 0) return [];

  // Step 1 — Build raw decision matrix
  const raw = inputs.map((a) => ({
    applicationId: a.applicationId,
    jobPostingId: a.jobPostingId,
    c1: a.educationLevel ? EDUCATION_VALUE[a.educationLevel] : 0,
    c2: a.experienceYears,
    c3: a.technicalScore,
    c4: a.ipk ?? 0,
    c5: getAgeInYears(a.birthDate),
  }));

  // Step 2 — Normalize (benefit: val/max, cost: min/val)
  const maxC1 = safeMax(raw.map((r) => r.c1));
  const maxC2 = safeMax(raw.map((r) => r.c2));
  const maxC3 = safeMax(raw.map((r) => r.c3));
  const maxC4 = safeMax(raw.map((r) => r.c4));
  const minC5 = safeMin(raw.map((r) => r.c5));

  const normalized = raw.map((r) => ({
    applicationId: r.applicationId,
    jobPostingId: r.jobPostingId,
    c1: r.c1 === 0 ? 0 : r.c1 / maxC1,
    c2: r.c2 === 0 ? 0 : r.c2 / maxC2,
    c3: r.c3 === 0 ? 0 : r.c3 / maxC3,
    c4: r.c4 === 0 ? 0 : r.c4 / maxC4,
    // Cost: min/val. If age is 0 (unknown), set to 0
    c5: r.c5 === 0 ? 0 : minC5 / r.c5,
  }));

  // Step 3 — Calculate final score V
  const scored = normalized.map((n) => ({
    applicationId: n.applicationId,
    jobPostingId: n.jobPostingId,
    c1_education: n.c1,
    c2_experience: n.c2,
    c3_technical: n.c3,
    c4_ipk: n.c4,
    c5_age: n.c5,
    finalScore:
      n.c1 * WEIGHTS.c1 +
      n.c2 * WEIGHTS.c2 +
      n.c3 * WEIGHTS.c3 +
      n.c4 * WEIGHTS.c4 +
      n.c5 * WEIGHTS.c5,
  }));

  // Step 4 — Sort descending and assign rank
  scored.sort((a, b) => b.finalScore - a.finalScore);

  return scored.map((s, index) => ({
    ...s,
    rank: index + 1,
  }));
}
