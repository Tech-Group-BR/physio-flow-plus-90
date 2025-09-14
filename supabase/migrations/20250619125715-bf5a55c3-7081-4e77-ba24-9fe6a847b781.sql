
-- Solução completa e corrigida para todos os problemas de autenticação
DO $$ 
BEGIN
    -- 1. Remover completamente tudo que pode estar causando conflito
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
    
    -- 2. Remover e recriar o enum
    DROP TYPE IF EXISTS user_role CASCADE;
    CREATE TYPE user_role AS ENUM ('admin', 'Professional', 'guardian');
    
    -- 3. Remover e recriar a tabela profiles
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
    
    -- 4. Habilitar RLS na tabela profiles
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- 5. Criar políticas RLS mais permissivas inicialmente
    CREATE POLICY "Enable read access for users" ON public.profiles
        FOR SELECT USING (true);
    
    CREATE POLICY "Enable insert for authenticated users" ON public.profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    
    CREATE POLICY "Enable update for users based on id" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);
        
END $$;

-- 6. Função para obter role do usuário (para evitar recursão) - CORRIGIDA
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 7. Função trigger mais simples e robusta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_value user_role := 'guardian';
    user_name text := 'Usuário';
BEGIN
    -- Determinar o nome do usuário
    BEGIN
        user_name := COALESCE(
            NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
            NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
            SPLIT_PART(new.email, '@', 1),
            'Usuário'
        );
    EXCEPTION
        WHEN OTHERS THEN
            user_name := 'Usuário';
    END;
    
    -- Determinar o role do usuário
    BEGIN
        IF new.raw_user_meta_data IS NOT NULL AND 
           new.raw_user_meta_data->>'role' IS NOT NULL AND
           new.raw_user_meta_data->>'role' != '' THEN
            user_role_value := (new.raw_user_meta_data->>'role')::user_role;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            user_role_value := 'guardian';
    END;
    
    -- Inserir perfil (versão mais segura)
    BEGIN
        INSERT INTO public.profiles (id, full_name, email, role, phone, crefito)
        VALUES (
            new.id,
            user_name,
            new.email,
            user_role_value,
            NULLIF(TRIM(new.raw_user_meta_data->>'phone'), ''),
            NULLIF(TRIM(new.raw_user_meta_data->>'crefito'), '')
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Se falhar, inserir apenas o básico
            INSERT INTO public.profiles (id, full_name, email, role)
            VALUES (new.id, user_name, new.email, 'guardian')
            ON CONFLICT (id) DO NOTHING;
    END;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Recriar o trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Funções utilitárias para administração
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

CREATE OR REPLACE FUNCTION public.check_email_exists(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE email = user_email
    );
$$;

CREATE OR REPLACE FUNCTION public.ensure_admin_exists()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE role = 'admin'
    );
$$;

-- 10. Limpar dados inconsistentes se existirem
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);
