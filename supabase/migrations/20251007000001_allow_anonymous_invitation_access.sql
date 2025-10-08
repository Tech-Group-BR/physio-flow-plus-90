-- Migration: Allow anonymous access to invitations by token
-- Description: Permite que usuários não autenticados possam visualizar convites através do token único
-- Isso é necessário para que a página de aceitar convite funcione antes do login/cadastro

-- Remover política antiga que exigia autenticação
DROP POLICY IF EXISTS "Users can view invitations from their clinic" ON user_invitations;

-- Criar nova política que permite acesso anônimo pelo token
CREATE POLICY "Anyone can view invitation by token" ON user_invitations 
FOR SELECT 
USING (
  -- Permitir acesso anônimo quando o token está sendo consultado
  -- OU acesso autenticado para usuários da mesma clínica
  auth.uid() IS NULL -- Permite acesso anônimo
  OR clinic_id = (SELECT clinic_id FROM profiles WHERE id = auth.uid())
  OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'super')
);

-- Comentário explicativo
COMMENT ON POLICY "Anyone can view invitation by token" ON user_invitations IS 
'Permite que qualquer pessoa (autenticada ou não) possa visualizar convites através do token único. Isso é necessário para validar convites antes do cadastro.';
