"use client";

import { useEffect, useState } from "react";
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
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

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
  created_at: string;
  faculty?: Faculty;
}

export default function DepartmentsPage() {
  const supabase = createClient();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    const [deptResult, facResult] = await Promise.all([
      supabase
        .from("departments")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("faculties")
        .select("id, name, code")
        .order("name"),
    ]);

    if (deptResult.error || facResult.error) {
      toast.error("Failed to fetch data");
      setLoading(false);
      return;
    }

    const facultyMap = new Map(
      (facResult.data || []).map((f) => [f.id, f])
    );

    const departmentsWithFaculty = (deptResult.data || []).map((dept) => ({
      ...dept,
      faculty: dept.faculty_id ? facultyMap.get(dept.faculty_id) : undefined,
    }));

    setDepartments(departmentsWithFaculty);
    setFaculties(facResult.data || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  const openAddDialog = () => {
    setEditingDepartment(null);
    setName("");
    setCode("");
    setFacultyId("");
    setDialogOpen(true);
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department);
    setName(department.name);
    setCode(department.code);
    setFacultyId(department.faculty_id ?? "");
    setDialogOpen(true);
  };

  const openDeleteDialog = (department: Department) => {
    setDeletingDepartment(department);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim() || !facultyId) {
      toast.error("Name, code, and faculty are required");
      return;
    }

    setSubmitting(true);

    if (editingDepartment) {
      const { error } = await supabase
        .from("departments")
        .update({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          faculty_id: facultyId,
        })
        .eq("id", editingDepartment.id);

      if (error) {
        toast.error("Failed to update department");
        setSubmitting(false);
        return;
      }

      toast.success("Department updated successfully");
    } else {
      const { error } = await supabase
        .from("departments")
        .insert({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          faculty_id: facultyId,
        });

      if (error) {
        toast.error("Failed to create department");
        setSubmitting(false);
        return;
      }

      toast.success("Department created successfully");
    }

    setDialogOpen(false);
    setSubmitting(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deletingDepartment) return;

    setSubmitting(true);

    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("id", deletingDepartment.id);

    if (error) {
      toast.error("Failed to delete department");
      setSubmitting(false);
      return;
    }

    toast.success("Department deleted successfully");
    setDeleteDialogOpen(false);
    setDeletingDepartment(null);
    setSubmitting(false);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Manage departments across all faculties
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary">
              {filtered.length}{" "}
              {filtered.length === 1 ? "department" : "departments"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No departments found
              </p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try adjusting your search terms"
                  : "Get started by adding a new department"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">
                        {department.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{department.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {department.faculty?.name || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(department.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(department)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(department)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "Edit Department" : "Add Department"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Department of Computer Science"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="e.g. DCS"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty">Faculty</Label>
              <select
                id="faculty"
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a faculty</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : editingDepartment
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deletingDepartment?.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
