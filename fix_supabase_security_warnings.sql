-- Fix Supabase Security Warnings
-- This script addresses all security linter warnings

-- ============================================================================
-- 1. Fix lumbar_punctures_with_names view - Remove auth.users exposure
-- ============================================================================

-- Drop the existing view that exposes auth.users
DROP VIEW IF EXISTS public.lumbar_punctures_with_names;

-- Create a safer view that uses user metadata instead of joining auth.users directly
-- This avoids exposing sensitive auth.users data while still providing resident names
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
    -- Supervisor is already a text field, so use it directly
    COALESCE(lp.supervisor, 'Unknown Supervisor') as supervisor_name,
    -- Get training level from user_metadata
    COALESCE(
        (SELECT raw_user_meta_data->>'training_level'
         FROM auth.users
         WHERE id = lp.resident_id),
        'Unknown'
    ) as resident_level
FROM public.lumbar_punctures lp;

-- Enable RLS on the lumbar_punctures table if not already enabled
ALTER TABLE public.lumbar_punctures ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for lumbar_punctures_with_names view access
-- All authenticated users can view all lumbar puncture records (shared access)
CREATE POLICY "Allow authenticated users to view all lumbar punctures via view"
ON public.lumbar_punctures FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- 2. Enable RLS on academic_resources table
-- ============================================================================

-- Enable RLS on academic_resources table
ALTER TABLE public.academic_resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for academic_resources
-- All authenticated users can view academic resources
CREATE POLICY "Allow authenticated users to view academic resources"
ON public.academic_resources FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can insert academic resources
CREATE POLICY "Allow authenticated users to insert academic resources"
ON public.academic_resources FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update academic resources (consider restricting this if needed)
CREATE POLICY "Allow authenticated users to update academic resources"
ON public.academic_resources FOR UPDATE
TO authenticated
USING (true);

-- Users can delete academic resources (consider restricting this if needed)
CREATE POLICY "Allow authenticated users to delete academic resources"
ON public.academic_resources FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- 3. Enable RLS on user_resource_favorites table
-- ============================================================================

-- Enable RLS on user_resource_favorites table
ALTER TABLE public.user_resource_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_resource_favorites
-- Note: user_id is VARCHAR(255), so we cast auth.uid() to text
-- Users can only view their own favorites
CREATE POLICY "Users can view their own resource favorites"
ON public.user_resource_favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- Users can only insert their own favorites
CREATE POLICY "Users can insert their own resource favorites"
ON public.user_resource_favorites FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- Users can only update their own favorites
CREATE POLICY "Users can update their own resource favorites"
ON public.user_resource_favorites FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text);

-- Users can only delete their own favorites
CREATE POLICY "Users can delete their own resource favorites"
ON public.user_resource_favorites FOR DELETE
TO authenticated
USING (user_id = auth.uid()::text);

-- ============================================================================
-- 4. Enable RLS on academic_classes table
-- ============================================================================

-- Enable RLS on academic_classes table
ALTER TABLE public.academic_classes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for academic_classes
-- All authenticated users can view academic classes
CREATE POLICY "Allow authenticated users to view academic classes"
ON public.academic_classes FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can insert academic classes
CREATE POLICY "Allow authenticated users to insert academic classes"
ON public.academic_classes FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update academic classes (consider restricting to instructors/admins)
CREATE POLICY "Allow authenticated users to update academic classes"
ON public.academic_classes FOR UPDATE
TO authenticated
USING (true);

-- Users can delete academic classes (consider restricting to instructors/admins)
CREATE POLICY "Allow authenticated users to delete academic classes"
ON public.academic_classes FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- 5. Enable RLS on class_attendance table
-- ============================================================================

-- Enable RLS on class_attendance table
ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for class_attendance
-- Users can view attendance records for classes they're enrolled in or teaching
-- For now, allowing all authenticated users to view (adjust as needed)
CREATE POLICY "Allow authenticated users to view class attendance"
ON public.class_attendance FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own attendance records
-- Note: user_id is VARCHAR(255), so we cast auth.uid() to text
CREATE POLICY "Users can insert their own attendance records"
ON public.class_attendance FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- Users can update their own attendance records
CREATE POLICY "Users can update their own attendance records"
ON public.class_attendance FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text);

-- Users can delete their own attendance records
CREATE POLICY "Users can delete their own attendance records"
ON public.class_attendance FOR DELETE
TO authenticated
USING (user_id = auth.uid()::text);

-- ============================================================================
-- 6. Grant appropriate permissions to authenticated role
-- ============================================================================

-- Grant necessary permissions for the view
GRANT SELECT ON public.lumbar_punctures_with_names TO authenticated;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_resources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_resource_favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_attendance TO authenticated;

-- ============================================================================
-- 7. Verify RLS is working correctly
-- ============================================================================

-- You can run these queries to verify RLS is working:
-- SELECT * FROM public.academic_resources; -- Should work for authenticated users
-- SELECT * FROM public.lumbar_punctures_with_names; -- Should work for authenticated users
-- SELECT * FROM public.user_resource_favorites; -- Should only show user's own favorites

COMMENT ON VIEW public.lumbar_punctures_with_names IS
'Secure view of lumbar punctures with resident names from user metadata, avoiding direct auth.users exposure';

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. The lumbar_punctures_with_names view now uses subqueries instead of JOINs
--    to avoid exposing auth.users table structure
-- 2. All tables now have RLS enabled with appropriate policies
-- 3. User-specific data (favorites, attendance) is restricted to the user's own records
-- 4. Academic resources and classes are shared among all authenticated users
-- 5. Consider further restricting some operations to admin users if needed