"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  UploadCloud,
  Loader2,
  FileUp,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Trash2,
  Database,
} from "lucide-react";

type ParsedRow = {
  registration_number: string;
  full_name: string;
  email: string | null;
  faculty: string | null;
  department: string | null;
  program: string | null;
  academic_year: string | null;
  semester: string | null;
  class_name: string | null;
  valid: boolean;
  reason?: string;
};

const HEADER_SYNONYMS: Record<string, string[]> = {
  registration_number: ["registration_number", "registrationnumber", "reg no", "regno", "reg", "registration", "student id", "studentid", "adm", "adm no"],
  full_name: ["full_name", "fullname", "name", "student name", "studentname", "names", "student"],
  email: ["email", "e mail", "email address", "emailaddress"],
  faculty: ["faculty", "faculty name", "facultyname", "school"],
  department: ["department", "department name", "departmentname", "dept", "dept name"],
  program: ["program", "programme", "program name", "programname", "degree"],
  academic_year: ["academic_year", "academicyear", "academic year", "academic yr", "year", "study year"],
  semester: ["semester", "sem", "semester name", "semestername"],
  class_name: ["class_name", "classname", "class", "class name", "section"],
};

const COLUMN_ORDER: (keyof ParsedRow)[] = [
  "registration_number",
  "full_name",
  "email",
  "faculty",
  "department",
  "program",
  "academic_year",
  "semester",
  "class_name",
];

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/^"|"$/g, "")
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }

  row.push(field);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

function detectHeaders(headers: string[]): (keyof ParsedRow | "ignore")[] {
  const normalized = headers.map(normalizeHeader);
  const mapping: (keyof ParsedRow | "ignore")[] = [];

  for (const h of normalized) {
    let matched: keyof ParsedRow | undefined;
    for (const [field, synonyms] of Object.entries(HEADER_SYNONYMS)) {
      if (synonyms.includes(h)) {
        matched = field as keyof ParsedRow;
        break;
      }
    }
    mapping.push(matched || "ignore");
  }
  return mapping;
}

function buildRows(data: string[][]): ParsedRow[] {
  if (data.length === 0) return [];

  let mapping: (keyof ParsedRow | "ignore")[];
  let startIndex = 0;

  const isHeaderRow = data[0].some((cell) => {
    const n = normalizeHeader(cell);
    return Object.values(HEADER_SYNONYMS).some((syns) => syns.includes(n));
  });

  if (isHeaderRow) {
    mapping = detectHeaders(data[0]);
    startIndex = 1;
  } else {
    mapping = [...COLUMN_ORDER];
  }

  const rows: ParsedRow[] = [];
  for (let i = startIndex; i < data.length; i++) {
    const cells = data[i];
    const base: Record<string, string | null> = {};

    mapping.forEach((field, idx) => {
      if (field === "ignore") return;
      const value = (cells[idx] || "").trim();
      base[field] = value || null;
    });

    const reg = (base.registration_number || "").trim();
    const name = (base.full_name || "").trim();

    if (!reg && !name) continue;

    const row: ParsedRow = {
      registration_number: reg,
      full_name: name,
      email: base.email || null,
      faculty: base.faculty || null,
      department: base.department || null,
      program: base.program || null,
      academic_year: base.academic_year || null,
      semester: base.semester || null,
      class_name: base.class_name || null,
      valid: true,
    };

    if (!reg) {
      row.valid = false;
      row.reason = "Missing registration number";
    } else if (!name) {
      row.valid = false;
      row.reason = "Missing full name";
    }
    rows.push(row);
  }
  return rows;
}

export default function AdminImportStudentsPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [source, setSource] = useState("");
  const [fileName, setFileName] = useState("");
  const [existingCount, setExistingCount] = useState(0);
  const [defaultClass, setDefaultClass] = useState("");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [defaultProgram, setDefaultProgram] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [years, setYears] = useState<{ id: string; name: string }[]>([]);
  const [sems, setSems] = useState<{ id: string; name: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ added: number; updated: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadContext();
  }, []);

  useEffect(() => {
    if (source) parse(source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultClass, defaultProgram, academicYear, semester]);

  async function loadContext() {
    const supabase = createClient();
    const [countRes, classesRes, programsRes, yearsRes, semsRes] = await Promise.all([
      supabase.from("imported_students").select("id", { count: "exact", head: true }),
      supabase.from("classes").select("id, name"),
      supabase.from("programs").select("id, name"),
      supabase.from("academic_years").select("id, name").eq("is_current", true),
      supabase.from("semesters").select("id, name").eq("is_current", true),
    ]);
    setExistingCount(countRes.count || 0);
    setClasses(classesRes.data || []);
    setPrograms(programsRes.data || []);
    setYears(yearsRes.data || []);
    setSems(semsRes.data || []);
    if ((yearsRes.data || []).length === 1) setAcademicYear(yearsRes.data![0].name);
    if ((semsRes.data || []).length === 1) setSemester(semsRes.data![0].name);
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setSource(text);
      parse(text);
    };
    reader.readAsText(file);
  }

  function parse(text: string) {
    const data = parseCsv(text);
    let parsed = buildRows(data);

    if (defaultClass) parsed = parsed.map((r) => ({ ...r, class_name: r.class_name || defaultClass }));
    if (defaultProgram) parsed = parsed.map((r) => ({ ...r, program: r.program || defaultProgram }));
    if (academicYear) parsed = parsed.map((r) => ({ ...r, academic_year: r.academic_year || academicYear }));
    if (semester) parsed = parsed.map((r) => ({ ...r, semester: r.semester || semester }));

    setRows(parsed);
    setResult(null);
  }

  function handlePasteChange(value: string) {
    setSource(value);
    setFileName("");
    parse(value);
  }

  function clearAll() {
    setSource("");
    setRows([]);
    setFileName("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const stats = useMemo(() => {
    const total = rows.length;
    const valid = rows.filter((r) => r.valid).length;
    return { total, valid, invalid: total - valid };
  }, [rows]);

  async function handleImport() {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error("No valid rows to import.");
      return;
    }

    setImporting(true);
    setResult(null);
    const supabase = createClient();

    let added = 0;
    let updated = 0;
    let skipped = 0;

    const insertable = validRows.map((r) => ({
      registration_number: r.registration_number,
      full_name: r.full_name,
      email: r.email,
      faculty: r.faculty,
      department: r.department,
      program: r.program,
      academic_year: r.academic_year,
      semester: r.semester,
      class_name: r.class_name,
    }));

    const regNumbers = insertable.map((r) => r.registration_number);
    const existingRes = await supabase
      .from("imported_students")
      .select("registration_number")
      .in("registration_number", regNumbers);

    const existing = new Set((existingRes.data || []).map((r) => r.registration_number));

    for (const row of insertable) {
      const { error } = await supabase
        .from("imported_students")
        .upsert(row, { onConflict: "registration_number" });

      if (error) {
        skipped += 1;
      } else if (existing.has(row.registration_number)) {
        updated += 1;
      } else {
        added += 1;
      }
    }

    setImporting(false);
    setResult({ added, updated, skipped });
    loadContext();

    if (added + updated > 0) {
      toast.success(`Imported ${added + updated} student record(s).`);
    } else {
      toast.error("Nothing was imported.");
    }
  }

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import Students</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bulk-import students from a CSV file. Records are keyed by registration number.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Currently Stored</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{existingCount}</p>
            <p className="text-xs text-muted-foreground">imported_students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Parsed Rows</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">from current source</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Ready to Import</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">{stats.valid}</p>
            <p className="text-xs text-muted-foreground">valid rows</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Needs Attention</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">{stats.invalid}</p>
            <p className="text-xs text-muted-foreground">invalid rows</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Student Records</CardTitle>
          <CardDescription>
            Expected columns: registration_number, full_name, email, faculty, department, program, academic_year, semester, class_name.
            Header names are auto-detected (e.g. &quot;Reg No&quot;, &quot;Student Name&quot;).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="upload">
            <TabsList>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="paste">Paste CSV</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="pt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <div
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center hover:border-primary/60 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFile(e.dataTransfer.files?.[0]);
                }}
              >
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">
                  {fileName ? fileName : "Drag & drop your CSV file here, or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
              </div>
            </TabsContent>

            <TabsContent value="paste" className="pt-4">
              <Textarea
                placeholder={"registration_number,full_name,email,faculty,department,program,academic_year,semester,class_name\n" +
                  "CSC-001,Alice Mwangi,alice@example.com,Computer Science,Networking,BSc Computer Science,2025/2026,1,BSc CS Year 1 Section A"}
                value={source}
                onChange={(e) => handlePasteChange(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="default-class">Default Class</Label>
              <select
                id="default-class"
                value={defaultClass}
                onChange={(e) => setDefaultClass(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Auto-detect from CSV</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="default-program">Default Program</Label>
              <select
                id="default-program"
                value={defaultProgram}
                onChange={(e) => setDefaultProgram(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Auto-detect from CSV</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="default-year">Academic Year</Label>
              <select
                id="default-year"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Auto-detect from CSV</option>
                {years.map((y) => (
                  <option key={y.id} value={y.name}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="default-semester">Semester</Label>
              <select
                id="default-semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Auto-detect from CSV</option>
                {sems.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button onClick={handleImport} disabled={importing || stats.valid === 0}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
              {importing ? "Importing..." : `Import ${stats.valid > 0 ? `${stats.valid} Record${stats.valid === 1 ? "" : "s"}` : ""}`}
            </Button>
            <Button variant="outline" onClick={clearAll} disabled={importing || (rows.length === 0 && !source)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>

          {result && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Import Complete
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{result.added} added</Badge>
                <Badge variant="secondary">{result.updated} updated</Badge>
                {result.skipped > 0 && <Badge variant="destructive">{result.skipped} skipped</Badge>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Preview
              <Badge variant="secondary" className="ml-1">
                {rows.length} rows
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration No</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs">{row.registration_number || "-"}</TableCell>
                    <TableCell>{row.full_name || "-"}</TableCell>
                    <TableCell>{row.email || "-"}</TableCell>
                    <TableCell>{row.program || "-"}</TableCell>
                    <TableCell>{row.class_name || "-"}</TableCell>
                    <TableCell>
                      {row.valid ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Valid</Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {row.reason}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveRow(idx)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {rows.length > 50 && (
              <p className="text-xs text-muted-foreground text-center pt-3">
                Showing first 50 of {rows.length} rows.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>CSV Template</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-slate-50 dark:bg-slate-900/60 p-4 text-xs font-mono">
{`registration_number,full_name,email,faculty,department,program,academic_year,semester,class_name
CSC-001,Alice Mwangi,alice@example.com,Computer Science,Networking,BSc Computer Science,2025/2026,1,BSc CS Year 1 Section A
CSC-002,Brian Kimani,brian@example.com,Computer Science,Networking,BSc Computer Science,2025/2026,1,BSc CS Year 1 Section A
CSC-003,Carol Njuguna,carol@example.com,Computer Science,Software Engineering,BSc Computer Science,2025/2026,1,BSc CS Year 1 Section A`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
