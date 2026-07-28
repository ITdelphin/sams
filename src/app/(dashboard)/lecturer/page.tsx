"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDate, getStatusColor } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BookOpen,
  CalendarCheck,
  Users,
  Clock,
  Loader2,
  Inbox,
  ArrowRight,
  Play,
  Eye,
  BarChart3,
} from "lucide-react";

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "lecturer" | "super_admin";
  account_status: string;
};

type Course = {
  id: string;
  name: string;
  code: string;
  department_id: string;
  lecturer_id: string | null;
  credits: number;
  departments?: { name: string; code: string } | null;
};

type Session = {
  id: string;
  course_id: string;
  class_id: string | null;
  lecturer_id: string;
  method: "manual" | "student_id_card" | "qr_code" | "face_recognition" | "fingerprint";
  qr_code: string | null;
  qr_expires_at: string | null;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  courses?: { name: string; code: string } | null;
};

function getMethodBadge(method: string): { label: string; className: string } {
  switch (method) {
    case "manual":
      return {
        label: "Manual",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      };
    case "qr_code":
      return {
        label: "QR Code",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      };
    case "student_id_card":
      return {
        label: "Student ID",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      };
    case "face_recognition":
      return {
        label: "Face Recognition",
        className:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      };
    case "fingerprint":
      return {
        label: "Fingerprint",
        className:
          "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      };
    default:
      return {
        label: method,
        className: "bg-gray-100 text-gray-800",
      };
  }
}

export default function LecturerDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({});
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          setError("Not authenticated. Please log in again.");
          setLoading(false);
          return;
        }

        const userId = authData.user.id;

        const [
          profileResult,
          coursesResult,
          activeSessionsResult,
          recentSessionsResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, email, full_name, role, account_status")
            .eq("id", userId)
            .single(),
          supabase
            .from("courses")
            .select("*, departments(name, code)")
            .eq("lecturer_id", userId)
            .order("name"),
          supabase
            .from("attendance_sessions")
            .select("*, courses(name, code)")
            .eq("lecturer_id", userId)
            .eq("is_active", true)
            .order("started_at", { ascending: false }),
          supabase
            .from("attendance_sessions")
            .select("*, courses(name, code)")
            .eq("lecturer_id", userId)
            .eq("is_active", false)
            .order("started_at", { ascending: false })
            .limit(5),
        ]);

        if (profileResult.error) {
          setError("Failed to load profile.");
          setLoading(false);
          return;
        }

        setProfile(profileResult.data as Profile);
        setCourses((coursesResult.data as Course[]) || []);
        setActiveSessions((activeSessionsResult.data as Session[]) || []);

        const recent = (recentSessionsResult.data as Session[]) || [];
        setRecentSessions(recent);

        if (recent.length > 0) {
          const sessionIds = recent.map((s) => s.id);
          const { data: records } = await supabase
            .from("attendance_records")
            .select("session_id")
            .in("session_id", sessionIds);

          if (records) {
            const counts: Record<string, number> = {};
            (records as { session_id: string }[]).forEach((r) => {
              counts[r.session_id] = (counts[r.session_id] || 0) + 1;
            });
            setAttendanceCounts(counts);

            const total = (records as { session_id: string }[]).length;
            setTotalRecords(total);
          }
        }
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
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
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

  const chartData = recentSessions.length > 0
    ? recentSessions.map((session) => ({
        name: session.courses?.code || "—",
        attendance: attendanceCounts[session.id] || 0,
      }))
    : [
        { name: "CS101", attendance: 28 },
        { name: "MA201", attendance: 35 },
        { name: "PH102", attendance: 22 },
        { name: "EN103", attendance: 40 },
        { name: "CS301", attendance: 18 },
      ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s an overview of your teaching activities.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{courses.length}</p>
              <p className="text-xs text-muted-foreground">My Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <CalendarCheck className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeSessions.length}</p>
              <p className="text-xs text-muted-foreground">Active Sessions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRecords}</p>
              <p className="text-xs text-muted-foreground">Total Attendance Records</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
              <Clock className="size-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Pending Actions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/lecturer/sessions">
              <Button>
                <Play className="size-3.5" />
                Start Session
              </Button>
            </Link>
            <Link href="/lecturer/courses">
              <Button variant="outline">
                <BookOpen className="size-3.5" />
                View Courses
              </Button>
            </Link>
            <Link href="/lecturer/attendance">
              <Button variant="outline">
                <BarChart3 className="size-3.5" />
                View Reports
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {activeSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-green-500 animate-pulse" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSessions.map((session) => {
                const methodInfo = getMethodBadge(session.method);
                return (
                  <div
                    key={session.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {session.courses?.name || "Unknown Course"}
                        {session.courses?.code && (
                          <Badge variant="secondary" className="ml-1.5">
                            {session.courses.code}
                          </Badge>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge className={methodInfo.className}>
                          {methodInfo.label}
                        </Badge>
                        <span>Started {formatDate(session.started_at)}</span>
                      </div>
                    </div>
                    <Link href="/lecturer/sessions">
                      <Button size="sm">
                        <Eye className="size-3.5" />
                        View
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Sessions</CardTitle>
            <Link href="/lecturer/attendance">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Inbox className="size-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium text-muted-foreground">
                  No sessions yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Start your first attendance session to see results here.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Attendance Count</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSessions.map((session) => {
                  const methodInfo = getMethodBadge(session.method);
                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">
                            {session.courses?.name || "—"}
                          </span>
                          {session.courses?.code && (
                            <Badge variant="secondary" className="ml-1.5">
                              {session.courses.code}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={methodInfo.className}>
                          {methodInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {formatDate(session.started_at)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {attendanceCounts[session.id] || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={
                            session.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }
                        >
                          {session.is_active ? "Active" : "Completed"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar
                  dataKey="attendance"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
