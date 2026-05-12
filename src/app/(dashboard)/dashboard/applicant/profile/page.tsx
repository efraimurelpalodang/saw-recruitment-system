"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

const EDUCATION_OPTIONS = [
  { value: "sma_smk", label: "SMA / SMK" },
  { value: "d3", label: "D3" },
  { value: "s1_d4", label: "S1 / D4" },
  { value: "s2", label: "S2" },
  { value: "s3", label: "S3" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export default function ApplicantProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Personal
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  // Academic & professional
  const [educationLevel, setEducationLevel] = useState("");
  const [major, setMajor] = useState("");
  const [institution, setInstitution] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [ipk, setIpk] = useState("");
  const [skills, setSkills] = useState("");

  // Load profile on mount
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/applicant/profile");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setName(data.user?.name ?? "");
      setEmail(data.user?.email ?? "");
      setPhone(data.user?.phone ?? "");
      setBirthDate(data.birth_date ? data.birth_date.split("T")[0] : "");
      setGender(data.gender ?? "");
      setAddress(data.address ?? "");
      setCity(data.city ?? "");
      setProvince(data.province ?? "");
      setEducationLevel(data.education_level ?? "");
      setMajor(data.major ?? "");
      setInstitution(data.institution ?? "");
      setExperienceYears(
        data.experience_years !== null ? String(data.experience_years) : ""
      );
      setIpk(data.ipk !== null ? String(data.ipk) : "");
      setSkills(data.skills ?? "");
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    const res = await fetch("/api/applicant/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        birth_date: birthDate || null,
        gender: gender || null,
        address,
        city,
        province,
        education_level: educationLevel || null,
        major,
        institution,
        experience_years: experienceYears !== "" ? Number(experienceYears) : null,
        ipk: ipk !== "" ? Number(ipk) : null,
        skills,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save. Please try again.");
      return;
    }

    setSuccess("Profile updated successfully.");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          Keep your information up to date.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
            <CardDescription>Basic details from your KTP.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} disabled className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={saving}
                  placeholder="+62..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birth_date">Date of birth</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={setGender} disabled={saving}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={saving}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Education & experience */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Education & Experience</CardTitle>
            <CardDescription>
              Used as criteria in the recruitment scoring system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="education_level">Education level</Label>
                <Select
                  value={educationLevel}
                  onValueChange={setEducationLevel}
                  disabled={saving}
                >
                  <SelectTrigger id="education_level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="major">Major / Field of study</Label>
                <Input
                  id="major"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  disabled={saving}
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  disabled={saving}
                  placeholder="e.g. Universitas Indonesia"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ipk">GPA (IPK)</Label>
                <Input
                  id="ipk"
                  type="number"
                  min="0"
                  max="4"
                  step="0.01"
                  value={ipk}
                  onChange={(e) => setIpk(e.target.value)}
                  disabled={saving}
                  placeholder="0.00 – 4.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="experience_years">Years of experience</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  disabled={saving}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="skills">Skills</Label>
              <Textarea
                id="skills"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                disabled={saving}
                rows={3}
                placeholder="e.g. JavaScript, Project Management, AutoCAD"
              />
            </div>
          </CardContent>
        </Card>

        {/* Feedback & submit */}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
