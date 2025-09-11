
-- Corrigir o problema com o tipo user_role na função handle_new_user
-- Primeiro, vamos garantir que o enum user_role existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'physiotherapist', 'guardian');
    END IF;
END $$;

-- Recriar a função handle_new_user com tratamento de erro melhorado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_value user_role;
BEGIN
    -- Definir o role padrão como 'guardian' se não especificado
    user_role_value := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'guardian'::user_role);
    
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
