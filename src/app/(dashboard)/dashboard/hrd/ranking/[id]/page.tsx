"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw, ArrowLeft, CheckCircle, XCircle } from "lucide-react";

const EDUCATION_LABEL: Record<string, string> = {
  sma_smk: "SMA/SMK",
  d3: "D3",
  s1_d4: "S1/D4",
  s2: "S2",
  s3: "S3",
};

type SawScore = {
  id: string;
  rank: number;
  c1_education: number;
  c2_experience: number;
  c3_technical: number;
  c4_ipk: number;
  c5_age: number;
  final_score: number;
  calculated_at: string;
  application: {
    id: string;
    status: "pending" | "accepted" | "rejected";
    applicant: {
      name: string;
      email: string;
      applicant_profile: {
        education_level: string | null;
        experience_years: number;
        ipk: number | null;
      } | null;
    };
  };
};

function pct(val: number) {
  return (val * 100).toFixed(1) + "%";
}

export default function RankingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [scores, setScores] = useState<SawScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function initData() {
    setLoading(true);
    setError("");

    // Auto-calculate SAW ranking
    const calcRes = await fetch(`/api/hrd/jobs/${id}/saw`, { method: "POST" });
    const calcData = await calcRes.json();
    
    // If it fails but NOT because of "no completed applicants", show error
    if (!calcRes.ok && calcData.error !== "No completed applicants found for this job posting.") {
      setError(calcData.error ?? "Terjadi kesalahan saat menghitung ranking.");
    }

    // Always load existing scores
    const res = await fetch(`/api/hrd/jobs/${id}/ranking`);
    if (res.ok) setScores(await res.json());
    
    setLoading(false);
  }

  async function handleDecision(applicationId: string, decision: "accepted" | "rejected") {
    setDecidingId(applicationId);
    const res = await fetch(`/api/hrd/seleksi/${applicationId}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });

    const data = await res.json();
    setDecidingId(null);

    if (!res.ok) {
      setError(data.error ?? "Failed to save decision.");
      return;
    }

    // Update status locally — no full reload needed
    setScores((prev) =>
      prev.map((s) =>
        s.application.id === applicationId
          ? { ...s, application: { ...s.application, status: decision } }
          : s
      )
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">SAW Ranking</h1>
          <p className="text-sm text-muted-foreground">
            Applicants ranked by the Simple Additive Weighting method. Use this as a recommendation — final decisions are yours to make.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {scores.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No ranking data yet. Only applicants who have completed the Interview stage will be ranked.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Criteria weight reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Criteria Weights</CardTitle>
              <CardDescription>
                Last calculated: {new Date(scores[0].calculated_at).toLocaleString("en-GB")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm">
                {[
                  { label: "C1 Education", weight: "20%" },
                  { label: "C2 Experience", weight: "25%" },
                  { label: "C3 Technical Test", weight: "25%" },
                  { label: "C4 GPA (IPK)", weight: "15%" },
                  { label: "C5 Age (cost)", weight: "15%" },
                ].map((c) => (
                  <div key={c.label} className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{c.label}</span>
                    <Badge variant="outline">{c.weight}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Ranking table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead className="text-right">C1</TableHead>
                  <TableHead className="text-right">C2</TableHead>
                  <TableHead className="text-right">C3</TableHead>
                  <TableHead className="text-right">C4</TableHead>
                  <TableHead className="text-right">C5</TableHead>
                  <TableHead className="text-right font-semibold">Score</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((s) => {
                  const isPending = s.application.status === "pending";
                  const isAccepted = s.application.status === "accepted";
                  const isDeciding = decidingId === s.application.id;
                  const profile = s.application.applicant.applicant_profile;

                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold text-center">
                        #{s.rank}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{s.application.applicant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.education_level ? EDUCATION_LABEL[profile.education_level] : "-"}{" "}
                          · {profile?.experience_years ?? 0} yr(s) ·{" "}
                          IPK {profile?.ipk?.toFixed(2) ?? "-"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right text-xs">{pct(s.c1_education)}</TableCell>
                      <TableCell className="text-right text-xs">{pct(s.c2_experience)}</TableCell>
                      <TableCell className="text-right text-xs">{pct(s.c3_technical)}</TableCell>
                      <TableCell className="text-right text-xs">{pct(s.c4_ipk)}</TableCell>
                      <TableCell className="text-right text-xs">{pct(s.c5_age)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {s.final_score.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            isAccepted
                              ? "default"
                              : s.application.status === "rejected"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {isAccepted ? "Accepted" : s.application.status === "rejected" ? "Rejected" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isPending && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={isDeciding}
                              onClick={() => handleDecision(s.application.id, "accepted")}
                            >
                              {isDeciding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              disabled={isDeciding}
                              onClick={() => handleDecision(s.application.id, "rejected")}
                            >
                              {isDeciding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
