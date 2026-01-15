-- =====================================================
-- PENDING PATIENTS - FIX PARA ERROR 403 EN INSERT
-- Corrección de políticas RLS
-- =====================================================

-- Primero, eliminar las políticas existentes
DROP POLICY IF EXISTS "Users can view pending patients" ON pending_patients;
DROP POLICY IF EXISTS "Users can create pending patients" ON pending_patients;
DROP POLICY IF EXISTS "Users can update own pending patients" ON pending_patients;
DROP POLICY IF EXISTS "Users can delete own pending patients" ON pending_patients;

-- =====================================================
-- NUEVAS POLÍTICAS CORREGIDAS
-- =====================================================

-- Policy 1: SELECT - Ver todos los pacientes (autenticados)
CREATE POLICY "Users can view pending patients"
  ON pending_patients
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy 2: INSERT - Crear pacientes (la más importante - CORREGIDA)
CREATE POLICY "Users can create pending patients"
  ON pending_patients
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Policy 3: UPDATE - Actualizar solo propios pacientes
CREATE POLICY "Users can update own pending patients"
  ON pending_patients
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    created_by = (auth.jwt() ->> 'email')
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = (auth.jwt() ->> 'email')
  );

-- Policy 4: DELETE - Eliminar solo propios pacientes
CREATE POLICY "Users can delete own pending patients"
  ON pending_patients
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    created_by = (auth.jwt() ->> 'email')
  );

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver las políticas activas
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'pending_patients';
