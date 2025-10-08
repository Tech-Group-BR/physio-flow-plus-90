-- ===================================================================
-- EXECUTAR ESTE SQL COMPLETO NO SUPABASE DASHBOARD (SQL EDITOR)
-- Corrige todos os problemas de schema e triggers
-- ===================================================================

-- PARTE 1: Verificar e adicionar colunas faltantes na tabela profiles
-- =====================================================================

DO $$ 
BEGIN
  -- Adicionar crefito se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'crefito'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN crefito text;
    RAISE NOTICE '✅ Coluna crefito adicionada';
  ELSE
    RAISE NOTICE '✅ Coluna crefito já existe';
  END IF;

  -- Adicionar clinic_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN clinic_id uuid REFERENCES clinic_settings(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);
    RAISE NOTICE '✅ Coluna clinic_id adicionada';
  ELSE
    RAISE NOTICE '✅ Coluna clinic_id já existe';
  END IF;

  -- Adicionar clinic_code se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'clinic_code'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN clinic_code text;
    CREATE INDEX IF NOT EXISTS idx_profiles_clinic_code ON public.profiles(clinic_code);
    RAISE NOTICE '✅ Coluna clinic_code adicionada';
  ELSE
    RAISE NOTICE '✅ Coluna clinic_code já existe';
  END IF;
END $$;

-- PARTE 2: Corrigir a trigger de auto-criação de professional
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_create_professional_from_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas criar professional se o role for 'professional'
  IF NEW.role = 'professional' THEN
    -- Verificar se já existe um professional com este profile_id
    IF NOT EXISTS (
      SELECT 1 FROM public.professionals 
      WHERE profile_id = NEW.id
    ) THEN
      -- Criar o professional (sem usar campos que não existem)
      INSERT INTO public.professionals (
        profile_id,
        full_name,
        email,
        phone,
        crefito,
        specialties,
        is_active,
        clinic_id
      ) VALUES (
        NEW.id,                                    -- profile_id
        NEW.full_name,                            -- full_name
        COALESCE(NEW.email, ''),                  -- email
        NEW.phone,                                -- phone
        COALESCE(NEW.crefito, ''),                -- crefito (agora suporta NULL)
        ARRAY[]::text[],                          -- specialties vazio (não vem do profile)
        COALESCE(NEW.is_active, true),            -- is_active
        NEW.clinic_id                             -- clinic_id
      );
      
      RAISE NOTICE '✅ Professional criado automaticamente para profile %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PARTE 3: Forçar reload do PostgREST schema cache
-- =================================================

NOTIFY pgrst, 'reload schema';

-- PARTE 4: Verificar resultado
-- ============================

-- Mostrar todas as colunas da tabela profiles
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ SCHEMA ATUALIZADO COM SUCESSO!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '1. Colunas clinic_id, clinic_code e crefito verificadas';
  RAISE NOTICE '2. Trigger auto_create_professional_from_profile corrigida';
  RAISE NOTICE '3. Schema cache do PostgREST recarregado';
  RAISE NOTICE '';
  RAISE NOTICE '⏳ Aguarde 5-10 segundos para o cache atualizar completamente';
  RAISE NOTICE '💡 Se ainda der erro, vá em Settings > API > Restart PostgREST';
END $$;
