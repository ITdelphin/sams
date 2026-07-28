"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  calculateAttendancePercentage,
} from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  BookOpen,
  Loader2,
  Inbox,
  GraduationCap,
  Clock,
} from "lucide-react";

type EnrolledCourse = {
  id: string;
  name: string;
  code: string;
  credits: number;
  department_id: string;
  lecturer_id: string | null;
  departments?: { name: string; code: string } | null;
  enrollment_id: string;
  enrolled_at: string;
  total_sessions: number;
  present_count: number;
  late_count: number;
};

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

      const { data: enrollments, error: enrollError } = await supabase
        .from("course_enrollments")
        .select("id, course_id, enrolled_at, courses(id, name, code, credits, department_id, lecturer_id, departments(name, code))")
        .eq("student_id", studentId)
        .order("enrolled_at", { ascending: false });

      if (enrollError) {
        toast.error("Failed to load enrolled courses");
        setLoading(false);
        return;
      }

      const enrollmentList = (enrollments || []) as {
        id: string;
        course_id: string;
        enrolled_at: string;
        courses?: {
          id: string;
          name: string;
          code: string;
          credits: number;
          department_id: string;
          lecturer_id: string | null;
          departments?: { name: string; code: string } | null;
        } | null;
      }[];

      const courseIds = enrollmentList
        .map((e) => e.courses?.id)
        .filter((id): id is string => !!id);

      let sessionMap: Record<string, number> = {};
      let presentMap: Record<string, number> = {};
      let lateMap: Record<string, number> = {};

      if (courseIds.length > 0) {
        const { data: sessions } = await supabase
          .from("attendance_sessions")
          .select("id, course_id")
          .in("course_id", courseIds);

        if (sessions && sessions.length > 0) {
          const sessionIds = sessions.map((s) => s.id);

          sessions.forEach((s) => {
            sessionMap[s.course_id] = (sessionMap[s.course_id] || 0) + 1;
          });

          const { data: records } = await supabase
            .from("attendance_records")
            .select("session_id, student_id, status")
            .in("session_id", sessionIds)
            .eq("student_id", studentId);

          if (records) {
            const sessToCourse: Record<string, string> = {};
            sessions.forEach((s) => {
              sessToCourse[s.id] = s.course_id;
            });

            (records as { session_id: string; status: string }[]).forEach((r) => {
              const courseId = sessToCourse[r.session_id];
              if (!courseId) return;
              if (r.status === "present") {
                presentMap[courseId] = (presentMap[courseId] || 0) + 1;
              } else if (r.status === "late") {
                lateMap[courseId] = (lateMap[courseId] || 0) + 1;
              }
            });
          }
        }
      }

      const result: EnrolledCourse[] = enrollmentList
        .filter((e) => e.courses)
        .map((e) => {
          const course = e.courses!;
          return {
            id: course.id,
            name: course.name,
            code: course.code,
            credits: course.credits,
            department_id: course.department_id,
            lecturer_id: course.lecturer_id,
            departments: course.departments,
            enrollment_id: e.id,
            enrolled_at: e.enrolled_at,
            total_sessions: sessionMap[course.id] || 0,
            present_count: presentMap[course.id] || 0,
            late_count: lateMap[course.id] || 0,
          };
        });

      setCourses(result);
      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const query = searchQuery.toLowerCase();
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query) ||
        c.departments?.name?.toLowerCase().includes(query)
    );
  }, [courses, searchQuery]);

  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const avgAttendance =
      courses.length > 0
        ? Math.round(
            courses.reduce(
              (sum, c) =>
                sum +
                calculateAttendancePercentage(
                  c.present_count + c.late_count,
                  c.total_sessions
                ),
              0
            ) / courses.length
          )
        : 0;
    return { totalCourses, totalCredits, avgAttendance };
  }, [courses]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading your courses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
        <p className="text-sm text-muted-foreground">
          View your enrolled courses and attendance progress.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalCourses}</p>
              <p className="text-xs text-muted-foreground">Enrolled Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <GraduationCap className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalCredits}</p>
              <p className="text-xs text-muted-foreground">Total Credits</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <Clock className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avgAttendance}%</p>
              <p className="text-xs text-muted-foreground">Avg Attendance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search courses by name, code, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full pl-8 sm:w-96"
        />
      </div>

      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Inbox className="size-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-muted-foreground">No courses found</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "You are not enrolled in any courses yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const attendancePercent = calculateAttendancePercentage(
              course.present_count + course.late_count,
              course.total_sessions
            );

            const percentColor =
              attendancePercent >= 75
                ? "text-green-600 dark:text-green-400"
                : attendancePercent >= 50
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400";

            const barColor =
              attendancePercent >= 75
                ? "bg-green-500"
                : attendancePercent >= 50
                  ? "bg-yellow-500"
                  : "bg-red-500";

            return (
              <Card key={course.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">
                      {course.name}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {course.code}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Department</span>
                      <span className="font-medium">
                        {course.departments?.name || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Credits</span>
                      <span className="font-medium">{course.credits}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sessions</span>
                      <span className="font-medium">{course.total_sessions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Present</span>
                      <span className="font-medium">
                        {course.present_count + course.late_count} / {course.total_sessions}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Attendance</Label>
                      <span className={`text-sm font-bold ${percentColor}`}>
                        {attendancePercent}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${attendancePercent}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
