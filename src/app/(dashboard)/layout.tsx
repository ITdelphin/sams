"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/sidebar";
import { Navbar } from "@/components/shared/navbar";

const adminLinks = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Students", href: "/admin/students", icon: "students" },
  { label: "Lecturers", href: "/admin/lecturers", icon: "lecturers" },
  { label: "Faculties", href: "/admin/faculties", icon: "faculties" },
  { label: "Departments", href: "/admin/departments", icon: "departments" },
  { label: "Courses", href: "/admin/courses", icon: "courses" },
  { label: "Classes", href: "/admin/classes", icon: "classes" },
  { label: "Attendance", href: "/admin/attendance", icon: "attendance" },
  { label: "Academic Years", href: "/admin/academic-years", icon: "years" },
  { label: "Audit Log", href: "/admin/audit-log", icon: "audit" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

const lecturerLinks = [
  { label: "Dashboard", href: "/lecturer", icon: "dashboard" },
  { label: "My Courses", href: "/lecturer/courses", icon: "courses" },
  { label: "Sessions", href: "/lecturer/sessions", icon: "sessions" },
  { label: "Attendance", href: "/lecturer/attendance", icon: "attendance" },
  { label: "Profile", href: "/lecturer/profile", icon: "profile" },
];

const studentLinks = [
  { label: "Dashboard", href: "/student", icon: "dashboard" },
  { label: "My Courses", href: "/student/courses", icon: "courses" },
  { label: "Attendance", href: "/student/attendance", icon: "attendance" },
  { label: "Profile", href: "/student/profile", icon: "profile" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      supabase
        .from("profiles")
        .select("role, account_status")
        .eq("id", data.user.id)
        .single()
        .then(({ data: profile }) => {
          if (!profile) {
            router.push("/login");
            return;
          }
          if (profile.account_status === "pending") {
            router.push("/pending");
            return;
          }
          setRole(profile.role);
          setLoading(false);
        });
    });
  }, [router]);

  if (loading || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const links =
    role === "super_admin"
      ? adminLinks
      : role === "lecturer"
        ? lecturerLinks
        : studentLinks;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar links={links} role={role} />
      <div className="flex flex-1 flex-col">
        <Navbar role={role} links={links} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
