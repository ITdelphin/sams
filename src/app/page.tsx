"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              SA
            </div>
            <span className="text-xl font-bold text-foreground">SAMS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            Smart Attendance Management System
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Secure Digital Attendance for{" "}
            <span className="text-primary">Universities</span>
          </h1>
          <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
            Replace paper attendance with secure digital tracking using QR
            Codes, Student ID Cards, Face Recognition, and Fingerprint
            verification.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
            >
              Register Now
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-border bg-card px-8 py-3 text-base font-semibold text-foreground shadow-sm hover:bg-accent transition-all"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { label: "QR Code", desc: "Instant scanning" },
              { label: "Face Recognition", desc: "AI-powered" },
              { label: "Fingerprint", desc: "Biometric security" },
              { label: "ID Card", desc: "Barcode scanning" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        &copy; 2026 SAMS. All rights reserved.
      </footer>
    </div>
  );
}
