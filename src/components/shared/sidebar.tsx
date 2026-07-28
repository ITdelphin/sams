"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarLink {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  links: SidebarLink[];
  role: string;
}

export function Sidebar({ links, role }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border lg:bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
          SA
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">SAMS</p>
          <p className="text-xs text-muted-foreground capitalize">{role.replace("_", " ")}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span className="text-lg">{getIcon(link.icon)}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function getIcon(icon: string): string {
  const icons: Record<string, string> = {
    dashboard: "📊",
    students: "🎓",
    lecturers: "👨‍🏫",
    departments: "🏛️",
    faculties: "🏢",
    courses: "📚",
    classes: "🏫",
    attendance: "✅",
    settings: "⚙️",
    audit: "📋",
    years: "📅",
    profile: "👤",
    sessions: "📝",
    notifications: "🔔",
    reports: "📈",
  };
  return icons[icon] || "📌";
}
