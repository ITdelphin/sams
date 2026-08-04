"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Setting {
  id: string;
  key: string;
  value: string;
}

const DEFAULT_SETTINGS = [
  { key: "institution_name", label: "Institution Name", placeholder: "University of SAMS", group: "General" },
  { key: "attendance_method_default", label: "Default Attendance Method", placeholder: "qr_code", group: "General" },
  { key: "qr_expiry_seconds", label: "QR Code Expiry (seconds)", placeholder: "30", group: "Attendance" },
  { key: "late_threshold_minutes", label: "Late Threshold (minutes)", placeholder: "15", group: "Attendance" },
  { key: "max_failed_logins", label: "Max Failed Logins", placeholder: "5", group: "Security" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("system_settings").select("*");
      setSettings(data || []);
      const v: Record<string, string> = {};
      (data || []).forEach((s: Setting) => { v[s.key] = s.value; });
      setValues(v);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    for (const [key, value] of Object.entries(values)) {
      const existing = settings.find((s) => s.key === key);
      if (existing) {
        await supabase.from("system_settings").update({ value }).eq("id", existing.id);
      } else {
        await supabase.from("system_settings").insert({ key, value });
      }
    }
    toast.success("Settings saved successfully.");
    setSaving(false);
  }

  async function handleAddSetting() {
    if (!newKey.trim() || !newValue.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from("system_settings").insert({ key: newKey.trim(), value: newValue.trim() });
    if (error) {
      toast.error("Failed to add setting.");
    } else {
      toast.success("Setting added.");
      setShowAdd(false);
      setNewKey("");
      setNewValue("");
      const { data } = await supabase.from("system_settings").select("*");
      setSettings(data || []);
      const v: Record<string, string> = {};
      (data || []).forEach((s: Setting) => { v[s.key] = s.value; });
      setValues(v);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const groups = ["General", "Attendance", "Security"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAdd(true)}>Add Setting</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save All"}</Button>
        </div>
      </div>

      {groups.map((group) => (
        <Card key={group}>
          <CardHeader><CardTitle>{group}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {DEFAULT_SETTINGS.filter((s) => s.group === group).map((s) => (
              <div key={s.key} className="space-y-2">
                <Label>{s.label}</Label>
                <Input
                  value={values[s.key] || ""}
                  onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                  placeholder={s.placeholder}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {settings.filter((s) => !DEFAULT_SETTINGS.find((d) => d.key === s.key)).length > 0 && (
        <Card>
          <CardHeader><CardTitle>Custom Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {settings
              .filter((s) => !DEFAULT_SETTINGS.find((d) => d.key === s.key))
              .map((s) => (
                <div key={s.key} className="space-y-2">
                  <Label>{s.key}</Label>
                  <Input
                    value={values[s.key] || ""}
                    onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                  />
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Setting</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Key</Label>
              <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="setting_key" />
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="value" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAddSetting}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
