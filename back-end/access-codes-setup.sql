-- ================================
-- ACCESS CODES SYSTEM
-- ================================
-- Este script agrega el sistema de códigos de acceso
-- Ejecuta esto DESPUÉS del supabase-schema.sql principal

-- Tabla de códigos de acceso
CREATE TABLE IF NOT EXISTS public.access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  max_uses INTEGER DEFAULT NULL,  -- NULL = ilimitado
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede leer códigos activos (para validación)
CREATE POLICY "Anyone can read active codes"
  ON public.access_codes
  FOR SELECT
  USING (is_active = true);

-- Función para validar código de acceso
CREATE OR REPLACE FUNCTION public.validate_access_code(p_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_code RECORD;
BEGIN
  -- Buscar el código
  SELECT * INTO v_code
  FROM public.access_codes
  WHERE code = p_code
    AND is_active = true;
  
  -- Si no existe, retornar false
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verificar si expiró
  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < NOW() THEN
    RETURN false;
  END IF;
  
  -- Verificar límite de usos
  IF v_code.max_uses IS NOT NULL AND v_code.current_uses >= v_code.max_uses THEN
    RETURN false;
  END IF;
  
  -- Código válido
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para incrementar uso de código
CREATE OR REPLACE FUNCTION public.increment_code_usage(p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.access_codes
  SET current_uses = current_uses + 1
  WHERE code = p_code
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- INSERTAR CÓDIGO INICIAL
-- ================================

-- Insertar la clave CEFIMAT2026
INSERT INTO public.access_codes (code, description, max_uses, is_active)
VALUES ('CEFIMAT2026', 'Clave de acceso general para alumnos 2026', NULL, true)
ON CONFLICT (code) DO NOTHING;

-- ================================
-- ÍNDICES
-- ================================

CREATE INDEX IF NOT EXISTS idx_access_codes_code ON public.access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON public.access_codes(is_active);

-- ================================
-- COMENTARIOS
-- ================================

COMMENT ON TABLE public.access_codes IS 'Códigos de acceso para registro de usuarios';
COMMENT ON COLUMN public.access_codes.code IS 'Código de acceso único';
COMMENT ON COLUMN public.access_codes.max_uses IS 'Máximo de usos permitidos (NULL = ilimitado)';
COMMENT ON COLUMN public.access_codes.current_uses IS 'Número de veces que se ha usado';
COMMENT ON COLUMN public.access_codes.expires_at IS 'Fecha de expiración (NULL = nunca expira)';
