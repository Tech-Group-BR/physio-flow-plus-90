-- Corrigir a URL do WhatsApp para remover o endpoint duplicado
UPDATE public.whatsapp_settings 
SET base_url = 'https://zap.zapflow.click'
WHERE base_url LIKE '%/message/sendText/%';