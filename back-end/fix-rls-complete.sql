-- ================================
-- FIX COMPLETO: Políticas RLS para CEFIMAT
-- ================================
-- Este script crea TODAS las políticas necesarias desde cero

-- ================================
-- LIMPIAR POLÍTICAS EXISTENTES
-- ================================

-- Eliminar todas las políticas de usuarios
DROP POLICY IF EXISTS "Users can read own data" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update own data" ON public.usuarios;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.usuarios;
DROP POLICY IF EXISTS "Enable read access for leaderboards" ON public.usuarios;

-- Eliminar todas las políticas de high_scores
DROP POLICY IF EXISTS "Users can read own scores" ON public.high_scores;
DROP POLICY IF EXISTS "Users can insert own scores" ON public.high_scores;
DROP POLICY IF EXISTS "Anyone can read leaderboard" ON public.high_scores;

-- ================================
-- POLÍTICAS PARA TABLA: usuarios
-- ================================

-- Permitir que TODOS lean los nombres de usuarios (para leaderboards)
CREATE POLICY "Enable read access for all users"
  ON public.usuarios
  FOR SELECT
  USING (true);

-- Permitir que los usuarios actualicen SOLO su propia información
CREATE POLICY "Users can update own data"
  ON public.usuarios
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permitir inserción cuando se registra un usuario (trigger automático)
CREATE POLICY "Enable insert for authenticated users"
  ON public.usuarios
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ================================
-- POLÍTICAS PARA TABLA: high_scores
-- ================================

-- Permitir que TODOS lean TODOS los scores (para leaderboards públicos)
CREATE POLICY "Enable read access for all users"
  ON public.high_scores
  FOR SELECT
  USING (true);

-- Permitir que los usuarios inserten SOLO sus propios scores
CREATE POLICY "Users can insert own scores"
  ON public.high_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ================================
-- VERIFICACIÓN
-- ================================
-- Ejecuta esto para verificar que las políticas se crearon correctamente:
-- 
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
