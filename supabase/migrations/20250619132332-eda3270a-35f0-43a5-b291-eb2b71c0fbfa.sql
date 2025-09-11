
-- Corrigir todas as políticas RLS para permitir acesso aos dados
-- Problema: as políticas estão muito restritivas e bloqueando acesso

-- 1. Corrigir políticas da tabela patients
DROP POLICY IF EXISTS "Enable read access for all users" ON public.patients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.patients;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.patients;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.patients;

CREATE POLICY "Enable all operations for authenticated users" ON public.patients
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 2. Corrigir políticas da tabela appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.appointments;
CREATE POLICY "Enable all operations for authenticated users" ON public.appointments
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 3. Corrigir políticas da tabela leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.leads;
CREATE POLICY "Enable all operations for authenticated users" ON public.leads
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 4. Corrigir políticas da tabela payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.payments;
CREATE POLICY "Enable all operations for authenticated users" ON public.payments
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. Corrigir políticas da tabela rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.rooms;
CREATE POLICY "Enable all operations for authenticated users" ON public.rooms
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 6. Corrigir políticas da tabela accounts_payable
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.accounts_payable;
CREATE POLICY "Enable all operations for authenticated users" ON public.accounts_payable
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 7. Corrigir políticas da tabela accounts_receivable
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.accounts_receivable;
CREATE POLICY "Enable all operations for authenticated users" ON public.accounts_receivable
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 8. Corrigir políticas da tabela medical_records
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.medical_records;
CREATE POLICY "Enable all operations for authenticated users" ON public.medical_records
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 9. Corrigir políticas da tabela evolutions
ALTER TABLE public.evolutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.evolutions;
CREATE POLICY "Enable all operations for authenticated users" ON public.evolutions
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 10. Corrigir políticas da tabela guardians
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.guardians;
CREATE POLICY "Enable all operations for authenticated users" ON public.guardians
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 11. Inserir dados de exemplo para testar o sistema
INSERT INTO public.rooms (name, capacity, equipment) VALUES 
('Sala 1', 1, ARRAY['Maca', 'Aparelho de alongamento']),
('Sala 2', 2, ARRAY['Maca', 'Pilates', 'Bola suíça'])
ON CONFLICT DO NOTHING;

-- 12. Garantir que a função get_current_user_role funciona corretamente
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT COALESCE(role, 'guardian'::user_role) FROM public.profiles WHERE id = auth.uid();
$$;
