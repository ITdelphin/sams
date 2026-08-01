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
import { formatDate, getStatusColor } from "@/lib/utils";
import { generateTempPassword } from "@/lib/security";
import { toast } from "sonner";
import {
  Search,
  Users,
  Clock,
  CheckCircle2,
  Ban,
  Pencil,
  Check,
  X,
  ShieldOff,
  RotateCcw,
  User,
  Mail,
  Loader2,
  Inbox,
  Plus,
  KeyRound,
  Copy,
} from "lucide-react";

type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  national_id: string | null;
  student_id: string | null;
  role: "student" | "lecturer" | "super_admin";
  account_status:
    | "pending"
    | "approved"
    | "suspended"
    | "inactive"
    | "rejected"
    | "graduated";
  department_id: string | null;
  faculty_id: string | null;
  profile_photo_url: string | null;
  created_at: string;
  updated_at: string;
};

type Department = {
  id: string;
  name: string;
  code: string;
  faculty_id: string | null;
  created_at: string;
};

type FilterTab = "all" | "pending" | "approved" | "suspended";

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "suspended", label: "Suspended" },
];

export default function AdminLecturersPage() {
  const [lecturers, setLecturers] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [editingLecturer, setEditingLecturer] = useState<Profile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    national_id: "",
    department_id: "",
    account_status: "" as Profile["account_status"],
  });
  const [saving, setSaving] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [tempPasswordDialog, setTempPasswordDialog] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [faculties, setFaculties] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [addForm, setAddForm] = useState({
    staff_id: "",
    full_name: "",
    email: "",
    phone_number: "",
    faculty_id: "",
    department_id: "",
    office: "",
    class_ids: [] as string[],
    course_ids: [] as string[],
  });

  const supabase = createClient();

  async function fetchLecturers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "lecturer")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load lecturers");
      setLoading(false);
      return;
    }

    setLecturers(data || []);
    setLoading(false);
  }

  async function fetchDepartments() {
    const supabase = createClient();
    const [deptRes, facRes, classRes, courseRes] = await Promise.all([
      supabase.from("departments").select("*").order("name"),
      supabase.from("faculties").select("id, name").order("name"),
      supabase.from("classes").select("id, name").order("name"),
      supabase.from("courses").select("id, name, code").order("name"),
    ]);

    if (deptRes.data) {
      setDepartments(deptRes.data);
    }
    if (facRes.data) setFaculties(facRes.data);
    if (classRes.data) setClasses(classRes.data);
    if (courseRes.data) setCourses(courseRes.data);
  }

  useEffect(() => {
    async function init() {
      await Promise.all([fetchLecturers(), fetchDepartments()]);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateLecturer() {
    if (!addForm.staff_id.trim() || !addForm.full_name.trim() || !addForm.email.trim()) {
      toast.error("Please fill in Staff ID, Full Name, and Email");
      return;
    }
    if (!addForm.department_id) {
      toast.error("Please select a department");
      return;
    }

    setSaving(true);

    const tempPassword = generateTempPassword();
    const { data, error: authError } = await supabase.auth.signUp({
      email: addForm.email.trim(),
      password: tempPassword,
      options: {
        data: {
          full_name: addForm.full_name.trim(),
          role: "lecturer",
        },
      },
    });

    if (authError || !data.user) {
      toast.error(authError?.message || "Failed to create lecturer account");
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email: addForm.email.trim(),
      full_name: addForm.full_name.trim(),
      staff_id: addForm.staff_id.trim(),
      phone_number: addForm.phone_number.trim() || null,
      faculty_id: addForm.faculty_id || null,
      department_id: addForm.department_id,
      office: addForm.office.trim() || null,
      role: "lecturer",
      account_status: "approved",
      must_change_password: true,
    });

    if (profileError) {
      toast.error(profileError.message);
      setSaving(false);
      return;
    }

    if (addForm.course_ids.length > 0) {
      await supabase
        .from("courses")
        .update({ lecturer_id: data.user.id })
        .in("id", addForm.course_ids);
    }

    if (addForm.class_ids.length > 0) {
      for (const classId of addForm.class_ids) {
        for (const courseId of addForm.course_ids) {
          await supabase.from("course_assignments").upsert(
            { class_id: classId, course_id: courseId, lecturer_id: data.user.id },
            { onConflict: "class_id,course_id" }
          );
        }
      }
    }

    try {
      await supabase.from("audit_logs").insert({
        user_id: data.user.id,
        action: "create_lecturer",
        entity_type: "profiles",
        entity_id: data.user.id,
        new_value: { note: `Lecturer created with staff id ${addForm.staff_id.trim()}` },
      });
    } catch {
      // non-blocking
    }

    setGeneratedPassword(tempPassword);
    setTempPasswordDialog(true);
    setAddDialogOpen(false);
    setAddForm({
      staff_id: "",
      full_name: "",
      email: "",
      phone_number: "",
      faculty_id: "",
      department_id: "",
      office: "",
      class_ids: [],
      course_ids: [],
    });
    setSaving(false);
    toast.success("Lecturer account created");
    fetchLecturers();
  }

  function toggleArrayItem(field: "class_ids" | "course_ids", id: string) {
    setAddForm((prev) => {
      const current = prev[field];
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      return { ...prev, [field]: next };
    });
  }

  async function updateStatus(
    lecturerId: string,
    newStatus: Profile["account_status"],
    actionLabel: string
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("profiles") as any)
      .update({ account_status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", lecturerId);

    if (error) {
      toast.error(`Failed to ${actionLabel} lecturer`);
      return;
    }

    toast.success(`Lecturer ${actionLabel} successfully`);
    setLecturers((prev) =>
      prev.map((l) =>
        l.id === lecturerId
          ? { ...l, account_status: newStatus, updated_at: new Date().toISOString() }
          : l
      )
    );
  }

  async function handleSaveEdit() {
    if (!editingLecturer) return;

    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("profiles") as any)
      .update({
        full_name: editForm.full_name,
        email: editForm.email,
        phone_number: editForm.phone_number || null,
        national_id: editForm.national_id || null,
        department_id: editForm.department_id || null,
        account_status: editForm.account_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingLecturer.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to update lecturer details");
      return;
    }

    toast.success("Lecturer details updated successfully");
    setEditDialogOpen(false);
    setEditingLecturer(null);
    fetchLecturers();
  }

  function openEditDialog(lecturer: Profile) {
    setEditingLecturer(lecturer);
    setEditForm({
      full_name: lecturer.full_name,
      email: lecturer.email,
      phone_number: lecturer.phone_number || "",
      national_id: lecturer.national_id || "",
      department_id: lecturer.department_id || "",
      account_status: lecturer.account_status,
    });
    setEditDialogOpen(true);
  }

  function getDepartmentName(id: string | null): string {
    if (!id) return "—";
    const dept = departments.find((d) => d.id === id);
    return dept ? dept.name : "—";
  }

  const filteredLecturers = useMemo(() => {
    let result = lecturers;

    if (activeFilter !== "all") {
      if (activeFilter === "suspended") {
        result = result.filter(
          (l) => l.account_status === "suspended" || l.account_status === "rejected"
        );
      } else {
        result = result.filter((l) => l.account_status === activeFilter);
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.full_name.toLowerCase().includes(query) ||
          l.email.toLowerCase().includes(query)
      );
    }

    return result;
  }, [lecturers, activeFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = lecturers.length;
    const pending = lecturers.filter((l) => l.account_status === "pending").length;
    const approved = lecturers.filter((l) => l.account_status === "approved").length;
    const suspended =
      lecturers.filter(
        (l) =>
          l.account_status === "suspended" || l.account_status === "rejected"
      ).length;
    return { total, pending, approved, suspended };
  }, [lecturers]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading lecturers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Lecturer Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage lecturer accounts, approvals, and permissions.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            setAddForm({
              staff_id: "",
              full_name: "",
              email: "",
              phone_number: "",
              faculty_id: "",
              department_id: "",
              office: "",
              class_ids: [],
              course_ids: [],
            });
            setAddDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add Lecturer
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Lecturers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
              <Clock className="size-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.approved}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
              <Ban className="size-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.suspended}</p>
              <p className="text-xs text-muted-foreground">
                Suspended / Rejected
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lecturers</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full pl-8 sm:w-64"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pt-1">
            {FILTER_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant={activeFilter === tab.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(tab.value)}
              >
                {tab.label}
                {tab.value !== "all" && (
                  <span className="ml-1.5 text-xs opacity-70">
                    {tab.value === "pending"
                      ? stats.pending
                      : tab.value === "approved"
                        ? stats.approved
                        : stats.suspended}
                  </span>
                )}
                {tab.value === "all" && (
                  <span className="ml-1.5 text-xs opacity-70">
                    {stats.total}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {filteredLecturers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Inbox className="size-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium text-muted-foreground">
                  No lecturers found
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : activeFilter !== "all"
                      ? `No ${activeFilter} lecturers at the moment`
                      : "No lecturer accounts have been created yet"}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Department
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Joined
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLecturers.map((lecturer) => (
                  <TableRow key={lecturer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {lecturer.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <span className="font-medium">
                          {lecturer.full_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lecturer.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {getDepartmentName(lecturer.department_id)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(lecturer.account_status)}
                      >
                        {lecturer.account_status.charAt(0).toUpperCase() +
                          lecturer.account_status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatDate(lecturer.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {lecturer.account_status === "pending" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() =>
                                updateStatus(lecturer.id, "approved", "approved")
                              }
                            >
                              <Check className="size-3.5" />
                              <span className="hidden sm:inline">Approve</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                updateStatus(lecturer.id, "rejected", "rejected")
                              }
                            >
                              <X className="size-3.5" />
                              <span className="hidden sm:inline">Reject</span>
                            </Button>
                          </>
                        )}
                        {lecturer.account_status === "approved" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              updateStatus(
                                lecturer.id,
                                "suspended",
                                "suspended"
                              )
                            }
                          >
                            <ShieldOff className="size-3.5" />
                            <span className="hidden sm:inline">Suspend</span>
                          </Button>
                        )}
                        {(lecturer.account_status === "suspended" ||
                          lecturer.account_status === "rejected") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatus(
                                lecturer.id,
                                "approved",
                                "reactivated"
                              )
                            }
                          >
                            <RotateCcw className="size-3.5" />
                            <span className="hidden sm:inline">
                              Reactivate
                            </span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(lecturer)}
                        >
                          <Pencil className="size-3.5" />
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
            <DialogTitle>Add Lecturer</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto py-2 pr-1">
            <div className="space-y-2">
              <Label htmlFor="add-staff">Staff ID *</Label>
              <Input
                id="add-staff"
                value={addForm.staff_id}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, staff_id: e.target.value }))
                }
                placeholder="e.g. LEC-1001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-name">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="add-name"
                  value={addForm.full_name}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  className="pl-8"
                  placeholder="Enter full name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="add-email"
                  type="email"
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="pl-8"
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-phone">Phone Number</Label>
              <Input
                id="add-phone"
                value={addForm.phone_number}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, phone_number: e.target.value }))
                }
                placeholder="Enter phone number"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Faculty</Label>
                <Select
                  value={addForm.faculty_id}
                  onValueChange={(value) =>
                    setAddForm((prev) => ({
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
                    {faculties.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select
                  value={addForm.department_id}
                  onValueChange={(value) =>
                    setAddForm((prev) => ({
                      ...prev,
                      department_id: value ?? "",
                    }))
                  }
                  disabled={!addForm.faculty_id}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        addForm.faculty_id
                          ? "Select department"
                          : "Select faculty first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {departments
                      .filter((d) => d.faculty_id === addForm.faculty_id)
                      .map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-office">Office</Label>
              <Input
                id="add-office"
                value={addForm.office}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, office: e.target.value }))
                }
                placeholder="e.g. Office 205, Science Building"
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned Courses</Label>
              <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border p-2">
                {courses.length === 0 && (
                  <p className="px-2 py-1 text-xs text-muted-foreground">
                    No courses available
                  </p>
                )}
                {courses.map((course) => (
                  <label
                    key={course.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={addForm.course_ids.includes(course.id)}
                      onChange={() => toggleArrayItem("course_ids", course.id)}
                      className="size-4 rounded border-slate-300 text-sky-600 accent-sky-600"
                    />
                    {course.name} ({course.code})
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assigned Classes</Label>
              <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border p-2">
                {classes.length === 0 && (
                  <p className="px-2 py-1 text-xs text-muted-foreground">
                    No classes available
                  </p>
                )}
                {classes.map((cls) => (
                  <label
                    key={cls.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={addForm.class_ids.includes(cls.id)}
                      onChange={() => toggleArrayItem("class_ids", cls.id)}
                      className="size-4 rounded border-slate-300 text-sky-600 accent-sky-600"
                    />
                    {cls.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLecturer} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Lecturer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={tempPasswordDialog} onOpenChange={setTempPasswordDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Temporary Password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The lecturer must use this temporary password on their first login.
            They will be required to change it before accessing the dashboard.
            In production, this is delivered by email.
          </p>
          <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted p-3">
            <code className="text-sm font-semibold">{generatedPassword}</code>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                navigator.clipboard?.writeText(generatedPassword);
                toast.success("Copied to clipboard");
              }}
            >
              <Copy className="size-3.5" />
            </Button>
          </div>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setTempPasswordDialog(false)}
            >
              <KeyRound className="size-3.5" />
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lecturer Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="edit-name"
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  className="pl-8"
                  placeholder="Enter full name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="pl-8"
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editForm.phone_number}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    phone_number: e.target.value,
                  }))
                }
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-national-id">National ID</Label>
              <Input
                id="edit-national-id"
                value={editForm.national_id}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    national_id: e.target.value,
                  }))
                }
                placeholder="Enter national ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={editForm.department_id}
                onValueChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    department_id: value ?? "",
                  }))
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
              <Label>Status</Label>
              <Select
                value={editForm.account_status}
                onValueChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    account_status: (value ?? "pending") as Profile["account_status"],
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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
                setEditingLecturer(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
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
    </div>
  );
}
