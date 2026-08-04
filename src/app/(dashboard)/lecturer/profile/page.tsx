"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate, getStatusColor, getRoleLabel } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

type ProfileData = {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  national_id: string | null;
  account_status: string;
  role: string;
  created_at: string;
  departments: { name: string } | null;
  faculties: { name: string } | null;
};

export default function LecturerProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone_number: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*, departments(name), faculties(name)")
        .eq("id", user.id)
        .single();

      setProfile(data as ProfileData);
      setForm({ full_name: data?.full_name || "", phone_number: data?.phone_number || "" });
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: form.full_name, phone_number: form.phone_number || null })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to update profile.");
    } else {
      toast.success("Profile updated.");
      setProfile({ ...profile, ...form });
      setEditing(false);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const initials = profile?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center py-8">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-semibold">{profile?.full_name}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <Badge className={`mt-2 ${getStatusColor(profile?.account_status || "")}`}>{profile?.account_status}</Badge>
            <Badge variant="outline" className="mt-1">{getRoleLabel(profile?.role || "lecturer")}</Badge>
            <p className="mt-4 text-xs text-muted-foreground">Member since {formatDate(profile?.created_at || "")}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Personal Information</CardTitle>
            {!editing ? (
              <Button variant="outline" onClick={() => setEditing(true)}>Edit Profile</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setEditing(false); setForm({ full_name: profile?.full_name || "", phone_number: profile?.phone_number || "" }); }}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                {editing ? (
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                ) : (
                  <p className="text-sm">{profile?.full_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-sm">{profile?.email}</p>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                {editing ? (
                  <Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
                ) : (
                  <p className="text-sm">{profile?.phone_number || "Not set"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>National ID</Label>
                <p className="text-sm">{profile?.national_id || "Not set"}</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Department</Label>
                <p className="text-sm">{profile?.departments?.name || "Not assigned"}</p>
              </div>
              <div className="space-y-2">
                <Label>Faculty</Label>
                <p className="text-sm">{profile?.faculties?.name || "Not assigned"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Change your account password for better security.
              </p>
            </div>
            <Link href="/change-password">
              <Button variant="outline" size="sm">Change Password</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
