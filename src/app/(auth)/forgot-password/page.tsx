"use client";

import { useState } from "react";
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
import { Mail, Loader2, KeyRound, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
    toast.success("Password reset email sent. Check your inbox.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-sky-500 px-4 py-8">
      <div className="w-full max-w-md [animation:fade-up_0.5s_ease_both]">
        <Card className="overflow-hidden border-slate-200 shadow-2xl shadow-slate-900/20">
          <CardHeader className="bg-white px-6 pt-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg shadow-sky-500/30">
              <KeyRound className="size-7 text-white" />
            </div>
            <CardTitle className="text-xl text-[#1E3A8A]">
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-slate-500">
              Enter your registered email and we will send you a secure link to
              reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            {sent ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="size-7 text-green-600" />
                </div>
                <p className="text-sm text-slate-600">
                  If an account exists for{" "}
                  <span className="font-medium text-[#1E3A8A]">{email}</span>,
                  a password reset email has been sent. Check your inbox and
                  follow the link to create a new password.
                </p>
                <p className="text-xs text-slate-400">
                  The link expires after 60 minutes.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="you@university.edu"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-sky-500 to-sky-600"
                  disabled={loading || !email.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <div className="text-center text-sm text-slate-500">
                  Remembered your password?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-sky-600 hover:underline"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
