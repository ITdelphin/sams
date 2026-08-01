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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Layers,
  Loader2,
  Inbox,
} from "lucide-react";

interface Faculty {
  id: string;
  name: string;
  code: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  faculty_id: string | null;
}

interface Program {
  id: string;
  name: string;
  code: string;
  faculty_id: string | null;
  department_id: string | null;
  duration_years: number;
  created_at: string;
  faculties?: { name: string };
  departments?: { name: string };
}

const EMPTY_FORM = {
  name: "",
  code: "",
  faculty_id: "",
  department_id: "",
  duration_years: 3,
};

export default function AdminProgramsPage() {
  const supabase = createClient();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    const [progResult, facResult, deptResult] = await Promise.all([
      supabase
        .from("programs")
        .select("*, faculties(name), departments(name)")
        .order("created_at", { ascending: false }),
      supabase.from("faculties").select("id, name, code").order("name"),
      supabase.from("departments").select("id, name, code, faculty_id").order("name"),
    ]);

    if (progResult.error || facResult.error || deptResult.error) {
      toast.error("Failed to fetch data");
      setLoading(false);
      return;
    }

    setPrograms((progResult.data as Program[]) || []);
    setFaculties(facResult.data || []);
    setDepartments(deptResult.data || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentsForFaculty = useMemo(
    () => departments.filter((d) => d.faculty_id === form.faculty_id),
    [departments, form.faculty_id]
  );

  const filtered = programs.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.faculties?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openAddDialog = () => {
    setEditingProgram(null);
    setForm(EMPTY_FORM);
    setAddDialogOpen(true);
  };

  const openEditDialog = (program: Program) => {
    setEditingProgram(program);
    setForm({
      name: program.name,
      code: program.code,
      faculty_id: program.faculty_id ?? "",
      department_id: program.department_id ?? "",
      duration_years: program.duration_years,
    });
    setEditDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.faculty_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    if (editingProgram) {
      const { error } = await supabase
        .from("programs")
        .update({
          name: form.name.trim(),
          code: form.code.trim(),
          faculty_id: form.faculty_id,
          department_id: form.department_id || null,
          duration_years: form.duration_years,
        })
        .eq("id", editingProgram.id);

      setSubmitting(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Program updated successfully");
      setEditDialogOpen(false);
    } else {
      const { error } = await supabase.from("programs").insert({
        name: form.name.trim(),
        code: form.code.trim(),
        faculty_id: form.faculty_id,
        department_id: form.department_id || null,
        duration_years: form.duration_years,
      });

      setSubmitting(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Program created successfully");
      setAddDialogOpen(false);
    }

    setForm(EMPTY_FORM);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deletingProgram) return;

    setSubmitting(true);
    const { error } = await supabase
      .from("programs")
      .delete()
      .eq("id", deletingProgram.id);
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Program deleted successfully");
    setDeleteDialogOpen(false);
    setDeletingProgram(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading programs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Program Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage academic programs under faculties and departments.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
              <Layers className="size-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{programs.length}</p>
              <p className="text-xs text-muted-foreground">Total Programs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <Layers className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{faculties.length}</p>
              <p className="text-xs text-muted-foreground">Faculties</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
              <Layers className="size-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{departments.length}</p>
              <p className="text-xs text-muted-foreground">Departments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Programs</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search programs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-full pl-8 sm:w-64"
                />
              </div>
              <Button size="sm" onClick={openAddDialog}>
                <Plus className="size-3.5" />
                Add Program
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
                  No programs found
                </p>
                <p className="text-xs text-muted-foreground">
                  {search
                    ? "Try adjusting your search query"
                    : "No programs have been created yet"}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Faculty
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Department
                  </TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>
                      <span className="font-medium">{program.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{program.code}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {program.faculties?.name || "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {program.departments?.name || "—"}
                    </TableCell>
                    <TableCell>
                      {program.duration_years} yr
                      {program.duration_years > 1 ? "s" : ""}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatDate(program.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(program)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setDeletingProgram(program);
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
            <DialogTitle>Add New Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Program Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Bachelor of Computer Science"
              />
            </div>
            <div className="space-y-2">
              <Label>Program Code *</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="e.g. BCS"
              />
            </div>
            <div className="space-y-2">
              <Label>Faculty *</Label>
              <Select
                value={form.faculty_id}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    faculty_id: value ?? "",
                    department_id: "",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id}>
                      {faculty.name} ({faculty.code})
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
                  setForm((prev) => ({ ...prev, department_id: value ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentsForFaculty.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No departments in this faculty
                    </div>
                  )}
                  {departmentsForFaculty.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration (Years)</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={form.duration_years}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    duration_years: Number(e.target.value) || 3,
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
                setForm(EMPTY_FORM);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Create Program"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Program Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Bachelor of Computer Science"
              />
            </div>
            <div className="space-y-2">
              <Label>Program Code *</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="e.g. BCS"
              />
            </div>
            <div className="space-y-2">
              <Label>Faculty *</Label>
              <Select
                value={form.faculty_id}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    faculty_id: value ?? "",
                    department_id: "",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id}>
                      {faculty.name} ({faculty.code})
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
                  setForm((prev) => ({ ...prev, department_id: value ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentsForFaculty.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No departments in this faculty
                    </div>
                  )}
                  {departmentsForFaculty.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration (Years)</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={form.duration_years}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    duration_years: Number(e.target.value) || 3,
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
                setEditingProgram(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
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
            <DialogTitle>Delete Program</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {deletingProgram?.name}
            </span>
            ? All classes under this program will also be deleted.
          </p>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingProgram(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? (
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
