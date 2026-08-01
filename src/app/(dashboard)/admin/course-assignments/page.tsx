"use client";

import { useEffect, useMemo, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Search,
  Pencil,
  Plus,
  Trash2,
  Loader2,
  Inbox,
  ListChecks,
  BookOpen,
  Users,
} from "lucide-react";

type Assignment = {
  id: string;
  class_id: string;
  course_id: string;
  lecturer_id: string | null;
  created_at: string;
  classes?: { id: string; name: string; section: string } | null;
  courses?: { id: string; name: string; code: string } | null;
  lecturers?: { id: string; full_name: string } | null;
};

type ClassItem = { id: string; name: string };
type Course = { id: string; name: string; code: string };
type Lecturer = { id: string; full_name: string };

const EMPTY_FORM = {
  class_id: "",
  course_id: "",
  lecturer_id: "",
};

export default function AdminCourseAssignmentsPage() {
  const supabase = createClient();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] =
    useState<Assignment | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    const [assignResult, classResult, courseResult, lecturerResult] =
      await Promise.all([
        supabase
          .from("course_assignments")
          .select("*, classes(id, name, section), courses(id, name, code), lecturers:profiles!course_assignments_lecturer_id_fkey(id, full_name)")
          .order("created_at", { ascending: false }),
        supabase.from("classes").select("id, name").order("name"),
        supabase.from("courses").select("id, name, code").order("name"),
        supabase
          .from("profiles")
          .select("id, full_name")
          .eq("role", "lecturer")
          .order("full_name"),
      ]);

    if (assignResult.error || classResult.error || courseResult.error || lecturerResult.error) {
      toast.error("Failed to fetch data");
      setLoading(false);
      return;
    }

    setAssignments((assignResult.data as Assignment[]) || []);
    setClasses(classResult.data || []);
    setCourses(courseResult.data || []);
    setLecturers(lecturerResult.data || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      assignments.filter((a) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          a.classes?.name?.toLowerCase().includes(q) ||
          a.courses?.name?.toLowerCase().includes(q) ||
          a.courses?.code?.toLowerCase().includes(q) ||
          a.lecturers?.full_name?.toLowerCase().includes(q)
        );
      }),
    [assignments, search]
  );

  const openAddDialog = () => {
    setEditingAssignment(null);
    setForm(EMPTY_FORM);
    setAddDialogOpen(true);
  };

  const openEditDialog = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setForm({
      class_id: assignment.class_id,
      course_id: assignment.course_id,
      lecturer_id: assignment.lecturer_id || "",
    });
    setEditDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.class_id || !form.course_id) {
      toast.error("Please select a class and a course");
      return;
    }

    setSaving(true);

    if (editingAssignment) {
      const { error } = await supabase
        .from("course_assignments")
        .update({
          class_id: form.class_id,
          course_id: form.course_id,
          lecturer_id: form.lecturer_id || null,
        })
        .eq("id", editingAssignment.id);

      setSaving(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Course assignment updated");
      setEditDialogOpen(false);
    } else {
      const { error } = await supabase.from("course_assignments").insert({
        class_id: form.class_id,
        course_id: form.course_id,
        lecturer_id: form.lecturer_id || null,
      });

      setSaving(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Course assigned to class");
      setAddDialogOpen(false);
    }

    setForm(EMPTY_FORM);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deletingAssignment) return;

    setSaving(true);
    const { error } = await supabase
      .from("course_assignments")
      .delete()
      .eq("id", deletingAssignment.id);
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Course assignment removed");
    setDeleteDialogOpen(false);
    setDeletingAssignment(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Loading course assignments...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Course Assignments
        </h1>
        <p className="text-sm text-muted-foreground">
          Assign courses and lecturers to classes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
              <ListChecks className="size-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{assignments.length}</p>
              <p className="text-xs text-muted-foreground">Total Assignments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <BookOpen className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{courses.length}</p>
              <p className="text-xs text-muted-foreground">Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
              <Users className="size-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lecturers.length}</p>
              <p className="text-xs text-muted-foreground">Lecturers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Assignments</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search assignments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-full pl-8 sm:w-64"
                />
              </div>
              <Button size="sm" onClick={openAddDialog}>
                <Plus className="size-3.5" />
                Assign Course
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Inbox className="size-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium text-muted-foreground">
                  No assignments found
                </p>
                <p className="text-xs text-muted-foreground">
                  {search
                    ? "Try adjusting your search query"
                    : "No courses have been assigned to classes yet"}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Lecturer
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <span className="font-medium">
                        {assignment.classes?.name || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {assignment.courses?.name || "—"}
                      {assignment.courses && (
                        <Badge variant="secondary" className="ml-1.5">
                          {assignment.courses.code}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {assignment.lecturers?.full_name || "Not assigned"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(assignment)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setDeletingAssignment(assignment);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Course to Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select
                value={form.class_id}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, class_id: value ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Course *</Label>
              <Select
                value={form.course_id}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, course_id: value ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lecturer</Label>
              <Select
                value={form.lecturer_id}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, lecturer_id: value ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select lecturer" />
                </SelectTrigger>
                <SelectContent>
                  {lecturers.map((lecturer) => (
                    <SelectItem key={lecturer.id} value={lecturer.id}>
                      {lecturer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setForm(EMPTY_FORM);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Assign Course"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Course Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select
                value={form.class_id}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, class_id: value ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Course *</Label>
              <Select
                value={form.course_id}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, course_id: value ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lecturer</Label>
              <Select
                value={form.lecturer_id}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, lecturer_id: value ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select lecturer" />
                </SelectTrigger>
                <SelectContent>
                  {lecturers.map((lecturer) => (
                    <SelectItem key={lecturer.id} value={lecturer.id}>
                      {lecturer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingAssignment(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Course Assignment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove{" "}
            <span className="font-medium text-foreground">
              {deletingAssignment?.courses?.name}
            </span>{" "}
            from{" "}
            <span className="font-medium text-foreground">
              {deletingAssignment?.classes?.name}
            </span>
            ?
          </p>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingAssignment(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
