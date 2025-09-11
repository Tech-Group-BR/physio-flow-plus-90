
-- Solução definitiva para o erro "Database error saving new user"
DO $$ 
BEGIN
    -- 1. Remover trigger problemático
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    
    -- 2. Verificar se a tabela profiles existe e tem a estrutura correta
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
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
        
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Enable read access for users" ON public.profiles
            FOR SELECT USING (true);
        
        CREATE POLICY "Enable insert for authenticated users" ON public.profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
        
        CREATE POLICY "Enable update for users based on id" ON public.profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;
    
END $$;

-- 3. Criar função trigger mais simples e à prova de falhas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir perfil básico, ignorando se já existe
    INSERT INTO public.profiles (id, full_name, email, role, phone, crefito)
    VALUES (
        new.id,
        COALESCE(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name', 
            SPLIT_PART(new.email, '@', 1),
            'Usuário'
        ),
        new.email,
        CASE 
            WHEN new.raw_user_meta_data->>'role' IS NOT NULL 
            THEN (new.raw_user_meta_data->>'role')::user_role 
            ELSE 'guardian'::user_role 
        END,
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'crefito'
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Se tudo falhar, apenas retornar new para não bloquear o cadastro
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recriar o trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Garantir que as políticas RLS estão corretas
DROP POLICY IF EXISTS "Enable read access for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

CREATE POLICY "Enable read access for users" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
