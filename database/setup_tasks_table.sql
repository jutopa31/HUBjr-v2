-- Create tasks table for the pendientes management system
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  due_date DATE,
  patient_id UUID,
  source TEXT DEFAULT 'manual', -- 'manual' or 'ward_rounds'
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_tasks_status;
CREATE INDEX idx_tasks_status ON tasks(status);

DROP INDEX IF EXISTS idx_tasks_priority;
CREATE INDEX idx_tasks_priority ON tasks(priority);

DROP INDEX IF EXISTS idx_tasks_patient_id;
CREATE INDEX idx_tasks_patient_id ON tasks(patient_id);

DROP INDEX IF EXISTS idx_tasks_source;
CREATE INDEX idx_tasks_source ON tasks(source);

DROP INDEX IF EXISTS idx_tasks_due_date;
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Add RLS (Row Level Security) policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and create new one
DROP POLICY IF EXISTS "Enable all operations for tasks" ON tasks;
CREATE POLICY "Enable all operations for tasks" ON tasks
  FOR ALL USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();