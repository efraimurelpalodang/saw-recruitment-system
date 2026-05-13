"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Tesseract from "tesseract.js";
import { supabase } from "@/lib/supabase";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormValues } from "@/lib/validations";
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
    ktp_number: find(["nik", "nomor induk"]).replace(/\s/g, "").replace(/[^0-9]/g, ""),
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [nikAlert, setNikAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      ktp_number: "",
      birth_date: "",
      gender: undefined,
      address: "",
      email: "",
      password: "",
      confirm: "",
    },
  });

  // ── Step 1: handle KTP upload & run OCR ─────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setKtpFile(file);
    setKtpPreview(URL.createObjectURL(file));
    setOcrLoading(true);
    setOcrProgress(0);
    setServerError("");
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
      
      setValue("name", fields.name);
      setValue("ktp_number", fields.ktp_number);
      setValue("birth_date", fields.birth_date);
      if (fields.gender === "male" || fields.gender === "female") {
        setValue("gender", fields.gender);
      }
      setValue("address", fields.address);

      // Check NIK duplicate if extracted
      if (fields.ktp_number) {
        await checkNikDuplicate(fields.ktp_number);
      }

      setStep("review");
    } catch (err) {
      console.error(err);
      setServerError("Gagal membaca KTP. Silakan coba dengan foto yang lebih jelas.");
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

  async function handleContinueToAccount() {
    if (nikAlert) return;
    const isValid = await trigger(["name", "ktp_number", "birth_date", "gender", "address"]);
    if (isValid) {
      setStep("account");
    }
  }

  // ── Step 3: submit ───────────────────────────────────────────────────────

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError("");
    setSubmitting(true);

    try {
      // Upload KTP photo to Supabase Storage
      let ktp_photo_url: string | null = null;
      if (ktpFile) {
        const ext = ktpFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("ktp-photos")
          .upload(fileName, ktpFile, { upsert: false });

        if (uploadError) {
          throw new Error("Gagal mengunggah foto KTP. Silakan coba lagi.");
        }

        const { data: publicData } = supabase.storage
          .from("ktp-photos")
          .getPublicUrl(fileName);

        ktp_photo_url = publicData.publicUrl;
      }

      // Call register API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          ktp_photo_url,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error ?? "Pendaftaran gagal. Silakan coba lagi.");
      }

      // Auto login after successful registration
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // If auto-login fails, redirect to login page anyway but with a message
        router.push("/login?registered=true");
      } else {
        // Successful login, redirect to applicant profile
        router.push("/dashboard/applicant/profile");
      }
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
              {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
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
                  {...register("name")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ktp_number">NIK</Label>
                <Input
                  id="ktp_number"
                  {...register("ktp_number")}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
                {errors.ktp_number && (
                  <p className="text-xs text-destructive">{errors.ktp_number.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birth_date">Tanggal Lahir</Label>
                <Input
                  id="birth_date"
                  type="date"
                  {...register("birth_date")}
                  className={errors.birth_date ? "border-red-500" : ""}
                />
                {errors.birth_date && (
                  <p className="text-xs text-destructive">{errors.birth_date.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <select
                  id="gender"
                  {...register("gender")}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.gender ? "border-red-500" : "border-input"}`}
                >
                  <option value="">Pilih jenis kelamin</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
                {errors.gender && (
                  <p className="text-xs text-destructive">{errors.gender.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Alamat</Label>
                <Input
                  id="address"
                  {...register("address")}
                  className={errors.address ? "border-red-500" : ""}
                />
                {errors.address && (
                  <p className="text-xs text-destructive">{errors.address.message}</p>
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
                  }}
                >
                  Unggah Ulang KTP
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleContinueToAccount}
                  disabled={!!nikAlert}
                >
                  Lanjutkan
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Email & password ── */}
          {step === "account" && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="anda@contoh.com"
                  {...register("email")}
                  disabled={submitting}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Kata Sandi</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 karakter"
                    {...register("password")}
                    disabled={submitting}
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Konfirmasi Kata Sandi</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("confirm")}
                    disabled={submitting}
                    className={errors.confirm ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirm && (
                  <p className="text-xs text-destructive">{errors.confirm.message}</p>
                )}
              </div>
              {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep("review");
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
