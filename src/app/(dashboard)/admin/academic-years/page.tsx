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
    const { data: yearsData } = await supabase.from("academic_years").select("*").order("start_date", { ascending: false });
    const { data: semsData } = await supabase.from("semesters").select("*").order("start_date");

    const yearsWithSems = (yearsData || []).map((y) => ({
      ...y,
      semesters: (semsData || []).filter((s) => s.academic_year_id === y.id),
    }));
    setYears(yearsWithSems);
    setLoading(false);
  }

  async function handleSaveYear() {
    const supabase = createClient();
    if (editingYear) {
      const { error } = await supabase.from("academic_years").update(yearForm).eq("id", editingYear.id);
      if (error) { toast.error("Failed to update."); return; }
    } else {
      const { error } = await supabase.from("academic_years").insert(yearForm);
      if (error) { toast.error("Failed to create."); return; }
    }
    toast.success(editingYear ? "Academic year updated." : "Academic year created.");
    setShowYearDialog(false);
    setEditingYear(null);
    setYearForm({ name: "", start_date: "", end_date: "" });
    loadData();
  }

  async function handleDeleteYear(id: string) {
    const supabase = createClient();
    await supabase.from("academic_years").delete().eq("id", id);
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
      if (error) { toast.error("Failed to update."); return; }
    } else {
      const { error } = await supabase.from("semesters").insert({ ...semForm, academic_year_id: selectedYearId });
      if (error) { toast.error("Failed to create."); return; }
    }
    toast.success(editingSemester ? "Semester updated." : "Semester created.");
    setShowSemesterDialog(false);
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
                <div className="text-sm text-muted-foreground">
                  {formatDate(year.start_date)} - {formatDate(year.end_date)}
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
