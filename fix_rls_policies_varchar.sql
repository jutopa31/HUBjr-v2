-- Alternative fix: Keep VARCHAR user_id and modify RLS policies to cast UUID to text
-- This approach is less invasive and preserves existing data structure

-- ============================================================================
-- 1. Drop existing RLS policies that have type mismatches
-- ============================================================================

-- Drop policies for user_resource_favorites
DROP POLICY IF EXISTS "Users can view their own resource favorites" ON public.user_resource_favorites;
DROP POLICY IF EXISTS "Users can insert their own resource favorites" ON public.user_resource_favorites;
DROP POLICY IF EXISTS "Users can update their own resource favorites" ON public.user_resource_favorites;
DROP POLICY IF EXISTS "Users can delete their own resource favorites" ON public.user_resource_favorites;

-- Drop policies for class_attendance
DROP POLICY IF EXISTS "Users can insert their own attendance records" ON public.class_attendance;
DROP POLICY IF EXISTS "Users can update their own attendance records" ON public.class_attendance;
DROP POLICY IF EXISTS "Users can delete their own attendance records" ON public.class_attendance;

-- ============================================================================
-- 2. Create RLS policies that cast auth.uid() to text to match VARCHAR columns
-- ============================================================================

-- RLS policies for user_resource_favorites (VARCHAR user_id)
CREATE POLICY "Users can view their own resource favorites"
ON public.user_resource_favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own resource favorites"
ON public.user_resource_favorites FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own resource favorites"
ON public.user_resource_favorites FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own resource favorites"
ON public.user_resource_favorites FOR DELETE
TO authenticated
USING (user_id = auth.uid()::text);

-- RLS policies for class_attendance (VARCHAR user_id)
CREATE POLICY "Users can view class attendance"
ON public.class_attendance FOR SELECT
TO authenticated
USING (true); -- Allow viewing all attendance, or modify to: user_id = auth.uid()::text

CREATE POLICY "Users can insert their own attendance records"
ON public.class_attendance FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own attendance records"
ON public.class_attendance FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own attendance records"
ON public.class_attendance FOR DELETE
TO authenticated
USING (user_id = auth.uid()::text);

-- ============================================================================
-- 3. Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_resource_favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_attendance TO authenticated;

COMMENT ON POLICY "Users can view their own resource favorites" ON public.user_resource_favorites IS
'RLS policy using auth.uid()::text to match VARCHAR user_id column';

COMMENT ON POLICY "Users can insert their own attendance records" ON public.class_attendance IS
'RLS policy using auth.uid()::text to match VARCHAR user_id column';