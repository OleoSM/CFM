-- ================================
-- CEFIMAT Database Schema
-- ================================

-- Tabla de usuarios (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  clave_curso TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de high scores
CREATE TABLE IF NOT EXISTS public.high_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  unit_key TEXT NOT NULL,
  quiz_key TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_high_scores_user_id ON public.high_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_high_scores_quiz ON public.high_scores(subject, unit_key, quiz_key);
CREATE INDEX IF NOT EXISTS idx_high_scores_leaderboard ON public.high_scores(subject, unit_key, quiz_key, score DESC);

-- ================================
-- Row Level Security (RLS) Policies
-- ================================

-- Habilitar RLS en las tablas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.high_scores ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
-- Permitir que los usuarios lean su propia información
CREATE POLICY "Users can read own data"
  ON public.usuarios
  FOR SELECT
  USING (auth.uid() = id);

-- Permitir que los usuarios actualicen su propia información
CREATE POLICY "Users can update own data"
  ON public.usuarios
  FOR UPDATE
  USING (auth.uid() = id);

-- Permitir inserción cuando se registra un usuario (trigger automático)
CREATE POLICY "Enable insert for authenticated users"
  ON public.usuarios
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas para high_scores
-- Permitir que los usuarios lean sus propios scores
CREATE POLICY "Users can read own scores"
  ON public.high_scores
  FOR SELECT
  USING (auth.uid() = user_id);

-- Permitir que los usuarios inserten sus propios scores
CREATE POLICY "Users can insert own scores"
  ON public.high_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permitir que todos lean el leaderboard (para rankings públicos)
CREATE POLICY "Anyone can read leaderboard"
  ON public.high_scores
  FOR SELECT
  USING (true);

-- ================================
-- Trigger para crear usuario automáticamente
-- ================================

-- Función que se ejecuta cuando se registra un nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, clave_curso)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    NEW.raw_user_meta_data->>'clave_curso'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que ejecuta la función cuando se crea un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================
-- Función para obtener el mejor score por quiz
-- ================================

CREATE OR REPLACE FUNCTION public.get_best_scores(p_user_id UUID)
RETURNS TABLE (
  subject TEXT,
  unit_key TEXT,
  quiz_key TEXT,
  best_score INTEGER,
  best_percentage DECIMAL,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (hs.subject, hs.unit_key, hs.quiz_key)
    hs.subject,
    hs.unit_key,
    hs.quiz_key,
    hs.score as best_score,
    hs.percentage as best_percentage,
    hs.completed_at
  FROM public.high_scores hs
  WHERE hs.user_id = p_user_id
  ORDER BY hs.subject, hs.unit_key, hs.quiz_key, hs.score DESC, hs.completed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
