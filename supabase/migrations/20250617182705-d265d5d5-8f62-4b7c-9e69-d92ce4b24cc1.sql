
-- Verificar se existem usuários cadastrados
SELECT email, role FROM public.profiles;

-- Verificar se há algum problema com a configuração de autenticação
-- Vamos também criar um usuário administrador de teste diretamente
-- Nota: Como não podemos inserir diretamente em auth.users via SQL,
-- vamos facilitar o processo criando uma função que irá ajudar

-- Função para listar todos os perfis existentes (para debug)
CREATE OR REPLACE FUNCTION list_all_profiles()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  role user_role,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, email, full_name, role, created_at 
  FROM public.profiles 
  ORDER BY created_at DESC;
$$;

-- Função para verificar se um email já existe
CREATE OR REPLACE FUNCTION check_email_exists(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = user_email
  );
$$;
