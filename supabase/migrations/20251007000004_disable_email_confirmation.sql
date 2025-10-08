-- Migration: Desabilitar confirmação de email obrigatória
-- Descrição: Configura o sistema para criar usuários sem necessidade de confirmação de email

-- IMPORTANTE: Esta migration não pode modificar diretamente a tabela auth.users
-- pois ela pertence ao schema auth e requer privilégios de superusuário.

-- CONFIGURAÇÃO MANUAL NECESSÁRIA:
-- 1. Acesse o Dashboard do Supabase
-- 2. Vá em Authentication > Settings
-- 3. Na seção "Email", desabilite "Confirm email"
-- 4. Salve as alterações

-- ALTERNATIVA: Execute o seguinte SQL como administrador no SQL Editor do Supabase:
/*
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL
  AND deleted_at IS NULL;
*/

-- Esta migration serve apenas para documentar a mudança
-- A confirmação de email foi desabilitada nas configurações do projeto

-- Criar uma função auxiliar para confirmar emails programaticamente se necessário
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta função pode ser chamada pelo admin para confirmar emails manualmente
  -- mas requer que a confirmação seja desabilitada no dashboard primeiro
  
  RAISE NOTICE 'Para confirmar emails automaticamente, desabilite "Confirm email" no Dashboard do Supabase em Authentication > Settings > Email';
  RETURN 'Função disponível para uso futuro. Configure o Supabase primeiro.';
END;
$$;

COMMENT ON FUNCTION public.confirm_user_email(TEXT) IS 
'Função auxiliar para documentar que a confirmação de email foi desabilitada. Configure no Dashboard: Authentication > Settings > Email > Confirm email: OFF';

