-- Migration: Corrigir trigger auto_create_professional_from_profile
-- Remove referências a campos que não existem na tabela profiles (specialties)

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
      -- Criar o professional
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
        COALESCE(NEW.email, ''),                  -- email (obrigatório na tabela)
        NEW.phone,                                -- phone
        COALESCE(NEW.crefito, ''),                -- crefito (string vazia se null)
        ARRAY[]::text[],                          -- specialties (array vazio - não vem do profile)
        COALESCE(NEW.is_active, true),            -- is_active
        NEW.clinic_id                             -- clinic_id
      );
      
      RAISE NOTICE '✅ Professional criado automaticamente para profile %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.auto_create_professional_from_profile() IS 
'Trigger function que cria automaticamente um registro em professionals quando um profile com role=professional é criado ou atualizado';
