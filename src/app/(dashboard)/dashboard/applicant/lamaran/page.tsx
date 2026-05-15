"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type Job = {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  quota: number;
  deadline: string | null;
  has_applied: boolean;
};

export default function LamaranPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/applicant/jobs");
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (error) {
        console.error("Failed to load jobs:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleApply(jobId: string) {
    setApplyingId(jobId);
    setFeedback((prev) => ({ ...prev, [jobId]: "" }));
    try {
      const res = await fetch(`/api/applicant/jobs/${jobId}/apply`, {
        method: "POST",
      });
      const data = await res.json();
      
      if (!res.ok) {
        setFeedback((prev) => ({
          ...prev,
          [jobId]: data.error ?? "Failed to apply. Please try again.",
        }));
        return;
      }

      // Mark as applied locally — no need to refetch
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, has_applied: true } : j))
      );
      setFeedback((prev) => ({ ...prev, [jobId]: "Application submitted!" }));
    } catch (error) {
      setFeedback((prev) => ({
        ...prev,
        [jobId]: "An error occurred. Please try again.",
      }));
    } finally {
      setApplyingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold">Open Positions</h1>
        <p className="text-sm text-muted-foreground">
          Browse available job openings and submit your application.
        </p>
      </div>

      {jobs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No open positions at the moment. Check back later.
        </p>
      )}

      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-base">{job.title}</CardTitle>
                {job.has_applied && <Badge variant="secondary">Applied</Badge>}
              </div>
              <CardDescription>
                Quota: {job.quota} &nbsp;·&nbsp;{" "}
                {job.deadline
                  ? `Deadline: ${new Date(job.deadline).toLocaleDateString(
                      "en-GB"
                    )}`
                  : "No deadline"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {job.description}
              </p>
              {job.requirements && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  <span className="font-medium text-foreground">
                    Requirements:{" "}
                  </span>
                  {job.requirements}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between gap-4 bg-muted/30 py-3">
              <div className="flex-1">
                {feedback[job.id] && (
                  <p
                    className={`text-xs font-medium ${
                      feedback[job.id] === "Application submitted!"
                        ? "text-green-600"
                        : "text-destructive"
                    }`}
                  >
                    {feedback[job.id]}
                  </p>
                )}
              </div>
              <div className="ml-auto">
                {!job.has_applied && (
                  <Button
                    size="sm"
                    disabled={applyingId === job.id}
                    onClick={() => handleApply(job.id)}
                  >
                    {applyingId === job.id && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {applyingId === job.id ? "Applying..." : "Apply"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
