-- Fix RLS policies for ward_round_patients table
-- This script fixes the restrictive RLS policies that were preventing updates in production

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable read for assigned residents" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON ward_round_patients;

-- Create more flexible policies for Ward Rounds functionality

-- Allow all authenticated users to read all ward round patients
-- This is necessary for the Ward Rounds interface to function properly
CREATE POLICY "Enable read for all authenticated users" ON ward_round_patients
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow all authenticated users to update all ward round patients
-- This enables editing of patient data in the Ward Rounds interface
CREATE POLICY "Enable update for all authenticated users" ON ward_round_patients
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Note: Insert and Delete policies remain the same as they were already permissive
-- CREATE POLICY "Enable insert for all authenticated users" ON ward_round_patients
--   FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- CREATE POLICY "Enable delete for all authenticated users" ON ward_round_patients
--   FOR DELETE USING (auth.uid() IS NOT NULL);

-- Verify policies are applied correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'ward_round_patients'
ORDER BY policyname;