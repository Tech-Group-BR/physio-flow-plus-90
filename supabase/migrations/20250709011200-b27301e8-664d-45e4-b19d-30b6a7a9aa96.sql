-- Adicionar campos para compatibilidade com as configurações de integração
-- Adicionar campos opcionais para flexibilidade na configuração
ALTER TABLE public.whatsapp_settings 
ADD COLUMN IF NOT EXISTS integration_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS api_url TEXT,
ADD COLUMN IF NOT EXISTS api_token TEXT;

-- Atualizar configurações existentes com valores padrão se existirem
UPDATE public.whatsapp_settings 
SET 
  integration_enabled = true,
  api_url = COALESCE(api_url, base_url),
  api_token = COALESCE(api_token, api_key)
WHERE id IS NOT NULL;