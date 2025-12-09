-- Agrega un campo opcional para enlazar bibliografía de cada clase
ALTER TABLE academic_classes
  ADD COLUMN IF NOT EXISTS bibliography_url TEXT;

COMMENT ON COLUMN academic_classes.bibliography_url IS 'URL opcional con la bibliografía o material de la clase';
