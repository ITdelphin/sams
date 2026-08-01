"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { validatePasswordStrength, auditAction } from "@/lib/security";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setInitializing(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password cannot match the current password.");
      return;
    }

    const issues = validatePasswordStrength(newPassword);
    if (issues.length > 0) {
      setError(issues.join(", "));
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      setError("Session expired. Please log in again.");
      setLoading(false);
      router.push("/login");
      return;
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.user.email || "",
      password: currentPassword,
    });

    if (verifyError) {
      setError("Current password is incorrect.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({
        must_change_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.user.id);

    await auditAction(supabase, {
      userId: user.user.id,
      action: "password_change",
      entityType: "auth",
      entityId: user.user.id,
      details: "Password changed (forced or from security settings)",
    });

    toast.success("Password updated successfully.");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.user.id)
      .single();

    switch (profile?.role) {
      case "super_admin":
        router.push("/admin");
        break;
      case "lecturer":
        router.push("/lecturer");
        break;
      default:
        router.push("/student");
    }

    setLoading(false);
  }

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="size-8 animate-spin text-sky-500" />
      </div>
    );
  }

  const strength = validatePasswordStrength(newPassword);
  const passwordOk = strength.length === 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-sky-500 px-4 py-8">
      <div className="w-full max-w-md [animation:fade-up_0.5s_ease_both]">
        <Card className="overflow-hidden border-slate-200 shadow-2xl shadow-slate-900/20">
          <CardHeader className="bg-white px-6 pt-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg shadow-sky-500/30">
              <ShieldCheck className="size-7 text-white" />
            </div>
            <CardTitle className="text-xl text-[#1E3A8A]">
              Create a New Password
            </CardTitle>
            <CardDescription className="text-slate-500">
              Welcome! For your security, please create a new password before
              continuing.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="current"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="new"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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

              {newPassword && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">
                    Password requirements
                  </p>
                  <div className="mt-1.5 grid grid-cols-1 gap-1">
                    {[
                      { label: "At least 8 characters", ok: newPassword.length >= 8 },
                      { label: "At least one uppercase letter", ok: /[A-Z]/.test(newPassword) },
                      { label: "At least one lowercase letter", ok: /[a-z]/.test(newPassword) },
                      { label: "At least one number", ok: /[0-9]/.test(newPassword) },
                      { label: "At least one special character", ok: /[^A-Za-z0-9]/.test(newPassword) },
                    ].map((req) => (
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
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
