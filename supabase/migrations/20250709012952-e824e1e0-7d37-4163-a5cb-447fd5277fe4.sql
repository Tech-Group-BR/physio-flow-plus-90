-- Testar diferentes formatos de URL para a Evolution API
-- Vamos adicionar algumas configurações alternativas para teste

-- Atualizar com endpoint específico
UPDATE public.whatsapp_settings 
SET 
  base_url = 'https://zap.zapflow.click',
  api_url = 'https://zap.zapflow.click/message/sendText/livia',
  updated_at = now()
WHERE id = '7b5aaa32577d86a7778957722b932265';

-- Verificar se a instância está ativa
SELECT 
  instance_name,
  base_url,
  api_url,
  api_key,
  is_active
FROM whatsapp_settings 
WHERE is_active = true;