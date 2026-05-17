"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

type ApplicantProfile = {
  education_level: string | null;
  major: string | null;
  institution: string | null;
  ipk: number | null;
  experience_years: number;
  skills: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  ktp_number: string | null;
};

type ApplicationDetail = {
  id: string;
  current_stage: string;
  status: string;
  applied_at: string;
  applicant: {
    name: string;
    email: string;
    phone: string | null;
    ktp_photo_url: string | null;
    applicant_profile: ApplicantProfile | null;
  };
  job_posting: {
    id: string;
    title: string;
  };
  selection_stages: {
    stage_name: string;
    status: string;
    notes: string | null;
  }[];
};

const EDUCATION_LABEL: Record<string, string> = {
  sma_smk: "SMA / SMK",
  d3: "D3",
  s1_d4: "S1 / D4",
  s2: "S2",
  s3: "S3",
};

const STAGE_LABEL: Record<string, string> = {
  administrasi: "Administrasi",
  tes_teknis: "Tes Teknis",
  interview: "Interview",
  selesai: "Selesai",
};

function calculateAge(birthDate: string | null): string {
  if (!birthDate) return "-";
  const diff = Date.now() - new Date(birthDate).getTime();
  return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365))} years old`;
}

export default function ApplicantDetailPage() {
  const { id, appId } = useParams<{ id: string; appId: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");

  const [teScore, setTeScore] = useState("");
  const [teNotes, setTeNotes] = useState("");

  const [ivScore, setIvScore] = useState("");
  const [ivNotes, setIvNotes] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/hrd/seleksi/${appId}/detail`);
      if (res.ok) setDetail(await res.json());
      setLoading(false);
    }
    load();
  }, [appId]);

  async function handleAdministrasi(result: "passed" | "failed") {
    setActing(true);
    setError("");

    const res = await fetch(`/api/hrd/seleksi/${appId}/administrasi`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
    });

    const data = await res.json();
    setActing(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    // Redirect back to the list page after action
    router.push(`/dashboard/hrd/seleksi/${id}`);
  }

  async function handleTesTeknis(e: React.FormEvent) {
    e.preventDefault();
    setActing(true);
    setError("");

    const res = await fetch(`/api/hrd/seleksi/${appId}/tes-teknis`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: Number(teScore),
        notes: teNotes || null,
      }),
    });

    const data = await res.json();
    setActing(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.push(`/dashboard/hrd/seleksi/${id}`);
  }

  async function handleInterview(e: React.FormEvent) {
    e.preventDefault();
    setActing(true);
    setError("");

    const res = await fetch(`/api/hrd/seleksi/${appId}/interview`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: Number(ivScore),
        notes: ivNotes || null,
      }),
    });

    const data = await res.json();
    setActing(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.push(`/dashboard/hrd/seleksi/${id}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <p className="text-sm text-muted-foreground">Application not found.</p>
      </div>
    );
  }

  const profile = detail.applicant.applicant_profile;
  const isAtAdministrasi = detail.current_stage === "administrasi";
  const isRejected = detail.status === "rejected";

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/dashboard/hrd/seleksi/${id}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to applicant list
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{detail.applicant.name}</h1>
          <p className="text-sm text-muted-foreground">{detail.applicant.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Applied to: {detail.job_posting.title} ·{" "}
            {new Date(detail.applied_at).toLocaleDateString("en-GB")}
          </p>
        </div>
        <Badge variant={isRejected ? "destructive" : "outline"}>
          {isRejected ? "Rejected" : STAGE_LABEL[detail.current_stage]}
        </Badge>
      </div>

      <Separator />

      {/* Personal information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium">{detail.applicant.phone ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Age</p>
              <p className="font-medium">{calculateAge(profile?.birth_date ?? null)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gender</p>
              <p className="font-medium capitalize">{profile?.gender ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">City</p>
              <p className="font-medium">{profile?.city ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Province</p>
              <p className="font-medium">{profile?.province ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">NIK</p>
              <p className="font-medium">{profile?.ktp_number ?? "-"}</p>
            </div>
          </div>

          {profile?.address && (
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="font-medium">{profile.address}</p>
            </div>
          )}

          {/* KTP photo */}
          {detail.applicant.ktp_photo_url && (
            <div className="text-sm">
              <p className="text-xs text-muted-foreground mb-2">KTP Photo</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={detail.applicant.ktp_photo_url}
                alt="KTP"
                className="max-h-48 rounded-md border object-contain"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education & experience */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Education & Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Education level</p>
              <p className="font-medium">
                {profile?.education_level
                  ? EDUCATION_LABEL[profile.education_level] ?? profile.education_level
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Major</p>
              <p className="font-medium">{profile?.major ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Institution</p>
              <p className="font-medium">{profile?.institution ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">GPA (IPK)</p>
              <p className="font-medium">
                {profile?.ipk != null ? profile.ipk.toFixed(2) : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Experience</p>
              <p className="font-medium">{profile?.experience_years ?? 0} yr(s)</p>
            </div>
          </div>

          {profile?.skills && (
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">Skills</p>
              <p className="font-medium">{profile.skills}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Administrasi action */}
      {isAtAdministrasi && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Administrasi Screening</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Review the applicant's profile above, then pass or fail them for the next stage.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button
                disabled={acting}
                onClick={() => handleAdministrasi("passed")}
              >
                {acting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Pass — move to Tes Teknis
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={acting}
                onClick={() => handleAdministrasi("failed")}
              >
                {acting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Fail — reject applicant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tes Teknis scoring */}
      {detail.current_stage === "tes_teknis" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tes Teknis Scoring</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTesTeknis} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the applicant's technical test score (0–100). This score will
                be used as criteria C3 in the SAW calculation.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="te_score">Technical test score</Label>
                <Input
                  id="te_score"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={teScore}
                  onChange={(e) => setTeScore(e.target.value)}
                  disabled={acting}
                  required
                  placeholder="0 – 100"
                  className="max-w-[160px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="te_notes">
                  Notes <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="te_notes"
                  value={teNotes}
                  onChange={(e) => setTeNotes(e.target.value)}
                  disabled={acting}
                  placeholder="e.g. Passed written test, failed practical"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={acting || !teScore}>
                {acting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {acting ? "Saving..." : "Save score & move to Interview"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Interview scoring */}
      {detail.current_stage === "interview" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interview Scoring</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInterview} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the applicant's interview score (0–100). Once submitted, this applicant will be included in the SAW ranking calculation.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="iv_score">Interview score</Label>
                <Input
                  id="iv_score"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={ivScore}
                  onChange={(e) => setIvScore(e.target.value)}
                  disabled={acting}
                  required
                  placeholder="0 – 100"
                  className="max-w-[160px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="iv_notes">
                  Notes <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="iv_notes"
                  value={ivNotes}
                  onChange={(e) => setIvNotes(e.target.value)}
                  disabled={acting}
                  placeholder="e.g. Strong communication, good cultural fit"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={acting || !ivScore}>
                {acting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {acting ? "Saving..." : "Save score & complete selection"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
