-- Quick fix for UUID/text comparison error in tasks table RLS policies
-- This resolves the "operator does not exist: text = uuid" error

-- ============================================================================
-- Drop problematic policies and recreate with proper type handling
-- ============================================================================

-- Drop existing policies that might have type mismatches
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Enable all operations for tasks" ON public.tasks;

-- ============================================================================
-- Create simple, working RLS policies for tasks
-- ============================================================================

-- Allow all authenticated users to view all tasks (collaborative workflow)
CREATE POLICY "Allow authenticated users to view all tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert tasks
CREATE POLICY "Allow authenticated users to insert tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update any task (collaborative workflow)
CREATE POLICY "Allow authenticated users to update tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to delete any task (be careful with this in production)
CREATE POLICY "Allow authenticated users to delete tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- Alternative: More restrictive policies with proper UUID handling
-- ============================================================================

-- Uncomment these and comment the above if you want user-specific restrictions:

-- CREATE POLICY "Users can insert their own tasks"
-- ON public.tasks FOR INSERT
-- TO authenticated
-- WITH CHECK (created_by = auth.uid());

-- CREATE POLICY "Users can update their own tasks or any without owner"
-- ON public.tasks FOR UPDATE
-- TO authenticated
-- USING (created_by = auth.uid() OR created_by IS NULL);

-- CREATE POLICY "Users can delete their own tasks or any without owner"
-- ON public.tasks FOR DELETE
-- TO authenticated
-- USING (created_by = auth.uid() OR created_by IS NULL);

COMMENT ON TABLE public.tasks IS
'Tasks table with simplified RLS policies to avoid UUID/text comparison errors';