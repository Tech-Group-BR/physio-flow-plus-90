-- Remover políticas existentes e recriar
DROP POLICY IF EXISTS "Authenticated users can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can manage patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can manage medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Authenticated users can manage evolutions" ON public.evolutions;
DROP POLICY IF EXISTS "Authenticated users can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can manage accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Authenticated users can manage accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Authenticated users can manage guardians" ON public.guardians;
DROP POLICY IF EXISTS "Admins can manage WhatsApp settings" ON public.whatsapp_settings;
DROP POLICY IF EXISTS "Service role can access whatsapp_settings" ON public.whatsapp_settings;
DROP POLICY IF EXISTS "Staff can view WhatsApp logs" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "Service role can manage whatsapp_logs" ON public.whatsapp_logs;

-- Criar políticas RLS básicas para acesso autenticado
CREATE POLICY "Authenticated users can manage profiles" ON public.profiles FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage patients" ON public.patients FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage rooms" ON public.rooms FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage appointments" ON public.appointments FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage medical records" ON public.medical_records FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage evolutions" ON public.evolutions FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage leads" ON public.leads FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage payments" ON public.payments FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage accounts receivable" ON public.accounts_receivable FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage accounts payable" ON public.accounts_payable FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage guardians" ON public.guardians FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Políticas específicas para WhatsApp
CREATE POLICY "Admins can manage WhatsApp settings" ON public.whatsapp_settings FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Service role can access whatsapp_settings" ON public.whatsapp_settings FOR ALL TO service_role USING (true);

CREATE POLICY "Staff can view WhatsApp logs" ON public.whatsapp_logs FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'Professional'))
);

CREATE POLICY "Service role can manage whatsapp_logs" ON public.whatsapp_logs FOR ALL TO service_role USING (true);