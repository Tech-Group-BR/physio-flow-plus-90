-- Corrigir configurações do WhatsApp que estão com URL incorreta
-- A URL base deve ser apenas o domínio, sem o endpoint completo

UPDATE public.whatsapp_settings 
SET 
  base_url = 'https://zap.zapflow.click',
  instance_name = 'livia',
  api_key = '7b5aaa32577d86a7778957722b932265',
  is_active = true,
  updated_at = now()
WHERE is_active = true;

-- Verificar se as configurações foram corrigidas
SELECT 
  instance_name,
  base_url,
  api_key,
  is_active,
  updated_at
FROM whatsapp_settings 
WHERE is_active = true; 