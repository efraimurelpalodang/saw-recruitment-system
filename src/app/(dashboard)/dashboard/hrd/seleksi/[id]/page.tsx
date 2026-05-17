"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

type SelectionStage = {
  stage_name: string;
  status: string;
  notes: string | null;
};

type Application = {
  id: string;
  current_stage: string;
  status: string;
  applied_at: string;
  applicant: {
    id: string;
    name: string;
    email: string;
    applicant_profile: {
      education_level: string | null;
      experience_years: number;
      ipk: number | null;
      birth_date: string | null;
    } | null;
  };
  selection_stages: SelectionStage[];
};

const STAGE_LABEL: Record<string, string> = {
  administrasi: "Administrasi",
  tes_teknis: "Tes Teknis",
  interview: "Interview",
  selesai: "Selesai",
};

const EDUCATION_LABEL: Record<string, string> = {
  sma_smk: "SMA/SMK",
  d3: "D3",
  s1_d4: "S1/D4",
  s2: "S2",
  s3: "S3",
};

function calculateAge(birthDate: string | null): string {
  if (!birthDate) return "-";
  const diff = Date.now() - new Date(birthDate).getTime();
  return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365))} yo`;
}

export default function SeleksiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadApplicants();
  }, []);

  async function loadApplicants() {
    setLoading(true);
    const res = await fetch(`/api/hrd/jobs/${id}/applicants`);
    if (res.ok) setApplications(await res.json());
    setLoading(false);
  }

  async function handleAdministrasi(applicationId: string, result: "passed" | "failed") {
    setActingId(applicationId);
    setFeedback((prev) => ({ ...prev, [applicationId]: "" }));

    const res = await fetch(`/api/hrd/seleksi/${applicationId}/administrasi`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
    });

    const data = await res.json();
    setActingId(null);

    if (!res.ok) {
      setFeedback((prev) => ({ ...prev, [applicationId]: data.error ?? "Something went wrong." }));
      return;
    }

    loadApplicants();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalPages = Math.ceil(applications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedApplications = applications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Applicant Selection</h1>
        <p className="text-sm text-muted-foreground">
          Review applicants and perform administrasi screening.
        </p>
      </div>

      {applications.length === 0 && (
        <p className="text-sm text-muted-foreground">No applicants yet for this job posting.</p>
      )}

      <div className="space-y-4">
        {paginatedApplications.map((app) => {
          const profile = app.applicant.applicant_profile;
          const isAtAdministrasi = app.current_stage === "administrasi";
          const isRejected = app.status === "rejected";
          const isActing = actingId === app.id;

          return (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{app.applicant.name}</CardTitle>
                    <CardDescription>{app.applicant.email}</CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Badge variant={isRejected ? "destructive" : "outline"}>
                      {isRejected ? "Rejected" : STAGE_LABEL[app.current_stage]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Profile summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Education</p>
                    <p className="font-medium">
                      {profile?.education_level
                        ? EDUCATION_LABEL[profile.education_level] ?? profile.education_level
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Experience</p>
                    <p className="font-medium">
                      {profile?.experience_years ?? 0} yr(s)
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">GPA (IPK)</p>
                    <p className="font-medium">
                      {profile?.ipk != null ? profile.ipk.toFixed(2) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Age</p>
                    <p className="font-medium">{calculateAge(profile?.birth_date ?? null)}</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Applied: {new Date(app.applied_at).toLocaleDateString("en-GB")}
                </p>

                <div className="pt-1">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/hrd/seleksi/${id}/${app.id}`}>
                      View full profile
                    </Link>
                  </Button>
                </div>

                {feedback[app.id] && (
                  <p className="text-sm text-destructive">{feedback[app.id]}</p>
                )}

                {/* Administrasi action buttons */}
                {isAtAdministrasi && (
                  <>
                    <Separator />
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        disabled={isActing}
                        onClick={() => handleAdministrasi(app.id, "passed")}
                      >
                        {isActing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Pass
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled={isActing}
                        onClick={() => handleAdministrasi(app.id, "failed")}
                      >
                        {isActing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                        Fail
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <Pagination className="py-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((p) => Math.max(1, Math.min(totalPages, p + 1)))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
