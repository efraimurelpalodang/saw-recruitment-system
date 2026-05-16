"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

type JobStatus = "draft" | "open" | "closed";

type Job = {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  min_age: number;
  max_age: number;
  quota: number;
  deadline: string | null;
  status: JobStatus;
  _count: { job_applications: number };
};

const STATUS_BADGE: Record<JobStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "Draft", variant: "outline" },
  open: { label: "Open", variant: "default" },
  closed: { label: "Closed", variant: "secondary" },
};

const EMPTY_FORM = {
  title: "",
  description: "",
  requirements: "",
  min_age: "",
  max_age: "",
  quota: "",
  deadline: "",
};

export default function HrdLowonganPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Dialog state
  const [open, setOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    const res = await fetch("/api/hrd/jobs");
    if (res.ok) setJobs(await res.json());
    setLoading(false);
  }

  function openCreate() {
    setEditingJob(null);
    setForm(EMPTY_FORM);
    setError("");
    setOpen(true);
  }

  function openEdit(job: Job) {
    setEditingJob(job);
    setForm({
      title: job.title,
      description: job.description,
      requirements: job.requirements ?? "",
      min_age: String(job.min_age),
      max_age: String(job.max_age),
      quota: String(job.quota),
      deadline: job.deadline ? job.deadline.split("T")[0] : "",
    });
    setError("");
    setOpen(true);
  }

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const body = {
      ...form,
      min_age: Number(form.min_age),
      max_age: Number(form.max_age),
      quota: Number(form.quota),
      deadline: form.deadline || null,
    };

    const url = editingJob ? `/api/hrd/jobs/${editingJob.id}` : "/api/hrd/jobs";
    const method = editingJob ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setOpen(false);
    loadJobs();
  }

  async function handleStatusChange(job: Job, status: string) {
    const res = await fetch(`/api/hrd/jobs/${job.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) loadJobs();
  }

  async function handleDelete(job: Job) {
    if (!confirm(`Delete "${job.title}"?`)) return;
    const res = await fetch(`/api/hrd/jobs/${job.id}`, { method: "DELETE" });
    if (res.ok) loadJobs();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Job Postings</h1>
          <p className="text-sm text-muted-foreground">
            Manage open positions for applicants.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> New posting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingJob ? "Edit posting" : "New posting"}</DialogTitle>
              <DialogDescription>
                {editingJob
                  ? "Update the details for this draft job posting."
                  : "Fill in the details for the new job posting. It will be saved as a draft."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={field("title")}
                  required
                  disabled={submitting}
                  placeholder="e.g. Production Operator"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={field("description")}
                  required
                  disabled={submitting}
                  rows={3}
                  placeholder="Job responsibilities and overview..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="requirements">
                  Requirements <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="requirements"
                  value={form.requirements}
                  onChange={field("requirements")}
                  disabled={submitting}
                  rows={2}
                  placeholder="e.g. Min. D3, 2 years experience..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="min_age">Min. age</Label>
                  <Input
                    id="min_age"
                    type="number"
                    min={17}
                    value={form.min_age}
                    onChange={field("min_age")}
                    required
                    disabled={submitting}
                    placeholder="18"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max_age">Max. age</Label>
                  <Input
                    id="max_age"
                    type="number"
                    min={17}
                    value={form.max_age}
                    onChange={field("max_age")}
                    required
                    disabled={submitting}
                    placeholder="35"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quota">Quota</Label>
                  <Input
                    id="quota"
                    type="number"
                    min={1}
                    value={form.quota}
                    onChange={field("quota")}
                    required
                    disabled={submitting}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="deadline">
                    Deadline 
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={form.deadline}
                    onChange={field("deadline")}
                    disabled={submitting}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? "Saving..." : editingJob ? "Save changes" : "Create draft"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {jobs.length === 0 && (
        <p className="text-sm text-muted-foreground">No job postings yet. Create one to get started.</p>
      )}

      <div className="space-y-4">
        {jobs.map((job) => {
          const { label, variant } = STATUS_BADGE[job.status];
          return (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-base">{job.title}</CardTitle>
                  <Badge variant={variant}>{label}</Badge>
                </div>
                <CardDescription>
                  Age {job.min_age}–{job.max_age} · Quota: {job.quota} · Applicants: {job._count.job_applications}
                  {job.deadline && ` · Deadline: ${new Date(job.deadline).toLocaleDateString("en-GB")}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
              </CardContent>
              <CardFooter className="flex gap-2">
                {job.status === "draft" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => openEdit(job)}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" onClick={() => handleStatusChange(job, "open")}>
                      Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive ml-auto"
                      onClick={() => handleDelete(job)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                    </Button>
                  </>
                )}
                {job.status === "open" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(job, "closed")}>
                    Close posting
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
