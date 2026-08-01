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
  BookOpen,
  CalendarDays,
  Layers,
} from "lucide-react";

type ClassRow = {
  id: string;
  name: string;
  faculty_id: string | null;
  department_id: string | null;
  program_id: string | null;
  academic_year_id: string | null;
  semester_id: string | null;
  year: number;
  section: string;
  room: string | null;
  capacity: number | null;
  created_at: string;
  programs?: { name: string; code: string } | null;
  academic_years?: { name: string } | null;
  semesters?: { name: string } | null;
};

type Faculty = { id: string; name: string };
type Department = { id: string; name: string; faculty_id: string };
type Program = { id: string; name: string; code: string; faculty_id: string; department_id: string };
type AcademicYear = { id: string; name: string };
type Semester = { id: string; name: string; academic_year_id: string };

const EMPTY_CLASS_FORM = {
  name: "",
  faculty_id: "",
  department_id: "",
  program_id: "",
  academic_year_id: "",
  semester_id: "",
  year: 1,
  section: "A",
  room: "",
  capacity: 50,
};

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
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
      .select("*, programs(name, code), academic_years(name), semesters(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load classes");
      setLoading(false);
      return;
    }

    setClasses((data as ClassRow[]) || []);
    setLoading(false);
  }

  async function fetchReferenceData() {
    const [facRes, deptRes, progRes, yearRes, semRes] = await Promise.all([
      supabase.from("faculties").select("id, name").order("name"),
      supabase.from("departments").select("id, name, faculty_id").order("name"),
      supabase.from("programs").select("id, name, code, faculty_id, department_id").order("name"),
      supabase.from("academic_years").select("id, name").order("name"),
      supabase.from("semesters").select("id, name, academic_year_id").order("name"),
    ]);

    if (facRes.data) setFaculties(facRes.data);
    if (deptRes.data) setDepartments(deptRes.data);
    if (progRes.data) setPrograms(progRes.data);
    if (yearRes.data) setAcademicYears(yearRes.data);
    if (semRes.data) setSemesters(semRes.data);
  }

  useEffect(() => {
    async function init() {
      await Promise.all([fetchClasses(), fetchReferenceData()]);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function departmentsForFaculty(facultyId: string) {
    return departments.filter((d) => d.faculty_id === facultyId);
  }

  function programsForDepartment(departmentId: string) {
    return programs.filter((p) => p.department_id === departmentId);
  }

  function semestersForYear(yearId: string) {
    return semesters.filter((s) => s.academic_year_id === yearId);
  }

  function buildClassName(form: typeof EMPTY_CLASS_FORM): string {
    const program = programs.find((p) => p.id === form.program_id);
    const year = form.year ? `Year ${form.year}` : "";
    return program
      ? `${program.name} ${year} - Section ${form.section}`
      : form.name.trim();
  }

  function onFormChange(
    setter: React.Dispatch<React.SetStateAction<typeof EMPTY_CLASS_FORM>>,
    patch: Partial<typeof EMPTY_CLASS_FORM>
  ) {
    setter((prev) => {
      const next = { ...prev, ...patch };
      if (
        !("name" in patch) &&
        (patch.program_id !== undefined ||
          patch.year !== undefined ||
          patch.section !== undefined)
      ) {
        next.name = buildClassName(next);
      }
      return next;
    });
  }

  async function handleAddClass() {
    if (!addForm.program_id) {
      toast.error("Please select a program");
      return;
    }

    setSaving(true);
    const { error } = await (supabase.from("classes") as any).insert({
      name: addForm.name.trim(),
      faculty_id: addForm.faculty_id || null,
      department_id: addForm.department_id || null,
      program_id: addForm.program_id,
      academic_year_id: addForm.academic_year_id || null,
      semester_id: addForm.semester_id || null,
      year: addForm.year,
      section: addForm.section.trim(),
      room: addForm.room.trim() || null,
      capacity: addForm.capacity,
    });

    setSaving(false);

    if (error) {
      toast.error(error.message || "Failed to create class");
      return;
    }

    toast.success("Class created successfully");
    setAddDialogOpen(false);
    setAddForm(EMPTY_CLASS_FORM);
    fetchClasses();
  }

  async function handleEditClass() {
    if (!editingClass) return;
    if (!editForm.program_id) {
      toast.error("Please select a program");
      return;
    }

    setSaving(true);
    const { error } = await (supabase.from("classes") as any)
      .update({
        name: editForm.name.trim(),
        faculty_id: editForm.faculty_id || null,
        department_id: editForm.department_id || null,
        program_id: editForm.program_id,
        academic_year_id: editForm.academic_year_id || null,
        semester_id: editForm.semester_id || null,
        year: editForm.year,
        section: editForm.section.trim(),
        room: editForm.room.trim() || null,
        capacity: editForm.capacity,
      })
      .eq("id", editingClass.id);

    setSaving(false);

    if (error) {
      toast.error(error.message || "Failed to update class");
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
      faculty_id: classItem.faculty_id || "",
      department_id: classItem.department_id || "",
      program_id: classItem.program_id || "",
      academic_year_id: classItem.academic_year_id || "",
      semester_id: classItem.semester_id || "",
      year: classItem.year,
      section: classItem.section,
      room: classItem.room || "",
      capacity: classItem.capacity || 50,
    });
    setEditDialogOpen(true);
  }

  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes;
    const query = searchQuery.toLowerCase();
    return classes.filter(
      (cls) =>
        cls.name.toLowerCase().includes(query) ||
        cls.programs?.name?.toLowerCase().includes(query) ||
        cls.programs?.code?.toLowerCase().includes(query) ||
        cls.section?.toLowerCase().includes(query) ||
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

  const formDialogBody = (
    isEdit: boolean,
    form: typeof EMPTY_CLASS_FORM,
    setForm: (patch: Partial<typeof EMPTY_CLASS_FORM>) => void
  ) => {
    const depts = departmentsForFaculty(form.faculty_id);
    const progs = programsForDepartment(form.department_id);
    const sems = semestersForYear(form.academic_year_id);

    return (
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Faculty</Label>
            <Select
              value={form.faculty_id}
              onValueChange={(value) =>
                setForm({
                  faculty_id: value ?? "",
                  department_id: "",
                  program_id: "",
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select faculty" />
              </SelectTrigger>
              <SelectContent>
                {faculties.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select
              value={form.department_id}
              onValueChange={(value) =>
                setForm({ department_id: value ?? "", program_id: "" })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {depts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Program *</Label>
          <Select
            value={form.program_id}
            onValueChange={(value) => setForm({ program_id: value ?? "" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              {progs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Academic Year</Label>
            <Select
              value={form.academic_year_id}
              onValueChange={(value) =>
                setForm({ academic_year_id: value ?? "", semester_id: "" })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Semester</Label>
            <Select
              value={form.semester_id}
              onValueChange={(value) => setForm({ semester_id: value ?? "" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {sems.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Program Year *</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={form.year}
              onChange={(e) =>
                setForm({ year: Number(e.target.value) || 1 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Section *</Label>
            <Input
              value={form.section}
              onChange={(e) =>
                setForm({ section: e.target.value.toUpperCase() })
              }
              placeholder="A"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Room</Label>
            <Input
              value={form.room}
              onChange={(e) => setForm({ room: e.target.value })}
              placeholder="e.g. Room 301"
            />
          </div>
          <div className="space-y-2">
            <Label>Capacity</Label>
            <Input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) =>
                setForm({ capacity: Number(e.target.value) || 50 })
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Class Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ name: e.target.value })}
            placeholder="Auto-generated from program details"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Class Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Program-based classes with academic year, semester, and section.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
              <Layers className="size-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{programs.length}</p>
              <p className="text-xs text-muted-foreground">Programs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <CalendarDays className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{academicYears.length}</p>
              <p className="text-xs text-muted-foreground">Academic Years</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
              <BookOpen className="size-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{semesters.length}</p>
              <p className="text-xs text-muted-foreground">Semesters</p>
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
                  <TableHead>Program</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Year / Semester
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
                      {classItem.programs ? (
                        <Badge variant="secondary">
                          {classItem.programs.code}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {classItem.academic_years?.name
                        ? `${classItem.academic_years.name}${
                            classItem.semesters?.name
                              ? ` · ${classItem.semesters.name}`
                              : ""
                          }`
                        : "—"}
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
                          onClick={() => {
                            setDeletingClass(classItem);
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          {formDialogBody(
            false,
            addForm,
            (patch) =>
              onFormChange(setAddForm, patch)
          )}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          {formDialogBody(
            true,
            editForm,
            (patch) =>
              onFormChange(setEditForm, patch)
          )}
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
