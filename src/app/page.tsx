"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { GraduationCap, Play, Check, Lock, BarChart3 } from "lucide-react";

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
      </svg>
    ),
    title: "QR Code Scanning",
    desc: "Instant, contactless attendance marking with secure rotating QR codes that expire automatically.",
    grad: "from-[#2563EB] to-[#38BDF8]",
    glow: "shadow-[#2563EB]/30",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    title: "Face Recognition",
    desc: "AI-powered biometric face scanning ensures only verified students can mark attendance.",
    grad: "from-[#38BDF8] to-[#2563EB]",
    glow: "shadow-[#38BDF8]/30",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33" />
      </svg>
    ),
    title: "Fingerprint Scan",
    desc: "Military-grade biometric fingerprint verification for tamper-proof attendance records.",
    grad: "from-orange-400 to-orange-600",
    glow: "shadow-orange-500/30",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    ),
    title: "Student ID Card",
    desc: "Barcode-enabled student ID cards for quick swipe-to-mark attendance at lecture halls.",
    grad: "from-emerald-400 to-teal-600",
    glow: "shadow-emerald-500/30",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: "Real-time Analytics",
    desc: "Live dashboards with attendance trends, reports, and AI-driven insights for institutions.",
    grad: "from-[#2563EB] to-[#2563EB]",
    glow: "shadow-[#2563EB]/30",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: "Fraud Prevention",
    desc: "Multi-layered security prevents proxy attendance with location checks and session expiry.",
    grad: "from-green-400 to-emerald-600",
    glow: "shadow-emerald-500/30",
  },
];

const howItWorks = [
  { step: "01", title: "Lecturer Starts Session", desc: "Lecturer opens a session and chooses the verification method (QR, Face, Fingerprint, or ID Card).", icon: Play },
  { step: "02", title: "Students Verify Identity", desc: "Students scan QR code, submit biometrics, or tap their card — all from within the SAMS app.", icon: Check },
  { step: "03", title: "Records Are Secured", desc: "All attendance records are encrypted, timestamped, and stored with full audit trails.", icon: Lock },
  { step: "04", title: "Reports Generated", desc: "Admin and lecturers get instant reports and alerts for at-risk students.", icon: BarChart3 },
];

const stats = [
  { value: "50K+", label: "Students Enrolled" },
  { value: "2,500+", label: "Lectures Tracked" },
  { value: "99.8%", label: "Uptime SLA" },
  { value: "15+", label: "Universities" },
];

const testimonials = [
  {
    name: "Prof. Jean Kagame",
    role: "Head of Computer Science, UR",
    quote: "SAMS eliminated proxy attendance entirely. Our data is now 100% reliable and saves us hours each week.",
    initials: "JK",
    grad: "from-[#2563EB] to-[#38BDF8]",
  },
  {
    name: "Alice Uwimana",
    role: "Student, Software Engineering",
    quote: "Marking attendance with a QR scan takes under 3 seconds. So much better than paper registers!",
    initials: "AU",
    grad: "from-[#38BDF8] to-[#2563EB]",
  },
  {
    name: "Dr. Grace Nkurunziza",
    role: "Academic Registrar, KIM",
    quote: "The real-time analytics dashboard gives us insights we never had before. A game-changer for our institution.",
    initials: "GN",
    grad: "from-teal-400 to-teal-600",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase
          .from("profiles")
          .select("role, account_status")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              switch (data.role) {
                case "super_admin":
                  router.replace("/admin");
                  break;
                case "lecturer":
                  if (data.account_status === "pending") {
                    router.replace("/pending");
                  } else {
                    router.replace("/lecturer");
                  }
                  break;
                case "student":
                  router.replace("/student");
                  break;
              }
            }
            setChecking(false);
          });
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#081224]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-[#2563EB]/20 border-t-[#2563EB]" />
          </div>
          <p className="text-sm text-slate-400">Loading SAMS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#081224] text-white">
      {/* ─── Navbar ─── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#081224]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#38BDF8] shadow-lg shadow-[#2563EB]/30">
              <GraduationCap className="size-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">SAMS</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Testimonials"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm text-slate-400 transition-colors hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/30 transition-all hover:bg-[#2563EB] hover:shadow-[#2563EB]/40"
            >
              Get Started
              <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                <path d="M8.22 2.97a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06l2.97-2.97H3.75a.75.75 0 0 1 0-1.5h7.44L8.22 4.03a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </Link>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#081224]/95 px-4 py-4 space-y-2">
            {["Features", "How It Works", "Testimonials"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="block px-3 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <div className="pt-2 border-t border-white/5">
              <Link href="/login" className="block px-3 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                Log in
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32">
        {/* Background glows */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-[#2563EB]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-20 -left-20 h-80 w-80 rounded-full bg-[#38BDF8]/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 -right-20 h-80 w-80 rounded-full bg-[#2563EB]/10 blur-[100px] pointer-events-none" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Pill label */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/5 px-5 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#38BDF8] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2563EB]" />
            </span>
            <span className="text-sm font-medium text-[#38BDF8]">Smart Attendance Management System</span>
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Secure Digital{" "}
            <span className="relative">
              <span className="relative z-10 bg-gradient-to-r from-[#38BDF8] via-[#38BDF8] to-[#2563EB] bg-clip-text text-transparent">
                Attendance
              </span>
            </span>
            <br />
            for{" "}
            <span className="bg-gradient-to-r from-[#38BDF8] to-[#38BDF8]/80 bg-clip-text text-transparent">
              Universities
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg text-slate-400 sm:text-xl leading-relaxed">
            Replace paper attendance with secure digital tracking using{" "}
            <span className="text-[#38BDF8] font-medium">QR Codes</span>,{" "}
            <span className="text-[#38BDF8] font-medium">Face Recognition</span>,{" "}
            <span className="text-orange-400 font-medium">Fingerprints</span>, and{" "}
            <span className="text-[#38BDF8] font-medium">Student ID Cards</span>.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#38BDF8] px-8 py-4 text-base font-bold text-white shadow-2xl shadow-[#2563EB]/30 transition-all hover:shadow-[#2563EB]/50 hover:scale-105 active:scale-100"
            >
              Register Your Institution
              <svg viewBox="0 0 16 16" fill="currentColor" className="size-4 transition-transform group-hover:translate-x-0.5">
                <path d="M8.22 2.97a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06l2.97-2.97H3.75a.75.75 0 0 1 0-1.5h7.44L8.22 4.03a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/10 hover:border-white/20"
            >
              Sign In
            </Link>
          </div>

          {/* Stat pills */}
          <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur">
                <p className="text-3xl font-extrabold text-white">{s.value}</p>
                <p className="mt-1 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2563EB]/10 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#38BDF8]">Features</p>
            <h2 className="mt-3 text-4xl font-bold text-white sm:text-5xl">Everything You Need</h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              A complete suite of tools to digitize, secure, and analyze attendance across your entire institution.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur transition-all duration-300 hover:border-white/10 hover:bg-white/[0.05] hover:-translate-y-1"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.05), transparent 70%)" }}
                />
                <div className={`relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.grad} shadow-lg ${f.glow} text-white`}>
                  {f.icon}
                </div>
                <h3 className="relative text-lg font-semibold text-white">{f.title}</h3>
                <p className="relative mt-2 text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#38BDF8]">Process</p>
            <h2 className="mt-3 text-4xl font-bold text-white sm:text-5xl">How It Works</h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              From session start to report generation — everything happens in minutes, not days.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((step, i) => (
              <div key={step.step} className="relative flex flex-col">
                {i < howItWorks.length - 1 && (
                  <div className="absolute left-full top-8 hidden w-full border-t-2 border-dashed border-white/5 lg:block" />
                )}
                <div className="mb-4 text-3xl font-black text-white/5">{step.step}</div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur">
                  <step.icon className="size-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#38BDF8]">Testimonials</p>
            <h2 className="mt-3 text-4xl font-bold text-white sm:text-5xl">Trusted by Educators</h2>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur transition-all hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="size-4 text-amber-400">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.grad} text-xs font-bold text-white`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2563EB] via-[#38BDF8] to-[#2563EB] p-10 sm:p-16 text-center shadow-2xl shadow-[#2563EB]/20">
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-[#38BDF8]/20 blur-2xl" />
            <div className="relative">
              <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
                Ready to Go Paperless?
              </h2>
              <p className="mt-4 text-lg text-[#38BDF8]/80">
                Join 15+ universities that have already transformed their attendance systems with SAMS.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/register"
                  className="rounded-2xl bg-white px-8 py-4 text-base font-bold text-[#2563EB] shadow-lg transition-all hover:bg-[#2563EB]/10 hover:scale-105"
                >
                  Start Free Today
                </Link>
                <Link
                  href="/login"
                  className="rounded-2xl bg-white/10 border border-white/20 px-8 py-4 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/20"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#38BDF8] shadow-lg shadow-[#2563EB]/30">
                <GraduationCap className="size-4 text-white" />
              </div>
              <span className="font-bold text-white">SAMS</span>
            </div>
            <p className="text-sm text-slate-600">© 2026 SAMS – Smart Attendance Management System. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/login" className="text-sm text-slate-500 hover:text-white transition-colors">Log in</Link>
              <Link href="/register" className="text-sm text-slate-500 hover:text-white transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
