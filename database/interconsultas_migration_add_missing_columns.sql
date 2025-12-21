-- Migration: Add missing columns to interconsultas table
-- Date: 2025-12-16
-- Purpose: Add edad, image URLs, exa URLs, and OCR text fields to support new features

-- Add edad column (optional text field)
ALTER TABLE public.interconsultas
ADD COLUMN IF NOT EXISTS edad text null;

-- Add image URL arrays (for uploaded study images)
ALTER TABLE public.interconsultas
ADD COLUMN IF NOT EXISTS image_thumbnail_url text[] null default array[]::text[];

ALTER TABLE public.interconsultas
ADD COLUMN IF NOT EXISTS image_full_url text[] null default array[]::text[];

-- Add exa (exam) URL array (for exam links/references)
ALTER TABLE public.interconsultas
ADD COLUMN IF NOT EXISTS exa_url text[] null default array[]::text[];

-- Add OCR extracted text field (for text from uploaded studies)
ALTER TABLE public.interconsultas
ADD COLUMN IF NOT EXISTS estudios_ocr text null;

-- Add comment documenting the migration
COMMENT ON COLUMN public.interconsultas.edad IS 'Patient age (optional field added 2025-12-16)';
COMMENT ON COLUMN public.interconsultas.image_thumbnail_url IS 'Array of thumbnail image URLs (workflow integration)';
COMMENT ON COLUMN public.interconsultas.image_full_url IS 'Array of full-size image URLs (workflow integration)';
COMMENT ON COLUMN public.interconsultas.exa_url IS 'Array of exam/study URLs (workflow integration)';
COMMENT ON COLUMN public.interconsultas.estudios_ocr IS 'OCR extracted text from uploaded studies';

-- Verification query (run this to check the columns were added successfully)
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'interconsultas'
-- ORDER BY ordinal_position;
