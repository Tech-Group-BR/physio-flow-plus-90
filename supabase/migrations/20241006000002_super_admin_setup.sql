-- Query para definir usuário como SUPER ADMIN
-- Este usuário terá acesso a TODAS as clínicas e funcionalidades do sistema

-- 1. Primeiro, vamos encontrar o profile ID baseado no paciente
-- (assumindo que o usuário já tem um profile criado)

-- 2. Definir como SUPER ADMIN
UPDATE profiles 
SET role = 'super'
WHERE email = 'gustavoguimaraescamps@gmail.com';

-- OU se souber o ID do profile:
-- UPDATE profiles 
-- SET role = 'super'
-- WHERE id = 'SEU_PROFILE_ID_AQUI';

-- 3. Adicionar permissões específicas de SUPER ADMIN
-- Estas permissões só são visíveis e gerenciáveis por outros super admins

INSERT INTO permissions (name, resource, action, description) VALUES
-- Permissões globais de sistema (cross-clinic)
('system.manage_all_clinics', 'dashboard', 'manage', 'Acesso a todas as clínicas do sistema'),
('system.create_clinics', 'settings', 'create', 'Criar novas clínicas no sistema'),
('system.delete_clinics', 'settings', 'delete', 'Excluir clínicas do sistema'),
('system.view_global_stats', 'reports', 'read', 'Visualizar estatísticas globais do sistema'),
('system.manage_billing', 'financial', 'manage', 'Gerenciar cobrança e assinaturas das clínicas'),

-- Permissões de super administração
('superadmin.manage_users', 'settings', 'manage', 'Gerenciar usuários de todas as clínicas'),
('superadmin.manage_permissions', 'settings', 'manage', 'Gerenciar sistema de permissões'),
('superadmin.system_logs', 'reports', 'read', 'Acessar logs do sistema'),
('superadmin.database_access', 'settings', 'manage', 'Acesso direto ao banco de dados'),
('superadmin.backup_restore', 'settings', 'manage', 'Realizar backup e restore do sistema'),

-- Permissões de desenvolvimento
('dev.debug_mode', 'settings', 'manage', 'Ativar modo de debug'),
('dev.api_access', 'settings', 'manage', 'Acesso completo às APIs'),
('dev.system_maintenance', 'settings', 'manage', 'Colocar sistema em manutenção')
ON CONFLICT (name, resource, action) DO NOTHING;

-- 4. Criar preset específico para SUPER ADMIN (só visível para outros supers)
INSERT INTO permission_presets (role, permission_id)
SELECT 'super', id FROM permissions
WHERE NOT EXISTS (
  SELECT 1 FROM permission_presets pp 
  WHERE pp.role = 'super' AND pp.permission_id = permissions.id
);

-- 5. Função para verificar se usuário é SUPER ADMIN
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'super'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para super admin acessar qualquer clínica
CREATE OR REPLACE FUNCTION super_admin_clinic_access(user_id uuid)
RETURNS TABLE(clinic_id uuid, clinic_name text) AS $$
BEGIN
  -- Se é super admin, retorna todas as clínicas
  IF is_super_admin(user_id) THEN
    RETURN QUERY
    SELECT cs.id, cs.name
    FROM clinic_settings cs
    WHERE cs.is_active = true
    ORDER BY cs.name;
  ELSE
    -- Se não é super admin, retorna apenas sua clínica
    RETURN QUERY
    SELECT p.clinic_id, cs.name
    FROM profiles p
    JOIN clinic_settings cs ON cs.id = p.clinic_id
    WHERE p.id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Política RLS especial para super admins
-- Atualizar policies existentes para permitir acesso do super admin

-- Remover policies existentes se existirem
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Super admin can view all profiles') THEN
    DROP POLICY "Super admin can view all profiles" ON profiles;
  END IF;
END $$;

CREATE POLICY "Super admin can view all profiles" ON profiles FOR SELECT USING (
  is_super_admin(auth.uid()) OR clinic_id = (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- Política para clinic_settings (super admin vê todas as clínicas)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clinic_settings' AND policyname = 'Super admin can manage all clinics') THEN
    DROP POLICY "Super admin can manage all clinics" ON clinic_settings;
  END IF;
END $$;

CREATE POLICY "Super admin can manage all clinics" ON clinic_settings FOR ALL USING (
  is_super_admin(auth.uid()) OR id = (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  )
);

-- 8. View para super admin gerenciar sistema
DROP VIEW IF EXISTS super_admin_dashboard;
CREATE VIEW super_admin_dashboard AS
SELECT 
  -- Estatísticas globais
  (SELECT COUNT(*) FROM clinic_settings WHERE is_active = true) as total_clinics,
  (SELECT COUNT(*) FROM profiles WHERE is_active = true) as total_users,
  (SELECT COUNT(*) FROM patients) as total_patients,
  (SELECT COUNT(*) FROM appointments WHERE date >= CURRENT_DATE - INTERVAL '30 days') as appointments_last_30_days,
  
  -- Por clínica
  cs.id as clinic_id,
  cs.name as clinic_name,
  cs.created_at as clinic_created,
  (SELECT COUNT(*) FROM profiles WHERE clinic_id = cs.id) as clinic_users,
  (SELECT COUNT(*) FROM patients WHERE clinic_id = cs.id) as clinic_patients,
  (SELECT COUNT(*) FROM appointments WHERE clinic_id = cs.id AND date >= CURRENT_DATE - INTERVAL '30 days') as clinic_appointments
FROM clinic_settings cs
WHERE cs.is_active = true;

-- Política para a view (só super admins) - remover policy existente se houver
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clinic_settings' AND policyname = 'Only super admin can view dashboard') THEN
    DROP POLICY "Only super admin can view dashboard" ON clinic_settings;
  END IF;
END $$;

-- Não criar policy na view, mas sim garantir que as tabelas já tenham as policies corretas

-- 9. Atualizar função de verificação de permissões para incluir super admin
CREATE OR REPLACE FUNCTION user_has_permission(
  check_user_id uuid,
  permission_name text
)
RETURNS boolean AS $$
DECLARE
  has_permission boolean := false;
  user_role_val user_role;
BEGIN
  -- Super admin sempre tem todas as permissões
  IF is_super_admin(check_user_id) THEN
    RETURN true;
  END IF;
  
  -- Verificar permissão customizada
  SELECT EXISTS(
    SELECT 1 FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = check_user_id 
    AND p.name = permission_name
    AND up.granted = true
  ) INTO has_permission;
  
  -- Se não tem permissão customizada, verificar preset do role
  IF NOT has_permission THEN
    SELECT role INTO user_role_val FROM profiles WHERE id = check_user_id;
    
    SELECT EXISTS(
      SELECT 1 FROM permission_presets pp
      JOIN permissions p ON p.id = pp.permission_id
      WHERE pp.role = user_role_val 
      AND p.name = permission_name
    ) INTO has_permission;
  END IF;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 11. Log da operação (comentado para evitar conflitos)
-- INSERT INTO clinic_settings (name, email, created_at, clinic_code) 
-- VALUES ('SUPER_ADMIN_LOG', 'system@physioflow.com', now(), 'SYS_LOG')
-- ON CONFLICT DO NOTHING;

-- Verificar se o usuário foi criado corretamente
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.clinic_id,
  cs.name as clinic_name
FROM profiles p
LEFT JOIN clinic_settings cs ON cs.id = p.clinic_id
WHERE p.email = 'gustavoguimaraescamps@gmail.com';