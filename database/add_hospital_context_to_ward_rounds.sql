-- Migration: Add hospital_context column to ward_round_patients table
-- Purpose: Maintain consistency with other tables and enable hospital context filtering
-- Execute this in Supabase SQL Editor

-- Add hospital_context column with default value 'Posadas'
ALTER TABLE ward_round_patients
ADD COLUMN IF NOT EXISTS hospital_context TEXT NOT NULL DEFAULT 'Posadas';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_ward_round_patients_hospital_context
ON ward_round_patients(hospital_context);

-- Update RLS policies to include hospital_context filtering
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read for assigned residents" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable delete for all authenticated users" ON ward_round_patients;

-- Create new policies with hospital_context filtering
-- Policy to allow reads for Posadas context
CREATE POLICY "Enable read for Posadas context" ON ward_round_patients
  FOR SELECT USING (
    hospital_context = 'Posadas' AND (
      assigned_resident_id = auth.uid() OR
      assigned_resident_id IS NULL
    )
  );

-- Policy to allow inserts for authenticated users (Posadas context)
CREATE POLICY "Enable insert for authenticated users Posadas" ON ward_round_patients
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    hospital_context = 'Posadas'
  );

-- Policy to allow updates for authenticated users (Posadas context)
CREATE POLICY "Enable update for authenticated users Posadas" ON ward_round_patients
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    hospital_context = 'Posadas'
  ) WITH CHECK (
    hospital_context = 'Posadas'
  );

-- Policy to allow deletes for authenticated users (Posadas context)
CREATE POLICY "Enable delete for authenticated users Posadas" ON ward_round_patients
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    hospital_context = 'Posadas'
  );

-- Add comment for documentation
COMMENT ON COLUMN ward_round_patients.hospital_context IS 'Hospital context for data isolation (default: Posadas)';
