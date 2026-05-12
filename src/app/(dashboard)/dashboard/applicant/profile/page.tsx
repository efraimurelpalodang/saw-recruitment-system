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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Loader2, 
  User as UserIcon, 
  GraduationCap, 
  MapPin, 
  Briefcase, 
  Mail, 
  Phone, 
  Calendar,
  Save,
  UserCircle
} from "lucide-react";

const EDUCATION_OPTIONS = [
  { value: "sma_smk", label: "SMA / SMK" },
  { value: "d3", label: "D3" },
  { value: "s1_d4", label: "S1 / D4" },
  { value: "s2", label: "S2" },
  { value: "s3", label: "S3" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Laki-laki" },
  { value: "female", label: "Perempuan" },
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
      try {
        const res = await fetch("/api/applicant/profile");
        if (!res.ok) {
          throw new Error("Gagal mengambil data profil");
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
      } catch (err) {
        setError("Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    try {
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal menyimpan perubahan.");
      }

      setSuccess("Profil berhasil diperbarui.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 md:px-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 pb-2">
        <Avatar className="h-24 w-24 border-2 border-primary/10">
          <AvatarImage src="" />
          <AvatarFallback className="bg-foreground text-background text-2xl font-bold">
            {name ? name.charAt(0).toUpperCase() : <UserIcon />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center md:text-left space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{name || "Pelamar"}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> {email}
            </span>
            <span className="flex items-center gap-1">
              <UserCircle className="h-3.5 w-3.5" /> Pelamar
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {success && <span className="text-sm text-green-600 font-medium animate-in slide-in-from-right-2 fade-in">{success}</span>}
           {error && <span className="text-sm text-destructive font-medium animate-in slide-in-from-right-2 fade-in">{error}</span>}
        </div>
      </div>

      <Separator className="bg-foreground/5" />

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="personal" className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="grid grid-cols-2 w-full sm:w-[400px] bg-muted/50 p-1">
              <TabsTrigger value="personal" className="data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">
                Data Pribadi
              </TabsTrigger>
              <TabsTrigger value="professional" className="data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">
                Pendidikan & Skill
              </TabsTrigger>
            </TabsList>
            
            <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 transition-all">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>

          <TabsContent value="personal" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 border-foreground/5 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserIcon className="h-5 w-5" /> Informasi Dasar
                  </CardTitle>
                  <CardDescription>Detail identitas sesuai dengan KTP Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold">Nama Lengkap</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={saving}
                        required
                        className="focus-visible:ring-foreground/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                      <Input id="email" value={email} disabled className="bg-muted/50 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold">Nomor Telepon</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={saving}
                          placeholder="+62..."
                          className="pl-10 focus-visible:ring-foreground/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth_date" className="text-sm font-semibold">Tanggal Lahir</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="birth_date"
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          disabled={saving}
                          className="pl-10 focus-visible:ring-foreground/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm font-semibold">Jenis Kelamin</Label>
                      <Select value={gender} onValueChange={setGender} disabled={saving}>
                        <SelectTrigger id="gender" className="focus:ring-foreground/20">
                          <SelectValue placeholder="Pilih jenis kelamin" />
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
                </CardContent>
              </Card>

              <Card className="border-foreground/5 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> Alamat Domisili
                  </CardTitle>
                  <CardDescription>Lokasi tempat tinggal saat ini.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-semibold">Alamat Lengkap</Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={saving}
                      rows={4}
                      className="resize-none focus-visible:ring-foreground/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-semibold">Kota/Kabupaten</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={saving}
                      className="focus-visible:ring-foreground/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province" className="text-sm font-semibold">Provinsi</Label>
                    <Input
                      id="province"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      disabled={saving}
                      className="focus-visible:ring-foreground/20"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="professional" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-foreground/5 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" /> Pendidikan Terakhir
                  </CardTitle>
                  <CardDescription>Kualifikasi akademik Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="education_level" className="text-sm font-semibold">Tingkat Pendidikan</Label>
                      <Select
                        value={educationLevel}
                        onValueChange={setEducationLevel}
                        disabled={saving}
                      >
                        <SelectTrigger id="education_level" className="focus:ring-foreground/20">
                          <SelectValue placeholder="Pilih tingkat" />
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
                    <div className="space-y-2">
                      <Label htmlFor="major" className="text-sm font-semibold">Jurusan</Label>
                      <Input
                        id="major"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        disabled={saving}
                        placeholder="Contoh: Teknik Informatika"
                        className="focus-visible:ring-foreground/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ipk" className="text-sm font-semibold">IPK / GPA</Label>
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
                        className="focus-visible:ring-foreground/20"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="institution" className="text-sm font-semibold">Nama Institusi</Label>
                      <Input
                        id="institution"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        disabled={saving}
                        placeholder="Nama Sekolah atau Universitas"
                        className="focus-visible:ring-foreground/20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-foreground/5 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5" /> Pengalaman & Keahlian
                  </CardTitle>
                  <CardDescription>Informasi profesional tambahan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="experience_years" className="text-sm font-semibold">Total Pengalaman Kerja (Tahun)</Label>
                    <Input
                      id="experience_years"
                      type="number"
                      min="0"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      disabled={saving}
                      placeholder="0"
                      className="focus-visible:ring-foreground/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skills" className="text-sm font-semibold">Keahlian (Skills)</Label>
                    <Textarea
                      id="skills"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      disabled={saving}
                      rows={6}
                      placeholder="Contoh: JavaScript, Manajemen Proyek, AutoCAD, Analisis Data..."
                      className="resize-none focus-visible:ring-foreground/20"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Pisahkan keahlian dengan tanda koma.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4 md:px-8 space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 pb-2">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64 mx-auto md:mx-0" />
          <div className="flex justify-center md:justify-start gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[400px]" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] md:col-span-2 rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
