-- ================================
-- SEED DATA: HIGH SCORES
-- ================================
-- Este script inserta datos de ejemplo en la tabla high_scores
-- para las materias: Física, Geografía, Biología, Química, Español y Literatura
-- Ejecuta esto DESPUÉS de supabase-schema.sql

-- Nota: Primero necesitas crear usuarios de prueba.
-- Este script usa UUIDs de ejemplo que debes reemplazar con UUIDs reales
-- de usuarios existentes en tu BD.

-- Función auxiliar para generar UUIDs válidos si es necesario
-- (Los UUIDs aquí son de ejemplo)

-- ================================
-- USUARIOS DE PRUEBA (si no existen)
-- ================================

-- Crear usuarios de prueba (ejecutar primero en Supabase Auth, luego aquí)
-- Para propósitos de demostración, usaremos UUIDs ficticios
-- Reemplaza estos con IDs reales de usuarios

INSERT INTO public.usuarios (id, email, nombre, clave_curso, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'estudiante1@cefimat.com', 'Juan Pérez', 'CFMS2026', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'estudiante2@cefimat.com', 'María García', 'CFMS2026', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'estudiante3@cefimat.com', 'Carlos López', 'CFMS2026', NOW()),
  ('44444444-4444-4444-4444-444444444444', 'estudiante4@cefimat.com', 'Ana Martínez', 'CFMS2026', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'estudiante5@cefimat.com', 'Pedro Rodríguez', 'CFMS2026', NOW())
ON CONFLICT (id) DO NOTHING;

-- ================================
-- PHYSICS (FÍSICA) - 4 UNIDADES
-- ================================

INSERT INTO public.high_scores (user_id, subject, unit_key, quiz_key, score, total_questions, percentage, completed_at)
VALUES 
  -- Unidad 1
  ('11111111-1111-1111-1111-111111111111', 'fisica', 'unit_1', 'quiz_1', 18, 20, 90.00, NOW() - INTERVAL '10 days'),
  ('22222222-2222-2222-2222-222222222222', 'fisica', 'unit_1', 'quiz_1', 16, 20, 80.00, NOW() - INTERVAL '9 days'),
  ('33333333-3333-3333-3333-333333333333', 'fisica', 'unit_1', 'quiz_1', 19, 20, 95.00, NOW() - INTERVAL '8 days'),
  ('11111111-1111-1111-1111-111111111111', 'fisica', 'unit_1', 'quiz_2', 17, 20, 85.00, NOW() - INTERVAL '7 days'),
  
  -- Unidad 2
  ('22222222-2222-2222-2222-222222222222', 'fisica', 'unit_2', 'quiz_1', 15, 20, 75.00, NOW() - INTERVAL '6 days'),
  ('44444444-4444-4444-4444-444444444444', 'fisica', 'unit_2', 'quiz_1', 18, 20, 90.00, NOW() - INTERVAL '5 days'),
  ('33333333-3333-3333-3333-333333333333', 'fisica', 'unit_2', 'quiz_2', 14, 20, 70.00, NOW() - INTERVAL '4 days'),
  
  -- Unidad 3
  ('55555555-5555-5555-5555-555555555555', 'fisica', 'unit_3', 'quiz_1', 16, 20, 80.00, NOW() - INTERVAL '3 days'),
  ('11111111-1111-1111-1111-111111111111', 'fisica', 'unit_3', 'quiz_2', 19, 20, 95.00, NOW() - INTERVAL '2 days'),
  
  -- Unidad 4
  ('22222222-2222-2222-2222-222222222222', 'fisica', 'unit_4', 'quiz_1', 17, 20, 85.00, NOW() - INTERVAL '1 day');

-- ================================
-- GEOGRAPHY (GEOGRAFÍA) - 4 UNIDADES
-- ================================

INSERT INTO public.high_scores (user_id, subject, unit_key, quiz_key, score, total_questions, percentage, completed_at)
VALUES 
  -- Unidad 1
  ('33333333-3333-3333-3333-333333333333', 'geografia', 'unit_1', 'quiz_1', 19, 20, 95.00, NOW() - INTERVAL '10 days'),
  ('11111111-1111-1111-1111-111111111111', 'geografia', 'unit_1', 'quiz_1', 17, 20, 85.00, NOW() - INTERVAL '9 days'),
  ('55555555-5555-5555-5555-555555555555', 'geografia', 'unit_1', 'quiz_2', 18, 20, 90.00, NOW() - INTERVAL '8 days'),
  
  -- Unidad 2
  ('44444444-4444-4444-4444-444444444444', 'geografia', 'unit_2', 'quiz_1', 16, 20, 80.00, NOW() - INTERVAL '7 days'),
  ('22222222-2222-2222-2222-222222222222', 'geografia', 'unit_2', 'quiz_1', 15, 20, 75.00, NOW() - INTERVAL '6 days'),
  
  -- Unidad 3
  ('11111111-1111-1111-1111-111111111111', 'geografia', 'unit_3', 'quiz_1', 18, 20, 90.00, NOW() - INTERVAL '5 days'),
  ('33333333-3333-3333-3333-333333333333', 'geografia', 'unit_3', 'quiz_2', 14, 20, 70.00, NOW() - INTERVAL '4 days'),
  
  -- Unidad 4
  ('55555555-5555-5555-5555-555555555555', 'geografia', 'unit_4', 'quiz_1', 17, 20, 85.00, NOW() - INTERVAL '3 days');

-- ================================
-- BIOLOGY (BIOLOGÍA) - 4 UNIDADES
-- ================================

INSERT INTO public.high_scores (user_id, subject, unit_key, quiz_key, score, total_questions, percentage, completed_at)
VALUES 
  -- Unidad 1
  ('22222222-2222-2222-2222-222222222222', 'biologia', 'unit_1', 'quiz_1', 16, 20, 80.00, NOW() - INTERVAL '10 days'),
  ('44444444-4444-4444-4444-444444444444', 'biologia', 'unit_1', 'quiz_1', 18, 20, 90.00, NOW() - INTERVAL '9 days'),
  ('11111111-1111-1111-1111-111111111111', 'biologia', 'unit_1', 'quiz_2', 15, 20, 75.00, NOW() - INTERVAL '8 days'),
  
  -- Unidad 2
  ('33333333-3333-3333-3333-333333333333', 'biologia', 'unit_2', 'quiz_1', 17, 20, 85.00, NOW() - INTERVAL '7 days'),
  ('55555555-5555-5555-5555-555555555555', 'biologia', 'unit_2', 'quiz_1', 19, 20, 95.00, NOW() - INTERVAL '6 days'),
  
  -- Unidad 3
  ('22222222-2222-2222-2222-222222222222', 'biologia', 'unit_3', 'quiz_1', 14, 20, 70.00, NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'biologia', 'unit_3', 'quiz_2', 16, 20, 80.00, NOW() - INTERVAL '4 days'),
  
  -- Unidad 4
  ('44444444-4444-4444-4444-444444444444', 'biologia', 'unit_4', 'quiz_1', 18, 20, 90.00, NOW() - INTERVAL '3 days');

-- ================================
-- CHEMISTRY (QUÍMICA) - 4 UNIDADES
-- ================================

INSERT INTO public.high_scores (user_id, subject, unit_key, quiz_key, score, total_questions, percentage, completed_at)
VALUES 
  -- Unidad 1
  ('55555555-5555-5555-5555-555555555555', 'quimica', 'unit_1', 'quiz_1', 17, 20, 85.00, NOW() - INTERVAL '10 days'),
  ('33333333-3333-3333-3333-333333333333', 'quimica', 'unit_1', 'quiz_1', 16, 20, 80.00, NOW() - INTERVAL '9 days'),
  ('22222222-2222-2222-2222-222222222222', 'quimica', 'unit_1', 'quiz_2', 18, 20, 90.00, NOW() - INTERVAL '8 days'),
  
  -- Unidad 2
  ('11111111-1111-1111-1111-111111111111', 'quimica', 'unit_2', 'quiz_1', 15, 20, 75.00, NOW() - INTERVAL '7 days'),
  ('44444444-4444-4444-4444-444444444444', 'quimica', 'unit_2', 'quiz_1', 19, 20, 95.00, NOW() - INTERVAL '6 days'),
  
  -- Unidad 3
  ('33333333-3333-3333-3333-333333333333', 'quimica', 'unit_3', 'quiz_1', 14, 20, 70.00, NOW() - INTERVAL '5 days'),
  ('55555555-5555-5555-5555-555555555555', 'quimica', 'unit_3', 'quiz_2', 17, 20, 85.00, NOW() - INTERVAL '4 days'),
  
  -- Unidad 4
  ('22222222-2222-2222-2222-222222222222', 'quimica', 'unit_4', 'quiz_1', 16, 20, 80.00, NOW() - INTERVAL '3 days');

-- ================================
-- SPANISH (ESPAÑOL) - 4 UNIDADES
-- ================================

INSERT INTO public.high_scores (user_id, subject, unit_key, quiz_key, score, total_questions, percentage, completed_at)
VALUES 
  -- Unidad 1
  ('44444444-4444-4444-4444-444444444444', 'espanol', 'unit_1', 'quiz_1', 19, 20, 95.00, NOW() - INTERVAL '10 days'),
  ('11111111-1111-1111-1111-111111111111', 'espanol', 'unit_1', 'quiz_1', 18, 20, 90.00, NOW() - INTERVAL '9 days'),
  ('33333333-3333-3333-3333-333333333333', 'espanol', 'unit_1', 'quiz_2', 16, 20, 80.00, NOW() - INTERVAL '8 days'),
  
  -- Unidad 2
  ('22222222-2222-2222-2222-222222222222', 'espanol', 'unit_2', 'quiz_1', 17, 20, 85.00, NOW() - INTERVAL '7 days'),
  ('55555555-5555-5555-5555-555555555555', 'espanol', 'unit_2', 'quiz_1', 15, 20, 75.00, NOW() - INTERVAL '6 days'),
  
  -- Unidad 3
  ('11111111-1111-1111-1111-111111111111', 'espanol', 'unit_3', 'quiz_1', 18, 20, 90.00, NOW() - INTERVAL '5 days'),
  ('44444444-4444-4444-4444-444444444444', 'espanol', 'unit_3', 'quiz_2', 14, 20, 70.00, NOW() - INTERVAL '4 days'),
  
  -- Unidad 4
  ('33333333-3333-3333-3333-333333333333', 'espanol', 'unit_4', 'quiz_1', 19, 20, 95.00, NOW() - INTERVAL '3 days');

-- ================================
-- LITERATURE (LITERATURA) - 4 UNIDADES
-- ================================

INSERT INTO public.high_scores (user_id, subject, unit_key, quiz_key, score, total_questions, percentage, completed_at)
VALUES 
  -- Unidad 1
  ('33333333-3333-3333-3333-333333333333', 'literatura', 'unit_1', 'quiz_1', 17, 20, 85.00, NOW() - INTERVAL '10 days'),
  ('55555555-5555-5555-5555-555555555555', 'literatura', 'unit_1', 'quiz_1', 16, 20, 80.00, NOW() - INTERVAL '9 days'),
  ('22222222-2222-2222-2222-222222222222', 'literatura', 'unit_1', 'quiz_2', 18, 20, 90.00, NOW() - INTERVAL '8 days'),
  
  -- Unidad 2
  ('11111111-1111-1111-1111-111111111111', 'literatura', 'unit_2', 'quiz_1', 19, 20, 95.00, NOW() - INTERVAL '7 days'),
  ('44444444-4444-4444-4444-444444444444', 'literatura', 'unit_2', 'quiz_1', 15, 20, 75.00, NOW() - INTERVAL '6 days'),
  
  -- Unidad 3
  ('22222222-2222-2222-2222-222222222222', 'literatura', 'unit_3', 'quiz_1', 14, 20, 70.00, NOW() - INTERVAL '5 days'),
  ('33333333-3333-3333-3333-333333333333', 'literatura', 'unit_3', 'quiz_2', 17, 20, 85.00, NOW() - INTERVAL '4 days'),
  
  -- Unidad 4
  ('55555555-5555-5555-5555-555555555555', 'literatura', 'unit_4', 'quiz_1', 16, 20, 80.00, NOW() - INTERVAL '3 days');

-- ================================
-- ESTADÍSTICAS DE VERIFICACIÓN
-- ================================

-- Verificar cuántos registros se insertaron por materia
SELECT 
  subject,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(percentage) as avg_percentage,
  MAX(percentage) as max_percentage
FROM public.high_scores
WHERE subject IN ('fisica', 'geografia', 'biologia', 'quimica', 'espanol', 'literatura')
GROUP BY subject
ORDER BY subject;
