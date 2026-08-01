"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { QRCodeSVG } from "qrcode.react";
import { generateQRCode, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { RotateCw, Clock, Copy } from "lucide-react";

function QRCodeDisplay({
  session,
  refreshCount,
  onManualRefresh,
}: {
  session: any;
  refreshCount: number;
  onManualRefresh: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    if (!session.qr_expires_at) return;
    const tick = () => {
      const remaining = Math.max(0, Math.round((new Date(session.qr_expires_at).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session.qr_expires_at, refreshCount]);

  const urgency = secondsLeft <= 8 ? "text-red-500" : secondsLeft <= 15 ? "text-amber-500" : "text-green-600";

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-gradient-to-b from-muted/50 to-background p-4">
      <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          Auto-refresh every 30s
        </span>
        <span className={`flex items-center gap-1 font-bold tabular-nums ${urgency}`}>
          {secondsLeft}s
        </span>
      </div>

      <div className="rounded-lg bg-white p-3 shadow-sm">
        <QRCodeSVG
          value={session.qr_code}
          size={160}
          key={`${session.id}-${refreshCount}`}
          level="H"
        />
      </div>

      <div className="w-full space-y-1.5">
        <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Token String for Manual Entry
        </p>
        <div className="flex items-center gap-2 rounded-lg border bg-secondary px-3 py-2">
          <code className="flex-1 truncate text-xs font-mono text-foreground">{session.qr_code}</code>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={() => {
              navigator.clipboard?.writeText(session.qr_code);
              toast.success("Token copied!");
            }}
          >
            <Copy className="size-3" />
          </Button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground">
          Students paste this in the QR verification dialog.
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={onManualRefresh}
      >
        <RotateCw className="mr-1.5 size-3" />
        Force Refresh QR Now
      </Button>
    </div>
  );
}



export default function LecturerSessionsPage() {
  const [userId, setUserId] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newCourse, setNewCourse] = useState("");
  const [newMethod, setNewMethod] = useState("qr_code");
  const [loading, setLoading] = useState(true);
  const [qrRefresh, setQrRefresh] = useState<Record<string, number>>({});
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    loadData();
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const activeQRSessions = sessions.filter((s) => s.is_active && s.method === "qr_code");

    // Clear timeouts for sessions no longer active
    Object.keys(timeoutRefs.current).forEach((id) => {
      if (!activeQRSessions.some((s) => s.id === id)) {
        clearTimeout(timeoutRefs.current[id]);
        delete timeoutRefs.current[id];
      }
    });

    // Schedule timeouts for active sessions
    activeQRSessions.forEach((session) => {
      if (timeoutRefs.current[session.id]) {
        clearTimeout(timeoutRefs.current[session.id]);
      }

      const expiry = session.qr_expires_at ? new Date(session.qr_expires_at).getTime() : 0;
      const delay = Math.max(0, expiry - Date.now());

      timeoutRefs.current[session.id] = setTimeout(() => {
        refreshQR(session.id);
      }, delay);
    });

    return () => { };
  }, [sessions]);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [coursesRes, sessionsRes] = await Promise.all([
      supabase.from("courses").select("*").eq("lecturer_id", user.id),
      supabase.from("attendance_sessions").select("*, courses(name, code), attendance_records(id)").eq("lecturer_id", user.id).order("created_at", { ascending: false }),
    ]);
    setCourses(coursesRes.data || []);
    setSessions(sessionsRes.data || []);
    setLoading(false);
  }

  async function handleStartSession() {
    if (!newCourse) return;
    const supabase = createClient();
    const qrCode = newMethod === "qr_code" ? generateQRCode() : null;
    const qrExpires = newMethod === "qr_code" ? new Date(Date.now() + 30000).toISOString() : null;

    const { error } = await supabase.from("attendance_sessions").insert({
      course_id: newCourse,
      lecturer_id: userId,
      method: newMethod as any,
      qr_code: qrCode,
      qr_expires_at: qrExpires,
    });

    if (error) {
      toast.error("Failed to start session.");
    } else {
      toast.success("Session started!");
      setShowNew(false);
      loadData();
    }
  }

  async function handleEndSession(sessionId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("attendance_sessions")
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to end session.");
    } else {
      toast.success("Session ended.");
      if (timeoutRefs.current[sessionId]) {
        clearTimeout(timeoutRefs.current[sessionId]);
        delete timeoutRefs.current[sessionId];
      }
      loadData();
    }
  }

  function refreshQR(sessionId: string) {
    const supabase = createClient();
    const newQR = generateQRCode();
    const newExpiry = new Date(Date.now() + 30000).toISOString();
    supabase
      .from("attendance_sessions")
      .update({ qr_code: newQR, qr_expires_at: newExpiry })
      .eq("id", sessionId)
      .then(() => {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, qr_code: newQR, qr_expires_at: newExpiry }
              : s
          )
        );
        setQrRefresh((prev) => ({ ...prev, [sessionId]: (prev[sessionId] || 0) + 1 }));
      });
  }

  const activeSessions = sessions.filter((s) => s.is_active);
  const completedSessions = sessions.filter((s) => !s.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Attendance Sessions</h1>
        <Button onClick={() => setShowNew(true)}>New Session</Button>
      </div>

      {activeSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Active Sessions</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {activeSessions.map((session) => (
              <Card key={session.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">{session.courses?.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{session.courses?.code}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{session.method}</Badge>
                    <span>Started {formatDateTime(session.started_at)}</span>
                  </div>
                  <p className="text-sm">{session.attendance_records?.length || 0} students marked</p>
                  {session.method === "qr_code" && session.qr_code && (
                    <QRCodeDisplay
                      session={session}
                      refreshCount={qrRefresh[session.id] || 0}
                      onManualRefresh={() => refreshQR(session.id)}
                    />
                  )}
                  <Button variant="destructive" className="w-full" onClick={() => handleEndSession(session.id)}>
                    End Session
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Session History</h2>
        {completedSessions.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No completed sessions yet.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Ended</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedSessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.courses?.name}</TableCell>
                      <TableCell><Badge variant="outline">{s.method}</Badge></TableCell>
                      <TableCell className="text-sm">{formatDateTime(s.started_at)}</TableCell>
                      <TableCell className="text-sm">{s.ended_at ? formatDateTime(s.ended_at) : "-"}</TableCell>
                      <TableCell>{s.attendance_records?.length || 0} students</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Start New Session</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={newCourse} onValueChange={setNewCourse}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Attendance Method</Label>
              <Select value={newMethod} onValueChange={setNewMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="qr_code">QR Code</SelectItem>
                  <SelectItem value="student_id_card">Student ID Card</SelectItem>
                  <SelectItem value="face_recognition">Face Recognition</SelectItem>
                  <SelectItem value="fingerprint">Fingerprint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button onClick={handleStartSession} disabled={!newCourse}>Start Session</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
