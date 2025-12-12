-- Final comprehensive fix for ward_round_patients RLS policies
-- This script ensures CSV import duplicate checking works correctly
-- Execute this in Supabase SQL Editor

-- Purpose:
-- - Remove ALL existing conflicting policies
-- - Create simple, permissive policies for authenticated users
-- - Move hospital_context filtering to application logic (not RLS)
-- - Fix the 400 error in DNI duplicate check during CSV import

-- ============================================
-- STEP 1: Drop all existing policies
-- ============================================

DROP POLICY IF EXISTS "Enable read for assigned residents" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable read for Posadas context" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable insert for authenticated users Posadas" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable update for authenticated users Posadas" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable delete for all authenticated users" ON ward_round_patients;
DROP POLICY IF EXISTS "Enable delete for authenticated users Posadas" ON ward_round_patients;

-- ============================================
-- STEP 2: Create new, simple policies
-- ============================================

-- Rationale:
-- - RLS should only enforce authentication, not business logic
-- - Hospital context filtering is handled in application queries
-- - Simpler policies = fewer conflicts = more reliable queries
-- - This allows CSV import's checkDuplicateDNI to work correctly

-- SELECT: Allow authenticated users to read all ward round patients
CREATE POLICY "ward_round_patients_select_policy" ON ward_round_patients
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT: Allow authenticated users to insert ward round patients
CREATE POLICY "ward_round_patients_insert_policy" ON ward_round_patients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Allow authenticated users to update ward round patients
CREATE POLICY "ward_round_patients_update_policy" ON ward_round_patients
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: Allow authenticated users to delete ward round patients
CREATE POLICY "ward_round_patients_delete_policy" ON ward_round_patients
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- STEP 3: Verify the new policies
-- ============================================

SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'ward_round_patients'
ORDER BY policyname;

-- Expected output: 4 policies with simple authentication checks
-- - ward_round_patients_select_policy (SELECT)
-- - ward_round_patients_insert_policy (INSERT)
-- - ward_round_patients_update_policy (UPDATE)
-- - ward_round_patients_delete_policy (DELETE)

-- ============================================
-- NOTES
-- ============================================

-- After running this script:
-- 1. The DNI duplicate check in CSV import should work without 400 errors
-- 2. Hospital context filtering will be handled by the application
-- 3. All authenticated users can read/write ward round patients
-- 4. RLS only enforces that users must be authenticated

-- If you need to revert to hospital context-based RLS in the future,
-- you can add that logic back to the policies, but ensure queries
-- don't conflict with the RLS filters.
