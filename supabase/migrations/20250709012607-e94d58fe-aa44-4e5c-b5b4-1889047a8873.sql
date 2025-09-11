-- Inserir dados de teste se não existirem

-- Inserir perfil de fisioterapeuta se não existir
INSERT INTO public.profiles (id, full_name, email, role, phone, crefito, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Dr. Teste Fisioterapeuta',
  'fisio@teste.com',
  'physiotherapist',
  '11999999999',
  'CREFITO-123456',
  true
) ON CONFLICT (id) DO NOTHING;

-- Inserir paciente de teste se não existir
INSERT INTO public.patients (id, full_name, phone, email, cpf, birth_date, gender, is_active, session_value)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Paciente Teste WhatsApp',
  '11987654321',
  'paciente@teste.com',
  '12345678901',
  '1990-01-01',
  'male',
  true,
  100.00
) ON CONFLICT (id) DO NOTHING;

-- Inserir agendamento de teste para hoje se não existir
INSERT INTO public.appointments (id, patient_id, physiotherapist_id, date, time, status, treatment_type)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE,
  '15:00:00',
  'marcado',
  'Fisioterapia'
) ON CONFLICT (id) DO NOTHING;