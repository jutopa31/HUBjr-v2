-- =====================================================
-- Scientific Papers Table Setup
-- Feature: Trabajos Científicos Board (Google Keep style)
-- =====================================================

-- Create the scientific_papers table
CREATE TABLE IF NOT EXISTS scientific_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Paper data
  title VARCHAR(255) NOT NULL,
  description TEXT,
  paper_type VARCHAR(50) DEFAULT 'abstract', -- 'abstract', 'poster', 'articulo', 'caso_clinico'
  event_name VARCHAR(255),                    -- Congress/event name

  -- Deadline and status
  deadline DATE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'submitted', 'accepted', 'rejected'

  -- File URLs (Supabase Storage)
  abstract_url TEXT,
  draft_url TEXT,
  final_url TEXT,

  -- Assignment (array of resident emails)
  assigned_residents TEXT[] DEFAULT '{}',
  pending_tasks TEXT[] DEFAULT '{}',

  -- Organization (Google Keep style)
  color VARCHAR(50) DEFAULT 'default',
  priority VARCHAR(50) DEFAULT 'medium', -- 'urgent', 'high', 'medium', 'low'
  tags TEXT[] DEFAULT '{}',

  -- Metadata
  hospital_context VARCHAR(50) DEFAULT 'Posadas',
  created_by VARCHAR(255) NOT NULL,       -- User email
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure new columns exist for existing tables
ALTER TABLE scientific_papers
  ADD COLUMN IF NOT EXISTS pending_tasks TEXT[] DEFAULT '{}';

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_scientific_papers_hospital_context
  ON scientific_papers(hospital_context);
CREATE INDEX IF NOT EXISTS idx_scientific_papers_status
  ON scientific_papers(status);
CREATE INDEX IF NOT EXISTS idx_scientific_papers_deadline
  ON scientific_papers(deadline);
CREATE INDEX IF NOT EXISTS idx_scientific_papers_created_by
  ON scientific_papers(created_by);

-- Enable RLS
ALTER TABLE scientific_papers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies (using auth.jwt() ->> 'email' for email-based access)
-- =====================================================

-- Policy: SELECT - Users can view papers in their accessible hospital context
-- Posadas is accessible to all authenticated users
-- Julian requires 'hospital_context_access' privilege
CREATE POLICY "scientific_papers_select_policy"
ON scientific_papers FOR SELECT
TO authenticated
USING (
  CASE
    WHEN hospital_context = 'Posadas' THEN true
    WHEN hospital_context = 'Julian' THEN EXISTS (
      SELECT 1 FROM admin_privileges
      WHERE user_email = (auth.jwt() ->> 'email')
      AND privilege_type = 'hospital_context_access'
    )
    ELSE false
  END
);

-- Policy: INSERT - Any authenticated user can create papers
CREATE POLICY "scientific_papers_insert_policy"
ON scientific_papers FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = (auth.jwt() ->> 'email')
);

-- Policy: UPDATE - Creators or assigned residents can update
CREATE POLICY "scientific_papers_update_policy"
ON scientific_papers FOR UPDATE
TO authenticated
USING (
  created_by = (auth.jwt() ->> 'email')
  OR (auth.jwt() ->> 'email') = ANY(assigned_residents)
);

-- Policy: DELETE - Only creators can delete
CREATE POLICY "scientific_papers_delete_policy"
ON scientific_papers FOR DELETE
TO authenticated
USING (
  created_by = (auth.jwt() ->> 'email')
);

-- =====================================================
-- Trigger for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_scientific_papers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scientific_papers_updated_at ON scientific_papers;
CREATE TRIGGER scientific_papers_updated_at
  BEFORE UPDATE ON scientific_papers
  FOR EACH ROW
  EXECUTE FUNCTION update_scientific_papers_updated_at();

-- =====================================================
-- Storage bucket setup (run in Supabase Dashboard > Storage)
-- =====================================================
-- 1. Create bucket named 'scientific-papers' with public access disabled
-- 2. Add storage policies:
--    - authenticated users can upload to their own paper folders
--    - authenticated users can read files from papers they have access to

-- Storage policies (execute in Supabase SQL editor):
/*
-- Allow authenticated users to upload files
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Allow authenticated uploads',
  'scientific-papers',
  '(role() = ''authenticated'')'
);

-- Allow authenticated users to read files
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Allow authenticated reads',
  'scientific-papers',
  '(role() = ''authenticated'')'
);
*/

-- =====================================================
-- Sample data for testing (optional)
-- =====================================================
/*
INSERT INTO scientific_papers (title, description, paper_type, event_name, deadline, status, assigned_residents, created_by, hospital_context)
VALUES
  ('Caso de ACV isquémico con transformación hemorrágica', 'Presentación de caso clínico para el congreso de neurología', 'caso_clinico', 'Congreso Argentino de Neurología 2025', '2025-03-15', 'in_progress', ARRAY['resident1@hospital.com', 'resident2@hospital.com'], 'admin@hospital.com', 'Posadas'),
  ('Revisión de esclerosis múltiple', 'Abstract sobre nuevos tratamientos', 'abstract', 'LACTRIMS 2025', '2025-04-01', 'pending', ARRAY['resident3@hospital.com'], 'admin@hospital.com', 'Posadas');
*/
