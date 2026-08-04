"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";

type Faculty = { id: string; name: string };
type Department = { id: string; name: string; faculty_id: string | null };
type Program = { id: string; name: string; code: string; department_id: string | null };
type AcademicYear = { id: string; name: string };
type Semester = { id: string; name: string; academic_year_id: string };
type ClassItem = {
  id: string;
  name: string;
  year: number;
  section: string;
  program_id: string;
  academic_year_id: string | null;
  semester_id: string | null;
};
type ImportedStudent = {
  id?: string;
  full_name?: string;
  registration_number?: string;
  program?: string | null;
};

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  rollNumber: "",
  facultyId: "",
  departmentId: "",
  programId: "",
  academicYearId: "",
  semesterId: "",
  classId: "",
  gender: "",
  dateOfBirth: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingReg, setCheckingReg] = useState(false);
  const [regMatch, setRegMatch] = useState<ImportedStudent | null>(null);

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [facs, depts, progs, years, sems, cls] = await Promise.all([
        supabase.from("faculties").select("id, name").order("name"),
        supabase.from("departments").select("id, name, faculty_id").order("name"),
        supabase.from("programs").select("id, name, code, department_id").order("name"),
        supabase.from("academic_years").select("id, name").order("name"),
        supabase.from("semesters").select("id, name, academic_year_id").order("name"),
        supabase.from("classes").select("id, name, year, section, program_id, academic_year_id, semester_id").order("name"),
      ]);
      setFaculties(facs.data || []);
      setDepartments(depts.data || []);
      setPrograms(progs.data || []);
      setAcademicYears(years.data || []);
      setSemesters(sems.data || []);
      setClasses(cls.data || []);
    }
    load();
  }, []);

  const filteredDepartments = useMemo(
    () => departments.filter((d) => d.faculty_id === form.facultyId),
    [departments, form.facultyId]
  );
  const filteredPrograms = useMemo(
    () => programs.filter((p) => p.department_id === form.departmentId),
    [programs, form.departmentId]
  );
  const filteredSemesters = useMemo(
    () => semesters.filter((s) => s.academic_year_id === form.academicYearId),
    [semesters, form.academicYearId]
  );
  const filteredClasses = useMemo(
    () =>
      classes.filter(
        (c) =>
          c.program_id === form.programId &&
          (!form.academicYearId || c.academic_year_id === form.academicYearId) &&
          (!form.semesterId || c.semester_id === form.semesterId)
      ),
    [classes, form.programId, form.academicYearId, form.semesterId]
  );

  function updateForm(field: string, value: string | null) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value ?? "" };
      if (field === "facultyId") {
        updated.departmentId = "";
        updated.programId = "";
        updated.classId = "";
      }
      if (field === "departmentId") {
        updated.programId = "";
        updated.classId = "";
      }
      if (field === "programId") {
        updated.classId = "";
      }
      if (field === "academicYearId") {
        updated.semesterId = "";
        updated.classId = "";
      }
      if (field === "semesterId") {
        updated.classId = "";
      }
      return updated;
    });
  }

  async function checkRegistrationNumber() {
    const value = form.rollNumber.trim();
    if (!value) {
      setRegMatch(null);
      return;
    }

    setCheckingReg(true);
    setRegMatch(null);

    const supabase = createClient();
    const { data, error: regError } = await supabase
      .from("imported_students")
      .select("*")
      .eq("registration_number", value)
      .maybeSingle();

    setCheckingReg(false);

    if (regError) {
      return;
    }

    if (data) {
      setRegMatch(data);
      if (!form.firstName && data.full_name) {
        const parts = String(data.full_name).split(" ");
        setForm((prev) => ({
          ...prev,
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" "),
        }));
      }
    } else {
      toast.error("Registration number not found. Contact the administrator.");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const required: [string, string][] = [
      [form.rollNumber, "Registration Number"],
      [form.firstName, "First Name"],
      [form.lastName, "Last Name"],
      [form.email, "Email"],
      [form.facultyId, "Faculty"],
      [form.departmentId, "Department"],
      [form.programId, "Program"],
      [form.academicYearId, "Academic Year"],
      [form.classId, "Class / Section"],
      [form.gender, "Gender"],
      [form.dateOfBirth, "Date of Birth"],
    ];

    for (const [value, label] of required) {
      if (!value) {
        setError(`${label} is required.`);
        return;
      }
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    if (!regMatch) {
      const { data: regData } = await supabase
        .from("imported_students")
        .select("*")
        .eq("registration_number", form.rollNumber.trim())
        .maybeSingle();

      if (!regData) {
        setError(
          "This Registration Number does not exist in the university's records. Please contact the administrator."
        );
        setLoading(false);
        return;
      }
      setRegMatch(regData);
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          full_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          role: "student",
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        email: form.email.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        full_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        role: "student",
        phone_number: form.phoneNumber.trim() || null,
        student_id: form.rollNumber.trim(),
        faculty_id: form.facultyId,
        department_id: form.departmentId,
        program_id: form.programId,
        class_id: form.classId,
        gender: form.gender,
        date_of_birth: form.dateOfBirth || null,
        account_status: "approved",
      });

      if (profileError) {
        if (profileError.message?.includes("student_id")) {
          setError("This registration number is already registered.");
          setLoading(false);
          return;
        }
        console.error("Profile error:", profileError);
      }

      try {
        await supabase.from("audit_logs").insert({
          user_id: data.user.id,
          action: "register",
          entity_type: "profiles",
          entity_id: data.user.id,
          new_value: "Student self-registration",
        });
      } catch {
        // non-blocking
      }
    }

    toast.success(
      "Registration successful! Please enroll your biometric details to secure your account."
    );
    router.push("/biometrics");
    setLoading(false);
  }

  const passwordOk =
    form.password.length >= 8 &&
    /[A-Z]/.test(form.password) &&
    /[a-z]/.test(form.password) &&
    /[0-9]/.test(form.password) &&
    /[^A-Za-z0-9]/.test(form.password);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-10">
      <div className="w-full max-w-2xl [animation:fade-up_0.5s_ease_both]">
        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-900/5">
          <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-sky-500 px-6 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white backdrop-blur">
              SA
            </div>
            <CardTitle className="text-2xl text-white">
              Create Student Account
            </CardTitle>
            <CardDescription className="text-sky-100/80">
              Register with your university details to get started
            </CardDescription>
          </div>

          <CardContent className="px-6 py-6 sm:px-8">
            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs text-sky-700">
                Only students can register. Lecturer and admin accounts are
                created by the university administrator.
              </div>

              <div className="space-y-2">
                <Label htmlFor="rollNumber">
                  Student Registration Number *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="rollNumber"
                    placeholder="e.g., 20240001"
                    value={form.rollNumber}
                    onChange={(e) => {
                      updateForm("rollNumber", e.target.value);
                      setRegMatch(null);
                    }}
                    onBlur={checkRegistrationNumber}
                    required
                  />
                </div>
                {checkingReg && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Checking registration number...
                  </div>
                )}
                {regMatch && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 p-2 text-xs text-green-700">
                    <CheckCircle2 className="size-4 shrink-0" />
                    Verified: {regMatch.full_name}
                    {regMatch.program && ` · ${regMatch.program}`}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={form.firstName}
                    onChange={(e) => updateForm("firstName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={(e) => updateForm("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@university.edu"
                    value={form.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+250 7XX XXX XXX"
                    value={form.phoneNumber}
                    onChange={(e) => updateForm("phoneNumber", e.target.value)}
                    required
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Faculty *</Label>
                  <Select
                    value={form.facultyId}
                    onValueChange={(v) => updateForm("facultyId", v)}
                  >
                    <SelectTrigger>
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
                    value={form.departmentId}
                    onValueChange={(v) => updateForm("departmentId", v)}
                    disabled={!form.facultyId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          form.facultyId
                            ? "Select department"
                            : "Select faculty first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDepartments.map((d) => (
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
                  value={form.programId}
                  onValueChange={(v) => updateForm("programId", v)}
                  disabled={!form.departmentId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        form.departmentId
                          ? "Select program"
                          : "Select department first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPrograms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Academic Year *</Label>
                  <Select
                    value={form.academicYearId}
                    onValueChange={(v) => updateForm("academicYearId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
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
                  <Label>Semester *</Label>
                  <Select
                    value={form.semesterId}
                    onValueChange={(v) => updateForm("semesterId", v)}
                    disabled={!form.academicYearId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          form.academicYearId
                            ? "Select semester"
                            : "Select academic year first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSemesters.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Class / Section *</Label>
                <Select
                  value={form.classId}
                  onValueChange={(v) => updateForm("classId", v)}
                  disabled={!form.programId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        form.programId
                          ? "Select your class"
                          : "Select program first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        No classes available for the selected options
                      </div>
                    )}
                    {filteredClasses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => updateForm("gender", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => updateForm("dateOfBirth", e.target.value)}
                    required
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => updateForm("password", e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        updateForm("confirmPassword", e.target.value)
                      }
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {form.password && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Password requirements
                  </Label>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    {[
                      ["8+ characters", form.password.length >= 8],
                      ["Uppercase letter", /[A-Z]/.test(form.password)],
                      ["Lowercase letter", /[a-z]/.test(form.password)],
                      ["Number", /[0-9]/.test(form.password)],
                      ["Special character", /[^A-Za-z0-9]/.test(form.password)],
                    ].map(([label, ok]) => (
                      <div
                        key={label as string}
                        className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-600" : "text-muted-foreground"
                          }`}
                      >
                        <CheckCircle2 className="size-3.5" />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-500 to-sky-600"
                disabled={loading || !passwordOk}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-sky-600 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
