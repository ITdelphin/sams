export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          first_name: string | null;
          last_name: string | null;
          phone_number: string | null;
          national_id: string | null;
          student_id: string | null;
          staff_id: string | null;
          role: "student" | "lecturer" | "super_admin";
          account_status: "pending" | "approved" | "suspended" | "inactive" | "rejected" | "graduated";
          gender: string | null;
          date_of_birth: string | null;
          office: string | null;
          faculty_id: string | null;
          department_id: string | null;
          program_id: string | null;
          class_id: string | null;
          profile_photo_url: string | null;
          must_change_password: boolean;
          failed_login_attempts: number;
          locked_until: string | null;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          first_name?: string | null;
          last_name?: string | null;
          phone_number?: string | null;
          national_id?: string | null;
          student_id?: string | null;
          staff_id?: string | null;
          role: "student" | "lecturer" | "super_admin";
          account_status?: "pending" | "approved" | "suspended" | "inactive" | "rejected" | "graduated";
          gender?: string | null;
          date_of_birth?: string | null;
          office?: string | null;
          faculty_id?: string | null;
          department_id?: string | null;
          program_id?: string | null;
          class_id?: string | null;
          profile_photo_url?: string | null;
          must_change_password?: boolean;
          failed_login_attempts?: number;
          locked_until?: string | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone_number?: string | null;
          national_id?: string | null;
          student_id?: string | null;
          staff_id?: string | null;
          role?: "student" | "lecturer" | "super_admin";
          account_status?: "pending" | "approved" | "suspended" | "inactive" | "rejected" | "graduated";
          gender?: string | null;
          date_of_birth?: string | null;
          office?: string | null;
          faculty_id?: string | null;
          department_id?: string | null;
          program_id?: string | null;
          class_id?: string | null;
          profile_photo_url?: string | null;
          must_change_password?: boolean;
          failed_login_attempts?: number;
          locked_until?: string | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      faculties: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          created_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          code: string;
          faculty_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          faculty_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          faculty_id?: string | null;
          created_at?: string;
        };
      };
      programs: {
        Row: {
          id: string;
          name: string;
          code: string;
          faculty_id: string;
          department_id: string;
          duration_years: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          faculty_id: string;
          department_id: string;
          duration_years: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          faculty_id?: string;
          department_id?: string;
          duration_years?: number;
          created_at?: string;
        };
      };
      academic_years: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_current: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          start_date: string;
          end_date: string;
          is_current?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          is_current?: boolean;
          created_at?: string;
        };
      };
      semesters: {
        Row: {
          id: string;
          name: string;
          academic_year_id: string;
          start_date: string;
          end_date: string;
          is_current: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          academic_year_id: string;
          start_date: string;
          end_date: string;
          is_current?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          academic_year_id?: string;
          start_date?: string;
          end_date?: string;
          is_current?: boolean;
          created_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          name: string;
          code: string;
          department_id: string;
          lecturer_id: string | null;
          credits: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          department_id: string;
          lecturer_id?: string | null;
          credits?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          department_id?: string;
          lecturer_id?: string | null;
          credits?: number;
          created_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          name: string;
          faculty_id: string;
          department_id: string;
          program_id: string;
          academic_year_id: string;
          semester_id: string;
          year: number;
          section: string;
          room: string | null;
          capacity: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          faculty_id: string;
          department_id: string;
          program_id: string;
          academic_year_id: string;
          semester_id: string;
          year: number;
          section: string;
          room?: string | null;
          capacity?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          faculty_id?: string;
          department_id?: string;
          program_id?: string;
          academic_year_id?: string;
          semester_id?: string;
          year?: number;
          section?: string;
          room?: string | null;
          capacity?: number | null;
          created_at?: string;
        };
      };
      course_assignments: {
        Row: {
          id: string;
          class_id: string;
          course_id: string;
          lecturer_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          course_id: string;
          lecturer_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          course_id?: string;
          lecturer_id?: string | null;
          created_at?: string;
        };
      };
      timetable: {
        Row: {
          id: string;
          class_id: string;
          course_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          room: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          course_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          room?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          course_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          room?: string | null;
          created_at?: string;
        };
      };
      course_enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          course_id?: string;
          enrolled_at?: string;
        };
      };
      imported_students: {
        Row: {
          id: string;
          registration_number: string;
          full_name: string;
          email: string | null;
          faculty: string | null;
          department: string | null;
          program: string | null;
          academic_year: string | null;
          semester: string | null;
          class_name: string | null;
          imported_at: string;
        };
        Insert: {
          id?: string;
          registration_number: string;
          full_name: string;
          email?: string | null;
          faculty?: string | null;
          department?: string | null;
          program?: string | null;
          academic_year?: string | null;
          semester?: string | null;
          class_name?: string | null;
          imported_at?: string;
        };
        Update: {
          id?: string;
          registration_number?: string;
          full_name?: string;
          email?: string | null;
          faculty?: string | null;
          department?: string | null;
          program?: string | null;
          academic_year?: string | null;
          semester?: string | null;
          class_name?: string | null;
          imported_at?: string;
        };
      };
      attendance_sessions: {
        Row: {
          id: string;
          course_id: string;
          class_id: string | null;
          lecturer_id: string;
          method: "manual" | "student_id_card" | "qr_code" | "face_recognition" | "fingerprint";
          qr_code: string | null;
          qr_expires_at: string | null;
          is_active: boolean;
          started_at: string;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          class_id?: string | null;
          lecturer_id: string;
          method: "manual" | "student_id_card" | "qr_code" | "face_recognition" | "fingerprint";
          qr_code?: string | null;
          qr_expires_at?: string | null;
          is_active?: boolean;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          class_id?: string | null;
          lecturer_id?: string;
          method?: "manual" | "student_id_card" | "qr_code" | "face_recognition" | "fingerprint";
          qr_code?: string | null;
          qr_expires_at?: string | null;
          is_active?: boolean;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
      };
      attendance_records: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          status: "present" | "absent" | "late" | "excused";
          marked_at: string;
          marked_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          student_id: string;
          status: "present" | "absent" | "late" | "excused";
          marked_at?: string;
          marked_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          student_id?: string;
          status?: "present" | "absent" | "late" | "excused";
          marked_at?: string;
          marked_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_value: string | null;
          new_value: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_value?: string | null;
          new_value?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          old_value?: string | null;
          new_value?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      system_settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
