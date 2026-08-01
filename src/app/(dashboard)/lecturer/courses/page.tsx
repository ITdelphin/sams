"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Course = {
  id: string;
  name: string;
  code: string;
  credits: number;
  departmentName: string;
  enrolledCount: number;
};

export default function LecturerCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("courses")
        .select("*, departments(name), course_enrollments(id)")
        .eq("lecturer_id", user.id);

      setCourses((data || []).map((c) => ({
        ...c,
        enrolledCount: c.course_enrollments?.length || 0,
        departmentName: c.departments?.name || "N/A",
      })));
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return courses.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [courses, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
      <Input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />

      {filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No courses found.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{course.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">{course.code}</Badge>
                  </div>
                  <Badge>{course.credits} credits</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Department: {course.departmentName}</p>
                <p className="text-sm font-medium">{course.enrolledCount} students enrolled</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
