-- Migration: Add status column to lumbar_punctures table
-- This column tracks whether a procedure is scheduled or completed

-- Add the status column with a default of 'completed' for existing records
ALTER TABLE lumbar_punctures
ADD COLUMN IF NOT EXISTS status TEXT
  CHECK (status IN ('scheduled', 'completed'))
  DEFAULT 'completed';

-- Set all existing records to 'completed' (they were created before this feature)
UPDATE lumbar_punctures
SET status = 'completed'
WHERE status IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE lumbar_punctures
ALTER COLUMN status SET NOT NULL;

-- Create an index for filtering by status
CREATE INDEX IF NOT EXISTS idx_lumbar_punctures_status
  ON lumbar_punctures(status);

-- Update the view to include the status column (if it exists)
-- First, check if the view exists and recreate it
DROP VIEW IF EXISTS lumbar_punctures_with_names;

CREATE VIEW lumbar_punctures_with_names AS
SELECT
  lp.*,
  COALESCE(CONCAT(rp.first_name, ' ', rp.last_name), u.email) as resident_name,
  rp.training_level as resident_level
FROM lumbar_punctures lp
LEFT JOIN auth.users u ON lp.resident_id = u.id
LEFT JOIN resident_profiles rp ON lp.resident_id = rp.user_id;

-- Grant access to the view
GRANT SELECT ON lumbar_punctures_with_names TO authenticated;
