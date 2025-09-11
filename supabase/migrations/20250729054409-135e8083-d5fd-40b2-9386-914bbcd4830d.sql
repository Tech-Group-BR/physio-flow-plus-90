
UPDATE public.whatsapp_settings 
SET 
  base_url = 'https://zap.zapflow.click',
  instance_name = 'livia',
  api_key = '7b5aaa32577d86a7778957722b932265',
  is_active = true,
  updated_at = now()
WHERE is_active = true;
