-- Migration: Add scheduled_date column to tasks table
-- This separates the calendar display date from the deadline (due_date)
--
-- scheduled_date: When the task appears in the calendar/schedule view
-- due_date: The deadline/vencimiento of the task
--
-- Run this in Supabase SQL Editor

-- Add the new column
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- Create index for efficient calendar queries
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);

-- Migrate existing data: copy due_date to scheduled_date for existing tasks
-- This preserves current behavior for existing tasks
UPDATE tasks
SET scheduled_date = due_date
WHERE due_date IS NOT NULL
  AND scheduled_date IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN tasks.scheduled_date IS 'Date when task appears in calendar view (separate from due_date deadline)';
