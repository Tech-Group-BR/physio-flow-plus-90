
-- Atualizar tabela whatsapp_settings para Evolution API
ALTER TABLE public.whatsapp_settings 
ADD COLUMN IF NOT EXISTS integration_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS api_url TEXT,
ADD COLUMN IF NOT EXISTS api_token TEXT;

-- Atualizar comentários
COMMENT ON COLUMN public.whatsapp_settings.integration_enabled IS 'Se a integração Evolution API está habilitada';
COMMENT ON COLUMN public.whatsapp_settings.api_url IS 'URL da Evolution API';
COMMENT ON COLUMN public.whatsapp_settings.api_token IS 'Token de acesso da Evolution API';

-- Atualizar template padrão para Evolution API
UPDATE public.whatsapp_settings 
SET base_url = 'https://evolution-api.com/api/v1'
WHERE base_url = 'https://evolution-api.com';
