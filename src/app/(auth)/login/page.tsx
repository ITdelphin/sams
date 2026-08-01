"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  QrCode,
  BarChart3,
  ShieldCheck,
  Building2,
  Globe,
  Loader2,
} from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Multiple Attendance Methods",
    points: ["QR Code", "Face Recognition", "Fingerprint", "Manual Attendance"],
  },
  {
    icon: BarChart3,
    title: "Real-time Reports & Analytics",
    points: ["Monitor attendance instantly", "Generate reports automatically"],
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    points: ["Enterprise-grade authentication", "Encrypted data", "Role-based access control"],
  },
];

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
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, account_status")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
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
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      toast.success("Password reset email sent. Check your inbox.");
    }
  }

  function handleSocial(provider: string) {
    toast.info(`${provider} sign-in is coming soon. Use your email to sign in.`);
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Left branding panel */}
      <div className="relative hidden w-[40%] overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#16A34A] lg:block">
        <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-sky-500/30 blur-3xl animate-[blob-move_12s_ease-in-out_infinite]" />
        <div className="absolute right-[-60px] top-16 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl animate-[float-slow_7s_ease-in-out_infinite]" />
        <div className="absolute bottom-10 left-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
              <GraduationCap className="size-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-white">SAMS</p>
              <p className="text-[11px] text-sky-100/80">Smart Attendance Management System</p>
            </div>
          </div>

          <div className="mt-16 xl:mt-24 space-y-6 [animation:fade-up_0.6s_ease_both]">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight text-white">
              Smart Attendance for{" "}
              <span className="bg-gradient-to-r from-sky-300 to-teal-200 bg-clip-text text-transparent">
                Smarter Education
              </span>
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-sky-50/80">
              A unified platform that helps students, lecturers, and administrators
              manage attendance securely using QR codes, Face Recognition, Fingerprint
              authentication, and real-time analytics.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md"
                  style={{ animation: `fade-up 0.6s ease ${0.15 + i * 0.12}s both` }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/90 shadow-lg shadow-sky-500/30">
                    <Icon className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-sky-50/75">
                      {f.points.join(" · ")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-10">
            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Building2 className="size-5 text-sky-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Trusted by Universities</p>
                <p className="text-xs text-sky-50/75">
                  Built for institutions that value transparency, security, and academic excellence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right login area */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-end gap-2 p-5">
          <Button variant="ghost" className="gap-2 text-sm text-slate-500">
            <Globe className="size-4" />
            English
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-8">
          <div className="w-full max-w-md [animation:fade-up_0.5s_ease_both]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-teal-600 shadow-lg shadow-sky-500/30">
              <GraduationCap className="size-7 text-white" />
            </div>

            <div className="mt-5 text-center">
              <h1 className="text-2xl font-bold text-[#1E3A8A]">Welcome Back!</h1>
              <p className="mt-1 text-sm text-slate-500">Sign in to your SAMS account</p>
            </div>

            <div className="mt-8 rounded-[20px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-[#334155]">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-[#334155] placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-[#334155]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-[#334155] placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="size-4 rounded border-slate-300 text-sky-600 accent-sky-600"
                    />
                    Remember Me
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm font-medium text-sky-600 transition hover:text-sky-700 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-sky-500 to-teal-600 text-white font-semibold shadow-lg shadow-sky-500/30 transition hover:from-sky-600 hover:to-teal-700 hover:shadow-xl hover:shadow-sky-500/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Or continue with
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "Google", icon: <GoogleIcon /> },
                  { name: "GitHub", icon: <GitHubIcon /> },
                  { name: "Microsoft", icon: <MicrosoftIcon /> },
                ].map((provider) => (
                  <button
                    key={provider.name}
                    type="button"
                    onClick={() => handleSocial(provider.name)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    {provider.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-sky-600 transition hover:text-sky-700 hover:underline">
                Register
              </Link>
            </div>

            <footer className="mt-8 text-center text-xs text-slate-400">
              © 2026 SAMS – Smart Attendance Management System. All rights reserved.
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
