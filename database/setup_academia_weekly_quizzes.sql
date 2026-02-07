-- =====================================================
-- Academia - Weekly Topics + Quizzes (Supabase)
-- =====================================================
-- Run in Supabase SQL Editor
-- =====================================================

-- 1) Weekly topics table
CREATE TABLE IF NOT EXISTS academy_weekly_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE NOT NULL UNIQUE,
  topic_title TEXT NOT NULL,
  summary TEXT,
  status VARCHAR(20) DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed')),
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_weekly_topics_week ON academy_weekly_topics(week_start_date);

-- 2) Quizzes tables
CREATE TABLE IF NOT EXISTS academy_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academy_quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES academy_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_option_index INTEGER NOT NULL,
  explanation TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academy_quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES academy_quizzes(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_quiz_questions_quiz ON academy_quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_academy_quiz_attempts_quiz ON academy_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_academy_quiz_attempts_user ON academy_quiz_attempts(user_id);

-- 3) Reminder logs (idempotency for weekly emails)
CREATE TABLE IF NOT EXISTS academy_weekly_reminder_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE NOT NULL UNIQUE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recipient_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_academy_weekly_reminder_logs_week ON academy_weekly_reminder_logs(week_start_date);

-- 3) Updated_at trigger helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_academy_weekly_topics_updated_at
    BEFORE UPDATE ON academy_weekly_topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_quizzes_updated_at
    BEFORE UPDATE ON academy_quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4) RLS policies
ALTER TABLE academy_weekly_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_weekly_reminder_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view weekly topics" ON academy_weekly_topics;
CREATE POLICY "Anyone can view weekly topics"
  ON academy_weekly_topics FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert weekly topics" ON academy_weekly_topics;
CREATE POLICY "Users can insert weekly topics"
  ON academy_weekly_topics FOR INSERT
  WITH CHECK (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Users can update weekly topics" ON academy_weekly_topics;
CREATE POLICY "Users can update weekly topics"
  ON academy_weekly_topics FOR UPDATE
  USING (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Users can delete weekly topics" ON academy_weekly_topics;
CREATE POLICY "Users can delete weekly topics"
  ON academy_weekly_topics FOR DELETE
  USING (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Anyone can view quizzes" ON academy_quizzes;
CREATE POLICY "Anyone can view quizzes"
  ON academy_quizzes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert quizzes" ON academy_quizzes;
CREATE POLICY "Users can insert quizzes"
  ON academy_quizzes FOR INSERT
  WITH CHECK (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Users can update quizzes" ON academy_quizzes;
CREATE POLICY "Users can update quizzes"
  ON academy_quizzes FOR UPDATE
  USING (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Users can delete quizzes" ON academy_quizzes;
CREATE POLICY "Users can delete quizzes"
  ON academy_quizzes FOR DELETE
  USING (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Anyone can view quiz questions" ON academy_quiz_questions;
CREATE POLICY "Anyone can view quiz questions"
  ON academy_quiz_questions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owners can insert quiz questions" ON academy_quiz_questions;
CREATE POLICY "Owners can insert quiz questions"
  ON academy_quiz_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM academy_quizzes
      WHERE academy_quizzes.id = quiz_id
        AND academy_quizzes.created_by = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Owners can update quiz questions" ON academy_quiz_questions;
CREATE POLICY "Owners can update quiz questions"
  ON academy_quiz_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM academy_quizzes
      WHERE academy_quizzes.id = quiz_id
        AND academy_quizzes.created_by = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Owners can delete quiz questions" ON academy_quiz_questions;
CREATE POLICY "Owners can delete quiz questions"
  ON academy_quiz_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM academy_quizzes
      WHERE academy_quizzes.id = quiz_id
        AND academy_quizzes.created_by = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can view own quiz attempts" ON academy_quiz_attempts;
CREATE POLICY "Users can view own quiz attempts"
  ON academy_quiz_attempts FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON academy_quiz_attempts;
CREATE POLICY "Users can insert own quiz attempts"
  ON academy_quiz_attempts FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Only service can manage reminder logs" ON academy_weekly_reminder_logs;
CREATE POLICY "Only service can manage reminder logs"
  ON academy_weekly_reminder_logs
  USING (auth.role() = 'service_role');
