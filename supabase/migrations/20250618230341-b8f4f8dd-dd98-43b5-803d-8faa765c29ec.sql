
-- Corrigir a função handle_new_user com melhor tratamento de erros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_value user_role := 'guardian'::user_role;
BEGIN
    -- Tentar converter o role dos metadados do usuário
    BEGIN
        IF new.raw_user_meta_data IS NOT NULL AND new.raw_user_meta_data->>'role' IS NOT NULL THEN
            user_role_value := (new.raw_user_meta_data->>'role')::user_role;
        END IF;
    EXCEPTION
        WHEN invalid_text_representation THEN
            user_role_value := 'guardian'::user_role;
        WHEN OTHERS THEN
            user_role_value := 'guardian'::user_role;
    END;
    
    -- Inserir o perfil do usuário
    BEGIN
        INSERT INTO public.profiles (id, full_name, email, role, phone, crefito)
        VALUES (
            new.id,
            COALESCE(
                NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
                SPLIT_PART(new.email, '@', 1)
            ),
            new.email,
            user_role_value,
            NULLIF(TRIM(new.raw_user_meta_data->>'phone'), ''),
            NULLIF(TRIM(new.raw_user_meta_data->>'crefito'), '')
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Se falhar, inserir apenas o básico necessário
            INSERT INTO public.profiles (id, full_name, email, role)
            VALUES (
                new.id,
                COALESCE(
                    NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
                    SPLIT_PART(new.email, '@', 1)
                ),
                new.email,
                'guardian'::user_role
            );
    END;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que não há perfis órfãos
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
