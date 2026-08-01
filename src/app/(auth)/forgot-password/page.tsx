"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  Mail,
  Loader2,
  KeyRound,
  ArrowRight,
  Clock,
  Inbox,
  ShieldCheck,
} from "lucide-react";

const RESEND_COOLDOWN = 60;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (resendCountdown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setResendCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resendCountdown]);

  async function sendResetLink(targetEmail: string) {
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      targetEmail.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (resetError) {
      throw new Error(resetError.message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendResetLink(email);
      setSent(true);
      setResendCountdown(RESEND_COOLDOWN);
      toast.success("Reset link sent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCountdown > 0 || resending) return;
    setResending(true);
    try {
      await sendResetLink(email);
      setResendCountdown(RESEND_COOLDOWN);
      toast.success("A new reset link has been sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend.");
    } finally {
      setResending(false);
    }
  }

  const steps = [
    {
      icon: Inbox,
      title: "Check your inbox",
      text: "We sent a secure reset link to your email.",
    },
    {
      icon: KeyRound,
      title: "Click the reset link",
      text: "It opens a page where you can create a new password.",
    },
    {
      icon: ShieldCheck,
      title: "Sign in securely",
      text: "Use your new password to access your account.",
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-sky-500 px-4 py-8">
      <div className="w-full max-w-md [animation:fade-up_0.5s_ease_both]">
        {sent ? (
          <Card className="overflow-hidden border-slate-200 shadow-2xl shadow-slate-900/20">
            <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-sky-500 px-6 py-8 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur [animation:float-slow_3s_ease-in-out_infinite]">
                <Mail className="size-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">
                Check your email
              </CardTitle>
              <CardDescription className="mt-1 text-sky-100/80">
                We&apos;ve sent a password reset link to
              </CardDescription>
              <p className="mt-2 rounded-lg bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur inline-block">
                {email}
              </p>
            </div>

            <CardContent className="px-6 py-6">
              <div className="space-y-3">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100">
                          <Icon className="size-4 text-sky-600" />
                        </div>
                        {i < steps.length - 1 && (
                          <div className="mt-1 w-px flex-1 bg-slate-200" />
                        )}
                      </div>
                      <div className="pb-1">
                        <p className="text-sm font-semibold text-[#1E3A8A]">
                          {step.title}
                        </p>
                        <p className="text-xs text-slate-500">{step.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 py-2.5 text-xs text-slate-500">
                <Clock className="size-3.5" />
                The link expires in 60 minutes for your security.
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResend}
                  disabled={resendCountdown > 0 || resending}
                >
                  {resending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Resending...
                    </>
                  ) : resendCountdown > 0 ? (
                    <>Resend available in {resendCountdown}s</>
                  ) : (
                    <>Didn&apos;t receive it? Resend</>
                  )}
                </Button>

                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="w-full gap-1.5 text-slate-600"
                  >
                    Back to Login
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-slate-200 shadow-2xl shadow-slate-900/20">
            <CardHeader className="bg-white px-6 pt-8 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg shadow-sky-500/30">
                <KeyRound className="size-7 text-white" />
              </div>
              <CardTitle className="text-xl text-[#1E3A8A]">
                Forgot Password?
              </CardTitle>
              <CardDescription className="text-slate-500">
                Enter your registered email and we will send you a secure link
                to reset your password.
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
