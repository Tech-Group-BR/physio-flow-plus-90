
-- Habilitar RLS em todas as tabelas que ainda não têm
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Criar função para verificar se o usuário é admin ou fisioterapeuta
CREATE OR REPLACE FUNCTION public.is_admin_or_physio(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role IN ('admin', 'Professional')
  );
$$;

-- Políticas para tabela patients
CREATE POLICY "Admins and physios can view all patients" ON public.patients
    FOR SELECT USING (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins and physios can insert patients" ON public.patients
    FOR INSERT WITH CHECK (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins and physios can update patients" ON public.patients
    FOR UPDATE USING (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins can delete patients" ON public.patients
    FOR DELETE USING (public.is_admin(auth.uid()));

-- Políticas para tabela appointments
CREATE POLICY "Admins and physios can view all appointments" ON public.appointments
    FOR SELECT USING (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins and physios can insert appointments" ON public.appointments
    FOR INSERT WITH CHECK (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins and physios can update appointments" ON public.appointments
    FOR UPDATE USING (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins can delete appointments" ON public.appointments
    FOR DELETE USING (public.is_admin(auth.uid()));

-- Políticas para tabela payments
CREATE POLICY "Admins and physios can view all payments" ON public.payments
    FOR SELECT USING (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins and physios can insert payments" ON public.payments
    FOR INSERT WITH CHECK (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins and physios can update payments" ON public.payments
    FOR UPDATE USING (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins can delete payments" ON public.payments
    FOR DELETE USING (public.is_admin(auth.uid()));

-- Políticas para tabela leads
CREATE POLICY "Admins and physios can view all leads" ON public.leads
    FOR SELECT USING (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins and physios can insert leads" ON public.leads
    FOR INSERT WITH CHECK (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins and physios can update leads" ON public.leads
    FOR UPDATE USING (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins can delete leads" ON public.leads
    FOR DELETE USING (public.is_admin(auth.uid()));

-- Políticas para tabela medical_records
CREATE POLICY "Admins and physios can view all medical records" ON public.medical_records
    FOR SELECT USING (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins and physios can insert medical records" ON public.medical_records
    FOR INSERT WITH CHECK (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins and physios can update medical records" ON public.medical_records
    FOR UPDATE USING (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins can delete medical records" ON public.medical_records
    FOR DELETE USING (public.is_admin(auth.uid()));

-- Políticas para tabela evolutions
CREATE POLICY "Admins and physios can view all evolutions" ON public.evolutions
    FOR SELECT USING (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins and physios can insert evolutions" ON public.evolutions
    FOR INSERT WITH CHECK (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins and physios can update evolutions" ON public.evolutions
    FOR UPDATE USING (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins can delete evolutions" ON public.evolutions
    FOR DELETE USING (public.is_admin(auth.uid()));

-- Políticas para tabela accounts_payable
CREATE POLICY "Admins can view all accounts payable" ON public.accounts_payable
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert accounts payable" ON public.accounts_payable
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update accounts payable" ON public.accounts_payable
    FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete accounts payable" ON public.accounts_payable
    FOR DELETE USING (public.is_admin(auth.uid()));

-- Políticas para tabela accounts_receivable
CREATE POLICY "Admins can view all accounts receivable" ON public.accounts_receivable
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert accounts receivable" ON public.accounts_receivable
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update accounts receivable" ON public.accounts_receivable
    FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete accounts receivable" ON public.accounts_receivable
    FOR DELETE USING (public.is_admin(auth.uid()));

-- Políticas para tabela rooms
CREATE POLICY "Admins and physios can view all rooms" ON public.rooms
    FOR SELECT USING (public.is_admin_or_physio(auth.uid()));

CREATE POLICY "Admins can insert rooms" ON public.rooms
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update rooms" ON public.rooms
    FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete rooms" ON public.rooms
    FOR DELETE USING (public.is_admin(auth.uid()));

-- Políticas mais permissivas para whatsapp_logs (apenas admins)
CREATE POLICY "Admins can manage whatsapp logs" ON public.whatsapp_logs
    FOR ALL USING (public.is_admin(auth.uid()));

-- Políticas para whatsapp_settings (apenas admins)
CREATE POLICY "Admins can manage whatsapp settings" ON public.whatsapp_settings
    FOR ALL USING (public.is_admin(auth.uid()));

-- Políticas para guardians (acesso próprio + admins)
CREATE POLICY "Users can view own guardian data" ON public.guardians
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage guardians" ON public.guardians
    FOR ALL USING (public.is_admin(auth.uid()));
