-- Corrigir a constraint da tabela whatsapp_logs para aceitar todos os tipos de mensagem
ALTER TABLE public.whatsapp_logs DROP CONSTRAINT IF EXISTS whatsapp_logs_message_type_check;

-- Adicionar nova constraint mais permissiva
ALTER TABLE public.whatsapp_logs ADD CONSTRAINT whatsapp_logs_message_type_check 
CHECK (message_type IN (
  'confirmation', 
  'reminder', 
  'followup', 
  'welcome',
  'notification',
  'confirmation_response',
  'cancellation_response', 
  'unknown_response'
));