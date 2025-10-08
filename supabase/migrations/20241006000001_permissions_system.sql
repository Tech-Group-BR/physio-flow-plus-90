-- Sistema de Permissões Customizáveis
-- Permite permissões por usuário com presets por role

-- Enum para resources e actions
CREATE TYPE permission_resource AS ENUM (
  'patients', 'professionals', 'appointments', 'settings', 
  'financial', 'reports', 'whatsapp', 'dashboard'
);

CREATE TYPE permission_action AS ENUM (
  'create', 'read', 'update', 'delete', 'manage'
);

-- Tabela de permissões disponíveis
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL, -- ex: 'patients.create', 'settings.manage'
  resource permission_resource NOT NULL,
  action permission_action NOT NULL,
  description text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela de presets de permissões por role
CREATE TABLE IF NOT EXISTS permission_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  is_default boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(role, permission_id)
);

-- Tabela de permissões customizadas por usuário
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  granted boolean NOT NULL DEFAULT true,
  granted_by uuid REFERENCES profiles(id),
  granted_at timestamp with time zone DEFAULT now(),
  clinic_id uuid REFERENCES clinic_settings(id) ON DELETE CASCADE,
  
  UNIQUE(user_id, permission_id)
);

-- Inserir permissões básicas
INSERT INTO permissions (name, resource, action, description) VALUES
-- Pacientes
('patients.create', 'patients', 'create', 'Criar novos pacientes'),
('patients.read', 'patients', 'read', 'Visualizar lista e detalhes de pacientes'),
('patients.update', 'patients', 'update', 'Editar informações de pacientes'),
('patients.delete', 'patients', 'delete', 'Excluir pacientes'),
('patients.manage', 'patients', 'manage', 'Acesso completo a pacientes'),

-- Profissionais
('professionals.create', 'professionals', 'create', 'Criar novos profissionais'),
('professionals.read', 'professionals', 'read', 'Visualizar lista e detalhes de profissionais'),
('professionals.update', 'professionals', 'update', 'Editar informações de profissionais'),
('professionals.delete', 'professionals', 'delete', 'Excluir profissionais'),
('professionals.manage', 'professionals', 'manage', 'Acesso completo a profissionais'),

-- Agendamentos
('appointments.create', 'appointments', 'create', 'Criar novos agendamentos'),
('appointments.read', 'appointments', 'read', 'Visualizar agenda e agendamentos'),
('appointments.update', 'appointments', 'update', 'Editar agendamentos'),
('appointments.delete', 'appointments', 'delete', 'Cancelar agendamentos'),
('appointments.manage', 'appointments', 'manage', 'Acesso completo à agenda'),

-- Financeiro
('financial.create', 'financial', 'create', 'Criar lançamentos financeiros'),
('financial.read', 'financial', 'read', 'Visualizar relatórios financeiros'),
('financial.update', 'financial', 'update', 'Editar lançamentos financeiros'),
('financial.delete', 'financial', 'delete', 'Excluir lançamentos financeiros'),
('financial.manage', 'financial', 'manage', 'Acesso completo ao financeiro'),

-- Configurações
('settings.read', 'settings', 'read', 'Visualizar configurações'),
('settings.update', 'settings', 'update', 'Editar configurações básicas'),
('settings.manage', 'settings', 'manage', 'Acesso completo às configurações'),

-- Relatórios
('reports.read', 'reports', 'read', 'Visualizar relatórios'),
('reports.manage', 'reports', 'manage', 'Acesso completo aos relatórios'),

-- WhatsApp
('whatsapp.read', 'whatsapp', 'read', 'Visualizar configurações WhatsApp'),
('whatsapp.manage', 'whatsapp', 'manage', 'Gerenciar WhatsApp'),

-- Dashboard
('dashboard.read', 'dashboard', 'read', 'Visualizar dashboard');

-- Presets para ADMIN (acesso quase total)
INSERT INTO permission_presets (role, permission_id)
SELECT 'admin', id FROM permissions 
WHERE name IN (
  'patients.manage', 'professionals.manage', 'appointments.manage',
  'financial.manage', 'settings.update', 'reports.read', 
  'whatsapp.read', 'dashboard.read'
);

-- Presets para PROFESSIONAL (foco em pacientes e agenda)
INSERT INTO permission_presets (role, permission_id)
SELECT 'professional', id FROM permissions 
WHERE name IN (
  'patients.read', 'patients.update', 'appointments.read', 
  'appointments.create', 'appointments.update', 'financial.read',
  'dashboard.read'
);

-- Presets para RECEPTIONIST (foco em agenda e atendimento)
INSERT INTO permission_presets (role, permission_id)
SELECT 'receptionist', id FROM permissions 
WHERE name IN (
  'patients.create', 'patients.read', 'patients.update',
  'appointments.manage', 'financial.read', 'dashboard.read'
);

-- Presets para GUARDIAN (acesso limitado)
INSERT INTO permission_presets (role, permission_id)
SELECT 'guardian', id FROM permissions 
WHERE name IN ('dashboard.read');

-- Presets para SUPER (acesso total)
INSERT INTO permission_presets (role, permission_id)
SELECT 'super', id FROM permissions;

-- Função para aplicar preset de permissões a um usuário
CREATE OR REPLACE FUNCTION apply_role_preset_permissions(
  target_user_id uuid,
  target_role user_role,
  granted_by_user_id uuid
)
RETURNS void AS $$
BEGIN
  -- Limpar permissões existentes
  DELETE FROM user_permissions WHERE user_id = target_user_id;
  
  -- Aplicar preset do role
  INSERT INTO user_permissions (user_id, permission_id, granted_by, clinic_id)
  SELECT 
    target_user_id,
    pp.permission_id,
    granted_by_user_id,
    p.clinic_id
  FROM permission_presets pp
  JOIN profiles p ON p.id = target_user_id
  WHERE pp.role = target_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário tem permissão
CREATE OR REPLACE FUNCTION user_has_permission(
  check_user_id uuid,
  permission_name text
)
RETURNS boolean AS $$
DECLARE
  has_permission boolean := false;
  user_role_val user_role;
BEGIN
  -- Primeiro, verificar permissão customizada
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permission_presets_role ON permission_presets(role);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);

-- RLS Policies
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Policies para permissions (todos podem ler)
CREATE POLICY "Everyone can read permissions" ON permissions FOR SELECT USING (true);

-- Policies para permission_presets (todos podem ler)
CREATE POLICY "Everyone can read permission presets" ON permission_presets FOR SELECT USING (true);

-- Policies para user_permissions (usuários podem ver suas próprias + admins podem ver todas da clínica)
CREATE POLICY "Users can read own permissions" ON user_permissions FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super')
    AND clinic_id = user_permissions.clinic_id
  )
);

CREATE POLICY "Admins can manage user permissions" ON user_permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super')
    AND clinic_id = user_permissions.clinic_id
  )
);