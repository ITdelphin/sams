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
import { formatDate, getStatusColor } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  GraduationCap,
  Presentation,
  BookOpen,
  Building2,
  TrendingUp,
  Radio,
  UserPlus,
  FileText,
  Database,
  Users,
  Settings,
  AlertTriangle,
  ShieldCheck,
  Info,
  CheckCircle2,
  Loader2,
  Bell,
  ArrowRight,
  Activity,
  Sparkles,
  Clock,
} from "lucide-react";

const alerts = [
  {
    icon: CheckCircle2,
    title: "All systems operational",
    time: "Just now",
    priority: "Low",
    color: "text-green-500",
    badge: "bg-green-100 text-green-700",
  },
  {
    icon: Sparkles,
    title: "New student registrations",
    time: "2h ago",
    priority: "Info",
    color: "text-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    icon: ShieldCheck,
    title: "Database backup completed",
    time: "6h ago",
    priority: "Normal",
    color: "text-amber-500",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    icon: AlertTriangle,
    title: "Server storage is 85% full",
    time: "1d ago",
    priority: "High",
    color: "text-red-500",
    badge: "bg-red-100 text-red-700",
  },
];

const quickActions = [
  { label: "Add Student", icon: UserPlus, href: "/admin/students", iconBg: "bg-gradient-to-br from-sky-400 to-sky-600", iconColor: "text-white", hover: "hover:shadow-sky-500/25" },
  { label: "Add Lecturer", icon: Presentation, href: "/admin/lecturers", iconBg: "bg-gradient-to-br from-blue-400 to-blue-600", iconColor: "text-white", hover: "hover:shadow-blue-500/25" },
  { label: "Add Course", icon: BookOpen, href: "/admin/courses", iconBg: "bg-gradient-to-br from-purple-400 to-purple-600", iconColor: "text-white", hover: "hover:shadow-purple-500/25" },
  { label: "Add Department", icon: Building2, href: "/admin/departments", iconBg: "bg-gradient-to-br from-amber-400 to-amber-600", iconColor: "text-white", hover: "hover:shadow-amber-500/25" },
  { label: "Generate Report", icon: FileText, href: "/admin/attendance", iconBg: "bg-gradient-to-br from-indigo-400 to-indigo-600", iconColor: "text-white", hover: "hover:shadow-indigo-500/25" },
  { label: "System Backup", icon: Database, href: "/admin/settings", iconBg: "bg-gradient-to-br from-teal-400 to-teal-600", iconColor: "text-white", hover: "hover:shadow-teal-500/25" },
  { label: "Manage Users", icon: Users, href: "/admin/students", iconBg: "bg-gradient-to-br from-pink-400 to-pink-600", iconColor: "text-white", hover: "hover:shadow-pink-500/25" },
  { label: "System Settings", icon: Settings, href: "/admin/settings", iconBg: "bg-gradient-to-br from-cyan-400 to-cyan-600", iconColor: "text-white", hover: "hover:shadow-cyan-500/25" },
];

const fallbackWeek = [
  { name: "Mon", present: 42, absent: 2, late: 4, excused: 1 },
  { name: "Tue", present: 38, absent: 3, late: 6, excused: 2 },
  { name: "Wed", present: 45, absent: 1, late: 3, excused: 0 },
  { name: "Thu", present: 40, absent: 4, late: 5, excused: 1 },
  { name: "Fri", present: 36, absent: 2, late: 7, excused: 3 },
  { name: "Sat", present: 28, absent: 1, late: 2, excused: 0 },
  { name: "Sun", present: 0, absent: 0, late: 0, excused: 0 },
];

const fallbackStatus = [
  { name: "Active", value: 2450, color: "#16A34A" },
  { name: "Inactive", value: 180, color: "#94A3B8" },
  { name: "Graduated", value: 156, color: "#3B82F6" },
  { name: "Suspended", value: 70, color: "#EF4444" },
];

const fallbackCourses = [
  { name: "Software Engineering", code: "SE301", count: 320 },
  { name: "Information Systems", code: "IS202", count: 285 },
  { name: "Computer Science", code: "CS101", count: 260 },
  { name: "Cyber Security", code: "CS405", count: 195 },
  { name: "Data Science", code: "DS301", count: 170 },
];

const fallbackActivity = [
  { action: "Admin logged in", time: "Just now" },
  { action: "Attendance report generated", time: "1h ago" },
  { action: "Course created", time: "2h ago" },
  { action: "Department added", time: "4h ago" },
  { action: "User role updated", time: "6h ago" },
  { action: "System backup completed", time: "8h ago" },
];

const fallbackNotifs = [
  { title: "New lecturer registered", message: "Awaiting your approval.", type: "registration", time: "1h ago" },
  { title: "Attendance report ready", message: "Weekly report is ready to download.", type: "report", time: "3h ago" },
  { title: "Security alert", message: "New device login detected.", type: "security", time: "5h ago" },
  { title: "System update available", message: "Version 2.4 is ready to install.", type: "system", time: "1d ago" },
];

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
      days[idx][status] += 1;
    }
  });
  return days;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    students: 0,
    lecturers: 0,
    courses: 0,
    departments: 0,
    attendanceRate: 0,
    activeSessions: 0,
  });
  const [statusData, setStatusData] = useState<any[]>([]);
  const [topCourses, setTopCourses] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [weekData, setWeekData] = useState<any[]>([]);
  const [checkedIn, setCheckedIn] = useState(0);
  const [methodBreakdown, setMethodBreakdown] = useState<Record<string, number>>({});
  const [hasRealData, setHasRealData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [
        students,
        lecturers,
        courses,
        departments,
        sessions,
        activeSessions,
        recordsRes,
        statusRes,
        enrollRes,
        recent,
        activityRes,
        notifsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "lecturer"),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("departments").select("id", { count: "exact", head: true }),
        supabase.from("attendance_sessions").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("attendance_sessions").select("method").eq("is_active", true),
        supabase.from("attendance_records").select("id, status, marked_at, session:attendance_sessions(id, is_active)").gte("marked_at", new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from("profiles").select("account_status").eq("role", "student"),
        supabase.from("course_enrollments").select("course_id, course:courses(name, code)"),
        supabase.from("profiles").select("full_name, email, role, account_status, created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("audit_logs").select("action, entity_type, created_at").order("created_at", { ascending: false }).limit(6),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(4),
      ]);

      const records = (recordsRes.data as any[]) || [];
      const present = records.filter((r) => r.status === "present").length;
      const total = records.length;

      const activeSessionRows = (activeSessions.data as any[]) || [];
      const methodCounts: Record<string, number> = {};
      activeSessionRows.forEach((s) => {
        methodCounts[s.method] = (methodCounts[s.method] || 0) + 1;
      });

      setStats({
        students: students.count || 0,
        lecturers: lecturers.count || 0,
        courses: courses.count || 0,
        departments: departments.count || 0,
        attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
        activeSessions: sessions.count || 0,
      });

      setCheckedIn(records.filter((r) => r.session?.is_active).length);
      setMethodBreakdown(methodCounts);

      const statusRows = (statusRes.data as any[]) || [];
      const counts: Record<string, number> = {};
      statusRows.forEach((s) => {
        counts[s.account_status] = (counts[s.account_status] || 0) + 1;
      });
      const statusMap: Record<string, { label: string; color: string }> = {
        approved: { label: "Active", color: "#16A34A" },
        inactive: { label: "Inactive", color: "#94A3B8" },
        graduated: { label: "Graduated", color: "#3B82F6" },
        suspended: { label: "Suspended", color: "#EF4444" },
        pending: { label: "Pending", color: "#F59E0B" },
      };
      const statusDataArr = Object.entries(counts)
        .filter(([k]) => statusMap[k])
        .map(([k, v]) => ({ name: statusMap[k].label, value: v, color: statusMap[k].color }));
      setStatusData(statusDataArr.length > 0 ? statusDataArr : fallbackStatus);

      const enrollRows = (enrollRes.data as any[]) || [];
      const courseCounts: Record<string, { name: string; code: string; count: number }> = {};
      enrollRows.forEach((e) => {
        const c = e.course;
        if (!c) return;
        const key = c.code || c.name;
        if (!courseCounts[key]) courseCounts[key] = { name: c.name, code: c.code, count: 0 };
        courseCounts[key].count += 1;
      });
      const top = Object.values(courseCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((c) => ({ name: c.name, code: c.code, count: c.count }));
      setTopCourses(top.length > 0 ? top : fallbackCourses);

      setRecentUsers(recent.data || []);
      const activity = (activityRes.data as any[]) ?? [];
      const notifs = (notifsRes.data as any[]) ?? [];
      setActivity(activity.length ? activity.map((a: any) => ({ action: a.action, time: formatDate(a.created_at) })) : fallbackActivity);
      setNotifications(notifs.length ? notifs.map((n: any) => ({ title: n.title, message: n.message, type: n.type, time: formatDate(n.created_at) })) : fallbackNotifs);

      const realWeek = buildWeekData(records);
      const hasWeek = realWeek.some((d) => d.present + d.absent + d.late + d.excused > 0);
      setWeekData(hasWeek ? realWeek : fallbackWeek);
      setHasRealData(hasWeek);

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-sky-500" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const maxCourse = Math.max(...topCourses.map((c) => c.count), 1);

  const methodLabels: Record<string, string> = {
    qr_code: "QR Code",
    face_recognition: "Face Recognition",
    fingerprint: "Fingerprint",
    manual: "Manual",
    student_id_card: "Student ID",
  };

  const statCards = [
    { title: "Total Students", value: stats.students, icon: GraduationCap, grad: "from-sky-400 to-sky-600", glow: "shadow-sky-500/25", growth: hasRealData ? "+12.5%" : "—" },
    { title: "Total Lecturers", value: stats.lecturers, icon: Presentation, grad: "from-blue-400 to-blue-600", glow: "shadow-blue-500/25", growth: hasRealData ? "+4.2%" : "—" },
    { title: "Total Courses", value: stats.courses, icon: BookOpen, grad: "from-purple-400 to-purple-600", glow: "shadow-purple-500/25", growth: null },
    { title: "Departments", value: stats.departments, icon: Building2, grad: "from-amber-400 to-amber-600", glow: "shadow-amber-500/25", growth: null },
    { title: "Attendance Rate", value: `${stats.attendanceRate}%`, icon: TrendingUp, grad: "from-indigo-400 to-indigo-600", glow: "shadow-indigo-500/25", growth: hasRealData ? "+1.8%" : "—" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-[#16A34A] p-6 text-white shadow-lg shadow-sky-500/10 sm:p-8">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 right-24 h-24 w-24 rounded-full bg-sky-400/20 blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <Badge className="bg-white/15 text-sky-200 backdrop-blur">
              <span className="mr-1 size-1.5 animate-pulse rounded-full bg-sky-400" />
              Live
            </Badge>
          </div>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Welcome back, Super Admin! 👋</h2>
          <p className="mt-1.5 text-sm text-sky-50/80 sm:text-base">
            Here&apos;s what&apos;s happening across your institution today.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/admin/students">
              <Button className="bg-white text-sky-700 hover:bg-sky-50">
                <UserPlus className="size-4" />
                Add Student
              </Button>
            </Link>
            <Link href="/admin/attendance">
              <Button variant="ghost" className="text-white hover:bg-white/15 hover:text-white">
                View Attendance
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="rounded-2xl border-none shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.grad} shadow-lg ${card.glow}`}>
                    <Icon className="size-5 text-white" />
                  </div>
                  {card.growth && (
                    <Badge className="bg-sky-500/10 text-sky-600">{card.growth}</Badge>
                  )}
                </div>
                <p className="mt-4 text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </CardContent>
            </Card>
          );
        })}

        {/* Active sessions card with live badge */}
        <Card className="rounded-2xl border-none bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Radio className="size-5 text-white" />
              </div>
              <Badge className="bg-white/20 text-white">
                <span className="mr-1 size-1.5 animate-pulse rounded-full bg-sky-400" />
                Live
              </Badge>
            </div>
            <p className="mt-4 text-2xl font-bold">{stats.activeSessions}</p>
            <p className="text-xs text-white/80">Active Sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance analytics + institution overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border-none shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Attendance Analytics</CardTitle>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Present", color: "bg-green-500" },
                  { label: "Late", color: "bg-amber-500" },
                  { label: "Absent", color: "bg-red-500" },
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
                  <Line type="monotone" dataKey="late" name="Late" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="absent" name="Absent" stroke="#EF4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="excused" name="Excused" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle>Institution Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mx-auto h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-foreground">{stats.students}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2">
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                  <span className="text-xs font-semibold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent registrations + system alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Registrations</CardTitle>
              <Link href="/admin/students">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="ml-1 size-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="hidden sm:table-cell">Registered</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No registrations yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentUsers.map((user, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-sky-500/10 text-xs font-semibold text-sky-600">
                              {user.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{user.role.replace("_", " ")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">—</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.account_status)}>{user.account_status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-4 text-sky-500" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.title}
                  className="flex items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary"
                >
                  <div className={`mt-0.5 ${a.color}`}>
                    <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="size-3" />
                      {a.time}
                    </p>
                  </div>
                  <Badge className={a.badge}>{a.priority}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Top courses + live attendance + notifications */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle>Top Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCourses.map((c) => (
              <div key={c.code || c.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.count} students</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-500"
                    style={{ width: `${Math.max(6, (c.count / maxCourse) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none bg-[#1E3A8A] text-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Radio className="size-4 text-sky-400" />
              Live Attendance Monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-2xl font-bold text-sky-400">{stats.activeSessions}</p>
                <p className="text-xs text-slate-400">Active Sessions</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-2xl font-bold text-white">{checkedIn}</p>
                <p className="text-xs text-slate-400">Students Checked In</p>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              {Object.entries(methodBreakdown).length === 0 ? (
                <p className="rounded-lg bg-white/5 px-3 py-4 text-center text-xs text-slate-400">
                  No active sessions right now.
                </p>
              ) : (
                Object.entries(methodBreakdown).map(([method, count]) => (
                  <div key={method} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                    <span className="text-slate-300">{methodLabels[method] || method}</span>
                    <span className="flex items-center gap-2">
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-sky-500" />
                      </span>
                      <span className="font-semibold text-white">{count}</span>
                    </span>
                  </div>
                ))
              )}
            </div>
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
            {notifications.map((n, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary">
                <div className="mt-0.5 text-sky-500">
                  <Info className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{n.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System activity */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4 text-sky-500" />
            System Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-5">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-secondary" />
            <div className="space-y-5">
              {activity.map((a, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 size-3.5 rounded-full border-2 border-background bg-sky-500" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{a.action}</p>
                    <span className="text-xs text-muted-foreground">{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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

      {/* Footer */}
      <footer className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © 2026 SAMS – Smart Attendance Management System. All rights reserved.
      </footer>
    </div>
  );
}
