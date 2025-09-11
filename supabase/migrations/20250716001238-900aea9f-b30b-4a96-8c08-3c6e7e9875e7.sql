-- Criar agendamentos de teste para hoje e amanhã para demonstrar o funcionamento do WhatsApp
INSERT INTO appointments (
  patient_id,
  physiotherapist_id,
  room_id,
  date,
  time,
  status,
  treatment_type,
  notes
) VALUES 
-- Agendamento para hoje (teste de lembrete)
(
  (SELECT id FROM patients LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'physiotherapist' LIMIT 1),
  (SELECT id FROM rooms LIMIT 1),
  CURRENT_DATE,
  '14:00:00',
  'marcado',
  'fisioterapia',
  'Teste de envio WhatsApp - hoje'
),
-- Agendamento para amanhã (teste de confirmação)
(
  (SELECT id FROM patients LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'physiotherapist' LIMIT 1),
  (SELECT id FROM rooms LIMIT 1),
  CURRENT_DATE + INTERVAL '1 day',
  '09:00:00',
  'marcado',
  'fisioterapia',
  'Teste de envio WhatsApp - amanhã'
),
-- Agendamento para amanhã (teste de confirmação 2)
(
  (SELECT id FROM patients LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'physiotherapist' LIMIT 1),
  (SELECT id FROM rooms LIMIT 1),
  CURRENT_DATE + INTERVAL '1 day',
  '15:30:00',
  'marcado',
  'fisioterapia',
  'Teste de envio WhatsApp - amanhã 2'
);

-- Resetar campos de WhatsApp para permitir novos testes
UPDATE appointments 
SET 
  confirmation_sent_at = NULL,
  confirmation_message_id = NULL,
  physio_notified_at = NULL,
  physio_message_id = NULL,
  whatsapp_sent_at = NULL,
  whatsapp_confirmed = false
WHERE status = 'marcado';