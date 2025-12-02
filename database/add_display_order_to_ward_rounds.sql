-- Add manual ordering support for ward round patients
ALTER TABLE ward_round_patients
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Backfill existing rows with a stable order based on creation time
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS rn
  FROM ward_round_patients
)
UPDATE ward_round_patients wrp
SET display_order = ordered.rn
FROM ordered
WHERE wrp.id = ordered.id
  AND wrp.display_order IS NULL;

CREATE INDEX IF NOT EXISTS idx_ward_round_patients_display_order
  ON ward_round_patients(display_order);

-- Optional: keep ambulatorios aligned with the same ordering field
ALTER TABLE outpatient_ward_rounds
ADD COLUMN IF NOT EXISTS display_order INTEGER;

WITH ordered_outpatients AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS rn
  FROM outpatient_ward_rounds
)
UPDATE outpatient_ward_rounds owr
SET display_order = ordered_outpatients.rn
FROM ordered_outpatients
WHERE owr.id = ordered_outpatients.id
  AND owr.display_order IS NULL;

CREATE INDEX IF NOT EXISTS idx_outpatient_ward_rounds_display_order
  ON outpatient_ward_rounds(display_order);
