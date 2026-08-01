"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, getStatusColor } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Search, CheckCheck, ClipboardList, UserX } from "lucide-react";

type Status = "present" | "absent" | "late" | "excused";

const STATUSES: { value: Status; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "excused", label: "Excused" },
];

type EnrolledStudent = {
  id: string;
  full_name: string;
  student_id: string | null;
  status: Status | null;
};

export default function LecturerMarkAttendancePage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  const loadSessions = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data } = await supabase
      .from("attendance_sessions")
      .select("*, courses(name, code)")
      .eq("lecturer_id", user.id)
      .eq("is_active", true)
      .order("started_at", { ascending: false });
    const list = data || [];
    const requested = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("session") : null;
    setSessions(list);
    if (list.length > 0) {
      const target = requested && list.some((s) => s.id === requested) ? requested : list[0].id;
      setSelectedSessionId(target);
    } else {
      setSelectedSessionId("");
    }
    setLoading(false);
  }, []);

  const loadStudents = useCallback(async () => {
    if (!selectedSessionId) {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    const supabase = createClient();

    const [{ data: enrollments }, { data: records }] = await Promise.all([
      supabase
        .from("course_enrollments")
        .select("student_id, profiles!course_enrollments_student_id_fkey(id, full_name, student_id)")
        .eq("course_id", selectedSession.course_id),
      supabase
        .from("attendance_records")
        .select("student_id, status")
        .eq("session_id", selectedSessionId),
    ]);

    const recordMap = new Map<string, Status>();
    (records || []).forEach((r) => recordMap.set(r.student_id, r.status));

    const list: EnrolledStudent[] = (enrollments || [])
      .map((e) => {
        const p = e.profiles;
        return {
          id: p?.id || e.student_id,
          full_name: p?.full_name || "Unknown",
          student_id: p?.student_id ?? null,
          status: recordMap.get(e.student_id) || null,
        };
      })
      .filter((s) => s.id);
    setStudents(list);
    setLoadingStudents(false);
  }, [selectedSessionId, selectedSession?.course_id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (userId) loadStudents();
  }, [selectedSessionId, userId, loadStudents]);

  async function setStatus(studentId: string, status: Status) {
    if (!selectedSessionId) return;
    setSavingId(studentId);
    const supabase = createClient();
    const { error } = await supabase.from("attendance_records").upsert(
      {
        session_id: selectedSessionId,
        student_id: studentId,
        status,
        marked_at: new Date().toISOString(),
        marked_by: userId,
      },
      { onConflict: "session_id,student_id" }
    );
    setSavingId(null);
    if (error) {
      toast.error("Failed to mark attendance: " + error.message);
      return;
    }
    toast.success(`Marked ${status}`);
    loadStudents();
  }

  async function markAllPresent() {
    if (!selectedSessionId || students.length === 0) return;
    setMarkingAll(true);
    const supabase = createClient();
    const unmarked = students.filter((s) => !s.status);
    const { error } = await supabase.from("attendance_records").upsert(
      unmarked.map((s) => ({
        session_id: selectedSessionId,
        student_id: s.id,
        status: "present" as Status,
        marked_at: new Date().toISOString(),
        marked_by: userId,
      })),
      { onConflict: "session_id,student_id" }
    );
    setMarkingAll(false);
    if (error) {
      toast.error("Failed to mark all present: " + error.message);
      return;
    }
    toast.success(`Marked ${unmarked.length} students present`);
    loadStudents();
  }

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.full_name.toLowerCase().includes(q) ||
      (s.student_id || "").toLowerCase().includes(q)
    );
  });

  const markedCount = students.filter((s) => s.status).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mark Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Manually record attendance for your active sessions.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/lecturer/sessions")}>
          Manage Sessions
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="border-dashed py-12 text-center">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <ClipboardList className="size-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">No active sessions</h3>
              <p className="max-w-sm text-xs text-muted-foreground mt-1">
                Start a session from the Sessions page before marking attendance.
              </p>
            </div>
            <Button onClick={() => router.push("/lecturer/sessions")}>Start a Session</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Active Session</label>
                  <Select value={selectedSessionId} onValueChange={(v) => setSelectedSessionId(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an active session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.courses?.name || "Unassigned"} ({s.courses?.code || "N/A"}) · {formatDateTime(s.started_at)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={markAllPresent}
                    disabled={markingAll || !selectedSession || students.length === 0}
                  >
                    {markingAll ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCheck className="mr-2 size-4" />}
                    Mark All Present
                  </Button>
                </div>
              </div>

              {selectedSession && (
                <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-sm">
                  <Badge variant="secondary">{selectedSession.courses?.name}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {selectedSession.method.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-muted-foreground">Started {formatDateTime(selectedSession.started_at)}</span>
                  <span className="ml-auto font-medium">
                    {markedCount}/{students.length} marked
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Enrolled Students</CardTitle>
                  <CardDescription>
                    Students enrolled in {selectedSession?.courses?.name || "this course"}.
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search student..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-full pl-8 sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingStudents ? (
                <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-sm">Loading students...</span>
                </div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <UserX className="size-10 text-muted-foreground/50" />
                  <div>
                    <p className="font-medium text-muted-foreground">No enrolled students found</p>
                    <p className="max-w-xs text-xs text-muted-foreground mt-1">
                      No students are enrolled in this course yet. Enroll students from the admin dashboard.
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Registration No.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                          No students match your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {student.student_id || "—"}
                          </TableCell>
                          <TableCell>
                            {student.status ? (
                              <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
                            ) : (
                              <Badge variant="outline">Unmarked</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              {STATUSES.map((s) => (
                                <Button
                                  key={s.value}
                                  size="sm"
                                  variant={student.status === s.value ? "secondary" : "outline"}
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setStatus(student.id, s.value)}
                                  disabled={savingId === student.id}
                                >
                                  {savingId === student.id ? <Loader2 className="size-3 animate-spin" /> : s.label}
                                </Button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
