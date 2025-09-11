-- Teste completo do sistema WhatsApp
-- Primeiro vamos simular o envio de confirmação para o paciente
DO $$
DECLARE
  test_appointment_id UUID := 'c2e69d98-1ab7-4277-bdf8-464fb4975260';
BEGIN
  -- Atualizar status para simular que foi enviado WhatsApp
  UPDATE appointments 
  SET 
    confirmation_sent_at = NOW(),
    confirmation_message_id = 'TEST_MSG_001',
    whatsapp_sent_at = NOW(),
    whatsapp_status = 'sent'
  WHERE id = test_appointment_id;
  
  RAISE NOTICE 'Teste: WhatsApp simulado como enviado para o paciente';
END $$;

-- Testar função de confirmação com SIM
SELECT process_whatsapp_confirmation(
  '66996525791',
  'SIM',
  'TEST_EVOLUTION_001'
) as resultado_confirmacao;

-- Verificar resultado
SELECT 
  id,
  status,
  whatsapp_confirmed,
  patient_confirmed_at,
  physio_notified_at
FROM appointments 
WHERE id = 'c2e69d98-1ab7-4277-bdf8-464fb4975260';