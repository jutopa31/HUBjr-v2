-- Fix numeric field overflow issues in lumbar puncture tables
-- This resolves the "numeric field overflow" error for INR and other decimal fields

-- Fix INR value field to allow higher values (up to 99.99)
ALTER TABLE lumbar_punctures
ALTER COLUMN inr_value TYPE DECIMAL(4,2);

-- Fix other potentially problematic decimal fields
ALTER TABLE lumbar_punctures
ALTER COLUMN csf_protein TYPE DECIMAL(6,2);

ALTER TABLE lumbar_punctures
ALTER COLUMN csf_glucose TYPE DECIMAL(6,2);

ALTER TABLE lumbar_punctures
ALTER COLUMN serum_glucose TYPE DECIMAL(6,2);

ALTER TABLE lumbar_punctures
ALTER COLUMN csf_lactate TYPE DECIMAL(6,2);

-- Fix CSF analysis results table decimal fields
ALTER TABLE csf_analysis_results
ALTER COLUMN csf_chloride TYPE DECIMAL(6,2);

ALTER TABLE csf_analysis_results
ALTER COLUMN csf_albumin TYPE DECIMAL(6,2);

ALTER TABLE csf_analysis_results
ALTER COLUMN csf_igg TYPE DECIMAL(6,2);

ALTER TABLE csf_analysis_results
ALTER COLUMN albumin_ratio TYPE DECIMAL(6,3);

ALTER TABLE csf_analysis_results
ALTER COLUMN igg_index TYPE DECIMAL(6,3);

-- Fix biomarker fields to handle larger values
ALTER TABLE csf_analysis_results
ALTER COLUMN tau_protein TYPE DECIMAL(10,2);

ALTER TABLE csf_analysis_results
ALTER COLUMN phospho_tau TYPE DECIMAL(10,2);

ALTER TABLE csf_analysis_results
ALTER COLUMN amyloid_beta_42 TYPE DECIMAL(10,2);

ALTER TABLE csf_analysis_results
ALTER COLUMN amyloid_beta_40 TYPE DECIMAL(10,2);