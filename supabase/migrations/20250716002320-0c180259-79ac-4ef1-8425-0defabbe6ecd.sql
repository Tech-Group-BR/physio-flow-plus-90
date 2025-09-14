-- Atualizar fisioterapeutas existentes para testar detecção de gênero Dr/Dra
-- Vamos usar os fisioterapeutas que já existem no sistema

-- Atualizar alguns fisioterapeutas para ter nomes que identifiquem gênero
UPDATE profiles 
SET full_name = 'Dr. João Silva'
WHERE role = 'Professional' 
  AND id = (SELECT id FROM profiles WHERE role = 'Professional' ORDER BY created_at LIMIT 1);

UPDATE profiles 
SET full_name = 'Dra. Maria Santos'
WHERE role = 'Professional' 
  AND id = (SELECT id FROM profiles WHERE role = 'Professional' ORDER BY created_at OFFSET 1 LIMIT 1);

-- Garantir que têm números de telefone para receber mensagens
UPDATE profiles 
SET phone = '66999887766'
WHERE full_name = 'Dr. João Silva';

UPDATE profiles 
SET phone = '66988776655'
WHERE full_name = 'Dra. Maria Santos';

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
-- Agendamento com Dra. Maria (mulher)
(
  (SELECT id FROM patients LIMIT 1),
  (SELECT id FROM profiles WHERE full_name LIKE '%Maria%' AND role = 'Professional' LIMIT 1),
  (SELECT id FROM rooms LIMIT 1),
  CURRENT_DATE,
  '17:30:00',
  'marcado',
  'Fisioterapia Respiratória',
  'Teste WhatsApp - Dra Maria'
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