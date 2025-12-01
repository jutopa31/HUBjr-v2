-- Setup for interconsultas table (Posadas context only)
-- Execute in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS interconsultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR NOT NULL,
  dni VARCHAR NOT NULL,
  cama VARCHAR NOT NULL,
  relato_consulta TEXT,
  fecha_interconsulta DATE NOT NULL,
  respuesta TEXT,
  -- Seguridad/contexto
  hospital_context TEXT NOT NULL DEFAULT 'Posadas',
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_interconsultas_dni ON interconsultas(dni);
CREATE INDEX IF NOT EXISTS idx_interconsultas_fecha ON interconsultas(fecha_interconsulta);
CREATE INDEX IF NOT EXISTS idx_interconsultas_context ON interconsultas(hospital_context);

-- RLS: Solo para hospital context "Posadas" (no bypass de admin)
ALTER TABLE interconsultas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS interconsultas_select_posadas ON interconsultas;
CREATE POLICY interconsultas_select_posadas ON interconsultas
  FOR SELECT USING (hospital_context = 'Posadas');

DROP POLICY IF EXISTS interconsultas_insert_posadas ON interconsultas;
CREATE POLICY interconsultas_insert_posadas ON interconsultas
  FOR INSERT WITH CHECK (hospital_context = 'Posadas');

DROP POLICY IF EXISTS interconsultas_update_posadas ON interconsultas;
CREATE POLICY interconsultas_update_posadas ON interconsultas
  FOR UPDATE USING (hospital_context = 'Posadas')
  WITH CHECK (hospital_context = 'Posadas');

DROP POLICY IF EXISTS interconsultas_delete_posadas ON interconsultas;
CREATE POLICY interconsultas_delete_posadas ON interconsultas
  FOR DELETE USING (hospital_context = 'Posadas');

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_interconsultas_updated_at ON interconsultas;
CREATE TRIGGER trg_interconsultas_updated_at
  BEFORE UPDATE ON interconsultas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: set user_id from auth.uid() if available
CREATE OR REPLACE FUNCTION set_user_id_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_interconsultas_set_user ON interconsultas;
CREATE TRIGGER trg_interconsultas_set_user
  BEFORE INSERT ON interconsultas
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_from_auth();

COMMENT ON TABLE interconsultas IS 'Interconsultas: solo visibles para hospital_context Posadas via RLS';
COMMENT ON COLUMN interconsultas.hospital_context IS 'Contexto hospitalario de los datos (RLS aplica Posadas)';
