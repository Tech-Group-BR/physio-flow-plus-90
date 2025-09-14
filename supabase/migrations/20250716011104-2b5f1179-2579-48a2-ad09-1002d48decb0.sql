-- SCRIPT FINAL DE TESTES - SISTEMA WHATSAPP COMPLETO

-- 1. Simular confirmação de um agendamento
UPDATE appointments 
SET status = 'confirmado', 
    whatsapp_confirmed = true,
    patient_confirmed_at = NOW()
WHERE id = 'c2e69d98-1ab7-4277-bdf8-464fb4975260';

-- 2. Simular cancelamento de outro agendamento  
UPDATE appointments 
SET status = 'cancelado', 
    whatsapp_confirmed = false
WHERE id = '3be40d56-552d-4e18-89ae-03983b2798af';

-- 3. Criar um agendamento faltante para testar cor vermelha
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
  (SELECT id FROM patients WHERE phone = '66996525791' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'Professional' AND phone IS NOT NULL LIMIT 1),
  (SELECT id FROM rooms LIMIT 1),
  CURRENT_DATE,
  '14:00:00',
  'faltante',
  'Teste Cores - Vermelho',
  'Teste cor vermelha para falta'
);

-- 4. Verificar resultado final das cores
SELECT 
  a.id,
  a.status,
  a.whatsapp_confirmed,
  a.date,
  a.time,
  a.notes,
  CASE 
    WHEN a.status = 'confirmado' THEN '🟢 VERDE - CONFIRMADO'
    WHEN a.status = 'cancelado' THEN '🔴 VERMELHO - CANCELADO'
    WHEN a.status = 'faltante' THEN '🔴 VERMELHO - FALTANTE'
    WHEN a.status = 'marcado' THEN '🔵 AZUL - MARCADO'
    ELSE '⚪ OUTRO'
  END as cor_esperada
FROM appointments a
WHERE a.notes LIKE '%Teste%'
ORDER BY a.status;