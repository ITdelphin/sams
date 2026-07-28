"use client";

import { createClient } from "@/lib/supabase/client";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string
) {
  const supabase = createClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
  });
  return error;
}

export async function createAuditLog(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  oldValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>,
  ipAddress?: string
) {
  const supabase = createClient();
  const { error } = await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    old_value: oldValue ? JSON.stringify(oldValue) : null,
    new_value: newValue ? JSON.stringify(newValue) : null,
    ip_address: ipAddress || null,
  });
  return error;
}

export async function markNotificationRead(notificationId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  return error;
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return error;
}
