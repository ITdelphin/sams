"use client";

import { useEffect, useState } from "react";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, KeyRound, CheckCircle2 } from "lucide-react";
import { validatePasswordStrength } from "@/lib/security";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError(
          "Invalid or expired reset link. Please request a new password reset."
        );
        setInitializing(false);
        return;
      }
      setInitializing(false);
    }
    init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const issues = validatePasswordStrength(password);
    if (issues.length > 0) {
      setError(issues.join(", "));
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    toast.success("Password reset successfully. Please sign in.");
    router.push("/login");
  }

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-sky-500">
        <Loader2 className="size-8 animate-spin text-white" />
      </div>
    );
  }

  const requirements = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "At least one uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "At least one lowercase letter", ok: /[a-z]/.test(password) },
    { label: "At least one number", ok: /[0-9]/.test(password) },
    { label: "At least one special character", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const passwordOk = requirements.every((r) => r.ok);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-sky-500 px-4 py-8">
      <div className="w-full max-w-md [animation:fade-up_0.5s_ease_both]">
        <Card className="overflow-hidden border-slate-200 shadow-2xl shadow-slate-900/20">
          <CardHeader className="bg-white px-6 pt-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg shadow-sky-500/30">
              <KeyRound className="size-7 text-white" />
            </div>
            <CardTitle className="text-xl text-[#1E3A8A]">
              Set a New Password
            </CardTitle>
            <CardDescription className="text-slate-500">
              Choose a strong password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            {error ? (
              <div className="space-y-4 text-center">
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {password && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">
                      Password requirements
                    </p>
                    <div className="mt-1.5 grid grid-cols-1 gap-1">
                      {requirements.map((req) => (
                        <div
                          key={req.label}
                          className={`flex items-center gap-1.5 text-xs ${
                            req.ok ? "text-green-600" : "text-slate-400"
                          }`}
                        >
                          <CheckCircle2 className="size-3.5" />
                          {req.label}
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
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
