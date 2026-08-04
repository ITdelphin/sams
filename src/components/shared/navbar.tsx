"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";

interface NavbarProps {
  role: string;
  links: { label: string; href: string; icon: string }[];
}

export function Navbar({ role, links }: NavbarProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", data.user.id)
          .single()
          .then(({ data: p }) => {
            if (p) setProfile(p);
          });
        supabase
          .from("notifications")
          .select("id", { count: "exact" })
          .eq("user_id", data.user.id)
          .eq("is_read", false)
          .then(({ count }) => {
            if (count) setUnreadCount(count);
          });
      }
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  const roleLabel =
    role === "super_admin" ? "Administrator" : role.charAt(0).toUpperCase() + role.slice(1);

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="lg:hidden" />
            }
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-[#1E3A8A] p-0">
            <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 text-xs font-bold text-white">
                SA
              </div>
              <p className="text-sm font-bold text-white">SAMS</p>
            </div>
            <nav className="space-y-1 p-4">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-sky-500 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold text-foreground capitalize">
          {role.replace("_", " ")} Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground xl:block">{todayStr}</span>

        <Link href={`/${role === "super_admin" ? "admin" : role}/notifications`} className="relative">
          <Button variant="ghost" size="icon">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 p-0 text-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-9 gap-2 rounded-full" />
            }
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-sky-500/10 text-xs font-semibold text-sky-600">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden lg:block">
              <span className="block text-left text-sm font-medium leading-tight">{profile?.full_name}</span>
              <span className="block text-left text-xs text-muted-foreground">{roleLabel}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href={`/${role === "super_admin" ? "admin" : role}/profile`} />}
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link href={`/${role === "super_admin" ? "admin" : role}/settings`} />}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
