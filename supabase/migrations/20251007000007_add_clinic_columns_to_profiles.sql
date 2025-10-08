-- Migration: Adicionar colunas clinic_id e clinic_code à tabela profiles
-- Estas colunas são essenciais para o sistema multi-tenant

-- Adicionar coluna clinic_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN clinic_id uuid REFERENCES clinic_settings(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);
    
    RAISE NOTICE 'Coluna clinic_id adicionada à tabela profiles';
  ELSE
    RAISE NOTICE 'Coluna clinic_id já existe na tabela profiles';
  END IF;
END $$;

-- Adicionar coluna clinic_code se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'clinic_code'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN clinic_code text;
    CREATE INDEX IF NOT EXISTS idx_profiles_clinic_code ON public.profiles(clinic_code);
    
    RAISE NOTICE 'Coluna clinic_code adicionada à tabela profiles';
  ELSE
    RAISE NOTICE 'Coluna clinic_code já existe na tabela profiles';
  END IF;
END $$;

-- Criar constraint UNIQUE (clinic_id, email) se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_clinic_email_unique'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_clinic_email_unique UNIQUE (clinic_id, email);
    
    RAISE NOTICE 'Constraint UNIQUE (clinic_id, email) adicionada à tabela profiles';
  ELSE
    RAISE NOTICE 'Constraint profiles_clinic_email_unique já existe';
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.clinic_id IS 'Referência à clínica do usuário (multi-tenant)';
COMMENT ON COLUMN public.profiles.clinic_code IS 'Código de 6 dígitos da clínica para identificação rápida';
