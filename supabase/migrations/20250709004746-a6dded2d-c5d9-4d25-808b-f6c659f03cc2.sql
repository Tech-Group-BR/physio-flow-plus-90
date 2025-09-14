-- Buscar o ID do usuário admin existente
SELECT 
    au.id as user_id,
    au.email,
    p.id as profile_id,
    p.full_name,
    p.role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@sistema.com';

-- Criar perfil para o usuário admin com o ID correto
INSERT INTO profiles (id, email, full_name, role, is_active) 
SELECT 
    au.id,
    au.email,
    'Administrador do Sistema',
    'admin',
    true
FROM auth.users au
WHERE au.email = 'admin@sistema.com'
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = au.id
  );

-- Verificar agendamentos na base
SELECT COUNT(*) as total_appointments FROM appointments;

-- Listar agendamentos existentes para debug
SELECT 
    a.id,
    a.patient_id,
    a.professional_id,
    a.date,
    a.time,
    a.status,
    a.treatment_type,
    p.full_name as patient_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
ORDER BY a.date DESC, a.time DESC 
LIMIT 10;