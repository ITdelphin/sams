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
  Users,
  Pencil,
  Plus,
  Trash2,
  Loader2,
  Inbox,
} from "lucide-react";

type ClassRow = {
  id: string;
  name: string;
  course_id: string;
  schedule: string | null;
  room: string | null;
  created_at: string;
  courses?: { name: string; code: string } | null;
};

type Course = {
  id: string;
  name: string;
  code: string;
};

const EMPTY_CLASS_FORM = {
  name: "",
  course_id: "",
  schedule: "",
  room: "",
};

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [addForm, setAddForm] = useState(EMPTY_CLASS_FORM);
  const [editForm, setEditForm] = useState(EMPTY_CLASS_FORM);
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassRow | null>(null);

  const supabase = createClient();

  async function fetchClasses() {
    setLoading(true);
    const { data, error } = await supabase
      .from("classes")
      .select("*, courses(name, code)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load classes");
      setLoading(false);
      return;
    }

    setClasses((data as ClassRow[]) || []);
    setLoading(false);
  }

  async function fetchCourses() {
    const { data } = await supabase
      .from("courses")
      .select("id, name, code")
      .order("name");

    if (data) {
      setCourses(data);
    }
  }

  useEffect(() => {
    async function init() {
      await Promise.all([fetchClasses(), fetchCourses()]);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddClass() {
    if (!addForm.name.trim() || !addForm.course_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("classes") as any).insert({
      name: addForm.name.trim(),
      course_id: addForm.course_id,
      schedule: addForm.schedule.trim() || null,
      room: addForm.room.trim() || null,
    });

    setSaving(false);

    if (error) {
      toast.error("Failed to create class");
      return;
    }

    toast.success("Class created successfully");
    setAddDialogOpen(false);
    setAddForm(EMPTY_CLASS_FORM);
    fetchClasses();
  }

  async function handleEditClass() {
    if (!editingClass) return;
    if (!editForm.name.trim() || !editForm.course_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("classes") as any)
      .update({
        name: editForm.name.trim(),
        course_id: editForm.course_id,
        schedule: editForm.schedule.trim() || null,
        room: editForm.room.trim() || null,
        created_at: editingClass.created_at,
      })
      .eq("id", editingClass.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to update class");
      return;
    }

    toast.success("Class updated successfully");
    setEditDialogOpen(false);
    setEditingClass(null);
    fetchClasses();
  }

  async function handleDeleteClass() {
    if (!deletingClass) return;

    setSaving(true);
    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("id", deletingClass.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to delete class");
      return;
    }

    toast.success("Class deleted successfully");
    setDeleteDialogOpen(false);
    setDeletingClass(null);
    fetchClasses();
  }

  function openEditDialog(classItem: ClassRow) {
    setEditingClass(classItem);
    setEditForm({
      name: classItem.name,
      course_id: classItem.course_id,
      schedule: classItem.schedule || "",
      room: classItem.room || "",
    });
    setEditDialogOpen(true);
  }

  function openDeleteDialog(classItem: ClassRow) {
    setDeletingClass(classItem);
    setDeleteDialogOpen(true);
  }

  function getCourseLabel(courseId: string): string {
    const course = courses.find((c) => c.id === courseId);
    return course ? `${course.name} (${course.code})` : "—";
  }

  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes;
    const query = searchQuery.toLowerCase();
    return classes.filter(
      (cls) =>
        cls.name.toLowerCase().includes(query) ||
        cls.courses?.name?.toLowerCase().includes(query) ||
        cls.courses?.code?.toLowerCase().includes(query) ||
        cls.schedule?.toLowerCase().includes(query) ||
        cls.room?.toLowerCase().includes(query)
    );
  }, [classes, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading classes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Class Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage classes, schedules, and room assignments.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{classes.length}</p>
              <p className="text-xs text-muted-foreground">Total Classes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <Users className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{courses.length}</p>
              <p className="text-xs text-muted-foreground">
                Linked Courses
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
              <Users className="size-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {classes.filter((c) => !c.schedule).length}
              </p>
              <p className="text-xs text-muted-foreground">
                No Schedule Set
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Classes</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full pl-8 sm:w-64"
                />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setAddForm(EMPTY_CLASS_FORM);
                  setAddDialogOpen(true);
                }}
              >
                <Plus className="size-3.5" />
                Add Class
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {filteredClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Inbox className="size-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium text-muted-foreground">
                  No classes found
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "No classes have been created yet"}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Schedule
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Room</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell>
                      <span className="font-medium">{classItem.name}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {classItem.courses
                        ? `${classItem.courses.name}`
                        : "—"}
                      {classItem.courses && (
                        <Badge variant="secondary" className="ml-1.5">
                          {classItem.courses.code}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {classItem.schedule || "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {classItem.room || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(classItem)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDeleteDialog(classItem)}
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
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Class Name *</Label>
              <Input
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. CS101 - Section A"
              />
            </div>
            <div className="space-y-2">
              <Label>Course *</Label>
              <Select
                value={addForm.course_id}
                onValueChange={(value) =>
                  setAddForm((prev) => ({ ...prev, course_id: value ?? "" }))
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
              <Label>Schedule</Label>
              <Input
                value={addForm.schedule}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, schedule: e.target.value }))
                }
                placeholder="e.g. Mon/Wed 10:00-11:30"
              />
            </div>
            <div className="space-y-2">
              <Label>Room</Label>
              <Input
                value={addForm.room}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, room: e.target.value }))
                }
                placeholder="e.g. Room 301"
              />
            </div>
          </div>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setAddForm(EMPTY_CLASS_FORM);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddClass} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Create Class"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Class Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. CS101 - Section A"
              />
            </div>
            <div className="space-y-2">
              <Label>Course *</Label>
              <Select
                value={editForm.course_id}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, course_id: value ?? "" }))
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
              <Label>Schedule</Label>
              <Input
                value={editForm.schedule}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, schedule: e.target.value }))
                }
                placeholder="e.g. Mon/Wed 10:00-11:30"
              />
            </div>
            <div className="space-y-2">
              <Label>Room</Label>
              <Input
                value={editForm.room}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, room: e.target.value }))
                }
                placeholder="e.g. Room 301"
              />
            </div>
          </div>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingClass(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditClass} disabled={saving}>
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
            <DialogTitle>Delete Class</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {deletingClass?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingClass(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClass}
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
