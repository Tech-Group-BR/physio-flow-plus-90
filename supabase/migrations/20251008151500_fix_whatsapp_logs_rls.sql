-- Alterar o enum permission_resource para trocar 'whatsapp' por 'confirmations'
ALTER TYPE permission_resource RENAME VALUE 'whatsapp' TO 'confirmations';

-- Atualizar as permissões existentes para usar o novo resource
UPDATE "public"."permissions" 
SET name = 'confirmations.manage', resource = 'confirmations', description = 'Gerenciar Confirmações WhatsApp'
WHERE name = 'whatsapp.manage';

UPDATE "public"."permissions" 
SET name = 'confirmations.read', resource = 'confirmations', description = 'Visualizar Confirmações WhatsApp'
WHERE name = 'whatsapp.read';

-- Atualizar presets de permissões que referenciam as permissões antigas do WhatsApp
UPDATE "public"."permission_presets" 
SET permission_id = (SELECT id FROM permissions WHERE name = 'confirmations.manage')
WHERE permission_id = (SELECT id FROM permissions WHERE name = 'whatsapp.manage');

UPDATE "public"."permission_presets" 
SET permission_id = (SELECT id FROM permissions WHERE name = 'confirmations.read')
WHERE permission_id = (SELECT id FROM permissions WHERE name = 'whatsapp.read');

-- Corrigir políticas RLS para whatsapp_logs
-- Remover todas as políticas antigas
DROP POLICY IF EXISTS "Staff can view WhatsApp logs" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "Admins can manage whatsapp logs" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "System can insert WhatsApp logs" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "System can update WhatsApp logs" ON public.whatsapp_logs;

-- Política para visualização - usuários podem ver logs da própria clínica
CREATE POLICY "Users can view confirmations logs from their clinic" ON public.whatsapp_logs
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            -- Usuários podem ver logs da própria clínica
            clinic_id IN (
                SELECT clinic_id FROM public.profiles 
                WHERE id = auth.uid()
            )
            OR
            -- Admins podem ver todos os logs
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Política para inserção (permissiva para edge functions)
CREATE POLICY "Allow insert confirmations logs" ON public.whatsapp_logs
    FOR INSERT WITH CHECK (true);

-- Política para atualização (permissiva para edge functions)  
CREATE POLICY "Allow update confirmations logs" ON public.whatsapp_logs
    FOR UPDATE USING (true);

-- Política para deleção (usuários da mesma clínica)
CREATE POLICY "Users can delete confirmations logs from their clinic" ON public.whatsapp_logs
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND (
            -- Usuários podem deletar logs da própria clínica
            clinic_id IN (
                SELECT clinic_id FROM public.profiles 
                WHERE id = auth.uid()
            )
            OR
            -- Admins podem deletar todos os logs
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );