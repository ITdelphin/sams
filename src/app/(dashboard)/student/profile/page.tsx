"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, getStatusColor, getRoleLabel } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  CreditCard,
  BadgeCheck,
  Building2,
  BookOpen,
  Shield,
  Calendar,
  Pencil,
  Loader2,
  Inbox,
  Save,
  X,
} from "lucide-react";

type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  national_id: string | null;
  student_id: string | null;
  role: "student" | "lecturer" | "super_admin";
  account_status: string;
  department_id: string | null;
  faculty_id: string | null;
  profile_photo_url: string | null;
  created_at: string;
  updated_at: string;
  departments?: { name: string; code: string } | null;
  faculties?: { name: string; code: string } | null;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAccountStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "approved":
      return {
        label: "Active",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      };
    case "pending":
      return {
        label: "Pending Review",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      };
    case "suspended":
      return {
        label: "Suspended",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      };
    case "inactive":
      return {
        label: "Inactive",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      };
    case "rejected":
      return {
        label: "Rejected",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      };
    case "graduated":
      return {
        label: "Graduated",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      };
    default:
      return {
        label: status,
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      };
  }
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone_number: "",
  });

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        toast.error("Not authenticated. Please log in again.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*, departments(name, code), faculties(name, code)")
        .eq("id", authData.user.id)
        .single();

      if (error) {
        toast.error("Failed to load profile");
        setLoading(false);
        return;
      }

      setProfile(data as Profile);
      setEditForm({
        full_name: (data as Profile).full_name || "",
        phone_number: (data as Profile).phone_number || "",
      });
      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!profile) return;

    if (!editForm.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editForm.full_name.trim(),
        phone_number: editForm.phone_number.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            full_name: editForm.full_name.trim(),
            phone_number: editForm.phone_number.trim() || null,
          }
        : prev
    );
    setEditing(false);
    toast.success("Profile updated successfully");
  }

  function handleCancel() {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || "",
        phone_number: profile.phone_number || "",
      });
    }
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Inbox className="size-10 text-muted-foreground/50" />
        <div className="text-center">
          <p className="font-medium text-muted-foreground">
            Profile not found
          </p>
          <p className="text-xs text-muted-foreground">
            Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  const statusInfo = getAccountStatusBadge(profile.account_status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your account information.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
              {getInitials(profile.full_name)}
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-lg font-semibold">{profile.full_name}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
            <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
            <div className="w-full space-y-2 pt-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="size-4" />
                <span>Role: {getRoleLabel(profile.role)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-4" />
                <span>Joined {formatDate(profile.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="size-4" />
                  Personal Information
                </CardTitle>
                {!editing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      <X className="size-3.5" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <User className="size-3.5" />
                    Full Name
                  </Label>
                  {editing ? (
                    <Input
                      value={editForm.full_name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          full_name: e.target.value,
                        }))
                      }
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-sm font-medium">{profile.full_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="size-3.5" />
                    Email
                  </Label>
                  <p className="text-sm font-medium">{profile.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="size-3.5" />
                    Phone Number
                  </Label>
                  {editing ? (
                    <Input
                      value={editForm.phone_number}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          phone_number: e.target.value,
                        }))
                      }
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {profile.phone_number || "—"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CreditCard className="size-3.5" />
                    National ID
                  </Label>
                  <p className="text-sm font-medium">
                    {profile.national_id || "—"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <BadgeCheck className="size-3.5" />
                    Roll Number
                  </Label>
                  <p className="text-sm font-medium">
                    {profile.student_id || "—"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="size-3.5" />
                    Member Since
                  </Label>
                  <p className="text-sm font-medium">
                    {formatDate(profile.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="size-3.5" />
                    Department
                  </Label>
                  <p className="text-sm font-medium">
                    {profile.departments?.name || "—"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <BookOpen className="size-3.5" />
                    Faculty
                  </Label>
                  <p className="text-sm font-medium">
                    {profile.faculties?.name || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-4" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Your account is currently
                  </p>
                  <Badge className={`text-sm ${statusInfo.className}`}>
                    {statusInfo.label}
                  </Badge>
                  {profile.account_status === "pending" && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Your account is under review. You will be notified once approved.
                    </p>
                  )}
                  {profile.account_status === "suspended" && (
                    <p className="text-xs text-destructive pt-1">
                      Your account has been suspended. Please contact administration.
                    </p>
                  )}
                </div>
                <Link href="/student/courses">
                  <Button variant="outline" size="sm">
                    <BookOpen className="size-3.5" />
                    View My Courses
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
