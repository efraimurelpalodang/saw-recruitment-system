import { ApplicantNavbar } from "@/components/dashboard/ApplicantNavbar";

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <ApplicantNavbar />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
