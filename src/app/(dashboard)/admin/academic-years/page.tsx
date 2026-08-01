"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  semesters?: Semester[];
  classes_count?: number;
  students_count?: number;
}

interface Semester {
  id: string;
  name: string;
  academic_year_id: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export default function AdminAcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showYearDialog, setShowYearDialog] = useState(false);
  const [showSemesterDialog, setShowSemesterDialog] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [yearForm, setYearForm] = useState({ name: "", start_date: "", end_date: "" });
  const [semForm, setSemForm] = useState({ name: "", start_date: "", end_date: "" });
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const [yearsRes, semsRes, classesRes, studentsRes] = await Promise.all([
      supabase.from("academic_years").select("*").order("start_date", { ascending: false }),
      supabase.from("semesters").select("*").order("start_date"),
      supabase.from("classes").select("id, academic_year_id"),
      supabase.from("profiles").select("class_id").eq("role", "student"),
    ]);

    const semsData = semsRes.data || [];
    const classesData = classesRes.data || [];
    const studentsData = studentsRes.data || [];

    const yearsWithSems = (yearsRes.data || []).map((y) => {
      const classIds = new Set(classesData.filter((c) => c.academic_year_id === y.id).map((c) => c.id));
      return {
        ...y,
        semesters: semsData.filter((s) => s.academic_year_id === y.id),
        classes_count: classesData.filter((c) => c.academic_year_id === y.id).length,
        students_count: studentsData.filter((s) => s.class_id && classIds.has(s.class_id)).length,
      };
    });
    setYears(yearsWithSems);
    setLoading(false);
  }

  async function handleSaveYear() {
    if (!yearForm.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (!yearForm.start_date || !yearForm.end_date) {
      toast.error("Start and end dates are required.");
      return;
    }
    const supabase = createClient();
    if (editingYear) {
      const { error } = await supabase.from("academic_years").update(yearForm).eq("id", editingYear.id);
      if (error) { toast.error("Failed to update: " + error.message); return; }
    } else {
      const { error } = await supabase.from("academic_years").insert(yearForm);
      if (error) { toast.error("Failed to create: " + error.message); return; }
    }
    toast.success(editingYear ? "Academic year updated." : "Academic year created.");
    setShowYearDialog(false);
    setEditingYear(null);
    setYearForm({ name: "", start_date: "", end_date: "" });
    loadData();
  }

  async function handleDeleteYear(id: string) {
    if (!window.confirm("Delete this academic year? Semesters and classes linked to it may be blocked.")) {
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("academic_years").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete: " + error.message);
      return;
    }
    toast.success("Deleted.");
    loadData();
  }

  async function handleSetCurrentYear(id: string) {
    const supabase = createClient();
    await supabase.from("academic_years").update({ is_current: false }).neq("id", id);
    await supabase.from("academic_years").update({ is_current: true }).eq("id", id);
    toast.success("Current academic year set.");
    loadData();
  }

  function openAddSemester(yearId: string) {
    setSelectedYearId(yearId);
    setEditingSemester(null);
    setSemForm({ name: "", start_date: "", end_date: "" });
    setShowSemesterDialog(true);
  }

  async function handleSaveSemester() {
    const supabase = createClient();
    if (editingSemester) {
      const { error } = await supabase.from("semesters").update({ ...semForm }).eq("id", editingSemester.id);
      if (error) { toast.error("Failed to update: " + error.message); return; }
    } else {
      const { error } = await supabase.from("semesters").insert({ ...semForm, academic_year_id: selectedYearId });
      if (error) { toast.error("Failed to create: " + error.message); return; }
    }
    toast.success(editingSemester ? "Semester updated." : "Semester created.");
    setShowSemesterDialog(false);
    loadData();
  }

  async function handleDeleteSemester(semId: string) {
    if (!window.confirm("Delete this semester?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("semesters").delete().eq("id", semId);
    if (error) {
      toast.error("Could not delete: " + error.message);
      return;
    }
    toast.success("Semester deleted.");
    loadData();
  }

  async function handleSetCurrentSemester(semId: string, yearId: string) {
    const supabase = createClient();
    await supabase.from("semesters").update({ is_current: false }).eq("academic_year_id", yearId);
    await supabase.from("semesters").update({ is_current: true }).eq("id", semId);
    toast.success("Current semester set.");
    loadData();
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
        <h1 className="text-2xl font-bold text-foreground">Academic Years & Semesters</h1>
        <Button onClick={() => { setEditingYear(null); setYearForm({ name: "", start_date: "", end_date: "" }); setShowYearDialog(true); }}>
          Add Academic Year
        </Button>
      </div>

      {years.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No academic years found.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {years.map((year) => (
            <Card key={year.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>{year.name}</CardTitle>
                  {year.is_current && <Badge className="bg-green-100 text-green-800">Current</Badge>}
                </div>
                <div className="flex gap-2">
                  {!year.is_current && (
                    <Button variant="outline" size="sm" onClick={() => handleSetCurrentYear(year.id)}>Set Current</Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => { setEditingYear(year); setYearForm({ name: year.name, start_date: year.start_date, end_date: year.end_date }); setShowYearDialog(true); }}>Edit</Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteYear(year.id)}>Delete</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {formatDate(year.start_date)} - {formatDate(year.end_date)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md border bg-secondary px-2 py-1 text-xs text-foreground">
                      {year.semesters?.length || 0} semester{(year.semesters?.length || 0) === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-md border bg-secondary px-2 py-1 text-xs text-foreground">
                      {year.classes_count ?? 0} classes
                    </span>
                    <span className="rounded-md border bg-secondary px-2 py-1 text-xs text-foreground">
                      {year.students_count ?? 0} students
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Semesters</h3>
                  <Button variant="outline" size="sm" onClick={() => openAddSemester(year.id)}>Add Semester</Button>
                </div>
                {year.semesters && year.semesters.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {year.semesters.map((sem) => (
                      <div key={sem.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <p className="text-sm font-medium">{sem.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(sem.start_date)} - {formatDate(sem.end_date)}</p>
                          {sem.is_current && <Badge className="mt-1 text-xs">Current</Badge>}
                        </div>
                        <div className="flex gap-1">
                          {!sem.is_current && (
                            <Button variant="ghost" size="sm" onClick={() => handleSetCurrentSemester(sem.id, year.id)}>Set Current</Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => { setEditingSemester(sem); setSelectedYearId(year.id); setSemForm({ name: sem.name, start_date: sem.start_date, end_date: sem.end_date }); setShowSemesterDialog(true); }}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteSemester(sem.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No semesters yet.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showYearDialog} onOpenChange={setShowYearDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingYear ? "Edit" : "Add"} Academic Year</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={yearForm.name} onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })} placeholder="2025-2026" /></div>
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={yearForm.start_date} onChange={(e) => setYearForm({ ...yearForm, start_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="date" value={yearForm.end_date} onChange={(e) => setYearForm({ ...yearForm, end_date: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowYearDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveYear}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSemesterDialog} onOpenChange={setShowSemesterDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSemester ? "Edit" : "Add"} Semester</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={semForm.name} onChange={(e) => setSemForm({ ...semForm, name: e.target.value })} placeholder="Semester 1" /></div>
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={semForm.start_date} onChange={(e) => setSemForm({ ...semForm, start_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="date" value={semForm.end_date} onChange={(e) => setSemForm({ ...semForm, end_date: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSemesterDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveSemester}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
