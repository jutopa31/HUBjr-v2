-- Alternative approach: Create a secure user profiles table
-- This completely eliminates the need to access auth.users from views

-- ============================================================================
-- Create secure user profiles table
-- ============================================================================

-- Create a public user profiles table that mirrors the needed auth.users data
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    training_level TEXT,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
-- All authenticated users can view all profiles (for shared functionality)
CREATE POLICY "Allow authenticated users to view all user profiles"
ON public.user_profiles FOR SELECT
TO authenticated
USING (true);

-- Users can only insert/update their own profile
CREATE POLICY "Users can insert their own profile"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

-- ============================================================================
-- Create trigger to auto-populate user_profiles from auth.users
-- ============================================================================

-- Function to sync user profile data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, training_level, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
        COALESCE(NEW.raw_user_meta_data->>'training_level', 'R1'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'resident')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Create the completely secure lumbar punctures view
-- ============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS public.lumbar_punctures_with_names;

-- Create new secure view using user_profiles table
CREATE OR REPLACE VIEW public.lumbar_punctures_with_names AS
SELECT
    lp.*,
    up_resident.full_name as resident_name,
    up_resident.training_level as resident_level,
    -- Supervisor is a text field, use it directly
    COALESCE(lp.supervisor, 'Unknown Supervisor') as supervisor_name
FROM public.lumbar_punctures lp
LEFT JOIN public.user_profiles up_resident ON lp.resident_id = up_resident.id;

-- Grant permissions on the view
GRANT SELECT ON public.lumbar_punctures_with_names TO authenticated;

-- ============================================================================
-- Migrate existing user data to user_profiles
-- ============================================================================

-- Insert existing users into user_profiles table
INSERT INTO public.user_profiles (id, full_name, training_level, role)
SELECT
    id,
    COALESCE(raw_user_meta_data->>'full_name', 'Unknown User'),
    COALESCE(raw_user_meta_data->>'training_level', 'R1'),
    COALESCE(raw_user_meta_data->>'role', 'resident')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Update existing tables to reference user_profiles if needed
-- ============================================================================

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON public.user_profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_training_level ON public.user_profiles(training_level);

COMMENT ON TABLE public.user_profiles IS
'Secure user profiles table that mirrors auth.users metadata without exposing sensitive auth data';

COMMENT ON VIEW public.lumbar_punctures_with_names IS
'Secure view of lumbar punctures with user names from public.user_profiles table';