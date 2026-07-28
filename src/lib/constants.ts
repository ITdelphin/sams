export const ROLES = {
  STUDENT: "student",
  LECTURER: "lecturer",
  SUPER_ADMIN: "super_admin",
} as const;

export const ACCOUNT_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  SUSPENDED: "suspended",
  INACTIVE: "inactive",
  REJECTED: "rejected",
  GRADUATED: "graduated",
} as const;

export const ATTENDANCE_METHODS = {
  MANUAL: "manual",
  STUDENT_ID_CARD: "student_id_card",
  QR_CODE: "qr_code",
  FACE_RECOGNITION: "face_recognition",
  FINGERPRINT: "fingerprint",
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
  EXCUSED: "excused",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[keyof typeof ACCOUNT_STATUSES];
export type AttendanceMethod = (typeof ATTENDANCE_METHODS)[keyof typeof ATTENDANCE_METHODS];
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];
