-- Fix for Lumbar Puncture RPC Functions
-- This script adds SECURITY DEFINER and fixes potential issues

-- 1. Fix get_monthly_lp_stats - add SECURITY DEFINER
DROP FUNCTION IF EXISTS get_monthly_lp_stats(UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION get_monthly_lp_stats(resident_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
  month_year TEXT,
  total_lps INTEGER,
  successful_lps INTEGER,
  success_rate DECIMAL(5,2)
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(procedure_date, 'YYYY-MM') as month_year,
    COUNT(*)::INTEGER as total_lps,
    COUNT(*) FILTER (WHERE successful = true)::INTEGER as successful_lps,
    ROUND(
      (COUNT(*) FILTER (WHERE successful = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as success_rate
  FROM lumbar_punctures
  WHERE resident_id = resident_uuid
    AND procedure_date BETWEEN start_date AND end_date
  GROUP BY TO_CHAR(procedure_date, 'YYYY-MM')
  ORDER BY month_year;
END;
$$;

-- 2. Recreate get_resident_lp_stats with SECURITY DEFINER (ensure it's correct)
DROP FUNCTION IF EXISTS get_resident_lp_stats(UUID);

CREATE OR REPLACE FUNCTION get_resident_lp_stats(resident_uuid UUID)
RETURNS TABLE (
  total_procedures INTEGER,
  successful_procedures INTEGER,
  success_rate DECIMAL(5,2),
  complications_count INTEGER,
  average_attempts DECIMAL(3,1),
  most_common_indication TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_procedures,
    COUNT(*) FILTER (WHERE successful = true)::INTEGER as successful_procedures,
    ROUND(
      (COUNT(*) FILTER (WHERE successful = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as success_rate,
    (SELECT COUNT(*)::INTEGER
     FROM lp_complications lc
     JOIN lumbar_punctures lp ON lc.lumbar_puncture_id = lp.id
     WHERE lp.resident_id = resident_uuid
    ) as complications_count,
    ROUND(AVG(attempts_count)::DECIMAL, 1) as average_attempts,
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
$$;

-- 3. Recreate get_department_lp_stats with SECURITY DEFINER
DROP FUNCTION IF EXISTS get_department_lp_stats();

CREATE OR REPLACE FUNCTION get_department_lp_stats()
RETURNS TABLE (
  total_procedures INTEGER,
  successful_procedures INTEGER,
  success_rate DECIMAL(5,2),
  complications_count INTEGER,
  average_attempts DECIMAL(3,1),
  total_residents INTEGER,
  most_active_resident TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
    ROUND(AVG(lp.attempts_count)::DECIMAL, 1) as average_attempts,
    COUNT(DISTINCT lp.resident_id)::INTEGER as total_residents,
    (SELECT au.email
     FROM lumbar_punctures lp2
     JOIN auth.users au ON au.id = lp2.resident_id
     GROUP BY au.email, lp2.resident_id
     ORDER BY COUNT(*) DESC
     LIMIT 1
    ) as most_active_resident
  FROM lumbar_punctures lp;
END;
$$;

-- 4. Create get_resident_lp_comparison function (if not exists)
DROP FUNCTION IF EXISTS get_resident_lp_comparison();

CREATE OR REPLACE FUNCTION get_resident_lp_comparison()
RETURNS TABLE (
  resident_id UUID,
  resident_email TEXT,
  total_procedures INTEGER,
  successful_procedures INTEGER,
  success_rate DECIMAL(5,2),
  average_attempts DECIMAL(3,1)
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lp.resident_id,
    au.email as resident_email,
    COUNT(*)::INTEGER as total_procedures,
    COUNT(*) FILTER (WHERE lp.successful = true)::INTEGER as successful_procedures,
    ROUND(
      (COUNT(*) FILTER (WHERE lp.successful = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as success_rate,
    ROUND(AVG(lp.attempts_count)::DECIMAL, 1) as average_attempts
  FROM lumbar_punctures lp
  JOIN auth.users au ON au.id = lp.resident_id
  GROUP BY lp.resident_id, au.email
  ORDER BY total_procedures DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_resident_lp_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_lp_stats(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_department_lp_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_resident_lp_comparison() TO authenticated;
