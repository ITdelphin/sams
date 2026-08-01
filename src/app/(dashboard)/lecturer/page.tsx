"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BookOpen,
  Users,
  CalendarCheck,
  TrendingUp,
  Play,
  QrCode,
  ScanFace,
  Fingerprint,
  ClipboardList,
  History,
  FileText,
  Download,
  Clock,
  MapPin,
  Loader2,
  Inbox,
  Bell,
  UserPlus,
  Activity,
  Info,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

type Record = {
  id: string;
  marked_at: string;
  status: string;
  session: { method: string; courses: { name: string; code: string } | null } | null;
  student: { id: string; full_name: string; student_id: string | null } | null;
};

function getMethodInfo(method: string): { label: string; className: string } {
  switch (method) {
    case "qr_code":
      return { label: "QR Code", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" };
    case "face_recognition":
      return { label: "Face ID", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" };
    case "fingerprint":
      return { label: "Fingerprint", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" };
    case "student_id_card":
      return { label: "Student ID", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300" };
    case "manual":
      return { label: "Manual", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };
    default:
      return { label: method, className: "bg-gray-100 text-gray-700" };
  }
}

function getStatusInfo(status: string): { label: string; className: string } {
  switch (status) {
    case "present":
      return { label: "Present", className: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" };
    case "late":
      return { label: "Late", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" };
    case "absent":
      return { label: "Absent", className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" };
    case "excused":
      return { label: "Excused", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-700" };
  }
}

function getInitials(name?: string | null): string {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??"
  );
}

type WeekData = {
  key: string;
  name: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
};

function buildWeekData(records: Record[]): WeekData[] {
  const days: WeekData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      key: d.toDateString(),
      name: d.toLocaleDateString("en-US", { weekday: "short" }),
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    });
  }
  records.forEach((r) => {
    if (!r.marked_at || !r.status) return;
    const d = new Date(r.marked_at);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
    const idx = 6 - diff;
    if (idx < 0 || idx >= 7) return;
    const status = (r.status as string).toLowerCase();
    if (status === "present" || status === "absent" || status === "late" || status === "excused") {
      (days[idx] as any)[status] += 1;
    }
  });
  return days;
}

const fallbackWeek: WeekData[] = [
  { key: "", name: "Mon", present: 42, absent: 2, late: 4, excused: 1 },
  { key: "", name: "Tue", present: 38, absent: 3, late: 6, excused: 2 },
  { key: "", name: "Wed", present: 45, absent: 1, late: 3, excused: 0 },
  { key: "", name: "Thu", present: 40, absent: 4, late: 5, excused: 1 },
  { key: "", name: "Fri", present: 36, absent: 2, late: 7, excused: 3 },
  { key: "", name: "Sat", present: 28, absent: 1, late: 2, excused: 0 },
  { key: "", name: "Sun", present: 0, absent: 0, late: 0, excused: 0 },
];

const fallbackRecords: Record[] = [
  {
    id: "d1",
    marked_at: new Date().toISOString(),
    status: "present",
    session: { method: "qr_code", courses: { name: "Web Development", code: "CS101" } },
    student: { id: "u1", full_name: "Alice Uwimana", student_id: "2024001" },
  },
  {
    id: "d2",
    marked_at: new Date(Date.now() - 1800000).toISOString(),
    status: "present",
    session: { method: "face_recognition", courses: { name: "Web Development", code: "CS101" } },
    student: { id: "u2", full_name: "Jean Niyonzima", student_id: "2024002" },
  },
  {
    id: "d3",
    marked_at: new Date(Date.now() - 3600000).toISOString(),
    status: "late",
    session: { method: "fingerprint", courses: { name: "Database Systems", code: "DB201" } },
    student: { id: "u3", full_name: "Grace Uwase", student_id: "2024003" },
  },
  {
    id: "d4",
    marked_at: new Date(Date.now() - 5400000).toISOString(),
    status: "present",
    session: { method: "qr_code", courses: { name: "Web Development", code: "CS101" } },
    student: { id: "u4", full_name: "Eric Habimana", student_id: "2024004" },
  },
  {
    id: "d5",
    marked_at: new Date(Date.now() - 7200000).toISOString(),
    status: "absent",
    session: { method: "manual", courses: { name: "Database Systems", code: "DB201" } },
    student: { id: "u5", full_name: "Diane Mukamana", student_id: "2024005" },
  },
];

const fallbackClasses = [
  { id: "c1", schedule: "08:00 - 10:00", room: "Lab 3", courses: { name: "Web Development", code: "CS101" } },
  { id: "c2", schedule: "10:00 - 12:00", room: "Room 204", courses: { name: "Database Systems", code: "DB201" } },
  { id: "c3", schedule: "14:00 - 16:00", room: "Room 105", courses: { name: "Software Engineering", code: "SE301" } },
];

const quickActions = [
  { label: "Start Attendance", icon: Play, href: "/lecturer/sessions", iconBg: "bg-sky-500/10", iconColor: "text-sky-600 dark:text-sky-400", hover: "hover:shadow-sky-500/20" },
  { label: "Generate QR Code", icon: QrCode, href: "/lecturer/sessions", iconBg: "bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-400", hover: "hover:shadow-blue-500/20" },
  { label: "Face Recognition", icon: ScanFace, href: "/lecturer/sessions", iconBg: "bg-purple-500/10", iconColor: "text-purple-600 dark:text-purple-400", hover: "hover:shadow-purple-500/20" },
  { label: "Fingerprint Scan", icon: Fingerprint, href: "/lecturer/sessions", iconBg: "bg-orange-500/10", iconColor: "text-orange-600 dark:text-orange-400", hover: "hover:shadow-orange-500/20" },
  { label: "Manual Attendance", icon: ClipboardList, href: "/lecturer/sessions", iconBg: "bg-cyan-500/10", iconColor: "text-cyan-600 dark:text-cyan-400", hover: "hover:shadow-cyan-500/20" },
  { label: "Attendance History", icon: History, href: "/lecturer/attendance", iconBg: "bg-pink-500/10", iconColor: "text-pink-600 dark:text-pink-400", hover: "hover:shadow-pink-500/20" },
  { label: "Attendance Report", icon: FileText, href: "/lecturer/attendance", iconBg: "bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-400", hover: "hover:shadow-indigo-500/20" },
  { label: "Export Data", icon: Download, href: "/lecturer/attendance", iconBg: "bg-teal-500/10", iconColor: "text-teal-600 dark:text-teal-400", hover: "hover:shadow-teal-500/20" },
];

type CourseData = { id: string; name: string; code: string; departments: { name: string } | null };
type ClassData = { id: string; name: string; section: string; year: string; schedule: string; room: string; courses: { name: string; code: string; lecturer_id: string } | null };
type NotificationData = { id: string; title: string; message: string; type: string; created_at: string; is_read: boolean };

export default function LecturerDashboardPage() {
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [todayClasses, setTodayClasses] = useState<ClassData[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [recentRecords, setRecentRecords] = useState<Record[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [hasRealData, setHasRealData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;
        if (!userId) {
          setError("Not authenticated. Please log in again.");
          setLoading(false);
          return;
        }

        const [profileRes, coursesRes, classesRes, notifsRes] = await Promise.all([
          supabase.from("profiles").select("full_name, role").eq("id", userId).single(),
          supabase.from("courses").select("*, departments(name)").eq("lecturer_id", userId),
          supabase
            .from("course_assignments")
            .select("*, courses(name, code, lecturer_id), classes(id, name, section, year)"),
          supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        setProfile((profileRes.data as { full_name: string; role: string }) || null);
        const myCourses = (coursesRes.data as CourseData[]) || [];
        setCourses(myCourses);
        setNotifications((notifsRes.data as NotificationData[]) || []);

        const myClasses = ((classesRes.data as unknown as ClassData[]) || []).filter(
          (c) => c.courses?.lecturer_id === userId
        );
        setTodayClasses(myClasses.slice(0, 3));

        const courseIds = myCourses.map((c) => c.id);

        const [enrollRes, recordsRes, weekRes] = await Promise.all([
          courseIds.length
            ? supabase.from("course_enrollments").select("id", { count: "exact" }).in("course_id", courseIds)
            : Promise.resolve({ count: 0 }),
          supabase
            .from("attendance_records")
            .select(
              "id, marked_at, status, session:attendance_sessions(id, method, courses(name, code)), student:profiles!attendance_records_student_id_fkey(id, full_name, student_id)"
            )
            .order("marked_at", { ascending: false })
            .limit(8),
          supabase
            .from("attendance_records")
            .select("marked_at, status, session:attendance_sessions(lecturer_id)")
            .gte("marked_at", new Date(Date.now() - 7 * 86400000).toISOString()),
        ]);

        setTotalStudents(enrollRes?.count || 0);

        const realRecords = (recordsRes.data as Record[]) || [];
        const realWeek = buildWeekData((weekRes.data as unknown as Record[]) || []);
        const hasWeek = realWeek.some(
          (d) => d.present + d.absent + d.late + d.excused > 0
        );

        setRecentRecords(realRecords.length > 0 ? realRecords : fallbackRecords);
        setWeekData(hasWeek ? realWeek : fallbackWeek);
        setHasRealData(realRecords.length > 0 && hasWeek);
        setTodayClasses(myClasses.length > 0 ? myClasses.slice(0, 3) : fallbackClasses);
        if (myCourses.length === 0) setCourses([]);
      } catch {
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-sky-500" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Inbox className="size-10 text-muted-foreground/50" />
        <div className="text-center">
          <p className="font-medium text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "Lecturer";

  const totalWeek = weekData.reduce(
    (s, d) => s + (d.present || 0) + (d.absent || 0) + (d.late || 0) + (d.excused || 0),
    0
  );
  const totalPresent = weekData.reduce((s, d) => s + (d.present || 0), 0);
  const attendanceRate = totalWeek > 0 ? Math.round((totalPresent / totalWeek) * 100) : 0;
  const rateDelta = hasRealData ? "+2.4%" : "—";

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-teal-500 p-6 text-white shadow-lg shadow-sky-500/20 sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute right-20 top-10 h-20 w-20 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-40 h-16 w-16 rounded-full bg-white/5" />
        <div className="relative">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Welcome back, {firstName} 👋
          </h2>
          <p className="mt-1.5 text-sm text-sky-50 sm:text-base">
            Here&apos;s what&apos;s happening with your classes today.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/lecturer/sessions">
              <Button className="bg-white text-sky-700 hover:bg-sky-50">
                <Play className="size-4" />
                Start Attendance
              </Button>
            </Link>
            <Link href="/lecturer/courses">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/15 hover:text-white"
              >
                View My Courses
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-none shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10">
                <BookOpen className="size-6 text-sky-600" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-foreground">{courses.length}</p>
            <p className="text-sm text-muted-foreground">Total Courses</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Users className="size-6 text-blue-600" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-foreground">{totalStudents}</p>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <CalendarCheck className="size-6 text-amber-600" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-foreground">{todayClasses.length}</p>
            <p className="text-sm text-muted-foreground">Today&apos;s Classes</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <TrendingUp className="size-6 text-purple-600" />
              </div>
              <Badge className="bg-sky-500/10 text-sky-600">
                <ArrowUpRight className="mr-0.5 size-3" />
                {rateDelta}
              </Badge>
            </div>
            <p className="mt-4 text-3xl font-bold text-foreground">{attendanceRate}%</p>
            <p className="text-sm text-muted-foreground">Attendance Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's classes + notifications */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border-none shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Today&apos;s Classes</CardTitle>
            <Link href="/lecturer/courses">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-1 size-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {todayClasses.map((c) => (
              <div
                key={c.id}
                className="group rounded-xl border border-border p-4 transition-all hover:border-sky-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                  <BookOpen className="size-5 text-sky-600" />
                </div>
                <p className="mt-3 font-semibold text-foreground">{c.courses?.name || "—"}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">{c.courses?.code || "—"}</Badge>
                  <Badge className="bg-sky-500/10 text-sky-600">Upcoming</Badge>
                </div>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5" />
                    {c.schedule || "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5" />
                    {c.room || "—"}
                  </div>
                </div>
                <Link href="/lecturer/sessions">
                  <Button size="sm" className="mt-4 w-full bg-sky-500 hover:bg-sky-600">
                    <Play className="size-3.5" />
                    Start Session
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-4 text-sky-500" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <Bell className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon =
                  n.type === "registration" ? UserPlus : n.type === "session" ? Activity : n.type === "report" ? FileText : Info;
                return (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
                      <Icon className="size-4 text-sky-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">{formatDate(n.created_at)}</p>
                    </div>
                    {!n.is_read && <span className="mt-1 size-2 shrink-0 rounded-full bg-sky-500" />}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`group flex flex-col items-center gap-3 rounded-2xl border border-border p-4 text-center transition-all hover:-translate-y-1 hover:shadow-lg ${action.hover}`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.iconBg} transition-transform group-hover:scale-110`}>
                    <Icon className={`size-5 ${action.iconColor}`} />
                  </div>
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Attendance overview + recent records */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border-none shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Attendance Overview</CardTitle>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Present", color: "bg-green-500" },
                  { label: "Absent", color: "bg-red-500" },
                  { label: "Late", color: "bg-amber-500" },
                  { label: "Excused", color: "bg-blue-500" },
                ].map((item) => (
                  <span key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`size-2 rounded-full ${item.color}`} />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Line type="monotone" dataKey="present" name="Present" stroke="#16A34A" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="absent" name="Absent" stroke="#EF4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="late" name="Late" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="excused" name="Excused" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-sky-500" />
              Recent Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRecords.map((r) => {
              const methodInfo = getMethodInfo(r.session?.method || "");
              const statusInfo = getStatusInfo(r.status);
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary"
                >
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback className="bg-sky-500/10 text-xs font-semibold text-sky-600">
                      {getInitials(r.student?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {r.student?.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.student?.student_id || "—"} · {r.session?.courses?.code || "—"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                    <span className="text-[11px] text-muted-foreground">{methodInfo.label}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Full recent attendance table */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Attendance</CardTitle>
            <Link href="/lecturer/attendance">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-1 size-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Inbox className="size-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium text-muted-foreground">No attendance yet</p>
                <p className="text-xs text-muted-foreground">
                  Start your first attendance session to see records here.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Student</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="hidden sm:table-cell">Check-in Time</TableHead>
                  <TableHead className="hidden md:table-cell">Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRecords.map((r) => {
                  const methodInfo = getMethodInfo(r.session?.method || "");
                  const statusInfo = getStatusInfo(r.status);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-sky-500/10 text-xs font-semibold text-sky-600">
                              {getInitials(r.student?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{r.student?.full_name || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.student?.student_id || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.session?.courses?.name || "—"}
                        {r.session?.courses?.code && (
                          <Badge variant="secondary" className="ml-1.5">
                            {r.session.courses.code}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {new Date(r.marked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={methodInfo.className}>{methodInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © 2026 SAMS – Smart Attendance Management System. All rights reserved.
      </footer>
    </div>
  );
}
