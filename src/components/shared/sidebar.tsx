"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Building2,
  School,
  BookOpen,
  ClipboardList,
  Settings,
  ScrollText,
  CalendarDays,
  User,
  PlaySquare,
  Bell,
  BarChart3,
  LogOut,
  Layers,
  CalendarClock,
  ListChecks,
} from "lucide-react";

interface SidebarLink {
  label: string;
  href: string;
  icon: string;
}

interface SidebarGroup {
  label: string;
  links: SidebarLink[];
}

interface SidebarProps {
  links: SidebarLink[];
  role: string;
  groups?: SidebarGroup[];
}

const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  students: GraduationCap,
  lecturers: Users,
  departments: Building2,
  faculties: School,
  courses: BookOpen,
  classes: BookOpen,
  attendance: ClipboardList,
  settings: Settings,
  audit: ScrollText,
  years: CalendarDays,
  profile: User,
  sessions: PlaySquare,
  notifications: Bell,
  reports: BarChart3,
  programs: Layers,
  timetable: CalendarClock,
  assignments: ListChecks,
};

export function Sidebar({ links, role, groups }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function renderLink(link: SidebarLink) {
    const Icon = iconMap[link.icon] || LayoutDashboard;
    const isActive =
      pathname === link.href || pathname.startsWith(link.href + "/");
    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
          isActive
            ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
            : "text-slate-400 hover:bg-white/5 hover:text-white"
        )}
      >
        <Icon className="size-4 shrink-0" />
        {link.label}
      </Link>
    );
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#1E3A8A] lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-sm font-bold text-white shadow-lg shadow-sky-500/30">
          SA
        </div>
        <div>
          <p className="text-sm font-bold text-white">SAMS</p>
          <p className="text-[11px] capitalize text-slate-400">{role.replace("_", " ")}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {groups ? (
          groups.map((group) => (
            <div key={group.label} className="pt-3 first:pt-0">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
              <div className="space-y-1">{group.links.map(renderLink)}</div>
            </div>
          ))
        ) : (
          <div className="space-y-1">{links.map(renderLink)}</div>
        )}
      </nav>

      <div className="p-4">
        <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-sky-500" />
            </span>
            <p className="text-sm font-medium text-white">System Status</p>
          </div>
          <p className="mt-1 text-xs text-sky-300">All Systems Operational</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="size-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
