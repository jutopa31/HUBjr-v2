-- Clean setup for tasks table without any UUID comparison issues
-- This is a completely safe version that avoids all type mismatch problems

-- ============================================================================
-- 1. Drop existing table and recreate from scratch (optional, for clean setup)
-- ============================================================================

-- Uncomment these lines if you want to start completely fresh:
-- DROP TABLE IF EXISTS public.tasks CASCADE;

-- ============================================================================
-- 2. Create tasks table with correct structure
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
  created_by UUID, -- No foreign key constraint to avoid issues
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. Enable RLS with simple, working policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users to view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users to insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users to update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users to delete tasks" ON public.tasks;

-- Create simple, safe policies
CREATE POLICY "tasks_select_policy"
ON public.tasks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "tasks_insert_policy"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "tasks_update_policy"
ON public.tasks FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "tasks_delete_policy"
ON public.tasks FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- 4. Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_source ON public.tasks(source);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

-- ============================================================================
-- 5. Create updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at_trigger ON public.tasks;
CREATE TRIGGER tasks_updated_at_trigger
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tasks_updated_at();

-- ============================================================================
-- 6. Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;

-- ============================================================================
-- 7. Insert sample data if table is empty
-- ============================================================================

INSERT INTO public.tasks (title, description, priority, status, due_date, source)
SELECT
  'Revisar protocolo de ACV',
  'Actualizar protocolo según nuevas guías internacionales',
  'high',
  'pending',
  CURRENT_DATE + INTERVAL '7 days',
  'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.tasks);

INSERT INTO public.tasks (title, description, priority, status, due_date, source)
SELECT
  'Preparar presentación ateneo',
  'Caso clínico de epilepsia refractaria',
  'medium',
  'in_progress',
  CURRENT_DATE + INTERVAL '3 days',
  'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.tasks WHERE title = 'Preparar presentación ateneo');

COMMENT ON TABLE public.tasks IS
'Tasks management table with simple RLS policies for collaborative workflow';