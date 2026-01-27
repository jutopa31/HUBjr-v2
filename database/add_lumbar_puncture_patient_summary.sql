-- Migration: Add patient_summary to lumbar_punctures
ALTER TABLE lumbar_punctures
  ADD COLUMN IF NOT EXISTS patient_summary TEXT;
