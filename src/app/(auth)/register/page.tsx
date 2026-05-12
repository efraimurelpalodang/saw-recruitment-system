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
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
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
  const [error, setError] = useState("");
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
      setStep("review");
    } catch (err) {
      console.error(err);
      setError("Failed to read KTP. Please try a clearer photo.");
    } finally {
      setOcrLoading(false);
    }
  }

  // ── Step 3: submit ───────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

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
        setError("Failed to upload KTP photo. Please try again.");
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
      setError(data.error ?? "Registration failed. Please try again.");
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
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Step {stepNumber} of 3 —{" "}
            {step === "upload" && "Upload your KTP"}
            {step === "review" && "Review your details"}
            {step === "account" && "Set your email & password"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ── Step 1: Upload KTP ── */}
          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a clear photo of your KTP (Indonesian ID card). Your
                information will be filled in automatically.
              </p>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {ktpPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ktpPreview}
                    alt="KTP preview"
                    className="mx-auto max-h-48 object-contain rounded"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click to select a photo
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
                    Reading KTP... {ocrProgress}%
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
                Review the information extracted from your KTP. Correct any
                mistakes before continuing.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ktp_number">NIK</Label>
                <Input
                  id="ktp_number"
                  value={ktpNumber}
                  onChange={(e) => setKtpNumber(e.target.value)}
                  maxLength={16}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birth_date">Date of birth</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("upload")}
                >
                  Re-upload KTP
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => setStep("account")}
                  disabled={!name}
                >
                  Continue
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
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("review")}
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {submitting ? "Creating account..." : "Create account"}
                </Button>
              </div>
            </form>
          )}
          <p className="text-center text-sm text-muted-foreground pt-2">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
