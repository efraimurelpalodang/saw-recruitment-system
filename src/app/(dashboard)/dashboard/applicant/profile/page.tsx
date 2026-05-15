"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormValues } from "@/lib/validations";
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
  UserCircle,
  Plus,
  X
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
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema) as any,
  });

  const name = watch("name");
  const email = watch("email" as any); // email is not in profileSchema but fetched from API
  const [emailValue, setEmailValue] = useState("");

  // Load profile on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/applicant/profile");
        if (!res.ok) {
          throw new Error("Gagal mengambil data profil");
        }
        const data = await res.json();
        
        const formData: any = {
          name: data.user?.name ?? "",
          phone: data.user?.phone ?? "",
          birth_date: data.birth_date ? data.birth_date.split("T")[0] : "",
          gender: data.gender ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          province: data.province ?? "",
          education_level: data.education_level ?? "",
          major: data.major ?? "",
          institution: data.institution ?? "",
          experience_years: data.experience_years ?? 0,
          ipk: data.ipk ?? 0,
          skills: data.skills ?? "",
        };

        reset(formData);
        setEmailValue(data.user?.email ?? "");
        setSkills(data.skills ? data.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : []);
      } catch (err) {
        setError("Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reset]);

  const onSubmit = async (data: any) => {
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      const res = await fetch("/api/applicant/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          skills: skills.join(", "),
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error ?? "Gagal menyimpan perubahan.");
      }

      setSuccess("Profil berhasil diperbarui.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updatedSkills = [...skills, newSkill.trim()];
      setSkills(updatedSkills);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
              <Mail className="h-3.5 w-3.5" /> {emailValue}
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

      <form onSubmit={handleSubmit(onSubmit)}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-foreground/5 shadow-sm">
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
                        {...register("name")}
                        disabled={saving}
                        className={`focus-visible:ring-foreground/20 ${errors.name ? "border-red-500" : ""}`}
                      />
                      {errors.name && <p className="text-xs text-destructive">{(errors.name as any).message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                      <Input id="email" value={emailValue} disabled className="bg-muted/50 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold">Nomor Telepon</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          {...register("phone")}
                          disabled={saving}
                          placeholder="+62..."
                          className={`pl-10 focus-visible:ring-foreground/20 ${errors.phone ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.phone && <p className="text-xs text-destructive">{(errors.phone as any).message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth_date" className="text-sm font-semibold">Tanggal Lahir</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="birth_date"
                          type="date"
                          {...register("birth_date")}
                          disabled={saving}
                          className={`pl-10 focus-visible:ring-foreground/20 ${errors.birth_date ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.birth_date && <p className="text-xs text-destructive">{(errors.birth_date as any).message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm font-semibold">Jenis Kelamin</Label>
                      <Select 
                        value={watch("gender")} 
                        onValueChange={(val) => setValue("gender", val)} 
                        disabled={saving}
                      >
                        <SelectTrigger id="gender" className={`focus:ring-foreground/20 ${errors.gender ? "border-red-500" : ""}`}>
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
                      {errors.gender && <p className="text-xs text-destructive">{(errors.gender as any).message}</p>}
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
                      {...register("address")}
                      disabled={saving}
                      rows={4}
                      className={`resize-none focus-visible:ring-foreground/20 ${errors.address ? "border-red-500" : ""}`}
                    />
                    {errors.address && <p className="text-xs text-destructive">{(errors.address as any).message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-semibold">Kota/Kabupaten</Label>
                    <Input
                      id="city"
                      {...register("city")}
                      disabled={saving}
                      className={`focus-visible:ring-foreground/20 ${errors.city ? "border-red-500" : ""}`}
                    />
                    {errors.city && <p className="text-xs text-destructive">{(errors.city as any).message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province" className="text-sm font-semibold">Provinsi</Label>
                    <Input
                      id="province"
                      {...register("province")}
                      disabled={saving}
                      className={`focus-visible:ring-foreground/20 ${errors.province ? "border-red-500" : ""}`}
                    />
                    {errors.province && <p className="text-xs text-destructive">{(errors.province as any).message}</p>}
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
                        value={watch("education_level")}
                        onValueChange={(val) => setValue("education_level", val)}
                        disabled={saving}
                      >
                        <SelectTrigger id="education_level" className={`focus:ring-foreground/20 ${errors.education_level ? "border-red-500" : ""}`}>
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
                      {errors.education_level && <p className="text-xs text-destructive">{(errors.education_level as any).message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="major" className="text-sm font-semibold">Jurusan</Label>
                      <Input
                        id="major"
                        {...register("major")}
                        disabled={saving}
                        placeholder="Contoh: Teknik Informatika"
                        className={`focus-visible:ring-foreground/20 ${errors.major ? "border-red-500" : ""}`}
                      />
                      {errors.major && <p className="text-xs text-destructive">{(errors.major as any).message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ipk" className="text-sm font-semibold">IPK / GPA</Label>
                      <Input
                        id="ipk"
                        type="number"
                        min="0"
                        max="4"
                        step="0.01"
                        {...register("ipk")}
                        disabled={saving}
                        placeholder="0.00 – 4.00"
                        className={`focus-visible:ring-foreground/20 ${errors.ipk ? "border-red-500" : ""}`}
                      />
                      {errors.ipk && <p className="text-xs text-destructive">{(errors.ipk as any).message}</p>}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="institution" className="text-sm font-semibold">Nama Institusi</Label>
                      <Input
                        id="institution"
                        {...register("institution")}
                        disabled={saving}
                        placeholder="Nama Sekolah atau Universitas"
                        className={`focus-visible:ring-foreground/20 ${errors.institution ? "border-red-500" : ""}`}
                      />
                      {errors.institution && <p className="text-xs text-destructive">{(errors.institution as any).message}</p>}
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
                      {...register("experience_years")}
                      disabled={saving}
                      placeholder="0"
                      className={`focus-visible:ring-foreground/20 ${errors.experience_years ? "border-red-500" : ""}`}
                    />
                    {errors.experience_years && <p className="text-xs text-destructive">{(errors.experience_years as any).message}</p>}
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="skills" className="text-sm font-semibold">Keahlian (Skills)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="skills"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                        disabled={saving}
                        placeholder="Tambah keahlian (contoh: JavaScript)"
                        className="focus-visible:ring-foreground/20"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={addSkill}
                        disabled={saving || !newSkill.trim()}
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-md border border-foreground/5 bg-muted/20">
                      {skills.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">Belum ada keahlian yang ditambahkan.</span>
                      )}
                      {skills.map((skill) => (
                        <div
                          key={skill}
                          className="flex items-center gap-1 bg-foreground text-background px-2.5 py-1 rounded-full text-xs font-medium animate-in zoom-in-95 duration-200"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="hover:text-red-400 transition-colors ml-1"
                            disabled={saving}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">Tekan Enter atau klik tombol + untuk menambah keahlian.</p>
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
    <div className="space-y-8 animate-pulse">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
