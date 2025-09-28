-- Fix ward_round_patients table by adding missing assigned_resident_id column
-- Execute this in Supabase SQL Editor

-- Add the missing assigned_resident_id column
ALTER TABLE ward_round_patients
ADD COLUMN IF NOT EXISTS assigned_resident_id UUID REFERENCES auth.users(id);

-- Create index for the new column for better performance
CREATE INDEX IF NOT EXISTS idx_ward_round_patients_assigned_resident
ON ward_round_patients(assigned_resident_id);

-- Update RLS policies to handle the new column properly
-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable read for assigned residents" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable delete for all authenticated users" ON ward_round_patients;

-- Create new policies that handle the assigned_resident_id column
CREATE POLICY "Enable read for assigned residents or unassigned patients" ON ward_round_patients
  FOR SELECT USING (
    assigned_resident_id = auth.uid() OR
    assigned_resident_id IS NULL OR
    auth.uid() IS NOT NULL  -- Allow all authenticated users to read for now
  );

CREATE POLICY "Enable insert for all authenticated users" ON ward_round_patients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for all authenticated users" ON ward_round_patients
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for all authenticated users" ON ward_round_patients
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add comment for the new column
COMMENT ON COLUMN ward_round_patients.assigned_resident_id IS 'ID of the resident assigned to this patient';