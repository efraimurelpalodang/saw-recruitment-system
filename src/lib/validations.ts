import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, "Nama lengkap wajib diisi"),
  ktp_number: z.string().length(16, "NIK harus 16 digit"),
  birth_date: z.string().min(1, "Tanggal lahir wajib diisi"),
  gender: z.string().min(1, "Pilih jenis kelamin"),
  address: z.string().min(1, "Alamat wajib diisi"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  confirm: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
}).refine((data) => data.password === data.confirm, {
  message: "Kata sandi tidak cocok",
  path: ["confirm"],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  name: z.string().min(1, "Nama lengkap wajib diisi"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit").max(15, "Nomor telepon maksimal 15 digit").optional().nullable(),
  birth_date: z.string().min(1, "Tanggal lahir wajib diisi"),
  gender: z.string().min(1, "Pilih jenis kelamin"),
  address: z.string().min(1, "Alamat wajib diisi"),
  city: z.string().min(1, "Kota/Kabupaten wajib diisi"),
  province: z.string().min(1, "Provinsi wajib diisi"),
  education_level: z.string().min(1, "Pilih tingkat pendidikan"),
  major: z.string().min(1, "Jurusan wajib diisi"),
  institution: z.string().min(1, "Nama institusi wajib diisi"),
  experience_years: z.any().optional(),
  ipk: z.any().optional(),
  skills: z.string().optional().nullable(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
