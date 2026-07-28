"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, getStatusColor, calculateAttendancePercentage } from "@/lib/utils";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(profileData);

      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("*, courses(*)")
        .eq("student_id", user.id);
      setEnrolledCourses(enrollments || []);

      const { data: records } = await supabase
        .from("attendance_records")
        .select("*, attendance_sessions(*, courses(*))")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setRecentRecords(records || []);

      const total = (records || []).length;
      const present = (records || []).filter((r: any) => r.status === "present").length;
      const absent = (records || []).filter((r: any) => r.status === "absent").length;
      const late = (records || []).filter((r: any) => r.status === "late").length;
      setStats({ total, present, absent, late });

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      setChartData(months.map((m) => ({ name: m, attendance: Math.floor(Math.random() * 30) + 10 })));

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const attendancePct = calculateAttendancePercentage(stats.present, stats.total);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {profile?.full_name?.split(" ")[0]}!</h1>
          <p className="text-sm text-muted-foreground">Student ID: {profile?.student_id || "Not assigned"}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/student/attendance"><Button variant="outline">View Attendance</Button></Link>
          <Link href="/student/courses"><Button>My Courses</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Attendance</p>
          <p className={`text-2xl font-bold ${attendancePct >= 80 ? "text-green-600" : attendancePct >= 60 ? "text-yellow-600" : "text-red-600"}`}>{attendancePct}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total Sessions</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Present</p>
          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Absent</p>
          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Attendance Progress</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Attendance</span>
              <span className="font-semibold">{attendancePct}%</span>
            </div>
            <Progress value={attendancePct} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>My Courses</CardTitle></CardHeader>
          <CardContent>
            {enrolledCourses.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No courses enrolled.</p>
            ) : (
              <div className="space-y-3">
                {enrolledCourses.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{e.courses?.name}</p>
                      <p className="text-xs text-muted-foreground">{e.courses?.code}</p>
                    </div>
                    <Badge variant="outline">{e.courses?.credits} credits</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Attendance Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="attendance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Marked At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRecords.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No attendance records yet.</TableCell></TableRow>
              ) : (
                recentRecords.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.attendance_sessions?.courses?.name || "N/A"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(r.attendance_sessions?.started_at)}</TableCell>
                    <TableCell><Badge className={getStatusColor(r.status)}>{r.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(r.marked_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
