import type { SupabaseClient } from "@supabase/supabase-js";

export function validatePasswordStrength(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) {
    errors.push("At least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("At least one number");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("At least one special character");
  }
  return errors;
}

export function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "@#$%&*";
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  const parts = [pick(upper), pick(lower), pick(digits), pick(special)];
  const rest = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let i = 0; i < 8; i++) {
    parts.push(pick(rest));
  }
  for (let i = parts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }
  return `Sams@${parts.join("").slice(0, 8)}`;
}

export async function auditAction(
  supabase: SupabaseClient,
  payload: {
    userId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    details?: string;
  }
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      user_id: payload.userId,
      action: payload.action,
      entity_type: payload.entityType,
      entity_id: payload.entityId || null,
      new_value: payload.details ? { note: payload.details } : null,
    });
  } catch {
    // Audit logging must never block the primary flow.
  }
}
