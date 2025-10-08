-- ===================================================================
-- EXECUTE ESTE SQL NO SUPABASE DASHBOARD (SQL EDITOR)
-- Para forçar o reload do schema cache do PostgREST
-- ===================================================================

-- 1. Verificar se a coluna crefito existe na tabela profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('crefito', 'clinic_id', 'clinic_code')
ORDER BY column_name;

-- 2. Se as colunas não existirem, adicionar agora:
DO $$ 
BEGIN
  -- Adicionar crefito se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'crefito'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN crefito text;
    RAISE NOTICE 'Coluna crefito adicionada';
  ELSE
    RAISE NOTICE 'Coluna crefito já existe';
  END IF;

  -- Adicionar clinic_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN clinic_id uuid REFERENCES clinic_settings(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);
    RAISE NOTICE 'Coluna clinic_id adicionada';
  ELSE
    RAISE NOTICE 'Coluna clinic_id já existe';
  END IF;

  -- Adicionar clinic_code se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'clinic_code'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN clinic_code text;
    CREATE INDEX IF NOT EXISTS idx_profiles_clinic_code ON public.profiles(clinic_code);
    RAISE NOTICE 'Coluna clinic_code adicionada';
  ELSE
    RAISE NOTICE 'Coluna clinic_code já existe';
  END IF;
END $$;

-- 3. Forçar reload do schema do PostgREST
-- Isso notifica o PostgREST para recarregar o cache
NOTIFY pgrst, 'reload schema';

-- 4. Verificar novamente as colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Mostrar mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Schema atualizado! Aguarde 5-10 segundos para o PostgREST recarregar o cache.';
  RAISE NOTICE '💡 Se ainda der erro, vá em Settings > API > Restart PostgREST';
END $$;
