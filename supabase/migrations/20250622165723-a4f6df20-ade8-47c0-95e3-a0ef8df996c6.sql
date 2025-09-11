
-- Criar tabela para configurações do WhatsApp/EVOLUTION API
CREATE TABLE public.whatsapp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  base_url TEXT NOT NULL DEFAULT 'https://evolution-api.com',
  webhook_url TEXT,
  auto_confirm_enabled BOOLEAN NOT NULL DEFAULT true,
  confirmation_template TEXT NOT NULL DEFAULT 'Olá {nome}! Você tem consulta marcada para {data} às {horario} com {fisioterapeuta}. Confirme sua presença respondendo SIM.',
  reminder_template TEXT NOT NULL DEFAULT 'Lembrete: Sua consulta é amanhã ({data}) às {horario}. Compareça pontualmente!',
  followup_template TEXT NOT NULL DEFAULT 'Olá {nome}! Como você está se sentindo após a consulta? Lembre-se de seguir as orientações.',
  welcome_template TEXT NOT NULL DEFAULT 'Olá {nome}! Bem-vindo(a) à nossa clínica. Estamos aqui para cuidar da sua saúde!',
  reminder_hours_before INTEGER NOT NULL DEFAULT 2,
  confirmation_hours_before INTEGER NOT NULL DEFAULT 24,
  followup_hours_after INTEGER NOT NULL DEFAULT 24,
  welcome_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  followup_enabled BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos para controle de mensagens nos appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMP WITH TIME ZONE;

-- Criar tabela para logs de mensagens do WhatsApp
CREATE TABLE public.whatsapp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id),
  patient_phone TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('confirmation', 'reminder', 'followup', 'welcome')),
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  evolution_message_id TEXT,
  response_content TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_settings (apenas admins podem gerenciar)
CREATE POLICY "Admins can manage WhatsApp settings" 
  ON public.whatsapp_settings 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas RLS para whatsapp_logs (admins e fisioterapeutas podem ver)
CREATE POLICY "Staff can view WhatsApp logs" 
  ON public.whatsapp_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'physiotherapist')
    )
  );

CREATE POLICY "System can insert WhatsApp logs" 
  ON public.whatsapp_logs 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update WhatsApp logs" 
  ON public.whatsapp_logs 
  FOR UPDATE 
  USING (true);
