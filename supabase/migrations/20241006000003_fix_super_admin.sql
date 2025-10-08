-- Script simplificado para corrigir setup do super admin
-- Este script é seguro para executar múltiplas vezes

-- 1. Definir usuário como SUPER ADMIN (seguro executar múltiplas vezes)
UPDATE profiles 
SET role = 'super'
WHERE email = 'gustavoguimaraescamps@gmail.com';

-- 2. Adicionar permissões específicas apenas se não existirem
INSERT INTO permissions (name, resource, action, description) VALUES
('system.manage_all_clinics', 'dashboard', 'manage', 'Acesso a todas as clínicas do sistema'),
('system.create_clinics', 'settings', 'create', 'Criar novas clínicas no sistema'),
('system.delete_clinics', 'settings', 'delete', 'Excluir clínicas do sistema'),
('system.view_global_stats', 'reports', 'read', 'Visualizar estatísticas globais do sistema'),
('system.manage_billing', 'financial', 'manage', 'Gerenciar cobrança e assinaturas das clínicas'),
('superadmin.manage_users', 'settings', 'manage', 'Gerenciar usuários de todas as clínicas'),
('superadmin.manage_permissions', 'settings', 'manage', 'Gerenciar sistema de permissões'),
('superadmin.system_logs', 'reports', 'read', 'Acessar logs do sistema'),
('superadmin.database_access', 'settings', 'manage', 'Acesso direto ao banco de dados'),
('superadmin.backup_restore', 'settings', 'manage', 'Realizar backup e restore do sistema'),
('dev.debug_mode', 'settings', 'manage', 'Ativar modo de debug'),
('dev.api_access', 'settings', 'manage', 'Acesso completo às APIs'),
('dev.system_maintenance', 'settings', 'manage', 'Colocar sistema em manutenção')
ON CONFLICT (name, resource, action) DO NOTHING;

-- 3. Associar todas as permissões ao role super (evitando duplicatas)
INSERT INTO permission_presets (role, permission_id)
SELECT 'super', p.id 
FROM permissions p
WHERE NOT EXISTS (
  SELECT 1 FROM permission_presets pp 
  WHERE pp.role = 'super' AND pp.permission_id = p.id
);

-- 4. Verificar o resultado
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.clinic_id,
  cs.name as clinic_name,
  (SELECT COUNT(*) FROM permission_presets WHERE role = 'super') as total_permissions
FROM profiles p
LEFT JOIN clinic_settings cs ON cs.id = p.clinic_id
WHERE p.email = 'gustavoguimaraescamps@gmail.com';