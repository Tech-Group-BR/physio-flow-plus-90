-- Verificar se existe o perfil admin
SELECT * FROM profiles WHERE email = 'admin@sistema.com';

-- Criar perfil admin caso não exista
INSERT INTO profiles (id, email, full_name, role, is_active) 
SELECT 
    'bd37a4fa-3e8b-4c8a-8b85-8c8e8f8e8f8e',
    'admin@sistema.com',
    'Administrador do Sistema',
    'admin',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'admin@sistema.com'
);

-- Garantir que as políticas RLS estão corretas para appointments
UPDATE pg_policies SET qual = 'true' 
WHERE schemaname = 'public' 
AND tablename = 'appointments' 
AND policyname = 'Enable all operations for authenticated users';

-- Verificar se há agendamentos na base
SELECT COUNT(*) as total_appointments FROM appointments;

-- Listar agendamentos existentes
SELECT 
    id,
    patient_id,
    physiotherapist_id,
    date,
    time,
    status,
    treatment_type
FROM appointments 
ORDER BY date DESC, time DESC 
LIMIT 10;