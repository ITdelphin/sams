"use client";

import { useState } from "react";
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
} from "lucide-react";

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);

      const { data: lockedProfile } = await supabase
        .from("profiles")
        .select("id, failed_login_attempts")
        .eq("email", email.trim())
        .maybeSingle();

      if (lockedProfile) {
        const attempts = (lockedProfile.failed_login_attempts || 0) + 1;
        if (attempts >= 5) {
          await supabase.from("profiles").update({
            failed_login_attempts: 0,
            locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          }).eq("id", lockedProfile.id);
          setError(
            "Too many failed attempts. Your account is locked for 15 minutes."
          );
        } else {
          await supabase.from("profiles").update({
            failed_login_attempts: attempts,
          }).eq("id", lockedProfile.id);
        }
      }
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "role, account_status, must_change_password, locked_until, failed_login_attempts"
      )
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      setError("Profile not found. Please contact administrator.");
      setLoading(false);
      return;
    }

    if (
      profile.locked_until &&
      new Date(profile.locked_until).getTime() > Date.now()
    ) {
      await supabase.auth.signOut();
      setError(
        "Your account is temporarily locked. Please try again later."
      );
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

    await supabase
      .from("profiles")
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
      })
      .eq("id", data.user.id);

    try {
      await supabase.from("audit_logs").insert({
        user_id: data.user.id,
        action: "login",
        entity_type: "auth",
        entity_id: data.user.id,
      });
    } catch {
      // non-blocking
    }

    if (profile.must_change_password) {
      toast.info("Welcome! For your security, please create a new password before continuing.");
      router.push("/change-password");
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

  function handleSocial(provider: string) {
    toast.info(`${provider} sign-in is coming soon. Use your email to sign in.`);
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

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md animate-[fadeIn_0.6s_ease_both]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#38BDF8] shadow-lg shadow-[#2563EB]/30">
              <GraduationCap className="size-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Sign In</h1>
            <p className="mt-1 text-sm text-[#CBD5E1]">
              Access your attendance dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#CBD5E1]">
                University Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#CBD5E1]/50" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-10 pr-3 text-sm text-white placeholder:text-[#CBD5E1]/30 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#CBD5E1]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#CBD5E1]/50" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#CBD5E1]/70">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-white/20 bg-white/5 accent-[#2563EB]"
                />
                Remember Me
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#38BDF8] transition hover:text-[#38BDF8]/80 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/30 transition-all hover:shadow-[#2563EB]/50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Sign In
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

        {/* Register link */}
        <div className="mt-6 text-center text-sm text-[#CBD5E1]/50">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-[#38BDF8] transition hover:text-[#38BDF8]/80 hover:underline"
          >
            Register
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
