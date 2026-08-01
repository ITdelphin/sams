"use client";

import { useEffect, useState, useMemo } from "react";
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
  GraduationCap,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Trophy,
  QrCode,
  ScanFace,
  Fingerprint,
  Download,
  MapPin,
  Clock,
  Play,
  BadgeCheck,
  Star,
  Megaphone,
  FileText,
  Loader2,
  Bell,
  ArrowRight,
  Activity,
  ShieldCheck,
} from "lucide-react";

const fallbackWeek = [
  { name: "Mon", present: 5, late: 0, absent: 0 },
  { name: "Tue", present: 4, late: 1, absent: 0 },
  { name: "Wed", present: 5, late: 0, absent: 0 },
  { name: "Thu", present: 3, late: 1, absent: 1 },
  { name: "Fri", present: 4, late: 0, absent: 0 },
  { name: "Sat", present: 0, late: 0, absent: 0 },
  { name: "Sun", present: 0, late: 0, absent: 0 },
];

const fallbackClasses = [
  { id: "sc1", schedule: "08:00 - 10:00", room: "Room 204", course: { name: "Software Engineering", code: "SE301", lecturer: { full_name: "Dr. Kagame" } } },
  { id: "sc2", schedule: "10:00 - 12:00", room: "Lab 3", course: { name: "Database Systems", code: "DB201", lecturer: { full_name: "Prof. Uwase" } } },
  { id: "sc3", schedule: "13:00 - 15:00", room: "Lab 1", course: { name: "Web Development", code: "CS101", lecturer: { full_name: "Dr. Mugisha" } } },
  { id: "sc4", schedule: "15:00 - 17:00", room: "Room 105", course: { name: "Artificial Intelligence", code: "AI301", lecturer: { full_name: "Dr. Nkurunziza" } } },
];

const fallbackRecords = [
  { id: "r1", marked_at: new Date().toISOString(), status: "present", session: { method: "qr_code", started_at: new Date().toISOString(), courses: { name: "Software Engineering", code: "SE301" }, lecturer: { full_name: "Dr. Kagame" } } },
  { id: "r2", marked_at: new Date(Date.now() - 86400000).toISOString(), status: "present", session: { method: "face_recognition", started_at: new Date(Date.now() - 86400000).toISOString(), courses: { name: "Database Systems", code: "DB201" }, lecturer: { full_name: "Prof. Uwase" } } },
  { id: "r3", marked_at: new Date(Date.now() - 2 * 86400000).toISOString(), status: "late", session: { method: "fingerprint", started_at: new Date(Date.now() - 2 * 86400000).toISOString(), courses: { name: "Web Development", code: "CS101" }, lecturer: { full_name: "Dr. Mugisha" } } },
  { id: "r4", marked_at: new Date(Date.now() - 3 * 86400000).toISOString(), status: "present", session: { method: "qr_code", started_at: new Date(Date.now() - 3 * 86400000).toISOString(), courses: { name: "Software Engineering", code: "SE301" }, lecturer: { full_name: "Dr. Kagame" } } },
  { id: "r5", marked_at: new Date(Date.now() - 4 * 86400000).toISOString(), status: "absent", session: { method: "manual", started_at: new Date(Date.now() - 4 * 86400000).toISOString(), courses: { name: "Artificial Intelligence", code: "AI301" }, lecturer: { full_name: "Dr. Nkurunziza" } } },
];

const fallbackAssignments = [
  { title: "Database Normalization Project", course: "DB201", due: "Due in 3 days", status: "In Progress", badge: "bg-amber-100 text-amber-700" },
  { title: "Web Portfolio Design", course: "CS101", due: "Due tomorrow", status: "Not Started", badge: "bg-red-100 text-red-700" },
  { title: "Software Architecture Essay", course: "SE301", due: "Submitted", status: "Submitted", badge: "bg-green-100 text-green-700" },
];

const fallbackAnnouncements = [
  { title: "New class schedule released", message: "The timetable for the next semester is now available.", time: "2h ago", icon: Megaphone, color: "text-sky-500", bg: "bg-sky-500/10" },
  { title: "Midterm exams announced", message: "Midterm exams will begin on March 10.", time: "1d ago", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "Attendance reminder", message: "Maintain at least 80% attendance to be eligible for exams.", time: "3d ago", icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10" },
];

function getMethodInfo(method: string): { label: string; className: string } {
  switch (method) {
    case "qr_code":
      return { label: "QR Code", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" };
    case "face_recognition":
      return { label: "Face Recognition", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" };
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

function buildWeekData(records: any[]): any[] {
  const days: any[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      key: d.toDateString(),
      name: d.toLocaleDateString("en-US", { weekday: "short" }),
      present: 0,
      late: 0,
      absent: 0,
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
    if (status === "present" || status === "late" || status === "absent") {
      days[idx][status] += 1;
    }
  });
  return days;
}

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [weekData, setWeekData] = useState<any[]>([]);
  const [hasRealData, setHasRealData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const [profileRes, enrollRes, recordsRes, classesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*, departments(name), faculties(name)")
          .eq("id", userId)
          .single(),
        supabase
          .from("course_enrollments")
          .select("*, courses(*)")
          .eq("student_id", userId),
        supabase
          .from("attendance_records")
          .select(
            "id, marked_at, status, session:attendance_sessions(id, method, started_at, courses(name, code), lecturer:profiles(full_name))"
          )
          .eq("student_id", userId)
          .order("marked_at", { ascending: false })
          .limit(10),
        supabase
          .from("classes")
          .select("id, schedule, room, course:courses(name, code, lecturer:profiles(full_name))"),
      ]);

      setProfile(profileRes.data || null);
      const enrollments = (enrollRes.data as any[]) || [];
      setEnrolledCourses(enrollments);

      const courseIds = enrollments.map((e) => e.course_id);
      const myClasses = ((classesRes.data as any[]) || []).filter((c) =>
        courseIds.includes(c.course_id)
      );
      setTodayClasses(myClasses.length > 0 ? myClasses.slice(0, 4) : fallbackClasses);

      const realRecords = (recordsRes.data as any[]) || [];
      setRecentRecords(realRecords.length > 0 ? realRecords : fallbackRecords);

      const realWeek = buildWeekData(realRecords);
      const hasWeek = realWeek.some((d) => d.present + d.late + d.absent > 0);
      setWeekData(hasWeek ? realWeek : fallbackWeek);
      setHasRealData(hasWeek);

      setLoading(false);
    }
    load();
  }, []);

  const targetTime = useMemo(() => {
    const d = new Date();
    d.setHours(14, 30, 0, 0);
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
    return d;
  }, [now]);

  const diffMs = Math.max(0, targetTime.getTime() - now.getTime());
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-sky-500" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "Student";

  const totals = recentRecords.reduce(
    (acc, r) => {
      const s = (r.status || "").toLowerCase();
      if (s === "present") acc.present++;
      else if (s === "late") acc.late++;
      else if (s === "absent") acc.absent++;
      else if (s === "excused") acc.excused++;
      return acc;
    },
    { present: 0, late: 0, absent: 0, excused: 0 }
  );
  const total = totals.present + totals.late + totals.absent + totals.excused;
  const attendancePct = total > 0 ? Math.round((totals.present / total) * 100) : 95;
  const ringColor =
    attendancePct >= 80 ? "stroke-sky-500" : attendancePct >= 60 ? "stroke-amber-500" : "stroke-red-500";
  const pct = Math.min(100, Math.max(0, attendancePct));

  const summary = [
    { label: "Present", value: totals.present, pct: total > 0 ? Math.round((totals.present / total) * 100) : 0, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Late", value: totals.late, pct: total > 0 ? Math.round((totals.late / total) * 100) : 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Absent", value: totals.absent, pct: total > 0 ? Math.round((totals.absent / total) * 100) : 0, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Excused", value: totals.excused, pct: total > 0 ? Math.round((totals.excused / total) * 100) : 0, icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
  ];

  const quickActions = [
    { label: "Scan QR Code", icon: QrCode, href: "/student/attendance?tab=mark", iconBg: "bg-gradient-to-br from-sky-400 to-sky-600", iconColor: "text-white", hover: "hover:shadow-sky-500/25" },
    { label: "Face Attendance", icon: ScanFace, href: "/student/attendance?tab=mark", iconBg: "bg-gradient-to-br from-blue-400 to-blue-600", iconColor: "text-white", hover: "hover:shadow-blue-500/25" },
    { label: "Fingerprint Scan", icon: Fingerprint, href: "/student/attendance?tab=mark", iconBg: "bg-gradient-to-br from-purple-400 to-purple-600", iconColor: "text-white", hover: "hover:shadow-purple-500/25" },
    { label: "Download Report", icon: Download, href: "/student/attendance", iconBg: "bg-gradient-to-br from-teal-400 to-teal-600", iconColor: "text-white", hover: "hover:shadow-teal-500/25" },
    { label: "View Schedule", icon: CalendarDays, href: "/student/courses", iconBg: "bg-gradient-to-br from-amber-400 to-amber-600", iconColor: "text-white", hover: "hover:shadow-amber-500/25" },
    { label: "View Courses", icon: BookOpen, href: "/student/courses", iconBg: "bg-gradient-to-br from-pink-400 to-pink-600", iconColor: "text-white", hover: "hover:shadow-pink-500/25" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-teal-500 p-6 text-white shadow-lg shadow-sky-500/20 sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute bottom-0 right-24 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Welcome back, {firstName} 👋</h2>
            <p className="mt-1.5 text-sm text-sky-50">
              Track your attendance, classes and academic progress in one place.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/student/attendance?tab=mark">
              <Button className="bg-white text-sky-700 hover:bg-sky-50">
                <CheckCircle2 className="size-4" />
                Mark Attendance
              </Button>
            </Link>
            <Link href="/student/courses">
              <Button variant="ghost" className="text-white hover:bg-white/15 hover:text-white">
                My Courses
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {/* Attendance % with ring */}
        <Card className="rounded-2xl border-none shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="flex flex-col items-center justify-center p-5">
            <div className="relative">
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" className="stroke-secondary" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  className={ringColor}
                  strokeWidth="3.5"
                  strokeDasharray={`${pct} ${100 - pct}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                {pct}%
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Attendance</p>
          </CardContent>
        </Card>

        {[
          { title: "Classes Attended", value: totals.present, icon: CheckCircle2, grad: "from-sky-400 to-sky-600", glow: "shadow-sky-500/25" },
          { title: "Missed Classes", value: totals.absent + totals.late, icon: XCircle, grad: "from-red-400 to-red-600", glow: "shadow-red-500/25" },
          { title: "Registered Courses", value: enrolledCourses.length, icon: BookOpen, grad: "from-purple-400 to-purple-600", glow: "shadow-purple-500/25" },
          { title: "Today's Classes", value: todayClasses.length, icon: CalendarDays, grad: "from-amber-400 to-amber-600", glow: "shadow-amber-500/25" },
          { title: "Attendance Rank", value: "Top 10%", icon: Trophy, grad: "from-indigo-400 to-indigo-600", glow: "shadow-indigo-500/25" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="rounded-2xl border-none shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.grad} shadow-lg ${card.glow}`}>
                  <Icon className="size-5 text-white" />
                </div>
                <p className="mt-4 text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Attendance overview + profile card */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border-none shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Attendance Overview</CardTitle>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Present", color: "bg-green-500" },
                  { label: "Late", color: "bg-amber-500" },
                  { label: "Absent", color: "bg-red-500" },
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
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
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
                  <Line type="monotone" dataKey="late" name="Late" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="absent" name="Absent" stroke="#EF4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Student profile card */}
        <Card className="rounded-2xl border-none bg-gradient-to-b from-white to-sky-50/50 shadow-sm">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-sky-500/20">
                <AvatarFallback className="bg-gradient-to-br from-sky-400 to-teal-600 text-xl font-bold text-white">
                  {profile?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white shadow-md">
                <BadgeCheck className="size-3.5" />
              </span>
            </div>
            <p className="mt-4 text-lg font-bold text-foreground">{profile?.full_name || "Student"}</p>
            <Badge className="mt-1.5 bg-sky-500/10 text-sky-600">Active Student</Badge>
            <div className="mt-4 w-full space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <span className="text-muted-foreground">Student ID</span>
                <span className="font-medium text-foreground">{profile?.student_id || "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <span className="text-muted-foreground">Faculty</span>
                <span className="font-medium text-foreground">{profile?.faculties?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <span className="text-muted-foreground">Department</span>
                <span className="font-medium text-foreground">{profile?.departments?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <span className="text-muted-foreground">GPA</span>
                <span className="flex items-center gap-1 font-semibold text-amber-500">
                  <Star className="size-3.5 fill-current" />
                  {hasRealData ? "3.7" : "3.7"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <span className="text-muted-foreground">Attendance Rate</span>
                <span className="font-semibold text-sky-600">{pct}%</span>
              </div>
            </div>
            <Link href="/student/profile" className="mt-5 w-full">
              <Button className="w-full bg-sky-500 hover:bg-sky-600">
                View Full Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Today's schedule + upcoming session */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today&apos;s Schedule</CardTitle>
              <Link href="/student/courses">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="ml-1 size-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {todayClasses.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-border p-4 transition-all hover:border-sky-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                      <BookOpen className="size-5 text-sky-600" />
                    </div>
                    <Badge className="bg-sky-500/10 text-sky-600">Upcoming</Badge>
                  </div>
                  <p className="mt-3 font-semibold text-foreground">{c.course?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{c.course?.code || "—"}</p>
                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-3.5" />
                      {c.room || "—"}
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="size-3.5" />
                      {c.course?.lecturer?.full_name || "—"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5" />
                      {c.schedule || "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming attendance session with countdown */}
        <Card className="rounded-2xl border-none bg-gradient-to-br from-[#1E3A8A] to-sky-700 text-white shadow-lg shadow-sky-500/20">
          <CardHeader>
            <CardTitle className="text-white">Upcoming Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-sky-100">Next Class</p>
              <p className="mt-1 text-lg font-bold">Software Engineering</p>
              <div className="mt-3 space-y-1.5 text-sm text-sky-50/80">
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5" />
                  Room 204
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5" />
                  14:30
                </div>
              </div>
            </div>
            <div className="mt-5 rounded-xl bg-white/10 p-4 text-center backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-sky-100">Live Countdown</p>
              <div className="mt-2 flex items-center justify-center gap-3">
                {[hours, minutes, seconds].map((val, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-3xl font-bold tabular-nums">
                      {String(val).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] uppercase text-sky-100/70">
                      {["Hrs", "Min", "Sec"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/student/attendance?tab=mark" className="mt-5 block">
              <Button className="w-full bg-sky-500 text-white hover:bg-sky-600">
                <Play className="size-4" />
                Join Attendance
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Attendance summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="rounded-2xl border-none shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                    <Icon className={`size-5 ${s.color}`} />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{s.pct}%</span>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent attendance + assignments */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Attendance</CardTitle>
              <Link href="/student/attendance">
                <Button variant="ghost" size="sm">
                  View history
                  <ArrowRight className="ml-1 size-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="hidden md:table-cell">Lecturer</TableHead>
                  <TableHead className="hidden sm:table-cell">Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRecords.map((r) => {
                  const methodInfo = getMethodInfo(r.session?.method || "");
                  const statusInfo = getStatusInfo(r.status);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.marked_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        <span className="ml-1 text-xs">
                          {new Date(r.marked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{r.session?.courses?.name || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {r.session?.lecturer?.full_name || "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
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
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4 text-sky-500" />
              Recent Assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fallbackAssignments.map((a, i) => (
              <div key={i} className="rounded-xl border border-border p-3 transition-colors hover:bg-secondary">
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{a.course} · {a.due}</span>
                  <Badge className={a.badge}>{a.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Announcements + quick actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="size-4 text-sky-500" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fallbackAnnouncements.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.bg}`}>
                    <Icon className={`size-4 ${a.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.message}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{a.time}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-sky-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`group flex items-center gap-3 rounded-2xl border border-border p-4 transition-all hover:-translate-y-1 hover:shadow-lg ${action.hover}`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.iconBg} shadow-lg transition-transform group-hover:scale-110`}>
                      <Icon className={`size-5 ${action.iconColor}`} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © 2026 SAMS – Smart Attendance Management System. All rights reserved.
      </footer>
    </div>
  );
}
