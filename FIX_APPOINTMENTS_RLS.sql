-- ============================================
-- FIX APPOINTMENTS RLS POLICIES
-- Garantir que todas as operações funcionem em produção
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view appointments from their clinic" ON appointments;
DROP POLICY IF EXISTS "Users can insert appointments in their clinic" ON appointments;
DROP POLICY IF EXISTS "Users can update appointments from their clinic" ON appointments;
DROP POLICY IF EXISTS "Users can delete appointments from their clinic" ON appointments;

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view appointments from their clinic
CREATE POLICY "Users can view appointments from their clinic"
  ON appointments FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- INSERT: Users can insert appointments in their clinic
CREATE POLICY "Users can insert appointments in their clinic"
  ON appointments FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- UPDATE: Users can update appointments from their clinic
CREATE POLICY "Users can update appointments from their clinic"
  ON appointments FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- DELETE: Users can delete appointments from their clinic
CREATE POLICY "Users can delete appointments from their clinic"
  ON appointments FOR DELETE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;
