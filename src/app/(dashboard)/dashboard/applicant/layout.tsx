import { ApplicantNavbar } from "@/components/dashboard/ApplicantNavbar";

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <ApplicantNavbar />
      <main className="pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
