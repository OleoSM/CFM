-- ================================
-- FIX: Permitir leer nombres de usuarios en leaderboards
-- ================================

-- 1. Eliminar la política restrictiva actual
DROP POLICY IF EXISTS "Users can read own data" ON public.usuarios;

-- 2. Crear nueva política que permite leer nombres de todos los usuarios
-- pero mantiene privados otros datos sensibles
CREATE POLICY "Enable read access for leaderboards"
  ON public.usuarios
  FOR SELECT
  USING (true);

-- Nota: Esta política permite leer todos los campos de usuarios.
-- Si quieres restringir solo a 'nombre', necesitarías crear una vista
-- o manejar la privacidad en el nivel de aplicación.

-- Las políticas de UPDATE e INSERT permanecen sin cambios (solo propios datos)
