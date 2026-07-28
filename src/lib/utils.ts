import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateQRCode(): string {
  return `SAMS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function calculateAttendancePercentage(
  present: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "suspended":
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "inactive":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    case "graduated":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "lecturer":
      return "Lecturer";
    case "student":
      return "Student";
    default:
      return role;
  }
}

export function getAttendanceStatusLabel(status: string): string {
  switch (status) {
    case "present":
      return "Present";
    case "absent":
      return "Absent";
    case "late":
      return "Late";
    case "excused":
      return "Excused";
    default:
      return status;
  }
}
