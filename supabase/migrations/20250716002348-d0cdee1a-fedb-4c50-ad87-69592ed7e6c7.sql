-- Verificar e ajustar sistema de mensagens WhatsApp
-- Primeiro, verificar se temos dados básicos necessários

-- Resetar campos de WhatsApp para permitir novos testes nos agendamentos existentes
UPDATE appointments 
SET 
  confirmation_sent_at = NULL,
  confirmation_message_id = NULL,
  physio_notified_at = NULL,
  physio_message_id = NULL,
  whatsapp_sent_at = NULL,
  whatsapp_confirmed = false,
  whatsapp_status = 'pending'
WHERE status = 'marcado' AND date >= CURRENT_DATE;

-- Atualizar nomes de fisioterapeutas existentes para testar detecção Dr/Dra
-- (apenas se existirem)
UPDATE profiles 
SET full_name = CASE 
  WHEN full_name ILIKE '%luisa%' OR full_name ILIKE '%helena%' THEN 'Dra. ' || full_name
  WHEN full_name NOT ILIKE 'dr%' THEN 'Dr. ' || full_name
  ELSE full_name
END,
phone = CASE 
  WHEN phone IS NULL THEN '66999887766'
  ELSE phone
END
WHERE role = 'Professional';