-- =====================================================
-- Academia Simplificada - Schema de Base de Datos
-- =====================================================
-- Ejecutar este script en Supabase SQL Editor
-- Rediseño simplificado para sistema de clases colaborativo
-- =====================================================

-- =====================================================
-- PASO 1: Crear tabla de temas colaborativa
-- =====================================================

CREATE TABLE IF NOT EXISTS class_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_name VARCHAR(255) NOT NULL UNIQUE,
  created_by VARCHAR(255) NOT NULL, -- user email
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_class_topics_name ON class_topics(topic_name);

-- =====================================================
-- PASO 2: Limpiar y reestructurar academic_classes
-- =====================================================

-- Eliminar datos existentes (comenzar de cero como solicitó el usuario)
TRUNCATE TABLE academic_classes CASCADE;

-- Eliminar columnas innecesarias
ALTER TABLE academic_classes
  DROP COLUMN IF EXISTS type,
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS materials_url,
  DROP COLUMN IF EXISTS is_mandatory,
  DROP COLUMN IF EXISTS max_attendees,
  DROP COLUMN IF EXISTS current_attendees,
  DROP COLUMN IF EXISTS end_date,
  DROP COLUMN IF EXISTS start_date;

-- Agregar nuevas columnas para el sistema simplificado
ALTER TABLE academic_classes
  ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES class_topics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS topic_name VARCHAR(255) NOT NULL,
  ADD COLUMN IF NOT EXISTS class_date DATE NOT NULL,
  ADD COLUMN IF NOT EXISTS class_time TIME DEFAULT '08:00:00',
  ADD COLUMN IF NOT EXISTS instructor_email VARCHAR(255) NOT NULL,
  ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(255);

-- Eliminar columna title si existe (reemplazada por topic_name)
ALTER TABLE academic_classes DROP COLUMN IF EXISTS title;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_academic_classes_date ON academic_classes(class_date);
CREATE INDEX IF NOT EXISTS idx_academic_classes_instructor ON academic_classes(instructor_email);
CREATE INDEX IF NOT EXISTS idx_academic_classes_topic ON academic_classes(topic_id);

-- =====================================================
-- PASO 3: Configurar RLS (Row Level Security) Policies
-- =====================================================

-- Habilitar RLS en class_topics
ALTER TABLE class_topics ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver los temas
DROP POLICY IF EXISTS "Anyone can view topics" ON class_topics;
CREATE POLICY "Anyone can view topics"
  ON class_topics FOR SELECT
  USING (true);

-- Política: Usuarios autenticados pueden insertar temas
DROP POLICY IF EXISTS "Authenticated users can insert topics" ON class_topics;
CREATE POLICY "Authenticated users can insert topics"
  ON class_topics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Habilitar RLS en academic_classes
ALTER TABLE academic_classes ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver las clases
DROP POLICY IF EXISTS "Anyone can view classes" ON academic_classes;
CREATE POLICY "Anyone can view classes"
  ON academic_classes FOR SELECT
  USING (true);

-- Política: Usuarios pueden insertar clases donde ellos son el creador
DROP POLICY IF EXISTS "Users can insert their own classes" ON academic_classes;
CREATE POLICY "Users can insert their own classes"
  ON academic_classes FOR INSERT
  WITH CHECK (auth.uid()::text = created_by);

-- Política: Usuarios pueden actualizar solo sus propias clases
DROP POLICY IF EXISTS "Users can update their own classes" ON academic_classes;
CREATE POLICY "Users can update their own classes"
  ON academic_classes FOR UPDATE
  USING (auth.uid()::text = created_by);

-- Política: Usuarios pueden eliminar solo sus propias clases
DROP POLICY IF EXISTS "Users can delete their own classes" ON academic_classes;
CREATE POLICY "Users can delete their own classes"
  ON academic_classes FOR DELETE
  USING (auth.uid()::text = created_by);

-- =====================================================
-- PASO 4: Insertar temas iniciales predefinidos
-- =====================================================

INSERT INTO class_topics (topic_name, created_by) VALUES
  ('Neuroanatomía', 'system'),
  ('Semiología Neurológica', 'system'),
  ('ACV Isquémico', 'system'),
  ('ACV Hemorrágico', 'system'),
  ('Epilepsia', 'system'),
  ('Cefaleas', 'system'),
  ('Enfermedad de Parkinson', 'system'),
  ('Esclerosis Múltiple', 'system'),
  ('Demencias', 'system'),
  ('Neuroimágenes', 'system'),
  ('Electroencefalografía', 'system'),
  ('Enfermedades Neuromusculares', 'system'),
  ('Accidente Cerebrovascular', 'system'),
  ('Neuropatías Periféricas', 'system'),
  ('Trastornos del Movimiento', 'system')
ON CONFLICT (topic_name) DO NOTHING;

-- =====================================================
-- PASO 5: Verificación
-- =====================================================

-- Verificar que las tablas fueron creadas correctamente
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('class_topics', 'academic_classes')
ORDER BY table_name, ordinal_position;

-- Verificar temas insertados
SELECT COUNT(*) as total_topics FROM class_topics;

-- Verificar políticas RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('class_topics', 'academic_classes')
ORDER BY tablename, policyname;

-- =====================================================
-- Script completado ✅
-- =====================================================
-- Las tablas están listas para el nuevo sistema de Academia simplificado
-- Próximo paso: Implementar academiaService.ts en el frontend
