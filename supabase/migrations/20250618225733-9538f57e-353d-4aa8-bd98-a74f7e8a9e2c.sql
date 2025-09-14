
-- Primeiro, vamos garantir que o enum user_role existe corretamente
DO $$ 
BEGIN
    -- Drop do enum se existir para recriar
    DROP TYPE IF EXISTS user_role CASCADE;
    
    -- Criar o enum user_role
    CREATE TYPE user_role AS ENUM ('admin', 'Professional', 'guardian');
END $$;

-- Recriar a tabela profiles se necessário
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text,
    phone text,
    role user_role NOT NULL DEFAULT 'guardian',
    crefito text,
    specialties text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Função para criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_value user_role;
BEGIN
    -- Definir o role padrão como 'guardian' se não especificado
    BEGIN
        user_role_value := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'guardian'::user_role);
    EXCEPTION
        WHEN invalid_text_representation THEN
            user_role_value := 'guardian'::user_role;
        WHEN OTHERS THEN
            user_role_value := 'guardian'::user_role;
    END;
    
    INSERT INTO public.profiles (id, full_name, email, role, phone, crefito)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        new.email,
        user_role_value,
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'crefito'
    );
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro para debug
        RAISE NOTICE 'Erro ao criar perfil: %', SQLERRM;
        -- Inserir com valores padrão em caso de erro
        INSERT INTO public.profiles (id, full_name, email, role)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'full_name', new.email),
            new.email,
            'guardian'::user_role
        );
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Funções utilitárias para administração
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text)
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

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Limpar dados inconsistentes se existirem
DELETE FROM public.profiles WHERE role IS NULL;
