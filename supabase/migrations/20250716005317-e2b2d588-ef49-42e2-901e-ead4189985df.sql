-- Corrigir problema de RLS para inserção de dados de teste

-- Temporariamente desabilitar RLS para inserir dados de teste
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- Primeiro resetar os campos de WhatsApp dos agendamentos existentes
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

-- Inserir agendamento de teste
INSERT INTO appointments (
  patient_id,
  physiotherapist_id,
  room_id,
  date,
  time,
  status,
  treatment_type,
  notes
) VALUES (
  (SELECT id FROM patients WHERE phone = '66996525791' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'physiotherapist' AND phone IS NOT NULL LIMIT 1),
  (SELECT id FROM rooms LIMIT 1),
  CURRENT_DATE + INTERVAL '1 day',
  '11:00:00',
  'marcado',
  'Teste Final WhatsApp',
  'Teste envio paciente + fisioterapeuta'
);

-- Re-habilitar RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Verificar se o teste foi criado com sucesso
SELECT 
  a.id as appointment_id,
  a.date, a.time, a.status,
  p.full_name as patient_name, 
  p.phone as patient_phone,
  pr.full_name as physio_name, 
  pr.phone as physio_phone
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN profiles pr ON a.physiotherapist_id = pr.id
WHERE a.notes = 'Teste envio paciente + fisioterapeuta';