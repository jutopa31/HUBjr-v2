-- Script de migración para la sección Academia
-- Crear tablas para clases académicas y recursos educativos
-- Ejecutar este script en Supabase SQL Editor

-- 1. Crear tabla para clases académicas
CREATE TABLE IF NOT EXISTS academic_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('magistral', 'ateneo', 'seminario', 'examen', 'taller', 'rotacion')),
  instructor VARCHAR(255),
  location VARCHAR(255),
  description TEXT,
  materials_url TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla para recursos educativos
CREATE TABLE IF NOT EXISTS academic_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN (
    'neuroanatomia', 'semiologia', 'patologia', 'farmacologia',
    'imagenes', 'electroencefalografia', 'neurocirugia', 'rehabilitacion',
    'pediatria', 'geriatria', 'urgencias', 'investigacion'
  )),
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN (
    'guia', 'paper', 'video', 'presentacion', 'libro', 'atlas', 'caso_clinico'
  )),
  google_drive_url TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('basico', 'intermedio', 'avanzado')),
  estimated_time INTEGER, -- minutos estimados de lectura/estudio
  language VARCHAR(10) DEFAULT 'es',
  author VARCHAR(255),
  publication_year INTEGER,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  added_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla para favoritos de usuarios
CREATE TABLE IF NOT EXISTS user_resource_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  resource_id UUID NOT NULL REFERENCES academic_resources(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

-- 4. Crear tabla para asistencia a clases
CREATE TABLE IF NOT EXISTS class_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES academic_classes(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('confirmado', 'asistio', 'ausente', 'justificado')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

-- 5. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_academic_classes_date ON academic_classes(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_academic_classes_type ON academic_classes(type);
CREATE INDEX IF NOT EXISTS idx_academic_resources_category ON academic_resources(category);
CREATE INDEX IF NOT EXISTS idx_academic_resources_type ON academic_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_academic_resources_tags ON academic_resources USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_academic_resources_featured ON academic_resources(is_featured);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_resource_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_class ON class_attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_user ON class_attendance(user_id);

-- 6. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Crear triggers para actualizar timestamps
CREATE TRIGGER update_academic_classes_updated_at
    BEFORE UPDATE ON academic_classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academic_resources_updated_at
    BEFORE UPDATE ON academic_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_attendance_updated_at
    BEFORE UPDATE ON class_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Insertar datos de ejemplo para clases
INSERT INTO academic_classes (title, start_date, end_date, type, instructor, location, description) VALUES
('Neuroanatomía Funcional', '2025-09-20 10:00:00+00', '2025-09-20 12:00:00+00', 'magistral', 'Dr. García', 'Aula Magna', 'Revisión de neuroanatomía funcional aplicada a la clínica'),
('Ateneo de Casos Clínicos', '2025-09-22 14:00:00+00', '2025-09-22 16:00:00+00', 'ateneo', 'Dr. Martinez', 'Sala de Juntas', 'Presentación de casos complejos del servicio'),
('Seminario de EEG', '2025-09-25 09:00:00+00', '2025-09-25 11:00:00+00', 'seminario', 'Dra. López', 'Laboratorio EEG', 'Interpretación de electroencefalogramas'),
('Examen Parcial', '2025-09-30 14:00:00+00', '2025-09-30 16:00:00+00', 'examen', 'Comité Evaluador', 'Aula 1', 'Evaluación trimestral de residentes');

-- 9. Insertar datos de ejemplo para recursos
INSERT INTO academic_resources (title, category, resource_type, google_drive_url, description, tags, difficulty_level, estimated_time) VALUES
('Guía de Cefaleas Primarias', 'patologia', 'guia', 'https://drive.google.com/file/d/example1', 'Protocolo diagnóstico y terapéutico de cefaleas primarias', ARRAY['cefalea', 'migraña', 'tension'], 'intermedio', 45),
('Atlas de Neuroimágenes', 'imagenes', 'atlas', 'https://drive.google.com/file/d/example2', 'Colección de imágenes normales y patológicas', ARRAY['resonancia', 'tomografia', 'imagenes'], 'basico', 120),
('Paper: Stroke Guidelines 2024', 'patologia', 'paper', 'https://drive.google.com/file/d/example3', 'Últimas guías internacionales para manejo de ACV', ARRAY['stroke', 'acv', 'guias'], 'avanzado', 60),
('Semiología del Sistema Nervioso', 'semiologia', 'video', 'https://drive.google.com/file/d/example4', 'Video tutorial de examen neurológico completo', ARRAY['examen', 'semiologia', 'video'], 'basico', 90);

-- 10. Verificar que las tablas fueron creadas correctamente
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'academic_%' OR table_name LIKE '%_attendance' OR table_name LIKE 'user_resource_%';

-- Script completado ✅
-- Las tablas están listas para la sección Academia