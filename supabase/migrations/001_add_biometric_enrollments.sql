-- Migration: Add biometric_enrollments table
-- Run this in Supabase SQL Editor to add the missing table

-- Biometric Enrollments
CREATE TABLE IF NOT EXISTS biometric_enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('face', 'fingerprint', 'id_card')),
  face_descriptor JSONB,
  webauthn_credential_id TEXT,
  webauthn_public_key TEXT,
  card_barcode TEXT,
  device_info TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_biometric_student ON biometric_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_biometric_type ON biometric_enrollments(type);
CREATE INDEX IF NOT EXISTS idx_biometric_active ON biometric_enrollments(is_active);

-- Row Level Security
ALTER TABLE biometric_enrollments ENABLE ROW LEVEL SECURITY;

-- Students can view their own biometric enrollments
CREATE POLICY "Students can view own biometric enrollments"
  ON biometric_enrollments FOR SELECT
  USING (student_id = auth.uid());

-- Students can insert their own biometric enrollments
CREATE POLICY "Students can insert own biometric enrollments"
  ON biometric_enrollments FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Students can update their own biometric enrollments
CREATE POLICY "Students can update own biometric enrollments"
  ON biometric_enrollments FOR UPDATE
  USING (student_id = auth.uid());

-- Admins can view all biometric enrollments
CREATE POLICY "Admins can view all biometric enrollments"
  ON biometric_enrollments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Admins can manage all biometric enrollments
CREATE POLICY "Admins can manage all biometric enrollments"
  ON biometric_enrollments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_biometric_enrollments_updated_at
  BEFORE UPDATE ON biometric_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
