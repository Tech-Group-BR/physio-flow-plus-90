-- Migration: Desabilitar trigger de auto-criação de perfil
-- Motivo: Agora o perfil é criado manualmente no código do AuthContext
-- para ter controle total sobre os dados (email real vs sintético, crefito, etc.)

-- Remover trigger que cria perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Comentar a função (manter por enquanto caso seja necessária no futuro)
COMMENT ON FUNCTION public.handle_new_user() IS 
'DESABILITADA: Função de auto-criação de perfil. Agora o perfil é criado manualmente no AuthContext.register()';

-- Nota: Não vamos deletar a função handle_new_user() por segurança,
-- mas ela não será mais executada sem a trigger.
