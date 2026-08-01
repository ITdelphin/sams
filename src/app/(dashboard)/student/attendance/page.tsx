"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  QrCode,
  ScanFace,
  Fingerprint,
  CreditCard,
  Sparkles,
  History,
  Check,
  CheckCircle2,
  Play,
  RotateCw,
  Camera,
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

type ActiveSession = {
  id: string;
  course_id: string;
  class_id: string | null;
  lecturer_id: string;
  method: "manual" | "student_id_card" | "qr_code" | "face_recognition" | "fingerprint";
  qr_code: string | null;
  qr_expires_at: string | null;
  started_at: string;
  courses?: {
    name: string;
    code: string;
    profiles?: {
      full_name: string;
    } | null;
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
  const [activeTab, setActiveTab] = useState<"history" | "mark">("history");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentId, setStudentId] = useState<string>("");
  const [showDebugSessions, setShowDebugSessions] = useState(false);

  // Verification state
  const [selectedSessionInput, setSelectedSessionInput] = useState<ActiveSession | null>(null);
  const [qrToken, setQrToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<"idle" | "scanning" | "matched" | "success">("idle");

  // Camera scanner state
  const scannerInstanceRef = useRef<any>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState("");

  async function stopScanner() {
    setScannerActive(false);
    setScannerError("");
    if (scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.stop();
      } catch {
        // already stopped
      }
      try {
        scannerInstanceRef.current.clear();
      } catch {
        // already cleared
      }
      scannerInstanceRef.current = null;
    }
  }

  async function startScanner() {
    setScannerActive(true);
    setScannerError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerInstanceRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          stopScanner();
          setQrToken(decodedText);
          performCheckIn(decodedText);
        },
        () => {
          // ignore per-frame failures
        }
      );
    } catch (e: any) {
      setScannerActive(false);
      scannerInstanceRef.current = null;
      setScannerError(
        e?.message && e.message.includes("Permission")
          ? "Camera permission denied. Please allow camera access or paste the QR string instead."
          : "Could not start the camera. Please paste the QR string instead."
      );
    }
  }

  const supabase = createClient();

  // Listen to tab query param
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "mark") {
        setActiveTab("mark");
      }
    }
  }, []);

  async function loadRecords() {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return;
    const uid = authData.user.id;
    setStudentId(uid);

    const { data: recordData } = await supabase
      .from("attendance_records")
      .select("*, attendance_sessions(id, started_at, courses(name, code))")
      .eq("student_id", uid)
      .order("created_at", { ascending: false });

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
    setCourses(Array.from(courseMap.values()));
  }

  async function loadActiveSessions() {
    if (!studentId) return;
    setLoadingSessions(true);

    try {
      // 1. Fetch student's course enrollments
      const { data: enrollmentData } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("student_id", studentId);
      const enrolledCourseIds = (enrollmentData || []).map((e) => e.course_id);

      // 2. Fetch active attendance sessions
      let query = supabase
        .from("attendance_sessions")
        .select("*, courses(name, code, profiles!courses_lecturer_id_fkey(full_name))")
        .eq("is_active", true);

      if (enrolledCourseIds.length > 0 && !showDebugSessions) {
        query = query.in("course_id", enrolledCourseIds);
      }

      const { data: sessionsRes } = await query;
      setActiveSessions((sessionsRes as ActiveSession[]) || []);
    } catch (e: any) {
      toast.error("Failed to load active sessions.");
    } finally {
      setLoadingSessions(false);
    }
  }

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadRecords();
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (studentId) {
      loadActiveSessions();
    }
  }, [studentId, showDebugSessions]);

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

  const initiateVerification = (session: ActiveSession) => {
    setSelectedSessionInput(session);
    setQrToken("");
    setVerificationStep("idle");
  };

  const performCheckIn = async (token: string) => {
    if (!selectedSessionInput) {
      toast.error("Please enter the QR String.");
      return;
    }

    const trimmed = token.trim();
    if (!trimmed) {
      toast.error("Please enter the QR String.");
      return;
    }

    setVerifying(true);
    setVerificationStep("scanning");

    const { data: session, error } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("id", selectedSessionInput.id)
      .single();

    if (error || !session) {
      toast.error("Session not found.");
      setVerifying(false);
      setVerificationStep("idle");
      return;
    }

    if (!session.is_active) {
      toast.error("This session is no longer active.");
      setVerifying(false);
      setVerificationStep("idle");
      return;
    }

    // Check expiry
    if (session.qr_expires_at && new Date(session.qr_expires_at).getTime() < Date.now()) {
      toast.error("The QR token has expired. Please ask the lecturer to refresh the code.");
      setVerifying(false);
      setVerificationStep("idle");
      return;
    }

    if (session.qr_code !== trimmed) {
      toast.error("Verification failed. The QR code does not match the active session.");
      setVerifying(false);
      setVerificationStep("idle");
      return;
    }

    // Check existing
    const { data: existing } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("session_id", selectedSessionInput.id)
      .eq("student_id", studentId)
      .maybeSingle();

    if (existing) {
      toast.error("You have already logged attendance for this slot.");
      setVerifying(false);
      setSelectedSessionInput(null);
      return;
    }

    // Insert record
    const { error: insertError } = await supabase.from("attendance_records").insert({
      session_id: selectedSessionInput.id,
      student_id: studentId,
      status: "present",
      marked_at: new Date().toISOString(),
      marked_by: studentId,
      notes: "Checked in via student QR scanner dashboard validation.",
    });

    if (insertError) {
      toast.error("Failed to insert record: " + insertError.message);
      setVerificationStep("idle");
    } else {
      setVerificationStep("success");
      toast.success("Attendance successfully marked!");
      loadRecords();
      loadActiveSessions();
      setTimeout(() => setSelectedSessionInput(null), 1500);
    }
    setVerifying(false);
  };

  const handleMarkQR = async () => {
    await performCheckIn(qrToken);
  };

  const handleMarkBiometric = async () => {
    if (!selectedSessionInput) return;

    setVerifying(true);
    setVerificationStep("scanning");

    // Simulate scanning animation delay
    await new Promise((resolve) => setTimeout(resolve, 1800));

    // Ensure session still active
    const { data: session } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("id", selectedSessionInput.id)
      .single();

    if (!session || !session.is_active) {
      toast.error("This session is no longer active.");
      setVerifying(false);
      setVerificationStep("idle");
      return;
    }

    // Check existing
    const { data: existing } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("session_id", selectedSessionInput.id)
      .eq("student_id", studentId)
      .maybeSingle();

    if (existing) {
      toast.error("Attendance already recorded.");
      setVerifying(false);
      setSelectedSessionInput(null);
      return;
    }

    const verificationMethodName =
      selectedSessionInput.method === "face_recognition"
        ? "Facial Biometrics Scan"
        : selectedSessionInput.method === "fingerprint"
          ? "Fingerprint Biometrics Scan"
          : "NFC Smart ID Verification";

    const { error: insertError } = await supabase.from("attendance_records").insert({
      session_id: selectedSessionInput.id,
      student_id: studentId,
      status: "present",
      marked_at: new Date().toISOString(),
      marked_by: studentId,
      notes: `Verified via simulated ${verificationMethodName}`,
    });

    if (insertError) {
      toast.error("Failed to complete biometrics insert: " + insertError.message);
      setVerificationStep("idle");
    } else {
      setVerificationStep("success");
      toast.success("Identity verified! Present logged.");
      loadRecords();
      loadActiveSessions();
      setTimeout(() => setSelectedSessionInput(null), 1500);
    }

    setVerifying(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-sky-500" />
        <p className="text-sm text-muted-foreground">Loading attendance logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Center</h1>
          <p className="text-sm text-muted-foreground">
            Verify your daily attendance or view your historical checks.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-lg border bg-card p-1">
          <Button
            variant={activeTab === "history" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("history")}
            className="flex items-center gap-2"
          >
            <History className="size-4" />
            My History
          </Button>
          <Button
            variant={activeTab === "mark" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("mark")}
            className="flex items-center gap-2"
          >
            <Play className="size-4 animate-pulse text-sky-500" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {activeTab === "history" ? (
        <>
          {/* Stats Summary Area */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <CalendarCheck className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Logs</p>
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
                <CardTitle>Attendance History</CardTitle>
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
                          <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[250px] truncate">
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
        </>
      ) : (
        /* Mark Core Attendance Tab */
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Subscribed Active Sessions</h2>
              <p className="text-xs text-muted-foreground">
                Sessions started by your lecturers matching your enrolled courses.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Debug Mode:</span>
              <Button
                variant={showDebugSessions ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowDebugSessions(!showDebugSessions)}
                className="h-8"
              >
                {showDebugSessions ? "Show My Courses" : "Show All Active"}
              </Button>
              <Button size="icon" variant="outline" onClick={loadActiveSessions} disabled={loadingSessions} className="size-8">
                <RotateCw className={`size-3.5 ${loadingSessions ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {loadingSessions ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <Loader2 className="size-6 animate-spin text-sky-500" />
              <p className="text-xs text-muted-foreground">Scanning classes database...</p>
            </div>
          ) : activeSessions.length === 0 ? (
            <Card className="border-dashed py-12 text-center">
              <CardContent className="flex flex-col items-center justify-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <CalendarCheck className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">No active sessions found</h3>
                  <p className="max-w-xs text-xs text-muted-foreground mt-1">
                    Ask your lecturer to start an attendance session for your course to check in here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {activeSessions.map((session) => {
                const isQR = session.method === "qr_code";
                const isFace = session.method === "face_recognition";
                const isFinger = session.method === "fingerprint";
                const isCard = session.method === "student_id_card";

                return (
                  <Card key={session.id} className="border-sky-500/10 hover:border-sky-500/30 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-start justify-between pb-3">
                      <div>
                        <Badge className="bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 mb-1 border-none capitalize">
                          {session.method.replace(/_/g, " ")}
                        </Badge>
                        <CardTitle className="text-base font-bold text-foreground">
                          {session.courses?.name || "Unassigned Course"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {session.courses?.code || "N/A"} · {session.courses?.profiles?.full_name || "Lecturer"}
                        </CardDescription>
                      </div>
                      <div className="flex size-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600">
                        {isQR && <QrCode className="size-5" />}
                        {isFace && <ScanFace className="size-5" />}
                        {isFinger && <Fingerprint className="size-5" />}
                        {isCard && <CreditCard className="size-5" />}
                        {session.method === "manual" && <Sparkles className="size-5" />}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Started: {formatDate(session.started_at)}</p>
                        {isQR && session.qr_expires_at && (
                          <p className="text-amber-600 flex items-center gap-1">
                            <Clock className="size-3" />
                            Expiry Window Configured
                          </p>
                        )}
                      </div>
                      <Button
                        className="w-full bg-sky-500 hover:bg-sky-600 text-white"
                        onClick={() => initiateVerification(session)}
                      >
                        Launch Verification
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Interactive Modal dialog simulator */}
          <Dialog open={!!selectedSessionInput} onOpenChange={() => { stopScanner(); setSelectedSessionInput(null); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="size-5 text-sky-500" />
                  Authenticate Attendance
                </DialogTitle>
                <DialogDescription>
                  Verify check-in requirements for {selectedSessionInput?.courses?.name}.
                </DialogDescription>
              </DialogHeader>

              {selectedSessionInput?.method === "qr_code" ? (
                /* QR validation flow */
                <div className="space-y-4 py-2">
                  <div className="flex flex-col items-center justify-center rounded-lg border bg-slate-50 dark:bg-slate-900/60 p-6 text-center">
                    <QrCode className="size-12 text-sky-500 mb-2 animate-pulse" />
                    <p className="text-xs font-semibold text-foreground">Interactive QR Scanning Feed</p>
                    <p className="text-[10px] text-muted-foreground max-w-[220px] mt-1">
                      Scan the dynamic token QR on your lecturer&apos;s screen, or paste it below.
                    </p>
                  </div>

                  {!scannerActive && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={startScanner}
                      disabled={verifying}
                    >
                      <Camera className="size-4 mr-2" />
                      Scan with Camera
                    </Button>
                  )}

                  {scannerActive && (
                    <div className="space-y-2">
                      <div
                        ref={scannerRef}
                        id="qr-reader"
                        className="overflow-hidden rounded-lg border [&_video]:w-full"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-xs"
                        onClick={stopScanner}
                        disabled={verifying}
                      >
                        Cancel Camera
                      </Button>
                    </div>
                  )}

                  {scannerError && (
                    <p className="text-xs text-red-500 text-center">{scannerError}</p>
                  )}

                  <div className="space-y-2">
                    <Input
                      placeholder="Paste QR Code String (e.g. SAMS_xxxxxx)"
                      value={qrToken}
                      onChange={(e) => setQrToken(e.target.value)}
                      disabled={verifying}
                      className="text-center font-mono text-xs uppercase"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" onClick={() => setSelectedSessionInput(null)} disabled={verifying}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleMarkQR}
                      disabled={verifying || !qrToken.trim()}
                      className="bg-sky-500 hover:bg-sky-600 text-white"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify & Check In"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Biometric Verification Dialog */
                <div className="space-y-4 py-2">
                  <div className="flex flex-col items-center justify-center rounded-lg border bg-slate-50 dark:bg-slate-900/60 p-8 text-center relative overflow-hidden">
                    {verificationStep === "scanning" && (
                      <div className="absolute inset-0 bg-blue-500/5 animate-pulse flex items-center justify-center">
                        <div className="w-full h-1 bg-sky-500 absolute top-0 left-0 right-0 animate-bounce" />
                      </div>
                    )}

                    {selectedSessionInput?.method === "face_recognition" && (
                      <ScanFace className={`size-16 mb-3 ${verificationStep === "scanning" ? "text-blue-500 scale-110 duration-1000 transition-all font-light" : "text-muted-foreground"}`} />
                    )}

                    {selectedSessionInput?.method === "fingerprint" && (
                      <Fingerprint className={`size-16 mb-3 ${verificationStep === "scanning" ? "text-blue-500 scale-110 duration-1000 transition-all" : "text-muted-foreground"}`} />
                    )}

                    {selectedSessionInput?.method === "student_id_card" && (
                      <CreditCard className={`size-16 mb-3 ${verificationStep === "scanning" ? "text-blue-500 scale-110 duration-1000 transition-all" : "text-muted-foreground"}`} />
                    )}

                    {selectedSessionInput?.method === "manual" && (
                      <Sparkles className="size-16 text-sky-500 mb-3 animate-pulse" />
                    )}

                    <h4 className="text-sm font-bold text-foreground">
                      {verificationStep === "idle" && "Scanner Ready"}
                      {verificationStep === "scanning" && "Scanning Biometrics..."}
                      {verificationStep === "success" && "Verification Complete"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                      {verificationStep === "idle" && "Trigger simulator sensor block to authenticate."}
                      {verificationStep === "scanning" && "Validating scanner telemetry against database coordinates."}
                      {verificationStep === "success" && "Identity match 100%! Attendance present recorded."}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" onClick={() => setSelectedSessionInput(null)} disabled={verifying}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleMarkBiometric}
                      disabled={verifying}
                      className="bg-sky-500 hover:bg-sky-600 text-white"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Activate Biometrics Scanner"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
