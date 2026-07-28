"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState("roll_number");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    let loginEmail = identifier;

    if (loginType === "roll_number") {
      if (!identifier.trim()) {
        setError("Please enter your roll number.");
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("student_id", identifier.trim())
        .single() as { data: { email: string } | null };

      if (!profile) {
        setError("No account found with this roll number.");
        setLoading(false);
        return;
      }
      loginEmail = profile.email;
    } else {
      if (!identifier.trim()) {
        setError("Please enter your email address.");
        setLoading(false);
        return;
      }
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, account_status")
      .eq("id", data.user.id)
      .single() as { data: { role: string; account_status: string } | null };

    if (!profile) {
      setError("Profile not found. Please contact administrator.");
      setLoading(false);
      return;
    }

    if (profile.account_status === "pending") {
      router.push("/pending");
      setLoading(false);
      return;
    }

    if (profile.account_status === "suspended" || profile.account_status === "rejected" || profile.account_status === "inactive") {
      setError(`Your account has been ${profile.account_status}. Please contact the administrator.`);
      setLoading(false);
      return;
    }

    toast.success("Welcome back!");

    switch (profile.role) {
      case "super_admin":
        router.push("/admin");
        break;
      case "lecturer":
        router.push("/lecturer");
        break;
      case "student":
        router.push("/student");
        break;
    }
  }

  async function handleForgotPassword() {
    if (loginType === "roll_number" && !identifier) {
      setError("Please enter your roll number first.");
      return;
    }
    if (loginType === "email" && !identifier) {
      setError("Please enter your email address first.");
      return;
    }

    const supabase = createClient();
    let emailToReset = identifier;

    if (loginType === "roll_number") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("student_id", identifier.trim())
        .single() as { data: { email: string } | null };
      if (!profile) {
        setError("No account found with this roll number.");
        return;
      }
      emailToReset = profile.email;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      toast.success("Password reset email sent. Check your inbox.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            SA
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your SAMS account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Login With</Label>
              <Select value={loginType} onValueChange={setLoginType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roll_number">Roll Number</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifier">
                {loginType === "roll_number" ? "Roll Number" : "Email"}
              </Label>
              <Input
                id="identifier"
                type={loginType === "email" ? "email" : "text"}
                placeholder={loginType === "roll_number" ? "e.g., 20240001" : "you@university.edu"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
