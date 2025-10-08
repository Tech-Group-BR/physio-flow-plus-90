-- ===================================================================
-- CONFIRMAR EMAIL DO USUÁRIO RECÉM-CRIADO
-- Execute no SQL Editor do Supabase Dashboard
-- ===================================================================

-- Confirmar email de todos os usuários não confirmados
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL
  AND deleted_at IS NULL;

-- Verificar usuários confirmados
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Mensagem de confirmação
DO $$
DECLARE
  confirmed_count int;
BEGIN
  SELECT COUNT(*) INTO confirmed_count
  FROM auth.users 
  WHERE email_confirmed_at IS NOT NULL;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ EMAILS CONFIRMADOS COM SUCESSO!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total de usuários com email confirmado: %', confirmed_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔓 Agora os usuários podem fazer login normalmente';
END $$;
