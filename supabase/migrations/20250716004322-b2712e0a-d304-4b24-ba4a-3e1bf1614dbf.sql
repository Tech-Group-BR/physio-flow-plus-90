-- Atualizar telefones dos pacientes para formato válido e corrigir configurações

-- Atualizar telefone do paciente exemplo para um número válido de teste
UPDATE patients 
SET phone = '66996525791'
WHERE phone = '(11) 99999-9999' OR full_name = 'Paciente Exemplo';

-- Verificar se as configurações do WhatsApp estão corretas
SELECT api_key, instance_name, base_url, confirmation_template 
FROM whatsapp_settings 
WHERE is_active = true;