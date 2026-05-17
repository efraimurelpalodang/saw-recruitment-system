import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderSearch } from "lucide-react";

export default function HrdSeleksiPage() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Card className="max-w-md w-full border-dashed">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <FolderSearch className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Pilih Lowongan</CardTitle>
          <CardDescription>
            Silakan pilih lowongan kerja yang sudah ditutup dari sidebar untuk melihat daftar pelamar dan melakukan proses seleksi administrasi.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
