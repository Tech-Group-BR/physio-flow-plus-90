-- Inserir dados de teste nos profiles (admin já existe no auth)
INSERT INTO public.profiles (id, full_name, email, phone, role, is_active) 
VALUES ('efd08c24-0144-42a2-874c-3468d04da2a5', 'Administrador do Sistema', 'admin@sistema.com', '(66) 99999-9999', 'admin', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

-- Inserir fisioterapeuta de teste
INSERT INTO public.profiles (id, full_name, email, phone, role, crefito, specialties, is_active) 
VALUES ('00000000-0000-0000-0000-000000000002', 'Dr. Maria Silva', 'maria@clinica.com', '(66) 98888-8888', 'physiotherapist', 'CREFITO-8 12345', ARRAY['Ortopedia', 'Neurologia'], true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    crefito = EXCLUDED.crefito,
    specialties = EXCLUDED.specialties;

-- Inserir responsável de teste
INSERT INTO public.profiles (id, full_name, email, phone, role, is_active) 
VALUES ('00000000-0000-0000-0000-000000000003', 'João Santos', 'joao@email.com', '(66) 97777-7777', 'guardian', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

-- Inserir salas de teste
INSERT INTO public.rooms (id, name, capacity, equipment) 
VALUES 
    ('00000000-0000-0000-0000-000000000011', 'Sala 1', 1, ARRAY['Maca', 'Aparelho de ultrassom']),
    ('00000000-0000-0000-0000-000000000012', 'Sala 2', 2, ARRAY['Tatame', 'Bolas de pilates'])
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    capacity = EXCLUDED.capacity,
    equipment = EXCLUDED.equipment;

-- Inserir pacientes de teste
INSERT INTO public.patients (id, full_name, phone, email, birth_date, gender, session_value, guardian_id) 
VALUES 
    ('00000000-0000-0000-0000-000000000021', 'Ana Costa', '(66) 96666-6666', 'ana@email.com', '1990-05-15', 'feminino', 80.00, null),
    ('00000000-0000-0000-0000-000000000022', 'Pedro Silva', '(66) 95555-5555', 'pedro@email.com', '2010-08-20', 'masculino', 60.00, '00000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    session_value = EXCLUDED.session_value;

-- Inserir leads de teste
INSERT INTO public.leads (id, name, phone, email, source, status, assigned_to) 
VALUES 
    ('00000000-0000-0000-0000-000000000031', 'Carlos Lima', '(66) 94444-4444', 'carlos@email.com', 'Site', 'novo', '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000032', 'Fernanda Oliveira', '(66) 93333-3333', 'fernanda@email.com', 'Indicação', 'contatado', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    status = EXCLUDED.status;

-- Inserir agendamentos de teste
INSERT INTO public.appointments (id, patient_id, physiotherapist_id, room_id, date, time, status) 
VALUES 
    ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', CURRENT_DATE + INTERVAL '1 day', '09:00', 'marcado'),
    ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012', CURRENT_DATE + INTERVAL '2 days', '14:00', 'confirmado')
ON CONFLICT (id) DO UPDATE SET 
    date = EXCLUDED.date,
    time = EXCLUDED.time,
    status = EXCLUDED.status;

-- Inserir configuração WhatsApp de teste
INSERT INTO public.whatsapp_settings (id, instance_name, api_key, base_url, auto_confirm_enabled, is_active) 
VALUES ('00000000-0000-0000-0000-000000000051', 'clinica-instance', 'test-api-key', 'https://evolution-api.com', true, false)
ON CONFLICT (id) DO UPDATE SET 
    instance_name = EXCLUDED.instance_name,
    auto_confirm_enabled = EXCLUDED.auto_confirm_enabled;