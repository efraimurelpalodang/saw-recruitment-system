"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ClipboardCheck,
  BarChart2,
  FileOutput,
  SlidersHorizontal,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard/hrd", icon: LayoutDashboard },
  { label: "Job Postings", href: "/dashboard/hrd/lowongan", icon: Briefcase },
  { label: "Applicants", href: "/dashboard/hrd/pelamar", icon: Users },
  { label: "Selection", href: "/dashboard/hrd/seleksi", icon: ClipboardCheck },
  { label: "SAW Ranking", href: "/dashboard/hrd/ranking", icon: BarChart2 },
  { label: "Reports", href: "/dashboard/hrd/laporan", icon: FileOutput },
  { label: "Criteria", href: "/dashboard/hrd/kriteria", icon: SlidersHorizontal },
];

export function HrdSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          "flex flex-col h-screen sticky top-0 border-r border-border bg-background transition-all duration-200 shrink-0",
          expanded ? "w-56" : "w-14"
        )}
      >
        {/* Header */}
        <div className="flex items-center h-14 px-3 gap-2 shrink-0">
          {expanded && (
            <span className="font-semibold text-sm truncate flex-1 text-foreground">
              HRD Panel
            </span>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-auto"
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
          </button>
        </div>

        <Separator />

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/dashboard/hrd" && pathname.startsWith(href));
            const itemClass = cn(
              "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors w-full",
              active
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            );

            if (!expanded) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>
                    <Link href={href} className={itemClass} aria-label={label}>
                      <Icon className="h-4 w-4 shrink-0" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link key={href} href={href} className={itemClass}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* Sign out */}
        <div className="px-2 py-3">
          {!expanded ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors w-full"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Sign out
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors w-full"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="truncate">Sign out</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
