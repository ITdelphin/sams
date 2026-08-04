"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatDate, getStatusColor, calculateAttendancePercentage } from "@/lib/utils";
import { toast } from "sonner";
import { exportAttendancePDF, exportAttendanceExcel } from "@/lib/reports";

type Course = {
  id: string;
  name: string;
  code: string;
};

type AttendanceRecord = {
  id: string;
  status: string;
  marked_at: string;
  profiles: {
    full_name: string;
    student_id: string | null;
  } | null;
  attendance_sessions: {
    started_at: string;
    courses: {
      name: string;
      code: string;
    } | null;
  } | null;
};

export default function LecturerAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myCourses } = await supabase.from("courses").select("id, name, code").eq("lecturer_id", user.id);
      setCourses(myCourses || []);

      const courseIds = (myCourses || []).map((c) => c.id);
      if (courseIds.length === 0) { setLoading(false); return; }

      const { data: sessions } = await supabase
        .from("attendance_sessions")
        .select("id, course_id, started_at, courses(name, code)")
        .in("course_id", courseIds);

      const sessionIds = (sessions || []).map((s) => s.id);
      if (sessionIds.length === 0) { setLoading(false); return; }

      const { data: recs } = await supabase
        .from("attendance_records")
        .select("*, attendance_sessions(started_at, courses(name, code)), profiles!attendance_records_student_id_fkey(full_name, student_id)")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: false });

      setRecords((recs as unknown as AttendanceRecord[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter((r) => {
      const studentName = r.profiles?.full_name?.toLowerCase() || "";
      const courseName = r.attendance_sessions?.courses?.name?.toLowerCase() || "";
      const matchesSearch = !q || studentName.includes(q) || courseName.includes(q);
      const matchesCourse = filterCourse === "all" || r.attendance_sessions?.courses?.code === filterCourse;
      const matchesStatus = filterStatus === "all" || r.status === filterStatus;
      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [records, search, filterCourse, filterStatus]);

  const totalPresent = records.filter((r) => r.status === "present").length;
  const totalAbsent = records.filter((r) => r.status === "absent").length;
  const avgAttendance = calculateAttendancePercentage(totalPresent, records.length);

  const handleExportPDF = () => {
    if (filtered.length === 0) {
      toast.error("No records found to export.");
      return;
    }
    const reportData = filtered.map((r) => ({
      studentName: r.profiles?.full_name || "N/A",
      studentId: r.profiles?.student_id || "N/A",
      courseName: r.attendance_sessions?.courses?.name || "N/A",
      courseCode: r.attendance_sessions?.courses?.code || "N/A",
      status: r.status,
      sessionDate: formatDate(r.attendance_sessions?.started_at || ""),
      markedAt: formatDate(r.marked_at),
    }));
    exportAttendancePDF(reportData, "Lecturer Attendance Report");
    toast.success("Attendance PDF generated successfully!");
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      toast.error("No records found to export.");
      return;
    }
    const reportData = filtered.map((r) => ({
      studentName: r.profiles?.full_name || "N/A",
      studentId: r.profiles?.student_id || "N/A",
      courseName: r.attendance_sessions?.courses?.name || "N/A",
      courseCode: r.attendance_sessions?.courses?.code || "N/A",
      status: r.status,
      sessionDate: formatDate(r.attendance_sessions?.started_at || ""),
      markedAt: formatDate(r.marked_at),
    }));
    exportAttendanceExcel(reportData, "Lecturer Attendance Report");
    toast.success("Attendance Excel generated successfully!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Attendance Records</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Records</p><p className="text-2xl font-bold text-blue-600">{records.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Present</p><p className="text-2xl font-bold text-green-600">{totalPresent}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Absent</p><p className="text-2xl font-bold text-red-600">{totalAbsent}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg Attendance</p><p className="text-2xl font-bold text-primary">{avgAttendance}%</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-4">
        <Input placeholder="Search student or course..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filterCourse} onValueChange={(v) => setFilterCourse(v ?? "")}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All courses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.code}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "")}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="excused">Excused</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExportPDF}>Export PDF</Button>
        <Button variant="outline" onClick={handleExportExcel}>Export Excel</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Marked At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No records found.</TableCell></TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.profiles?.full_name || "N/A"}</TableCell>
                    <TableCell>{r.attendance_sessions?.courses?.name || "N/A"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(r.attendance_sessions?.started_at || "")}</TableCell>
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
