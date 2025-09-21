-- Fix RLS Policies for Lumbar Puncture Tables
-- This script resolves the "permission denied for table users" error

-- Drop the problematic admin policy that references auth.users metadata
DROP POLICY IF EXISTS "Admins manage all lumbar punctures" ON lumbar_punctures;

-- Create a simpler admin policy that uses service role
CREATE POLICY "Service role access all lumbar punctures" ON lumbar_punctures
  FOR ALL USING (auth.role() = 'service_role');

-- Ensure the main user policy is correct
DROP POLICY IF EXISTS "Residents manage own lumbar punctures" ON lumbar_punctures;
CREATE POLICY "Residents manage own lumbar punctures" ON lumbar_punctures
  FOR ALL USING (auth.uid() = resident_id) WITH CHECK (auth.uid() = resident_id);

-- Update CSF analysis policies to be more permissive for testing
DROP POLICY IF EXISTS "Users access own CSF results" ON csf_analysis_results;
CREATE POLICY "Users access own CSF results" ON csf_analysis_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lumbar_punctures
      WHERE id = lumbar_puncture_id
      AND resident_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lumbar_punctures
      WHERE id = lumbar_puncture_id
      AND resident_id = auth.uid()
    )
  );

-- Update complications policies
DROP POLICY IF EXISTS "Users access own complications" ON lp_complications;
CREATE POLICY "Users access own complications" ON lp_complications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lumbar_punctures
      WHERE id = lumbar_puncture_id
      AND resident_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lumbar_punctures
      WHERE id = lumbar_puncture_id
      AND resident_id = auth.uid()
    )
  );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON lumbar_punctures TO authenticated;
GRANT ALL ON csf_analysis_results TO authenticated;
GRANT ALL ON lp_complications TO authenticated;

-- Grant sequence permissions if they exist
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure authenticated users can execute the statistical functions
GRANT EXECUTE ON FUNCTION get_resident_lp_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_lp_stats(UUID, DATE, DATE) TO authenticated;