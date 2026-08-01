"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime, getStatusColor } from "@/lib/utils";

interface Faculty {
  id: string;
  name: string;
  code: string;
  department_count?: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
  faculty_id: string | null;
  course_count?: number;
}

interface Course {
  id: string;
  name: string;
  code: string;
  department_id: string;
  lecturer_id: string | null;
  credits: number;
  session_count?: number;
  profiles?: { full_name: string } | null;
}

interface Session {
  id: string;
  course_id: string;
  lecturer_id: string;
  method: string;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
  attendance_count?: number;
  profiles?: { full_name: string } | null;
}

interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: string;
  marked_at: string;
  notes: string | null;
  profiles?: { full_name: string; student_id: string | null } | null;
}

type ViewLevel = "faculties" | "departments" | "courses" | "sessions" | "records";

export default function AdminAttendancePage() {
  const [view, setView] = useState<ViewLevel>("faculties");
  const [search, setSearch] = useState("");

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const [loading, setLoading] = useState(true);

  const loadFaculties = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: facs } = await supabase.from("faculties").select("*").order("name");

    const facultiesWithCounts = await Promise.all(
      (facs || []).map(async (f) => {
        const { count } = await supabase
          .from("departments")
          .select("id", { count: "exact", head: true })
          .eq("faculty_id", f.id);
        return { ...f, department_count: count || 0 };
      })
    );

    setFaculties(facultiesWithCounts);
    setLoading(false);
  };

  useEffect(() => {
    loadFaculties();
  }, []);

  async function loadDepartments(faculty: Faculty) {
    setLoading(true);
    setSelectedFaculty(faculty);
    setSearch("");
    const supabase = createClient();
    const { data: depts } = await supabase
      .from("departments")
      .select("*")
      .eq("faculty_id", faculty.id)
      .order("name");

    const deptsWithCounts = await Promise.all(
      (depts || []).map(async (d) => {
        const { count } = await supabase
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("department_id", d.id);
        return { ...d, course_count: count || 0 };
      })
    );

    setDepartments(deptsWithCounts);
    setView("departments");
    setLoading(false);
  }

  async function loadCourses(department: Department) {
    setLoading(true);
    setSelectedDepartment(department);
    setSearch("");
    const supabase = createClient();
    const { data: coursesData } = await supabase
      .from("courses")
      .select("*, profiles!courses_lecturer_id_fkey(full_name)")
      .eq("department_id", department.id)
      .order("name");

    const coursesWithCounts = await Promise.all(
      (coursesData || []).map(async (c) => {
        const { count } = await supabase
          .from("attendance_sessions")
          .select("id", { count: "exact", head: true })
          .eq("course_id", c.id);
        return { ...c, session_count: count || 0 };
      })
    );

    setCourses(coursesWithCounts);
    setView("courses");
    setLoading(false);
  }

  async function loadSessions(course: Course) {
    setLoading(true);
    setSelectedCourse(course);
    setSearch("");
    const supabase = createClient();
    const { data: sessionsData } = await supabase
      .from("attendance_sessions")
      .select("*, profiles!attendance_sessions_lecturer_id_fkey(full_name)")
      .eq("course_id", course.id)
      .order("started_at", { ascending: false });

    const sessionsWithCounts = await Promise.all(
      (sessionsData || []).map(async (s) => {
        const { count } = await supabase
          .from("attendance_records")
          .select("id", { count: "exact", head: true })
          .eq("session_id", s.id);
        return { ...s, attendance_count: count || 0 };
      })
    );

    setSessions(sessionsWithCounts);
    setView("sessions");
    setLoading(false);
  }

  async function loadRecords(session: Session) {
    setLoading(true);
    setSelectedSession(session);
    setSearch("");
    const supabase = createClient();
    const { data } = await supabase
      .from("attendance_records")
      .select("*, profiles!attendance_records_student_id_fkey(full_name, student_id)")
      .eq("session_id", session.id)
      .order("created_at", { ascending: false });

    setRecords(data || []);
    setView("records");
    setLoading(false);
  }

  function goBack() {
    setSearch("");
    switch (view) {
      case "departments":
        setView("faculties");
        setSelectedFaculty(null);
        break;
      case "courses":
        setView("departments");
        setSelectedDepartment(null);
        break;
      case "sessions":
        setView("courses");
        setSelectedCourse(null);
        break;
      case "records":
        setView("sessions");
        setSelectedSession(null);
        break;
    }
  }

  function getMethodBadge(method: string) {
    const map: Record<string, { label: string; className: string }> = {
      manual: { label: "Manual", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
      qr_code: { label: "QR Code", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
      student_id_card: { label: "ID Card", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
      face_recognition: { label: "Face Recognition", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
      fingerprint: { label: "Fingerprint", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
    };
    return map[method] || { label: method, className: "" };
  }

  const breadcrumbs: { label: string; onClick?: () => void }[] = [
    selectedFaculty && { label: selectedFaculty.name, onClick: () => { setView("departments"); setSearch(""); } },
    selectedDepartment && { label: selectedDepartment.name, onClick: () => { setView("courses"); setSearch(""); } },
    selectedCourse && { label: selectedCourse.name, onClick: () => { setView("sessions"); setSearch(""); } },
    selectedSession && { label: `Session - ${formatDate(selectedSession.started_at)}` },
  ].filter((b): b is { label: string; onClick?: () => void } => Boolean(b));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <button onClick={goBack} className="hover:text-primary">Back</button>
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span>/</span>
                  {i < breadcrumbs.length - 1 ? (
                    <button onClick={() => b.onClick?.()} className="hover:text-primary">{b.label}</button>
                  ) : (
                    <span className="text-foreground font-medium">{b.label}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
        {view !== "faculties" && (
          <Button variant="outline" onClick={goBack}>Back</Button>
        )}
      </div>

      <Input
        placeholder={`Search ${view}...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {view === "faculties" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {faculties
                .filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.code.toLowerCase().includes(search.toLowerCase()))
                .map((faculty) => (
                  <Card
                    key={faculty.id}
                    className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                    onClick={() => loadDepartments(faculty)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{faculty.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">{faculty.code}</Badge>
                        </div>
                        <Badge>{faculty.department_count} depts</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Click to view departments and courses
                      </p>
                    </CardContent>
                  </Card>
                ))}
              {faculties.filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                <Card><CardContent className="py-8 text-center text-muted-foreground col-span-full">No faculties found.</CardContent></Card>
              )}
            </div>
          )}

          {view === "departments" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {departments
                .filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase()))
                .map((dept) => (
                  <Card
                    key={dept.id}
                    className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                    onClick={() => loadCourses(dept)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{dept.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">{dept.code}</Badge>
                        </div>
                        <Badge>{dept.course_count} courses</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Click to view courses and attendance
                      </p>
                    </CardContent>
                  </Card>
                ))}
              {departments.filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                <Card><CardContent className="py-8 text-center text-muted-foreground col-span-full">No departments found in this faculty.</CardContent></Card>
              )}
            </div>
          )}

          {view === "courses" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses
                .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
                .map((course) => (
                  <Card
                    key={course.id}
                    className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                    onClick={() => loadSessions(course)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{course.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">{course.code}</Badge>
                        </div>
                        <Badge>{course.credits} cr</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Lecturer: {(course as any).profiles?.full_name || "Not assigned"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{course.session_count} sessions</span>
                        <span className="text-xs text-muted-foreground">Click to view</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              {courses.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                <Card><CardContent className="py-8 text-center text-muted-foreground col-span-full">No courses found in this department.</CardContent></Card>
              )}
            </div>
          )}

          {view === "sessions" && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lecturer</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Ended</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions
                      .filter((s) => {
                        if (!search) return true;
                        const q = search.toLowerCase();
                        const method = getMethodBadge(s.method);
                        return method.label.toLowerCase().includes(q) ||
                          (s as any).profiles?.full_name?.toLowerCase().includes(q);
                      })
                      .map((session) => {
                        const method = getMethodBadge(session.method);
                        return (
                          <TableRow key={session.id}>
                            <TableCell className="font-medium">{(session as any).profiles?.full_name || "N/A"}</TableCell>
                            <TableCell><Badge className={method.className}>{method.label}</Badge></TableCell>
                            <TableCell className="text-sm">{formatDateTime(session.started_at)}</TableCell>
                            <TableCell className="text-sm">{session.ended_at ? formatDateTime(session.ended_at) : "-"}</TableCell>
                            <TableCell>
                              <Badge className={session.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                {session.is_active ? "Active" : "Completed"}
                              </Badge>
                            </TableCell>
                            <TableCell>{session.attendance_count}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => loadRecords(session)}>
                                View Records
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {sessions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                          No attendance sessions found for this course.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {view === "records" && (
            <div className="space-y-4">
              {selectedSession && (
                <Card>
                  <CardContent className="py-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Course</p>
                        <p className="font-medium">{selectedCourse?.name}</p>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div>
                        <p className="text-sm text-muted-foreground">Method</p>
                        <Badge className={getMethodBadge(selectedSession.method).className}>
                          {getMethodBadge(selectedSession.method).label}
                        </Badge>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={selectedSession.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {selectedSession.is_active ? "Active" : "Completed"}
                        </Badge>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Records</p>
                        <p className="font-medium">{records.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Marked At</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records
                        .filter((r) => {
                          if (!search) return true;
                          const q = search.toLowerCase();
                          const name = (r as any).profiles?.full_name?.toLowerCase() || "";
                          const roll = (r as any).profiles?.student_id?.toLowerCase() || "";
                          return name.includes(q) || roll.includes(q) || r.status.includes(q);
                        })
                        .map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{(record as any).profiles?.full_name || "N/A"}</TableCell>
                            <TableCell>{(record as any).profiles?.student_id || "-"}</TableCell>
                            <TableCell><Badge className={getStatusColor(record.status)}>{record.status}</Badge></TableCell>
                            <TableCell className="text-sm">{formatDateTime(record.marked_at)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{record.notes || "-"}</TableCell>
                          </TableRow>
                        ))}
                      {records.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                            No attendance records for this session.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
