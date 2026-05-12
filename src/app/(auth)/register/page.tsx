"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Tesseract from "tesseract.js";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import Link from "next/link";

// ── Helpers ────────────────────────────────────────────────────────────────

function extractKtpFields(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const find = (keywords: string[]) => {
    for (const line of lines) {
      for (const kw of keywords) {
        if (line.toLowerCase().includes(kw.toLowerCase())) {
          const parts = line.split(/[:=]/);
          if (parts.length > 1) return parts.slice(1).join(":").trim();
        }
      }
    }
    return "";
  };

  const rawDob = find(["tanggal lahir", "tgl lahir", "lahir"]);
  let birth_date = "";
  if (rawDob) {
    const parts = rawDob.split("-");
    if (parts.length === 3) {
      // KTP format: DD-MM-YYYY → convert to YYYY-MM-DD
      birth_date = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }

  const rawGender = find(["jenis kelamin", "kelamin"]).toLowerCase();
  const gender = rawGender.includes("laki") ? "male" : rawGender.includes("perempuan") ? "female" : "";

  return {
    name: find(["nama"]),
    ktp_number: find(["nik", "nomor induk"]).replace(/\s/g, ""),
    birth_date,
    gender,
    address: find(["alamat"]),
  };
}

// ── Component ──────────────────────────────────────────────────────────────

type Step = "upload" | "review" | "account";

export default function RegisterPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [ktpNumber, setKtpNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [nikAlert, setNikAlert] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Step 1: handle KTP upload & run OCR ─────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setKtpFile(file);
    setKtpPreview(URL.createObjectURL(file));
    setOcrLoading(true);
    setOcrProgress(0);
    setError("");
    setNikAlert("");

    try {
      const result = await Tesseract.recognize(file, "ind", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const fields = extractKtpFields(result.data.text);
      setName(fields.name);
      setKtpNumber(fields.ktp_number);
      setBirthDate(fields.birth_date);
      setGender(fields.gender);
      setAddress(fields.address);

      // Check NIK duplicate if extracted
      if (fields.ktp_number) {
        await checkNikDuplicate(fields.ktp_number);
      }

      setStep("review");
    } catch (err) {
      console.error(err);
      setError("Gagal membaca KTP. Silakan coba dengan foto yang lebih jelas.");
    } finally {
      setOcrLoading(false);
    }
  }

  // ── Check NIK duplicate ─────────────────────────────────────────────────

  async function checkNikDuplicate(nik: string) {
    try {
      const res = await fetch("/api/auth/check-nik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ktp_number: nik }),
      });

      const data = await res.json();

      if (data.exists) {
        setNikAlert("NIK sudah terdaftar di sistem. Silakan hubungi admin atau gunakan NIK lain.");
      } else {
        setNikAlert("");
      }
    } catch {
      console.error("Gagal memeriksa NIK.");
    }
  }

  // ── Step 2 → Step 3: validate review fields ─────────────────────────────

  function validateReviewFields(): boolean {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Nama lengkap wajib diisi.";
    }

    if (!birthDate) {
      errors.birth_date = "Tanggal lahir wajib diisi.";
    }

    if (!gender) {
      errors.gender = "Jenis kelamin wajib dipilih.";
    }

    if (!address.trim()) {
      errors.address = "Alamat wajib diisi.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleContinueToAccount() {
    if (nikAlert) return; // Block if NIK is duplicate
    if (!validateReviewFields()) return;
    setStep("account");
  }

  // ── Step 3: submit ───────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = "Email wajib diisi.";
    }

    if (!password) {
      errors.password = "Kata sandi wajib diisi.";
    } else if (password.length < 8) {
      errors.password = "Kata sandi harus minimal 8 karakter.";
    }

    if (!confirm) {
      errors.confirm = "Konfirmasi kata sandi wajib diisi.";
    } else if (password !== confirm) {
      errors.confirm = "Kata sandi tidak cocok.";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);

    // Upload KTP photo to Supabase Storage
    let ktp_photo_url: string | null = null;
    if (ktpFile) {
      const ext = ktpFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("ktp-photos")
        .upload(fileName, ktpFile, { upsert: false });

      if (uploadError) {
        setError("Gagal mengunggah foto KTP. Silakan coba lagi.");
        setSubmitting(false);
        return;
      }

      const { data } = supabase.storage
        .from("ktp-photos")
        .getPublicUrl(fileName);

      ktp_photo_url = data.publicUrl;
    }

    // Call register API
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        ktp_number: ktpNumber,
        birth_date: birthDate,
        gender,
        address,
        ktp_photo_url,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Pendaftaran gagal. Silakan coba lagi.");
      return;
    }

    router.push("/login?registered=true");
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const stepNumber = step === "upload" ? 1 : step === "review" ? 2 : 3;

  return (
    <div className="min-h-screen flex items-center justify-center py-10 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Buat Akun</CardTitle>
          <CardDescription>
            Langkah {stepNumber} dari 3 —{" "}
            {step === "upload" && "Unggah KTP Anda"}
            {step === "review" && "Periksa data Anda"}
            {step === "account" && "Atur email & kata sandi"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ── Step 1: Upload KTP ── */}
          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Unggah foto KTP (Kartu Tanda Penduduk) yang jelas. Data akan
                diisi secara otomatis.
              </p>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {ktpPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ktpPreview}
                    alt="Preview KTP"
                    className="mx-auto max-h-48 object-contain rounded"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Klik untuk memilih foto
                  </p>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {ocrLoading && (
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground">
                    Membaca KTP... {ocrProgress}%
                  </p>
                  <Progress value={ocrProgress} />
                </div>
              )}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          )}

          {/* ── Step 2: Review OCR results ── */}
          {step === "review" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Periksa data yang diekstrak dari KTP Anda. Perbaiki jika ada
                kesalahan sebelum melanjutkan.
              </p>

              {nikAlert && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>NIK Sudah Terdaftar</AlertTitle>
                  <AlertDescription>{nikAlert}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  required
                  className={fieldErrors.name ? "border-red-500" : ""}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-destructive">{fieldErrors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ktp_number">NIK</Label>
                <Input
                  id="ktp_number"
                  value={ktpNumber}
                  readOnly
                  maxLength={16}
                  className="bg-muted cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birth_date">Tanggal Lahir</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => {
                    setBirthDate(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, birth_date: "" }));
                  }}
                  className={fieldErrors.birth_date ? "border-red-500" : ""}
                />
                {fieldErrors.birth_date && (
                  <p className="text-xs text-destructive">{fieldErrors.birth_date}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => {
                    setGender(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, gender: "" }));
                  }}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors.gender ? "border-red-500" : "border-input"}`}
                >
                  <option value="">Pilih jenis kelamin</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
                {fieldErrors.gender && (
                  <p className="text-xs text-destructive">{fieldErrors.gender}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Alamat</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, address: "" }));
                  }}
                  className={fieldErrors.address ? "border-red-500" : ""}
                />
                {fieldErrors.address && (
                  <p className="text-xs text-destructive">{fieldErrors.address}</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep("upload");
                    setNikAlert("");
                    setFieldErrors({});
                  }}
                >
                  Unggah Ulang KTP
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleContinueToAccount}
                  disabled={!name || !!nikAlert}
                >
                  Lanjutkan
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Email & password ── */}
          {step === "account" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="anda@contoh.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  disabled={submitting}
                  required
                  className={fieldErrors.email ? "border-red-500" : ""}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">{fieldErrors.email}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Kata Sandi</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 karakter"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    disabled={submitting}
                    required
                    className={fieldErrors.password ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-destructive">{fieldErrors.password}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Konfirmasi Kata Sandi</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, confirm: "" }));
                    }}
                    disabled={submitting}
                    required
                    className={fieldErrors.confirm ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirm && (
                  <p className="text-xs text-destructive">{fieldErrors.confirm}</p>
                )}
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep("review");
                    setFieldErrors({});
                  }}
                  disabled={submitting}
                >
                  Kembali
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {submitting ? "Membuat akun..." : "Buat Akun"}
                </Button>
              </div>
            </form>
          )}
          <p className="text-center text-sm text-muted-foreground pt-2">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground hover:underline"
            >
              Masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
