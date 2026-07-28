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
import { Separator } from "@/components/ui/separator";
import { formatDate, getStatusColor } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  CalendarCheck,
  Loader2,
  Inbox,
} from "lucide-react";

type SessionRow = {
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
  profiles?: { full_name: string; email: string } | null;
};

type FilterTab = "all" | "active" | "completed";

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

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

export default function AdminAttendancePage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const supabase = createClient();

  async function fetchSessions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("*, courses(name, code), profiles(full_name, email)")
      .order("started_at", { ascending: false });

    if (error) {
      toast.error("Failed to load attendance sessions");
      setLoading(false);
      return;
    }

    const sessionData = (data as SessionRow[]) || [];
    setSessions(sessionData);

    if (sessionData.length > 0) {
      const sessionIds = sessionData.map((s) => s.id);
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
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = sessions.length;
    const active = sessions.filter((s) => s.is_active).length;
    const completed = sessions.filter((s) => !s.is_active).length;
    const totalRecords = Object.values(attendanceCounts).reduce((a, b) => a + b, 0);
    return { total, active, completed, totalRecords };
  }, [sessions, attendanceCounts]);

  const filteredSessions = useMemo(() => {
    let result = sessions;

    if (activeFilter === "active") {
      result = result.filter((s) => s.is_active);
    } else if (activeFilter === "completed") {
      result = result.filter((s) => !s.is_active);
    }

    if (methodFilter !== "all") {
      result = result.filter((s) => s.method === methodFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.courses?.name?.toLowerCase().includes(query) ||
          s.courses?.code?.toLowerCase().includes(query) ||
          s.profiles?.full_name?.toLowerCase().includes(query) ||
          s.method.toLowerCase().includes(query)
      );
    }

    return result;
  }, [sessions, activeFilter, methodFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Loading attendance sessions...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Attendance Monitoring
        </h1>
        <p className="text-sm text-muted-foreground">
          View all attendance sessions across courses and lecturers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CalendarCheck className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Sessions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <CalendarCheck className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active Now</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-500/10">
              <CalendarCheck className="size-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <CalendarCheck className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalRecords}</p>
              <p className="text-xs text-muted-foreground">
                Total Attendance Records
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Attendance Sessions</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select
                value={methodFilter}
                onValueChange={(value) => setMethodFilter(value ?? "all")}
              >
                <SelectTrigger className="h-8 w-full sm:w-40">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="qr_code">QR Code</SelectItem>
                  <SelectItem value="student_id_card">Student ID</SelectItem>
                  <SelectItem value="face_recognition">
                    Face Recognition
                  </SelectItem>
                  <SelectItem value="fingerprint">Fingerprint</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full pl-8 sm:w-64"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pt-1">
            {FILTER_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant={activeFilter === tab.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(tab.value)}
              >
                {tab.label}
                <span className="ml-1.5 text-xs opacity-70">
                  {tab.value === "all"
                    ? stats.total
                    : tab.value === "active"
                      ? stats.active
                      : stats.completed}
                </span>
              </Button>
            ))}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Inbox className="size-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium text-muted-foreground">
                  No sessions found
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : activeFilter !== "all"
                      ? `No ${activeFilter} sessions at the moment`
                      : "No attendance sessions have been created yet"}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Lecturer
                  </TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Started
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Ended</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">
                    Count
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => {
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
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {session.profiles?.full_name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={methodInfo.className}>
                          {methodInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {formatDate(session.started_at)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {session.ended_at
                          ? formatDate(session.ended_at)
                          : "—"}
                      </TableCell>
                      <TableCell>
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
                      <TableCell className="hidden sm:table-cell text-right font-medium">
                        {attendanceCounts[session.id] || 0}
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
