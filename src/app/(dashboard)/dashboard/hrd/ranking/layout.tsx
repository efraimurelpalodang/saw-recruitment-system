import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function RankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch closed jobs
  const closedJobs = await prisma.jobPosting.findMany({
    where: { status: "closed" },
    orderBy: { created_at: "desc" },
    include: {
      _count: {
        select: { job_applications: true },
      },
    },
  });

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Sidebar for Closed Jobs */}
      <div className="w-72 border-r bg-muted/20 flex flex-col h-full">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Perangkingan SAW</h3>
          <p className="text-sm text-muted-foreground">Pilih lowongan untuk diranking</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {closedJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada lowongan yang ditutup.
            </p>
          ) : (
            <div className="flex flex-col">
              {closedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/hrd/ranking/${job.id}`}
                  className="block px-4 py-3 border-b hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm mb-1">{job.title}</div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(job.created_at).toLocaleDateString("id-ID")}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {job._count.job_applications} Pelamar
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
