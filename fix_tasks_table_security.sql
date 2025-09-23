-- Fix tasks table security and functionality for PendientesManager
-- This addresses issues with task creation and updates not working

-- ============================================================================
-- 1. Ensure tasks table exists with correct structure
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  due_date DATE,
  patient_id UUID,
  source TEXT DEFAULT 'manual', -- 'manual' or 'ward_rounds'
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. Enable RLS and create comprehensive policies
-- ============================================================================

-- Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all operations for tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update any task status" ON public.tasks;

-- Create secure RLS policies
-- Allow all authenticated users to view all tasks (for collaborative workflow)
CREATE POLICY "Users can view all tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert tasks (with their user ID)
CREATE POLICY "Users can insert their own tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

-- Allow users to update tasks they created, or allow status updates for all
-- For now, allow all authenticated users to update any task for collaborative workflow
CREATE POLICY "Users can update their own tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (true);

-- Allow users to delete their own tasks
CREATE POLICY "Users can delete their own tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR created_by IS NULL);

-- ============================================================================
-- 3. Create indexes for better performance
-- ============================================================================

-- Drop existing indexes and create new ones
DROP INDEX IF EXISTS idx_tasks_status;
CREATE INDEX idx_tasks_status ON public.tasks(status);

DROP INDEX IF EXISTS idx_tasks_priority;
CREATE INDEX idx_tasks_priority ON public.tasks(priority);

DROP INDEX IF EXISTS idx_tasks_patient_id;
CREATE INDEX idx_tasks_patient_id ON public.tasks(patient_id);

DROP INDEX IF EXISTS idx_tasks_source;
CREATE INDEX idx_tasks_source ON public.tasks(source);

DROP INDEX IF EXISTS idx_tasks_due_date;
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

DROP INDEX IF EXISTS idx_tasks_created_by;
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);

DROP INDEX IF EXISTS idx_tasks_created_at;
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at);

-- ============================================================================
-- 4. Create or update the updated_at trigger
-- ============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger and create new one
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. Grant necessary permissions
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- 6. Insert sample data for testing (optional)
-- ============================================================================

-- Insert some sample tasks if the table is empty
INSERT INTO public.tasks (title, description, priority, status, due_date, source)
SELECT
  'Revisar protocolo de ACV',
  'Actualizar protocolo según nuevas guías internacionales',
  'high',
  'pending',
  CURRENT_DATE + INTERVAL '7 days',
  'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.tasks LIMIT 1);

INSERT INTO public.tasks (title, description, priority, status, due_date, source)
SELECT
  'Preparar presentación ateneo',
  'Caso clínico de epilepsia refractaria',
  'medium',
  'in_progress',
  CURRENT_DATE + INTERVAL '3 days',
  'manual'
WHERE (SELECT COUNT(*) FROM public.tasks) < 2;

-- ============================================================================
-- 7. Create helper function for task creation with proper user assignment
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_task(
  task_title TEXT,
  task_description TEXT DEFAULT NULL,
  task_priority TEXT DEFAULT 'medium',
  task_status TEXT DEFAULT 'pending',
  task_due_date DATE DEFAULT NULL,
  task_patient_id UUID DEFAULT NULL,
  task_source TEXT DEFAULT 'manual'
) RETURNS UUID AS $$
DECLARE
  new_task_id UUID;
BEGIN
  INSERT INTO public.tasks (
    title,
    description,
    priority,
    status,
    due_date,
    patient_id,
    source,
    created_by
  ) VALUES (
    task_title,
    task_description,
    task_priority,
    task_status,
    task_due_date,
    task_patient_id,
    task_source,
    auth.uid()
  ) RETURNING id INTO new_task_id;

  RETURN new_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_task TO authenticated;

COMMENT ON TABLE public.tasks IS
'Tasks and pending items management table with RLS policies for collaborative workflow';

COMMENT ON FUNCTION public.create_task IS
'Helper function to create tasks with proper user assignment and validation';