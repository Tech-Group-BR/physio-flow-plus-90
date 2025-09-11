
-- Remover todas as políticas restritivas existentes
DROP POLICY IF EXISTS "Admins and physios can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Admins and physios can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Admins and physios can update patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can delete patients" ON public.patients;

DROP POLICY IF EXISTS "Admins and physios can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins and physios can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins and physios can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;

DROP POLICY IF EXISTS "Admins and physios can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins and physios can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Admins and physios can update payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can delete payments" ON public.payments;

DROP POLICY IF EXISTS "Admins and physios can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Admins and physios can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Admins and physios can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

DROP POLICY IF EXISTS "Admins and physios can view all medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Admins and physios can insert medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Admins and physios can update medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Admins can delete medical records" ON public.medical_records;

DROP POLICY IF EXISTS "Admins and physios can view all evolutions" ON public.evolutions;
DROP POLICY IF EXISTS "Admins and physios can insert evolutions" ON public.evolutions;
DROP POLICY IF EXISTS "Admins and physios can update evolutions" ON public.evolutions;
DROP POLICY IF EXISTS "Admins can delete evolutions" ON public.evolutions;

DROP POLICY IF EXISTS "Admins can view all accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Admins can insert accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Admins can update accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Admins can delete accounts payable" ON public.accounts_payable;

DROP POLICY IF EXISTS "Admins can view all accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Admins can insert accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Admins can update accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Admins can delete accounts receivable" ON public.accounts_receivable;

DROP POLICY IF EXISTS "Admins and physios can view all rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can insert rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can delete rooms" ON public.rooms;

-- Criar políticas mais permissivas para usuários autenticados
-- Tabela patients
CREATE POLICY "Authenticated users can manage patients" ON public.patients
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Tabela appointments
CREATE POLICY "Authenticated users can manage appointments" ON public.appointments
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Tabela payments
CREATE POLICY "Authenticated users can manage payments" ON public.payments
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Tabela leads
CREATE POLICY "Authenticated users can manage leads" ON public.leads
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Tabela medical_records
CREATE POLICY "Authenticated users can manage medical records" ON public.medical_records
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Tabela evolutions
CREATE POLICY "Authenticated users can manage evolutions" ON public.evolutions
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Tabela accounts_payable
CREATE POLICY "Authenticated users can manage accounts payable" ON public.accounts_payable
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Tabela accounts_receivable
CREATE POLICY "Authenticated users can manage accounts receivable" ON public.accounts_receivable
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Tabela rooms
CREATE POLICY "Authenticated users can manage rooms" ON public.rooms
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Garantir que o usuário atual seja admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = auth.uid();

-- Inserir alguns dados de exemplo se não existirem
INSERT INTO public.patients (full_name, phone, email, is_active) 
VALUES ('Paciente Exemplo', '(11) 99999-9999', 'exemplo@email.com', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.leads (name, phone, source, status) 
VALUES ('Lead Exemplo', '(11) 88888-8888', 'site', 'novo')
ON CONFLICT DO NOTHING;
