
-- Criar um usuário administrador diretamente no banco
-- Primeiro, vamos inserir o usuário no auth.users (isso normalmente é feito pelo Supabase Auth)
-- Como não podemos inserir diretamente na tabela auth.users via SQL, 
-- vamos criar um perfil administrativo que pode ser associado a um usuário quando ele se cadastrar

-- Vamos criar uma função para promover um usuário existente a administrador
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET role = 'admin'
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', user_email;
  END IF;
END;
$$;

-- Função para verificar se existe pelo menos um admin no sistema
CREATE OR REPLACE FUNCTION ensure_admin_exists()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin'
  );
$$;
