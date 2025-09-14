-- Criar agendamentos de teste e simular confirmações WhatsApp

-- Criar um agendamento para testar confirmação
INSERT INTO appointments (
  patient_id,
  professional_id,
  room_id,
  date,
  time,
  status,
  treatment_type,
  notes
) VALUES (
  (SELECT id FROM patients LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'Professional' LIMIT 1),
  (SELECT id FROM rooms LIMIT 1),
  CURRENT_DATE + INTERVAL '1 day',
  '10:00:00',
  'marcado',
  'Teste de Confirmação',
  'Teste automação WhatsApp - SIM'
);

-- Criar outro agendamento para testar cancelamento
INSERT INTO appointments (
  patient_id,
  professional_id,
  room_id,
  date,
  time,
  status,
  treatment_type,
  notes
) VALUES (
  (SELECT id FROM patients LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'Professional' LIMIT 1),
  (SELECT id FROM rooms LIMIT 1),
  CURRENT_DATE + INTERVAL '1 day',
  '14:00:00',
  'marcado',
  'Teste de Cancelamento',
  'Teste automação WhatsApp - NÃO'
);