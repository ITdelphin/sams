"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatDate, calculateAttendancePercentage } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Inbox,
  Percent,
} from "lucide-react";

type AttendanceRecord = {
  id: string;
  session_id: string;
  student_id: string;
  status: "present" | "absent" | "late" | "excused";
  marked_at: string;
  marked_by: string | null;
  notes: string | null;
  created_at: string;
  attendance_sessions?: {
    id: string;
    started_at: string;
    courses?: { name: string; code: string } | null;
  } | null;
};

function getStatusBadge(status: string): { label: string; className: string; icon: React.ReactNode } {
  switch (status) {
    case "present":
      return {
        label: "Present",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        icon: <CheckCircle className="size-3" />,
      };
    case "absent":
      return {
        label: "Absent",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        icon: <XCircle className="size-3" />,
      };
    case "late":
      return {
        label: "Late",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        icon: <Clock className="size-3" />,
      };
    case "excused":
      return {
        label: "Excused",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        icon: <AlertCircle className="size-3" />,
      };
    default:
      return {
        label: status,
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        icon: null,
      };
  }
}

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        toast.error("Not authenticated. Please log in again.");
        setLoading(false);
        return;
      }

      const studentId = authData.user.id;

      const { data: recordData, error: recordError } = await supabase
        .from("attendance_records")
        .select("*, attendance_sessions(id, started_at, courses(name, code))")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (recordError) {
        toast.error("Failed to load attendance records");
        setLoading(false);
        return;
      }

      const allRecords = (recordData as AttendanceRecord[]) || [];
      setRecords(allRecords);

      const courseMap = new Map<string, { id: string; name: string; code: string }>();
      allRecords.forEach((r) => {
        const course = r.attendance_sessions?.courses;
        if (course) {
          const session = r.attendance_sessions;
          if (session) {
            courseMap.set(session.id, {
              id: session.id,
              name: course.name,
              code: course.code,
            });
          }
        }
      });

      const uniqueCourses = Array.from(courseMap.values());
      setCourses(uniqueCourses);
      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const late = records.filter((r) => r.status === "late").length;
    const excused = records.filter((r) => r.status === "excused").length;
    const attendancePercent = calculateAttendancePercentage(present + late, total);
    return { total, present, absent, late, excused, attendancePercent };
  }, [records]);

  const filteredRecords = useMemo(() => {
    let result = records;

    if (courseFilter !== "all") {
      result = result.filter((r) => r.attendance_sessions?.id === courseFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.attendance_sessions?.courses?.name?.toLowerCase().includes(query) ||
          r.attendance_sessions?.courses?.code?.toLowerCase().includes(query) ||
          r.notes?.toLowerCase().includes(query) ||
          r.status.toLowerCase().includes(query)
      );
    }

    return result;
  }, [records, courseFilter, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading attendance records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Track your attendance across all enrolled courses.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CalendarCheck className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Sessions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
              <XCircle className="size-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
              <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <AlertCircle className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.excused}</p>
              <p className="text-xs text-muted-foreground">Excused</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Percent className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.attendancePercent}%</p>
              <p className="text-xs text-muted-foreground">Attendance %</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Attendance Records</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={courseFilter} onValueChange={(v) => setCourseFilter(v ?? "all")}>
                <SelectTrigger className="h-8 w-full sm:w-48">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
                <SelectTrigger className="h-8 w-full sm:w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full pl-8 sm:w-56"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Inbox className="size-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium text-muted-foreground">No records found</p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery || courseFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No attendance records have been marked yet"}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="hidden sm:table-cell">Session Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Marked At</TableHead>
                  <TableHead className="hidden lg:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => {
                  const statusInfo = getStatusBadge(record.status);
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">
                            {record.attendance_sessions?.courses?.name || "—"}
                          </span>
                          {record.attendance_sessions?.courses?.code && (
                            <Badge variant="secondary" className="ml-1.5">
                              {record.attendance_sessions.courses.code}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {record.attendance_sessions?.started_at
                          ? formatDate(record.attendance_sessions.started_at)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.className}>
                          <span className="flex items-center gap-1">
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {record.marked_at ? formatDate(record.marked_at) : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                        {record.notes || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
