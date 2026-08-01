"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Loader2, UserPlus, Activity, FileText, ShieldCheck, Info } from "lucide-react";

type Notification = {
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
    is_read: boolean;
};

const fallbackNotifs: Notification[] = [
    { id: "n1", title: "New student registered", message: "A student in your SE301 course has just completed registration.", type: "registration", created_at: new Date(Date.now() - 3600000).toISOString(), is_read: false },
    { id: "n2", title: "Attendance session ended", message: "Your QR attendance session for Web Development (CS101) ended with 42 attendees.", type: "session", created_at: new Date(Date.now() - 5 * 3600000).toISOString(), is_read: false },
    { id: "n3", title: "Weekly attendance report ready", message: "Your attendance report for the week of July 28 is ready to download.", type: "report", created_at: new Date(Date.now() - 24 * 3600000).toISOString(), is_read: true },
    { id: "n4", title: "Low attendance alert", message: "5 students in Database Systems (DB201) have dropped below 80% attendance threshold.", type: "alert", created_at: new Date(Date.now() - 2 * 86400000).toISOString(), is_read: true },
    { id: "n5", title: "Security alert", message: "New device login detected. If this wasn't you, please change your password.", type: "security", created_at: new Date(Date.now() - 7 * 86400000).toISOString(), is_read: true },
];

function getNotifIcon(type: string) {
    switch (type) {
        case "registration": return { Icon: UserPlus, bg: "bg-sky-500/10", color: "text-sky-500" };
        case "session": return { Icon: Activity, bg: "bg-green-500/10", color: "text-green-500" };
        case "report": return { Icon: FileText, bg: "bg-blue-500/10", color: "text-blue-500" };
        case "alert": return { Icon: Bell, bg: "bg-amber-500/10", color: "text-amber-500" };
        case "security": return { Icon: ShieldCheck, bg: "bg-red-500/10", color: "text-red-500" };
        default: return { Icon: Info, bg: "bg-slate-500/10", color: "text-slate-500" };
    }
}

function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function LecturerNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread">("all");

    useEffect(() => {
        async function load() {
            const supabase = createClient();
            const { data: authData } = await supabase.auth.getUser();
            const userId = authData?.user?.id;
            if (!userId) { setNotifications(fallbackNotifs); setLoading(false); return; }

            const { data } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            setNotifications((data as Notification[])?.length ? (data as Notification[]) : fallbackNotifs);
            setLoading(false);
        }
        load();
    }, []);

    async function markAllRead() {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;
        if (userId) {
            await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
        }
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }

    const filtered = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
                <Loader2 className="size-8 animate-spin text-sky-500" />
                <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                    <p className="text-sm text-muted-foreground">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllRead}>
                        <CheckCheck className="size-4 mr-1" />
                        Mark all read
                    </Button>
                )}
            </div>

            <div className="flex gap-2">
                {(["all", "unread"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${filter === f
                                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                                : "bg-card border border-border text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {f === "all" ? "All" : "Unread"}
                        {f === "unread" && unreadCount > 0 && (
                            <Badge className="ml-1.5 bg-white/20 text-[10px] px-1.5 py-0">{unreadCount}</Badge>
                        )}
                    </button>
                ))}
            </div>

            <Card className="rounded-2xl border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="size-4 text-sky-500" />
                        {filter === "unread" ? "Unread Notifications" : "All Notifications"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/10">
                                <Bell className="size-8 text-sky-400" />
                            </div>
                            <p className="font-medium text-muted-foreground">No notifications</p>
                            <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
                        </div>
                    ) : (
                        filtered.map((n) => {
                            const { Icon, bg, color } = getNotifIcon(n.type);
                            return (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-4 rounded-2xl border p-4 transition-colors ${!n.is_read
                                            ? "border-sky-200 bg-sky-50/50 dark:border-sky-500/20 dark:bg-sky-500/5"
                                            : "border-border bg-card hover:bg-secondary"
                                        }`}
                                >
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                                        <Icon className={`size-5 ${color}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <p className={`text-sm font-semibold ${!n.is_read ? "text-foreground" : "text-foreground/80"}`}>
                                                {n.title}
                                            </p>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-[11px] text-muted-foreground">{formatRelativeTime(n.created_at)}</span>
                                                {!n.is_read && <span className="h-2 w-2 rounded-full bg-sky-500" />}
                                            </div>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                                        <Badge className={`mt-2 text-[10px] capitalize ${bg} ${color} border-0`}>
                                            {n.type}
                                        </Badge>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
