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
  CalendarClock,
  BookOpen,
} from "lucide-react";

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

type TimetableEntry = {
  id: string;
  class_id: string;
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  created_at: string;
  classes?: { id: string; name: string } | null;
  courses?: { id: string; name: string; code: string } | null;
};

type ClassItem = { id: string; name: string };
type Course = { id: string; name: string; code: string };

const EMPTY_FORM = {
  class_id: "",
  course_id: "",
  day_of_week: 1,
  start_time: "08:00",
  end_time: "09:30",
  room: "",
};

export default function AdminTimetablePage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<TimetableEntry | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    const [entryResult, classResult, courseResult] = await Promise.all([
      supabase
        .from("timetable")
        .select("*, classes(id, name), courses(id, name, code)")
        .order("day_of_week")
        .order("start_time"),
      supabase.from("classes").select("id, name").order("name"),
      supabase.from("courses").select("id, name, code").order("name"),
    ]);

    if (entryResult.error || classResult.error || courseResult.error) {
      toast.error("Failed to fetch timetable");
      setLoading(false);
      return;
    }

    setEntries((entryResult.data as TimetableEntry[]) || []);
    setClasses(classResult.data || []);
    setCourses(courseResult.data || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = entries;
    if (classFilter !== "all") {
      list = list.filter((e) => e.class_id === classFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.classes?.name?.toLowerCase().includes(q) ||
          e.courses?.name?.toLowerCase().includes(q) ||
          e.courses?.code?.toLowerCase().includes(q) ||
          e.room?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [entries, classFilter, search]);

  function dayLabel(day: number): string {
    return DAYS.find((d) => d.value === day)?.label || String(day);
  }

  function formatTime(time: string): string {
    if (!time) return "—";
    const [h, m] = time.split(":");
    if (!h) return time;
    const hour = Number(h);
    const suffix = hour >= 12 ? "PM" : "AM";
    const display = hour % 12 === 0 ? 12 : hour % 12;
    return `${display}:${m || "00"} ${suffix}`;
  }

  const openAddDialog = () => {
    setEditingEntry(null);
    setForm(EMPTY_FORM);
    setAddDialogOpen(true);
  };

  const openEditDialog = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setForm({
      class_id: entry.class_id,
      course_id: entry.course_id,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time?.slice(0, 5) || "08:00",
      end_time: entry.end_time?.slice(0, 5) || "09:30",
      room: entry.room || "",
    });
    setEditDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.class_id || !form.course_id) {
      toast.error("Please select a class and a course");
      return;
    }
    if (form.end_time <= form.start_time) {
      toast.error("End time must be after start time");
      return;
    }

    setSaving(true);

    if (editingEntry) {
      const { error } = await supabase
        .from("timetable")
        .update({
          class_id: form.class_id,
          course_id: form.course_id,
          day_of_week: form.day_of_week,
          start_time: form.start_time,
          end_time: form.end_time,
          room: form.room.trim() || null,
        })
        .eq("id", editingEntry.id);

      setSaving(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Timetable entry updated");
      setEditDialogOpen(false);
    } else {
      const { error } = await supabase.from("timetable").insert({
        class_id: form.class_id,
        course_id: form.course_id,
        day_of_week: form.day_of_week,
        start_time: form.start_time,
        end_time: form.end_time,
        room: form.room.trim() || null,
      });

      setSaving(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Timetable entry added");
      setAddDialogOpen(false);
    }

    setForm(EMPTY_FORM);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;

    setSaving(true);
    const { error } = await supabase
      .from("timetable")
      .delete()
      .eq("id", deletingEntry.id);
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Timetable entry removed");
    setDeleteDialogOpen(false);
    setDeletingEntry(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading timetable...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
        <p className="text-sm text-muted-foreground">
          Manage the weekly class schedule.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
              <CalendarClock className="size-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{entries.length}</p>
              <p className="text-xs text-muted-foreground">Total Slots</p>
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
              <BookOpen className="size-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{classes.length}</p>
              <p className="text-xs text-muted-foreground">Classes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Weekly Schedule</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={classFilter} onValueChange={(v) => setClassFilter(v ?? "")}>
                <SelectTrigger className="h-8 w-full sm:w-56">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-full pl-8 sm:w-48"
                />
              </div>
              <Button size="sm" onClick={openAddDialog}>
                <Plus className="size-3.5" />
                Add Slot
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
                  No timetable entries found
                </p>
                <p className="text-xs text-muted-foreground">
                  {search || classFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No timetable entries have been created yet"}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead className="hidden sm:table-cell">Time</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Course
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Room</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge
                        variant={
                          entry.day_of_week === 1 ? "default" : "secondary"
                        }
                      >
                        {dayLabel(entry.day_of_week)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground whitespace-nowrap">
                      {formatTime(entry.start_time)} –{" "}
                      {formatTime(entry.end_time)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {entry.classes?.name || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {entry.courses?.name || "—"}
                      {entry.courses && (
                        <Badge variant="secondary" className="ml-1.5">
                          {entry.courses.code}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {entry.room || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(entry)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setDeletingEntry(entry);
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
            <DialogTitle>Add Timetable Slot</DialogTitle>
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
              <Label>Day *</Label>
              <Select
                value={String(form.day_of_week)}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    day_of_week: Number(value),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      start_time: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, end_time: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Room</Label>
              <Input
                value={form.room}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, room: e.target.value }))
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
                "Add Slot"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Timetable Slot</DialogTitle>
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
              <Label>Day *</Label>
              <Select
                value={String(form.day_of_week)}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    day_of_week: Number(value),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      start_time: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, end_time: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Room</Label>
              <Input
                value={form.room}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, room: e.target.value }))
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
                setEditingEntry(null);
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
            <DialogTitle>Delete Timetable Slot</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete the{" "}
            <span className="font-medium text-foreground">
              {dayLabel(deletingEntry?.day_of_week || 1)} {formatTime(deletingEntry?.start_time || "")} –{" "}
              {formatTime(deletingEntry?.end_time || "")}
            </span>{" "}
            slot for{" "}
            <span className="font-medium text-foreground">
              {deletingEntry?.classes?.name}
            </span>
            ?
          </p>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingEntry(null);
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
