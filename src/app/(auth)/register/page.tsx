"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  ArrowRight,
  Loader2,
  User,
  Hash,
  Building2,
  BookOpen,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  rollNumber: "",
  facultyId: "",
  departmentId: "",
  programId: "",
  academicYearId: "",
  semesterId: "",
  classId: "",
  password: "",
  confirmPassword: "",
};

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.86 11.86 0 0 0 0 12c0 1.94.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 24 12C24 5.37 18.63 0 12 0z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24">
      <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
      <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
      <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
    </svg>
  );
}

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

    if (regError) return;

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
        student_id: form.rollNumber.trim(),
        faculty_id: form.facultyId,
        department_id: form.departmentId,
        program_id: form.programId,
        class_id: form.classId,
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

  function handleSocial(provider: string) {
    toast.info(`${provider} sign-up is coming soon. Use the form to register.`);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#081224] px-4 py-12 font-['Inter',sans-serif]">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-1/4 h-[500px] w-[500px] rounded-full bg-[#2563EB]/10 blur-[120px]" />
        <div className="absolute -right-40 bottom-1/4 h-[400px] w-[400px] rounded-full bg-[#38BDF8]/8 blur-[100px]" />
        <div className="absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#2563EB]/5 blur-[80px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-lg animate-[fadeIn_0.6s_ease_both]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#38BDF8] shadow-lg shadow-[#2563EB]/30">
              <GraduationCap className="size-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="mt-1 text-sm text-[#CBD5E1]">
              Join the Smart Attendance Management System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#CBD5E1]">First Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#CBD5E1]/50" />
                  <input
                    placeholder="John"
                    value={form.firstName}
                    onChange={(e) => updateForm("firstName", e.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-10 pr-3 text-sm text-white placeholder:text-[#CBD5E1]/30 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#CBD5E1]">Last Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#CBD5E1]/50" />
                  <input
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={(e) => updateForm("lastName", e.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-10 pr-3 text-sm text-white placeholder:text-[#CBD5E1]/30 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#CBD5E1]">University Email *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#CBD5E1]/50" />
                <input
                  type="email"
                  placeholder="you@university.edu"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-10 pr-3 text-sm text-white placeholder:text-[#CBD5E1]/30 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>
            </div>

            {/* Registration Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#CBD5E1]">Student Registration Number *</label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#CBD5E1]/50" />
                <input
                  placeholder="e.g., 20240001"
                  value={form.rollNumber}
                  onChange={(e) => {
                    updateForm("rollNumber", e.target.value);
                    setRegMatch(null);
                  }}
                  onBlur={checkRegistrationNumber}
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-10 pr-3 text-sm text-white placeholder:text-[#CBD5E1]/30 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>
              {checkingReg && (
                <div className="flex items-center gap-2 text-xs text-[#CBD5E1]/50">
                  <Loader2 className="size-3.5 animate-spin" />
                  Checking registration number...
                </div>
              )}
              {regMatch && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-xs text-emerald-400">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Verified: {regMatch.full_name}
                  {regMatch.program && ` · ${regMatch.program}`}
                </div>
              )}
            </div>

            {/* Faculty + Department */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#CBD5E1]">Faculty *</label>
                <Select value={form.facultyId} onValueChange={(v) => updateForm("facultyId", v)}>
                  <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-[#CBD5E1]/30 focus:border-[#2563EB] focus:ring-[#2563EB]/20">
                    <Building2 className="mr-2 size-4 text-[#CBD5E1]/50" />
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#0f1d35] text-white">
                    {faculties.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#CBD5E1]">Department *</label>
                <Select value={form.departmentId} onValueChange={(v) => updateForm("departmentId", v)} disabled={!form.facultyId}>
                  <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-[#CBD5E1]/30 focus:border-[#2563EB] focus:ring-[#2563EB]/20">
                    <Building2 className="mr-2 size-4 text-[#CBD5E1]/50" />
                    <SelectValue placeholder={form.facultyId ? "Select department" : "Select faculty first"} />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#0f1d35] text-white">
                    {filteredDepartments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Program */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#CBD5E1]">Program *</label>
              <Select value={form.programId} onValueChange={(v) => updateForm("programId", v)} disabled={!form.departmentId}>
                <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-[#CBD5E1]/30 focus:border-[#2563EB] focus:ring-[#2563EB]/20">
                  <BookOpen className="mr-2 size-4 text-[#CBD5E1]/50" />
                  <SelectValue placeholder={form.departmentId ? "Select program" : "Select department first"} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0f1d35] text-white">
                  {filteredPrograms.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Academic Year + Semester */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#CBD5E1]">Academic Year *</label>
                <Select value={form.academicYearId} onValueChange={(v) => updateForm("academicYearId", v)}>
                  <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-[#CBD5E1]/30 focus:border-[#2563EB] focus:ring-[#2563EB]/20">
                    <CalendarDays className="mr-2 size-4 text-[#CBD5E1]/50" />
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#0f1d35] text-white">
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#CBD5E1]">Semester *</label>
                <Select value={form.semesterId} onValueChange={(v) => updateForm("semesterId", v)} disabled={!form.academicYearId}>
                  <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-[#CBD5E1]/30 focus:border-[#2563EB] focus:ring-[#2563EB]/20">
                    <CalendarDays className="mr-2 size-4 text-[#CBD5E1]/50" />
                    <SelectValue placeholder={form.academicYearId ? "Select semester" : "Select year first"} />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#0f1d35] text-white">
                    {filteredSemesters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Class */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#CBD5E1]">Class / Section *</label>
              <Select value={form.classId} onValueChange={(v) => updateForm("classId", v)} disabled={!form.programId}>
                <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-[#CBD5E1]/30 focus:border-[#2563EB] focus:ring-[#2563EB]/20">
                  <BookOpen className="mr-2 size-4 text-[#CBD5E1]/50" />
                  <SelectValue placeholder={form.programId ? "Select your class" : "Select program first"} />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0f1d35] text-white">
                  {filteredClasses.length === 0 && (
                    <div className="px-3 py-2 text-xs text-[#CBD5E1]/30">No classes available</div>
                  )}
                  {filteredClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#CBD5E1]">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#CBD5E1]/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => updateForm("password", e.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-10 pr-10 text-sm text-white placeholder:text-[#CBD5E1]/30 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#CBD5E1]/40 transition hover:text-[#CBD5E1]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#CBD5E1]">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#CBD5E1]/50" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => updateForm("confirmPassword", e.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-10 pr-10 text-sm text-white placeholder:text-[#CBD5E1]/30 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#CBD5E1]/40 transition hover:text-[#CBD5E1]"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password requirements */}
            {form.password && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <p className="mb-2 text-xs font-medium text-[#CBD5E1]/50">Password requirements</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    ["8+ characters", form.password.length >= 8],
                    ["Uppercase letter", /[A-Z]/.test(form.password)],
                    ["Lowercase letter", /[a-z]/.test(form.password)],
                    ["Number", /[0-9]/.test(form.password)],
                    ["Special character", /[^A-Za-z0-9]/.test(form.password)],
                  ].map(([label, ok]) => (
                    <div
                      key={label as string}
                      className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-400" : "text-[#CBD5E1]/30"}`}
                    >
                      <CheckCircle2 className="size-3.5" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !passwordOk}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/30 transition-all hover:shadow-[#2563EB]/50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-medium uppercase tracking-wide text-[#CBD5E1]/30">
              OR
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Social */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "Google", icon: <GoogleIcon /> },
              { name: "Microsoft", icon: <MicrosoftIcon /> },
              { name: "GitHub", icon: <GitHubIcon /> },
            ].map((provider) => (
              <button
                key={provider.name}
                type="button"
                onClick={() => handleSocial(provider.name)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] text-sm font-medium text-[#CBD5E1] transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                {provider.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Login link */}
        <div className="mt-6 text-center text-sm text-[#CBD5E1]/50">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[#38BDF8] transition hover:text-[#38BDF8]/80 hover:underline"
          >
            Sign In
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-[#CBD5E1]/20">
          &copy; 2026 SAMS – Smart Attendance Management System
        </div>
      </div>
    </div>
  );
}
