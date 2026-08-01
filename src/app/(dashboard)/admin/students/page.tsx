"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatDate, getStatusColor } from "@/lib/utils";
import { toast } from "sonner";
import { Users, GraduationCap, AlertTriangle, FileUp } from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  email: string;
  student_id: string | null;
  phone_number: string | null;
  national_id: string | null;
  department_id: string | null;
  faculty_id: string | null;
  account_status: string;
  created_at: string;
  departments?: { name: string } | null;
}

interface Faculty {
  id: string;
  name: string;
  code: string;
}

interface Department {
  id: string;
  name: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone_number: "",
    student_id: "",
    department_id: "",
    faculty_id: "",
    account_status: "",
  });
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadImportedCount() {
    const supabase = createClient();
    const { count } = await supabase
      .from("imported_students")
      .select("id", { count: "exact", head: true });
    setImportedCount(count || 0);
  }

  async function loadData() {
    const supabase = createClient();
    const [studentsRes, deptsRes, facsRes] = await Promise.all([
      supabase.from("profiles").select("*, departments(name)").eq("role", "student").order("created_at", { ascending: false }),
      supabase.from("departments").select("*"),
      supabase.from("faculties").select("*").order("name"),
    ]);
    setStudents(studentsRes.data || []);
    setDepartments(deptsRes.data || []);
    setFaculties(facsRes.data || []);
    setLoading(false);
    loadImportedCount();
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        (selectedFaculty === "all" || s.faculty_id === selectedFaculty) &&
        (s.full_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.student_id && s.student_id.toLowerCase().includes(q)))
    );
  }, [students, search, selectedFaculty]);

  const facultyCounts = useMemo(() => {
    const counts: Record<string, number> = { all: students.length };
    faculties.forEach((f) => {
      counts[f.id] = students.filter((s) => s.faculty_id === f.id).length;
    });
    return counts;
  }, [students, faculties]);

  const activeCount = students.filter((s) => s.account_status === "approved").length;
  const suspendedCount = students.filter((s) => s.account_status === "suspended").length;

  function openEdit(student: Student) {
    setEditStudent(student);
    setEditForm({
      full_name: student.full_name,
      phone_number: student.phone_number || "",
      student_id: student.student_id || "",
      department_id: student.department_id || "",
      faculty_id: student.faculty_id || "",
      account_status: student.account_status,
    });
  }

  async function handleSave() {
    if (!editStudent) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editForm.full_name,
        phone_number: editForm.phone_number || null,
        student_id: editForm.student_id || null,
        department_id: editForm.department_id || null,
        faculty_id: editForm.faculty_id || null,
        account_status: editForm.account_status,
      })
      .eq("id", editStudent.id);

    if (error) {
      toast.error("Failed to update student.");
    } else {
      toast.success("Student updated successfully.");
      setEditStudent(null);
      loadData();
    }
  }

  async function toggleStatus(student: Student) {
    const supabase = createClient();
    const newStatus = student.account_status === "approved" ? "suspended" : "approved";
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: newStatus })
      .eq("id", student.id);

    if (error) {
      toast.error("Failed to update status.");
    } else {
      toast.success(`Student ${newStatus}.`);
      loadData();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Students</h1>
        <Button render={<Link href="/admin/import-students" />}>
          <FileUp className="mr-2 h-4 w-4" />
          Import Students
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold text-foreground">{students.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <GraduationCap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Suspended</p>
              <p className="text-2xl font-bold text-red-600">{suspendedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
              <FileUp className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Imported Records</p>
              <p className="text-2xl font-bold text-sky-600">{importedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Input placeholder="Search by name, email, or roll number..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />

      {/* Faculty tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedFaculty("all")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${selectedFaculty === "all"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-primary/10"
            }`}
        >
          All ({facultyCounts.all || 0})
        </button>
        {faculties.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFaculty(f.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${selectedFaculty === f.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-primary/10"
              }`}
          >
            {f.name} ({facultyCounts[f.id] || 0})
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No students found.</TableCell>
                </TableRow>
              ) : (
                filtered.map((student) => {
                  const facultyName = faculties.find((f) => f.id === student.faculty_id)?.name || "-";
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                      <TableCell>{student.student_id || "-"}</TableCell>
                      <TableCell>{facultyName}</TableCell>
                      <TableCell>{student.departments?.name || "-"}</TableCell>
                      <TableCell><Badge className={getStatusColor(student.account_status)}>{student.account_status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(student.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(student)}>Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => toggleStatus(student)}>
                            {student.account_status === "approved" ? "Suspend" : "Reactivate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editStudent} onOpenChange={() => setEditStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={editForm.phone_number} onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Roll Number</Label>
              <Input value={editForm.student_id} onChange={(e) => setEditForm({ ...editForm, student_id: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Faculty</Label>
              <Select value={editForm.faculty_id} onValueChange={(v) => setEditForm({ ...editForm, faculty_id: v ?? "" })}>
                <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
                <SelectContent>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={editForm.department_id} onValueChange={(v) => setEditForm({ ...editForm, department_id: v ?? "" })}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.account_status} onValueChange={(v) => setEditForm({ ...editForm, account_status: v ?? "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditStudent(null)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
