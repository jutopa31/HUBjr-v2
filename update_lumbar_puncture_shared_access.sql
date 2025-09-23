-- Update Lumbar Puncture Access for Shared Educational Use
-- This script changes the access model to allow all users to view all lumbar punctures
-- while maintaining write permissions only for the procedure owner and admins

-- Remove existing restrictive policies
DROP POLICY IF EXISTS "Residents manage own lumbar punctures" ON lumbar_punctures;
DROP POLICY IF EXISTS "Admins manage all lumbar punctures" ON lumbar_punctures;

-- Create new shared read access policies
CREATE POLICY "All users can view all lumbar punctures" ON lumbar_punctures
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Procedure owners can insert their own procedures
CREATE POLICY "Users can insert their own lumbar punctures" ON lumbar_punctures
  FOR INSERT WITH CHECK (auth.uid() = resident_id);

-- Procedure owners can update their own procedures
CREATE POLICY "Users can update their own lumbar punctures" ON lumbar_punctures
  FOR UPDATE USING (auth.uid() = resident_id) WITH CHECK (auth.uid() = resident_id);

-- Procedure owners can delete their own procedures
CREATE POLICY "Users can delete their own lumbar punctures" ON lumbar_punctures
  FOR DELETE USING (auth.uid() = resident_id);

-- Admins can manage all lumbar punctures
CREATE POLICY "Admins manage all lumbar punctures" ON lumbar_punctures
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Update CSF analysis policies for shared access
DROP POLICY IF EXISTS "Users access own CSF results" ON csf_analysis_results;

CREATE POLICY "All users can view all CSF results" ON csf_analysis_results
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage CSF results for their procedures" ON csf_analysis_results
  FOR INSERT WITH CHECK (
    lumbar_puncture_id IN (
      SELECT id FROM lumbar_punctures WHERE resident_id = auth.uid()
    )
  );

CREATE POLICY "Users can update CSF results for their procedures" ON csf_analysis_results
  FOR UPDATE USING (
    lumbar_puncture_id IN (
      SELECT id FROM lumbar_punctures WHERE resident_id = auth.uid()
    )
  )
  WITH CHECK (
    lumbar_puncture_id IN (
      SELECT id FROM lumbar_punctures WHERE resident_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete CSF results for their procedures" ON csf_analysis_results
  FOR DELETE USING (
    lumbar_puncture_id IN (
      SELECT id FROM lumbar_punctures WHERE resident_id = auth.uid()
    )
  );

-- Update complications policies for shared access
DROP POLICY IF EXISTS "Users access own complications" ON lp_complications;

CREATE POLICY "All users can view all complications" ON lp_complications
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage complications for their procedures" ON lp_complications
  FOR INSERT WITH CHECK (
    lumbar_puncture_id IN (
      SELECT id FROM lumbar_punctures WHERE resident_id = auth.uid()
    )
  );

CREATE POLICY "Users can update complications for their procedures" ON lp_complications
  FOR UPDATE USING (
    lumbar_puncture_id IN (
      SELECT id FROM lumbar_punctures WHERE resident_id = auth.uid()
    )
  )
  WITH CHECK (
    lumbar_puncture_id IN (
      SELECT id FROM lumbar_punctures WHERE resident_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete complications for their procedures" ON lp_complications
  FOR DELETE USING (
    lumbar_puncture_id IN (
      SELECT id FROM lumbar_punctures WHERE resident_id = auth.uid()
    )
  );

-- Create a view to get lumbar punctures with resident names
CREATE OR REPLACE VIEW lumbar_punctures_with_names AS
SELECT
  lp.*,
  COALESCE(
    rp.first_name || ' ' || rp.last_name,
    u.raw_user_meta_data->>'full_name',
    u.email
  ) as resident_name,
  rp.training_level as resident_level
FROM lumbar_punctures lp
LEFT JOIN auth.users u ON lp.resident_id = u.id
LEFT JOIN resident_profiles rp ON lp.resident_id = rp.user_id;

-- Grant access to the view
GRANT SELECT ON lumbar_punctures_with_names TO authenticated;

-- Update the statistics function to work with all residents
CREATE OR REPLACE FUNCTION get_department_lp_stats()
RETURNS TABLE (
  total_procedures INTEGER,
  successful_procedures INTEGER,
  success_rate DECIMAL(5,2),
  complications_count INTEGER,
  average_attempts DECIMAL(3,1),
  total_residents INTEGER,
  most_active_resident TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_procedures,
    COUNT(*) FILTER (WHERE successful = true)::INTEGER as successful_procedures,
    ROUND(
      (COUNT(*) FILTER (WHERE successful = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as success_rate,
    (SELECT COUNT(*)::INTEGER FROM lp_complications) as complications_count,
    ROUND(AVG(attempts_count)::DECIMAL, 1) as average_attempts,
    COUNT(DISTINCT resident_id)::INTEGER as total_residents,
    (SELECT
       COALESCE(
         rp.first_name || ' ' || rp.last_name,
         u.raw_user_meta_data->>'full_name',
         u.email
       )
     FROM lumbar_punctures lp2
     LEFT JOIN auth.users u ON lp2.resident_id = u.id
     LEFT JOIN resident_profiles rp ON lp2.resident_id = rp.user_id
     GROUP BY lp2.resident_id, rp.first_name, rp.last_name, u.raw_user_meta_data, u.email
     ORDER BY COUNT(*) DESC
     LIMIT 1
    ) as most_active_resident
  FROM lumbar_punctures;
END;
$$ LANGUAGE plpgsql;

-- Function to get stats by resident
CREATE OR REPLACE FUNCTION get_resident_lp_comparison()
RETURNS TABLE (
  resident_id UUID,
  resident_name TEXT,
  total_procedures INTEGER,
  successful_procedures INTEGER,
  success_rate DECIMAL(5,2),
  average_attempts DECIMAL(3,1),
  complications_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lp.resident_id,
    COALESCE(
      rp.first_name || ' ' || rp.last_name,
      u.raw_user_meta_data->>'full_name',
      u.email
    ) as resident_name,
    COUNT(*)::INTEGER as total_procedures,
    COUNT(*) FILTER (WHERE lp.successful = true)::INTEGER as successful_procedures,
    ROUND(
      (COUNT(*) FILTER (WHERE lp.successful = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as success_rate,
    ROUND(AVG(lp.attempts_count)::DECIMAL, 1) as average_attempts,
    (SELECT COUNT(*)::INTEGER
     FROM lp_complications lc
     WHERE lc.lumbar_puncture_id IN (
       SELECT id FROM lumbar_punctures WHERE resident_id = lp.resident_id
     )
    ) as complications_count
  FROM lumbar_punctures lp
  LEFT JOIN auth.users u ON lp.resident_id = u.id
  LEFT JOIN resident_profiles rp ON lp.resident_id = rp.user_id
  GROUP BY lp.resident_id, rp.first_name, rp.last_name, u.raw_user_meta_data, u.email
  ORDER BY total_procedures DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_department_lp_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_resident_lp_comparison() TO authenticated;

-- Update the existing resident stats function to be safer
DROP FUNCTION IF EXISTS get_resident_lp_stats(UUID);
CREATE OR REPLACE FUNCTION get_resident_lp_stats(resident_uuid UUID)
RETURNS TABLE (
  total_procedures INTEGER,
  successful_procedures INTEGER,
  success_rate DECIMAL(5,2),
  complications_count INTEGER,
  average_attempts DECIMAL(3,1),
  most_common_indication TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(COUNT(*)::INTEGER, 0) as total_procedures,
    COALESCE(COUNT(*) FILTER (WHERE successful = true)::INTEGER, 0) as successful_procedures,
    COALESCE(ROUND(
      (COUNT(*) FILTER (WHERE successful = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      2
    ), 0.0) as success_rate,
    COALESCE((SELECT COUNT(*)::INTEGER
     FROM lp_complications lc
     JOIN lumbar_punctures lp ON lc.lumbar_puncture_id = lp.id
     WHERE lp.resident_id = resident_uuid
    ), 0) as complications_count,
    COALESCE(ROUND(AVG(attempts_count)::DECIMAL, 1), 0.0) as average_attempts,
    (SELECT indication
     FROM lumbar_punctures
     WHERE resident_id = resident_uuid
     GROUP BY indication
     ORDER BY COUNT(*) DESC
     LIMIT 1
    ) as most_common_indication
  FROM lumbar_punctures
  WHERE resident_id = resident_uuid;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_resident_lp_stats(UUID) TO authenticated;