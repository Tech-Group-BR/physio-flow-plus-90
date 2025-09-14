-- Testar sistema de mensagens WhatsApp com diferentes cenários
-- Criar agendamentos de teste com fisioterapeutas homens e mulheres

-- Primeiro, vamos garantir que temos fisioterapeutas com nomes que identifiquem gênero
INSERT INTO profiles (id, full_name, email, phone, role) VALUES 
(gen_random_uuid(), 'Dr. João Silva', 'joao@clinica.com', '66999887766', 'Professional'),
(gen_random_uuid(), 'Dra. Ana Santos', 'ana@clinica.com', '66988776655', 'Professional')
ON CONFLICT (id) DO NOTHING;

-- Criar agendamentos de teste para hoje com fisioterapeutas diferentes
INSERT INTO appointments (
  patient_id,
  professional_id,
  room_id,
  date,
  time,
  status,
  treatment_type,
  notes
) VALUES 
-- Agendamento com Dr. João (homem)
(
  (SELECT id FROM patients LIMIT 1),
  (SELECT id FROM profiles WHERE full_name LIKE '%João%' AND role = 'Professional' LIMIT 1),
  (SELECT id FROM rooms LIMIT 1),
  CURRENT_DATE,
  '16:00:00',
  'marcado',
  'Fisioterapia Ortopédica',
  'Teste WhatsApp - Dr João'
),
-- Agendamento com Dra. Ana (mulher)
(
  (SELECT id FROM patients LIMIT 1),
  (SELECT id FROM profiles WHERE full_name LIKE '%Ana%' AND role = 'Professional' LIMIT 1),
  (SELECT id FROM rooms LIMIT 1),
  CURRENT_DATE,
  '17:30:00',
  'marcado',
  'Fisioterapia Respiratória',
  'Teste WhatsApp - Dra Ana'
);

-- Resetar campos de WhatsApp para permitir novos testes
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