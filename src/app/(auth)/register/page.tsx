"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    nationalId: "",
    rollNumber: "",
    facultyId: "",
    departmentId: "",
    role: "student" as "student" | "lecturer",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [facs, depts] = await Promise.all([
        supabase.from("faculties").select("*").order("name"),
        supabase.from("departments").select("*, faculties(name)").order("name"),
      ]);
      setFaculties(facs.data || []);
      setDepartments(depts.data || []);
    }
    load();
  }, []);

  const filteredDepartments = form.facultyId
    ? departments.filter((d) => d.faculty_id === form.facultyId)
    : departments;

  function updateForm(field: string, value: string) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "facultyId") {
        updated.departmentId = "";
      }
      return updated;
    });
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!form.rollNumber.trim()) {
      setError("Roll Number is required.");
      return;
    }

    if (!form.facultyId) {
      setError("Please select your Faculty.");
      return;
    }

    if (!form.departmentId) {
      setError("Please select your Department.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role: form.role,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          email: form.email,
          full_name: form.fullName,
          role: form.role,
          phone_number: form.phoneNumber || null,
          national_id: form.nationalId || null,
          student_id: form.rollNumber.trim(),
          faculty_id: form.facultyId,
          department_id: form.departmentId,
          account_status: form.role === "student" ? "approved" : "pending",
        });

      if (profileError) {
        if (profileError.message?.includes("student_id")) {
          setError("This roll number is already registered.");
          setLoading(false);
          return;
        }
        console.error("Profile error:", profileError);
      }
    }

    if (form.role === "student") {
      toast.success("Registration successful! You can now log in.");
      router.push("/login");
    } else {
      toast.info("Registration submitted. Await admin approval.");
      router.push("/pending");
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            SA
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Register for SAMS</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Account Type *</Label>
              <Select value={form.role} onValueChange={(v) => updateForm("role", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) => updateForm("fullName", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number *</Label>
              <Input
                id="rollNumber"
                placeholder="e.g., 20240001"
                value={form.rollNumber}
                onChange={(e) => updateForm("rollNumber", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@university.edu"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => updateForm("confirmPassword", e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facultyId">Faculty *</Label>
              <Select value={form.facultyId} onValueChange={(v) => updateForm("facultyId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="departmentId">Department *</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => updateForm("departmentId", v)}
                disabled={!form.facultyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={form.facultyId ? "Select your department" : "Select faculty first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredDepartments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="+250 7XX XXX XXX"
                value={form.phoneNumber}
                onChange={(e) => updateForm("phoneNumber", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalId">National ID / Passport</Label>
              <Input
                id="nationalId"
                placeholder="ID Number"
                value={form.nationalId}
                onChange={(e) => updateForm("nationalId", e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
