-- Migration: Auto criar professional quando um profile com role 'professional' é criado
-- Descrição: Quando um usuário é convidado como professional e aceita o convite,
-- automaticamente criar um registro na tabela professionals linkado ao profile

-- Criar função que cria professional automaticamente
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
        NEW.crefito,                              -- crefito
        COALESCE(NEW.specialties, ARRAY[]::text[]), -- specialties (array vazio se null)
        NEW.is_active,                            -- is_active
        NEW.clinic_id                             -- clinic_id
      );
      
      RAISE NOTICE '✅ Professional criado automaticamente para profile %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que dispara após INSERT no profiles
DROP TRIGGER IF EXISTS auto_create_professional_trigger ON public.profiles;
CREATE TRIGGER auto_create_professional_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_professional_from_profile();

-- Criar trigger que dispara após UPDATE no profiles (caso role mude para professional)
DROP TRIGGER IF EXISTS auto_create_professional_on_update_trigger ON public.profiles;
CREATE TRIGGER auto_create_professional_on_update_trigger
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'professional' AND OLD.role != 'professional')
  EXECUTE FUNCTION public.auto_create_professional_from_profile();

-- Comentário explicativo
COMMENT ON FUNCTION public.auto_create_professional_from_profile() IS 
'Função que cria automaticamente um registro na tabela professionals quando um profile com role "professional" é criado ou atualizado. Isso garante que todo fisioterapeuta tenha um registro completo vinculado ao seu profile.';
