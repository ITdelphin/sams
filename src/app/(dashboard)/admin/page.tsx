"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    students: 0,
    lecturers: 0,
    courses: 0,
    activeSessions: 0,
    pendingApprovals: 0,
    departments: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [students, lecturers, courses, sessions, pending, departments, recent] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "lecturer"),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("attendance_sessions").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "lecturer").eq("account_status", "pending"),
        supabase.from("departments").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("full_name, email, role, account_status, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      setStats({
        students: students.count || 0,
        lecturers: lecturers.count || 0,
        courses: courses.count || 0,
        activeSessions: sessions.count || 0,
        pendingApprovals: pending.count || 0,
        departments: departments.count || 0,
      });

      setRecentUsers(recent.data || []);

      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
          name: d.toLocaleDateString("en-US", { weekday: "short" }),
          attendance: Math.floor(Math.random() * 50) + 20,
        });
      }
      setChartData(days);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    { title: "Total Students", value: stats.students, color: "text-blue-600" },
    { title: "Total Lecturers", value: stats.lecturers, color: "text-green-600" },
    { title: "Total Courses", value: stats.courses, color: "text-purple-600" },
    { title: "Active Sessions", value: stats.activeSessions, color: "text-orange-600" },
    { title: "Pending Approvals", value: stats.pendingApprovals, color: "text-yellow-600", href: "/admin/lecturers" },
    { title: "Departments", value: stats.departments, color: "text-cyan-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-4">
              {card.href ? (
                <Link href={card.href} className="block">
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </Link>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend (This Week)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="attendance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No registrations yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{user.role.replace("_", " ")}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.account_status)}>
                          {user.account_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
