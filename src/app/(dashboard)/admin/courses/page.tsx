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
  BookOpen,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  UserMinus,
  Loader2,
  Inbox,
} from "lucide-react";

type CourseRow = {
  id: string;
  name: string;
  code: string;
  department_id: string;
  lecturer_id: string | null;
  credits: number;
  created_at: string;
  departments?: { name: string; code: string } | null;
  profiles?: { full_name: string; email: string } | null;
};

type Department = {
  id: string;
  name: string;
  code: string;
};

type Lecturer = {
  id: string;
  full_name: string;
  email: string;
};

const EMPTY_COURSE_FORM = {
  name: "",
  code: "",
  department_id: "",
  lecturer_id: "",
  credits: 3,
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [addForm, setAddForm] = useState(EMPTY_COURSE_FORM);
  const [editForm, setEditForm] = useState(EMPTY_COURSE_FORM);
  const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<CourseRow | null>(null);

  const supabase = createClient();

  async function fetchCourses() {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*, departments(name, code), profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load courses");
      setLoading(false);
      return;
    }

    setCourses((data as CourseRow[]) || []);
    setLoading(false);
  }

  async function fetchDepartments() {
    const { data } = await supabase
      .from("departments")
      .select("*")
      .order("name");

    if (data) {
      setDepartments(data);
    }
  }

  async function fetchLecturers() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "lecturer")
      .eq("account_status", "approved")
      .order("full_name");

    if (data) {
      setLecturers(data);
    }
  }

  useEffect(() => {
    async function init() {
      await Promise.all([fetchCourses(), fetchDepartments(), fetchLecturers()]);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddCourse() {
    if (!addForm.name.trim() || !addForm.code.trim() || !addForm.department_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("courses") as any).insert({
      name: addForm.name.trim(),
      code: addForm.code.trim(),
      department_id: addForm.department_id,
      lecturer_id: addForm.lecturer_id || null,
      credits: addForm.credits,
    });

    setSaving(false);

    if (error) {
      toast.error("Failed to create course");
      return;
    }

    toast.success("Course created successfully");
    setAddDialogOpen(false);
    setAddForm(EMPTY_COURSE_FORM);
    fetchCourses();
  }

  async function handleEditCourse() {
    if (!editingCourse) return;
    if (!editForm.name.trim() || !editForm.code.trim() || !editForm.department_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("courses") as any)
      .update({
        name: editForm.name.trim(),
        code: editForm.code.trim(),
        department_id: editForm.department_id,
        lecturer_id: editForm.lecturer_id || null,
        credits: editForm.credits,
        created_at: editingCourse.created_at,
      })
      .eq("id", editingCourse.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to update course");
      return;
    }

    toast.success("Course updated successfully");
    setEditDialogOpen(false);
    setEditingCourse(null);
    fetchCourses();
  }

  async function handleDeleteCourse() {
    if (!deletingCourse) return;

    setSaving(true);
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", deletingCourse.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to delete course");
      return;
    }

    toast.success("Course deleted successfully");
    setDeleteDialogOpen(false);
    setDeletingCourse(null);
    fetchCourses();
  }

  async function handleAssignLecturer(courseId: string, lecturerId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("courses") as any)
      .update({ lecturer_id: lecturerId })
      .eq("id", courseId);

    if (error) {
      toast.error("Failed to assign lecturer");
      return;
    }

    toast.success("Lecturer assigned successfully");
    fetchCourses();
  }

  async function handleUnassignLecturer(courseId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("courses") as any)
      .update({ lecturer_id: null })
      .eq("id", courseId);

    if (error) {
      toast.error("Failed to unassign lecturer");
      return;
    }

    toast.success("Lecturer unassigned successfully");
    fetchCourses();
  }

  function openEditDialog(course: CourseRow) {
    setEditingCourse(course);
    setEditForm({
      name: course.name,
      code: course.code,
      department_id: course.department_id,
      lecturer_id: course.lecturer_id || "",
      credits: course.credits,
    });
    setEditDialogOpen(true);
  }

  function openDeleteDialog(course: CourseRow) {
    setDeletingCourse(course);
    setDeleteDialogOpen(true);
  }

  function getDepartmentName(id: string): string {
    const dept = departments.find((d) => d.id === id);
    return dept ? dept.name : "—";
  }

  function getLecturerName(id: string | null): string {
    if (!id) return "—";
    const lec = lecturers.find((l) => l.id === id);
    return lec ? lec.full_name : "—";
  }

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const query = searchQuery.toLowerCase();
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query) ||
        getDepartmentName(c.department_id).toLowerCase().includes(query) ||
        getLecturerName(c.lecturer_id).toLowerCase().includes(query)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, searchQuery, departments, lecturers]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Course Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage courses, assign lecturers, and organize departments.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{courses.length}</p>
              <p className="text-xs text-muted-foreground">Total Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <UserPlus className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {courses.filter((c) => c.lecturer_id).length}
              </p>
              <p className="text-xs text-muted-foreground">With Lecturer</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
              <UserMinus className="size-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {courses.filter((c) => !c.lecturer_id).length}
              </p>
              <p className="text-xs text-muted-foreground">Unassigned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Courses</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full pl-8 sm:w-64"
                />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setAddForm(EMPTY_COURSE_FORM);
                  setAddDialogOpen(true);
                }}
              >
                <Plus className="size-3.5" />
                Add Course
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Inbox className="size-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium text-muted-foreground">
                  No courses found
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "No courses have been created yet"}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Department
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Lecturer
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Credits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <span className="font-medium">{course.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{course.code}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {getDepartmentName(course.department_id)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {getLecturerName(course.lecturer_id)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {course.credits}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {course.lecturer_id ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUnassignLecturer(course.id)}
                          >
                            <UserMinus className="size-3.5" />
                            <span className="hidden sm:inline">Unassign</span>
                          </Button>
                        ) : (
                          <Select
                            value=""
                            onValueChange={(value) =>
                              value && handleAssignLecturer(course.id, value)
                            }
                          >
                            <SelectTrigger className="h-7 w-auto text-xs">
                              <UserPlus className="size-3.5" />
                              <SelectValue placeholder="Assign" />
                            </SelectTrigger>
                            <SelectContent>
                              {lecturers.map((lec) => (
                                <SelectItem key={lec.id} value={lec.id}>
                                  {lec.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(course)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDeleteDialog(course)}
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
            <DialogTitle>Add New Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Course Name *</Label>
              <Input
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Introduction to Computer Science"
              />
            </div>
            <div className="space-y-2">
              <Label>Course Code *</Label>
              <Input
                value={addForm.code}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="e.g. CS101"
              />
            </div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select
                value={addForm.department_id}
                onValueChange={(value) =>
                  setAddForm((prev) => ({ ...prev, department_id: value ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lecturer</Label>
              <Select
                value={addForm.lecturer_id}
                onValueChange={(value) =>
                  setAddForm((prev) => ({ ...prev, lecturer_id: value ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Assign a lecturer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {lecturers.map((lec) => (
                    <SelectItem key={lec.id} value={lec.id}>
                      {lec.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Credits</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={addForm.credits}
                onChange={(e) =>
                  setAddForm((prev) => ({
                    ...prev,
                    credits: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </div>
          </div>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setAddForm(EMPTY_COURSE_FORM);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCourse} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Create Course"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Course Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Introduction to Computer Science"
              />
            </div>
            <div className="space-y-2">
              <Label>Course Code *</Label>
              <Input
                value={editForm.code}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="e.g. CS101"
              />
            </div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select
                value={editForm.department_id}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, department_id: value ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lecturer</Label>
              <Select
                value={editForm.lecturer_id}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, lecturer_id: value ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Assign a lecturer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {lecturers.map((lec) => (
                    <SelectItem key={lec.id} value={lec.id}>
                      {lec.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Credits</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={editForm.credits}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    credits: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </div>
          </div>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingCourse(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditCourse} disabled={saving}>
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
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {deletingCourse?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingCourse(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCourse}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
