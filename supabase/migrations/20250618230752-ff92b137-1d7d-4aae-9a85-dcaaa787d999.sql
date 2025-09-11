
-- Verificar e recriar completamente a estrutura de autenticação
DO $$ 
BEGIN
    -- Primeiro, remover dependências existentes
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    
    -- Recriar o enum user_role de forma segura
    DROP TYPE IF EXISTS user_role CASCADE;
    CREATE TYPE user_role AS ENUM ('admin', 'physiotherapist', 'guardian');
    
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
    
    -- Habilitar RLS
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Políticas RLS básicas
    CREATE POLICY "Users can view own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);
    
    CREATE POLICY "Users can update own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);
    
    -- Função para criar perfil - versão mais simples e robusta
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $func$
    DECLARE
        user_role_value user_role := 'guardian';
        user_name text;
    BEGIN
        -- Determinar o role
        IF new.raw_user_meta_data IS NOT NULL AND new.raw_user_meta_data->>'role' IS NOT NULL THEN
            BEGIN
                user_role_value := (new.raw_user_meta_data->>'role')::user_role;
            EXCEPTION
                WHEN OTHERS THEN
                    user_role_value := 'guardian';
            END;
        END IF;
        
        -- Determinar o nome
        user_name := COALESCE(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name',
            SPLIT_PART(new.email, '@', 1)
        );
        
        -- Inserir perfil
        INSERT INTO public.profiles (id, full_name, email, role, phone, crefito)
        VALUES (
            new.id,
            user_name,
            new.email,
            user_role_value,
            new.raw_user_meta_data->>'phone',
            new.raw_user_meta_data->>'crefito'
        );
        
        RETURN new;
    EXCEPTION
        WHEN OTHERS THEN
            -- Log do erro e inserir perfil básico
            RAISE WARNING 'Erro ao criar perfil para usuário %: %', new.email, SQLERRM;
            INSERT INTO public.profiles (id, full_name, email, role)
            VALUES (new.id, COALESCE(user_name, 'Usuário'), new.email, 'guardian')
            ON CONFLICT (id) DO NOTHING;
            RETURN new;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Recriar o trigger
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        
END $$;

-- Limpar dados inconsistentes
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);
