-- Adicionar o tipo 'response_received' à constraint da tabela whatsapp_logs
ALTER TABLE public.whatsapp_logs DROP CONSTRAINT IF EXISTS whatsapp_logs_message_type_check;

-- Adicionar nova constraint incluindo 'response_received'
ALTER TABLE public.whatsapp_logs ADD CONSTRAINT whatsapp_logs_message_type_check 
CHECK (message_type IN (
  'confirmation', 
  'reminder', 
  'followup', 
  'welcome',
  'notification',
  'confirmation_response',
  'cancellation_response', 
  'unknown_response',
  'response_received'
)); 