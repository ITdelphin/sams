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
  created_at: string;
  department_count?: number;
}

export default function FacultiesPage() {
  const supabase = createClient();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [deletingFaculty, setDeletingFaculty] = useState<Faculty | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchFaculties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("faculties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch faculties");
      setLoading(false);
      return;
    }

    const facultiesWithCount = await Promise.all(
      (data || []).map(async (faculty) => {
        const { count } = await supabase
          .from("departments")
          .select("*", { count: "exact", head: true })
          .eq("faculty_id", faculty.id);
        return { ...faculty, department_count: count || 0 };
      })
    );

    setFaculties(facultiesWithCount);
    setLoading(false);
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  const filtered = faculties.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase())
  );

  const openAddDialog = () => {
    setEditingFaculty(null);
    setName("");
    setCode("");
    setDialogOpen(true);
  };

  const openEditDialog = (faculty: Faculty) => {
    setEditingFaculty(faculty);
    setName(faculty.name);
    setCode(faculty.code);
    setDialogOpen(true);
  };

  const openDeleteDialog = (faculty: Faculty) => {
    setDeletingFaculty(faculty);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error("Name and code are required");
      return;
    }

    setSubmitting(true);

    if (editingFaculty) {
      const { error } = await supabase
        .from("faculties")
        .update({ name: name.trim(), code: code.trim().toUpperCase() })
        .eq("id", editingFaculty.id);

      if (error) {
        toast.error("Failed to update faculty");
        setSubmitting(false);
        return;
      }

      toast.success("Faculty updated successfully");
    } else {
      const { error } = await supabase
        .from("faculties")
        .insert({ name: name.trim(), code: code.trim().toUpperCase() });

      if (error) {
        toast.error("Failed to create faculty");
        setSubmitting(false);
        return;
      }

      toast.success("Faculty created successfully");
    }

    setDialogOpen(false);
    setSubmitting(false);
    fetchFaculties();
  };

  const handleDelete = async () => {
    if (!deletingFaculty) return;

    setSubmitting(true);

    const { error } = await supabase
      .from("faculties")
      .delete()
      .eq("id", deletingFaculty.id);

    if (error) {
      toast.error("Failed to delete faculty");
      setSubmitting(false);
      return;
    }

    toast.success("Faculty deleted successfully");
    setDeleteDialogOpen(false);
    setDeletingFaculty(null);
    setSubmitting(false);
    fetchFaculties();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculties</h1>
          <p className="text-muted-foreground">
            Manage faculties and their departments
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Faculty
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
              {filtered.length} {filtered.length === 1 ? "faculty" : "faculties"}
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
                No faculties found
              </p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try adjusting your search terms"
                  : "Get started by adding a new faculty"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Departments</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((faculty) => (
                    <TableRow key={faculty.id}>
                      <TableCell className="font-medium">
                        {faculty.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{faculty.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {faculty.department_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(faculty.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(faculty)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(faculty)}
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
              {editingFaculty ? "Edit Faculty" : "Add Faculty"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Faculty of Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="e.g. FENG"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="uppercase"
              />
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
                  : editingFaculty
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
            <DialogTitle>Delete Faculty</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deletingFaculty?.name}
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
