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
        Relationships: [
          {
            foreignKeyName: "profiles_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "departments_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculties";
            referencedColumns: ["id"];
          },
        ];
      };
      programs: {
        Row: {
          id: string;
          name: string;
          code: string;
          faculty_id: string | null;
          department_id: string | null;
          duration_years: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          faculty_id?: string | null;
          department_id?: string | null;
          duration_years: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          faculty_id?: string | null;
          department_id?: string | null;
          duration_years?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "programs_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programs_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "semesters_academic_year_id_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courses_lecturer_id_fkey";
            columns: ["lecturer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "classes_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "classes_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "classes_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "classes_academic_year_id_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "classes_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "course_assignments_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_assignments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_assignments_lecturer_id_fkey";
            columns: ["lecturer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "timetable_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "course_enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_sessions_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_sessions_lecturer_id_fkey";
            columns: ["lecturer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "attendance_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_marked_by_fkey";
            columns: ["marked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
