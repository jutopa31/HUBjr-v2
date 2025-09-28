# 📋 Database Setup - Pendientes Integration

## ⚠️ Database Schema Required

The pendientes integration system requires a `tasks` table in your Supabase database that currently doesn't exist. This is causing the 400 errors you're seeing.

## 🛠️ Setup Steps

### 1. Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Open your project dashboard
4. Navigate to **SQL Editor**

### 2. Create Tasks Table
Execute the SQL script located at: `database/setup_tasks_table.sql`

**Or copy and paste this SQL:**

```sql
-- Create tasks table for the pendientes management system
CREATE TABLE IF NOT EXISTS tasks (
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
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_patient_id ON tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Add RLS (Row Level Security) policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this based on your auth requirements)
CREATE POLICY IF NOT EXISTS "Enable all operations for tasks" ON tasks
  FOR ALL USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. Verify Table Creation
After running the SQL, verify the table was created:

```sql
SELECT * FROM tasks LIMIT 5;
```

## ✅ What This Enables

Once the database is set up, the pendientes integration will work seamlessly:

### 🔄 **Automatic Synchronization**
- Adding pendientes in Ward Rounds → Creates tasks automatically
- Completing tasks in Pendientes → Clears patient pendientes 

### 🎯 **Enhanced Task Management**
- **Priority Mapping**: Patient severity → Task priority
- **Source Tracking**: Distinguish ward rounds vs manual tasks
- **Visual Indicators**: Blue "Pase de Sala" badges
- **Smart Filtering**: Filter by origin, status, priority

### 📊 **Data Flow**
```
Ward Rounds → Save Pendientes → Task Created
Task Completed → Patient Pendientes Cleared
```

## 🚀 Test the Integration

After database setup:

1. **Go to Ward Rounds tab**
2. **Add pendientes** to any patient
3. **Switch to Pendientes tab**
4. **Click "Sincronizar Pase"** button
5. **See tasks appear** with blue "Pase de Sala" badges
6. **Complete a task** → pendientes clear from ward rounds

## 🔧 Troubleshooting

### If you still see 400 errors:
1. Refresh the page after creating the table
2. Check Supabase logs for specific error messages
3. Ensure your Supabase connection is working for other tables
4. Verify the SQL was executed without errors

### To check if table exists:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'tasks';
```

## 📋 Table Schema Details

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `title` | TEXT | Task title |
| `description` | TEXT | Task details |
| `priority` | TEXT | low/medium/high |
| `status` | TEXT | pending/in_progress/completed |
| `due_date` | DATE | Optional deadline |
| `patient_id` | UUID | Link to ward_round_patients |
| `source` | TEXT | 'manual' or 'ward_rounds' |
| `created_by` | UUID | User who created task |
| `created_at` | TIMESTAMP | Auto-generated |
| `updated_at` | TIMESTAMP | Auto-updated |

---

**Once you complete the database setup, the pendientes integration will work perfectly!** 🎉