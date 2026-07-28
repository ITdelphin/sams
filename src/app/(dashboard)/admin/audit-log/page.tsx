"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const perPage = 20;

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("audit_logs")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false });
      setLogs(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (log as any).profiles?.full_name?.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.entity_type.toLowerCase().includes(q);
    const matchesFrom = !dateFrom || new Date(log.created_at) >= new Date(dateFrom);
    const matchesTo = !dateTo || new Date(log.created_at) <= new Date(dateTo + "T23:59:59");
    return matchesSearch && matchesFrom && matchesTo;
  });

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  function getActionColor(action: string) {
    if (action.includes("create") || action.includes("insert")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (action.includes("update")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    if (action.includes("delete")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>

      <div className="flex flex-wrap gap-4">
        <Input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="max-w-xs" />
        <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} className="max-w-[180px]" />
        <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} className="max-w-[180px]" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No audit logs found.</TableCell>
                </TableRow>
              ) : (
                paged.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{formatDateTime(log.created_at)}</TableCell>
                    <TableCell className="text-sm">{(log as any).profiles?.full_name || "System"}</TableCell>
                    <TableCell><Badge className={getActionColor(log.action)}>{log.action}</Badge></TableCell>
                    <TableCell className="text-sm">{log.entity_type}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {log.new_value ? JSON.stringify(JSON.parse(log.new_value)).slice(0, 80) : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.ip_address || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages} ({filtered.length} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
