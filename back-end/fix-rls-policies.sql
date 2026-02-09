-- ================================
-- FIX: High Scores RLS Policies
-- ================================
-- Este script arregla las políticas de Row Level Security
-- para permitir que el leaderboard funcione correctamente

-- 1. Eliminar políticas conflictivas
DROP POLICY IF EXISTS "Users can read own scores" ON public.high_scores;
DROP POLICY IF EXISTS "Anyone can read leaderboard" ON public.high_scores;

-- 2. Crear política única y clara para lectura
CREATE POLICY "Enable read access for all authenticated users"
  ON public.high_scores
  FOR SELECT
  USING (true);

-- 3. Mantener política de inserción (solo propios scores)
DROP POLICY IF EXISTS "Users can insert own scores" ON public.high_scores;
CREATE POLICY "Users can insert own scores"
  ON public.high_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ================================
-- VERIFICACIÓN
-- ================================

-- Ver todas las políticas activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'high_scores';

-- Contar scores existentes
SELECT 
  subject,
  COUNT(*) as total_scores,
  COUNT(DISTINCT user_id) as unique_users
FROM public.high_scores
GROUP BY subject;
