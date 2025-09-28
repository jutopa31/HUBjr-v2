-- Quick fix for the column name error in lumbar_punctures_with_names view
-- This fixes the supervisor_id vs supervisor column issue

-- Drop the existing view that has the error
DROP VIEW IF EXISTS public.lumbar_punctures_with_names;

-- Recreate the view with correct column names
CREATE OR REPLACE VIEW public.lumbar_punctures_with_names AS
SELECT
    lp.*,
    -- Get resident name from user_metadata in a secure way
    COALESCE(
        (SELECT raw_user_meta_data->>'full_name'
         FROM auth.users
         WHERE id = lp.resident_id),
        'Unknown Resident'
    ) as resident_name,
    -- Supervisor is already a text field in the table, use it directly
    COALESCE(lp.supervisor, 'Unknown Supervisor') as supervisor_name,
    -- Get training level from user_metadata
    COALESCE(
        (SELECT raw_user_meta_data->>'training_level'
         FROM auth.users
         WHERE id = lp.resident_id),
        'Unknown'
    ) as resident_level
FROM public.lumbar_punctures lp;

-- Grant permissions on the view
GRANT SELECT ON public.lumbar_punctures_with_names TO authenticated;

-- Note: This still exposes auth.users, but fixes the immediate column error
-- For full security, run fix_supabase_security_warnings.sql after this