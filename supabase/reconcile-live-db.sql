-- SAMS live-database reconciliation
-- Brings the live DB in line with supabase/schema.sql (program-based hierarchy).
-- Safe to re-run: CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / DROP POLICY IF EXISTS.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Programs (missing in live DB)
CREATE TABLE IF NOT EXISTS programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  duration_years INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate classes with the program-based hierarchy (old schema had course_id/schedule)
DROP TABLE IF EXISTS classes CASCADE;
CREATE TABLE classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  year INTEGER NOT NULL DEFAULT 1,
  section TEXT NOT NULL DEFAULT 'A',
  room TEXT,
  capacity INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_unique_section
  ON classes(program_id, academic_year_id, semester_id, year, section);

-- Restore the FK that DROP TABLE ... CASCADE removed
ALTER TABLE attendance_sessions
  ADD CONSTRAINT attendance_sessions_class_id_fkey
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;

-- Course Assignments (missing)
CREATE TABLE IF NOT EXISTS course_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lecturer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, course_id)
);

-- Timetable (missing)
CREATE TABLE IF NOT EXISTS timetable (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Imported Student Records (missing; source of truth for self-registration)
CREATE TABLE IF NOT EXISTS imported_students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  registration_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  faculty TEXT,
  department TEXT,
  program TEXT,
  academic_year TEXT,
  semester TEXT,
  class_name TEXT,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles auth columns (missing)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS staff_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS office TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_faculty ON profiles(faculty_id);
CREATE INDEX IF NOT EXISTS idx_profiles_program ON profiles(program_id);
CREATE INDEX IF NOT EXISTS idx_profiles_class ON profiles(class_id);
CREATE INDEX IF NOT EXISTS idx_profiles_staff ON profiles(staff_id);
CREATE INDEX IF NOT EXISTS idx_imported_students_reg ON imported_students(registration_number);
CREATE INDEX IF NOT EXISTS idx_programs_faculty ON programs(faculty_id);
CREATE INDEX IF NOT EXISTS idx_programs_department ON programs(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_lecturer ON courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_classes_program ON classes(program_id);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_classes_semester ON classes(semester_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_class ON course_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_course ON course_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_lecturer ON course_assignments(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_timetable_class ON timetable(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_course ON timetable(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON attendance_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_lecturer ON attendance_sessions(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON attendance_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_records_student ON attendance_records(student_id);

-- Row Level Security
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_students ENABLE ROW LEVEL SECURITY;

-- Programs policies
DROP POLICY IF EXISTS "Anyone can view programs" ON programs;
CREATE POLICY "Anyone can view programs" ON programs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage programs" ON programs;
CREATE POLICY "Admins can manage programs" ON programs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Classes policies
DROP POLICY IF EXISTS "Anyone can view classes" ON classes;
CREATE POLICY "Anyone can view classes" ON classes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;
CREATE POLICY "Admins can manage classes" ON classes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Course assignments policies
DROP POLICY IF EXISTS "Anyone can view course assignments" ON course_assignments;
CREATE POLICY "Anyone can view course assignments" ON course_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage course assignments" ON course_assignments;
CREATE POLICY "Admins can manage course assignments" ON course_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Timetable policies
DROP POLICY IF EXISTS "Anyone can view timetable" ON timetable;
CREATE POLICY "Anyone can view timetable" ON timetable FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage timetable" ON timetable;
CREATE POLICY "Admins can manage timetable" ON timetable FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Imported students policies
DROP POLICY IF EXISTS "Anyone can view imported students" ON imported_students;
CREATE POLICY "Anyone can view imported students" ON imported_students FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage imported students" ON imported_students;
CREATE POLICY "Admins can manage imported students" ON imported_students FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
