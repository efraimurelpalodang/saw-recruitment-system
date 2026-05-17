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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react";

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
  draft: { label: "Draf", variant: "outline" },
  open: { label: "Dibuka", variant: "default" },
  closed: { label: "Ditutup", variant: "secondary" },
};

const EMPTY_FORM = {
  title: "",
  description: "",
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

  // Requirements sebagai array terpisah
  const [requirements, setRequirements] = useState<string[]>([""]);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

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
    setRequirements([""]);
    setError("");
    setOpen(true);
  }

  function openEdit(job: Job) {
    setEditingJob(job);
    setForm({
      title: job.title,
      description: job.description,
      min_age: String(job.min_age),
      max_age: String(job.max_age),
      quota: String(job.quota),
      deadline: job.deadline ? job.deadline.split("T")[0] : "",
    });
    // Parse requirements yang dipisah koma kembali ke array
    if (job.requirements) {
      const parsed = job.requirements.split(",").map((r) => r.trim()).filter(Boolean);
      setRequirements(parsed.length > 0 ? parsed : [""]);
    } else {
      setRequirements([""]);
    }
    setError("");
    setOpen(true);
  }

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  // Requirement handlers
  function handleRequirementChange(index: number, value: string) {
    setRequirements((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

  function addRequirement() {
    setRequirements((prev) => [...prev, ""]);
  }

  function removeRequirement(index: number) {
    setRequirements((prev) => {
      if (prev.length <= 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Gabungkan requirements yang tidak kosong dengan koma
    const reqJoined = requirements.filter((r) => r.trim() !== "").join(", ");

    const body = {
      ...form,
      requirements: reqJoined || null,
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
      setError(data.error ?? "Terjadi kesalahan.");
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

  function confirmDelete(job: Job) {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!jobToDelete) return;
    const res = await fetch(`/api/hrd/jobs/${jobToDelete.id}`, { method: "DELETE" });
    if (res.ok) loadJobs();
    setDeleteDialogOpen(false);
    setJobToDelete(null);
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
          <h1 className="text-2xl font-semibold">Lowongan Kerja</h1>
          <p className="text-sm text-muted-foreground">
            Kelola posisi lowongan untuk para pelamar.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Lowongan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingJob ? "Edit Lowongan" : "Tambah Lowongan Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingJob
                  ? "Perbarui detail lowongan kerja draf ini."
                  : "Isi detail lowongan kerja baru. Lowongan akan disimpan sebagai draf."}
              </DialogDescription>
            </DialogHeader>

            <Separator />

            <form onSubmit={handleSubmit} className="space-y-5 py-1">
              {/* 2 Kolom: Kiri = Info Pekerjaan, Kanan = Persyaratan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kolom Kiri — Info Pekerjaan */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">
                    Informasi Pekerjaan
                  </h3>

                  {/* Judul Posisi */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Judul Posisi <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={field("title")}
                      required
                      disabled={submitting}
                      placeholder="Contoh: Operator Produksi"
                    />
                  </div>

                  {/* Deskripsi */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Deskripsi Pekerjaan <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={field("description")}
                      required
                      disabled={submitting}
                      rows={5}
                      placeholder="Tuliskan tanggung jawab dan gambaran umum pekerjaan..."
                    />
                  </div>
                </div>

                {/* Kolom Kanan — Persyaratan */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground tracking-tight">
                      Persyaratan <span className="text-destructive">*</span>
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRequirement}
                      disabled={submitting}
                      className="h-7 text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" /> Tambah
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-7 w-7 rounded-md bg-muted text-xs font-medium text-muted-foreground shrink-0">
                          {idx + 1}
                        </div>
                        <Input
                          value={req}
                          onChange={(e) => handleRequirementChange(idx, e.target.value)}
                          disabled={submitting}
                          required
                          placeholder={`Persyaratan ke-${idx + 1}`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRequirement(idx)}
                          disabled={submitting || requirements.length <= 1}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Baris Bawah — Detail Tambahan (4 kolom penuh) */}
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight mb-3">
                  Detail Tambahan
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_age" className="text-sm font-medium">
                      Usia Min. <span className="text-destructive">*</span>
                    </Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="max_age" className="text-sm font-medium">
                      Usia Maks. <span className="text-destructive">*</span>
                    </Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="quota" className="text-sm font-medium">
                      Kuota <span className="text-destructive">*</span>
                    </Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-sm font-medium">
                      Batas Waktu
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
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Separator />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting
                    ? "Menyimpan..."
                    : editingJob
                    ? "Simpan Perubahan"
                    : "Simpan Draf"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {jobs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Belum ada lowongan kerja. Buat lowongan pertama Anda.
        </p>
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
                  Usia {job.min_age}–{job.max_age} · Kuota: {job.quota} · Pelamar: {job._count.job_applications}
                  {job.deadline && ` · Batas Waktu: ${new Date(job.deadline).toLocaleDateString("id-ID")}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                {job.requirements && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.requirements.split(",").map((req, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-normal">
                        {req.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                {job.status === "draft" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => openEdit(job)}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" onClick={() => handleStatusChange(job, "open")}>
                      Publikasi
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive ml-auto"
                      onClick={() => confirmDelete(job)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Hapus
                    </Button>
                  </>
                )}
                {job.status === "open" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(job, "closed")}>
                    Tutup Lowongan
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Konfirmasi Hapus */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Lowongan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus lowongan &quot;{jobToDelete?.title}&quot;?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
