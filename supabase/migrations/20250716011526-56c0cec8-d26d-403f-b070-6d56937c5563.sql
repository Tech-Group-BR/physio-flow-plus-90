-- Criar um agendamento completo para testar todas as informações na agenda
INSERT INTO appointments (
  patient_id,
  physiotherapist_id,
  room_id,
  date,
  time,
  status,
  treatment_type,
  duration,
  notes,
  confirmation_sent_at,
  confirmation_message_id,
  physio_notified_at,
  physio_message_id,
  whatsapp_confirmed,
  patient_confirmed_at
) VALUES (
  (SELECT id FROM patients WHERE phone = '66996525791' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'physiotherapist' AND phone IS NOT NULL LIMIT 1),
  (SELECT id FROM rooms LIMIT 1),
  CURRENT_DATE + INTERVAL '1 day',
  '15:30:00',
  'confirmado',
  'Fisioterapia Respiratória Completa',
  90,
  'Paciente com histórico de bronquite. Usar exercícios específicos para fortalecimento diafragmático.',
  NOW() - INTERVAL '2 hours',
  'TEST_MSG_COMPLETE_001',
  NOW() - INTERVAL '1 hour 50 minutes',
  'TEST_PHYSIO_MSG_001',
  true,
  NOW() - INTERVAL '1 hour 30 minutes'
);

-- Verificar se foi criado corretamente
SELECT 
  a.id,
  a.status,
  a.whatsapp_confirmed,
  a.treatment_type,
  a.duration,
  a.notes,
  a.confirmation_sent_at,
  a.physio_notified_at,
  a.patient_confirmed_at,
  p.full_name as patient_name,
  pr.full_name as physio_name,
  r.name as room_name
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN profiles pr ON a.physiotherapist_id = pr.id
LEFT JOIN rooms r ON a.room_id = r.id
WHERE a.notes LIKE '%bronquite%';