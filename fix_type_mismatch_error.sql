-- Fix type mismatch error between VARCHAR(255) user_id and UUID auth.uid()
-- The issue is that some tables have user_id as VARCHAR(255) instead of UUID

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
-- 2. Fix user_resource_favorites table - convert VARCHAR to UUID
-- ============================================================================

-- First, drop the unique constraint that references user_id
ALTER TABLE public.user_resource_favorites DROP CONSTRAINT IF EXISTS user_resource_favorites_user_id_resource_id_key;

-- Convert user_id from VARCHAR(255) to UUID
-- First, update any existing data that might be text to proper UUID format
UPDATE public.user_resource_favorites SET user_id = user_id::UUID WHERE user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Change the column type
ALTER TABLE public.user_resource_favorites ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- Recreate the unique constraint
ALTER TABLE public.user_resource_favorites ADD CONSTRAINT user_resource_favorites_user_id_resource_id_key UNIQUE(user_id, resource_id);

-- ============================================================================
-- 3. Fix class_attendance table - convert VARCHAR to UUID
-- ============================================================================

-- Drop the unique constraint that references user_id
ALTER TABLE public.class_attendance DROP CONSTRAINT IF EXISTS class_attendance_class_id_user_id_key;

-- Convert user_id from VARCHAR(255) to UUID
-- First, update any existing data that might be text to proper UUID format
UPDATE public.class_attendance SET user_id = user_id::UUID WHERE user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Change the column type
ALTER TABLE public.class_attendance ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- Recreate the unique constraint
ALTER TABLE public.class_attendance ADD CONSTRAINT class_attendance_class_id_user_id_key UNIQUE(class_id, user_id);

-- ============================================================================
-- 4. Recreate RLS policies with correct UUID comparisons
-- ============================================================================

-- RLS policies for user_resource_favorites (now with UUID user_id)
CREATE POLICY "Users can view their own resource favorites"
ON public.user_resource_favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own resource favorites"
ON public.user_resource_favorites FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own resource favorites"
ON public.user_resource_favorites FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own resource favorites"
ON public.user_resource_favorites FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- RLS policies for class_attendance (now with UUID user_id)
CREATE POLICY "Users can view class attendance"
ON public.class_attendance FOR SELECT
TO authenticated
USING (true); -- Allow viewing all attendance for now, adjust as needed

CREATE POLICY "Users can insert their own attendance records"
ON public.class_attendance FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own attendance records"
ON public.class_attendance FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own attendance records"
ON public.class_attendance FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- 5. Update indexes to reflect the new UUID type
-- ============================================================================

-- Recreate indexes for the new UUID columns
DROP INDEX IF EXISTS idx_user_favorites_user;
DROP INDEX IF EXISTS idx_class_attendance_user;

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_resource_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_user ON class_attendance(user_id);

-- ============================================================================
-- 6. Add foreign key constraints now that user_id is UUID
-- ============================================================================

-- Add foreign key constraint for user_resource_favorites
ALTER TABLE public.user_resource_favorites
ADD CONSTRAINT fk_user_resource_favorites_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for class_attendance
ALTER TABLE public.class_attendance
ADD CONSTRAINT fk_class_attendance_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMENT ON TABLE public.user_resource_favorites IS
'User favorites for academic resources - now with proper UUID user_id references';

COMMENT ON TABLE public.class_attendance IS
'Class attendance records - now with proper UUID user_id references';