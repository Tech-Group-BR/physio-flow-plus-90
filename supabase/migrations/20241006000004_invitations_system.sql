-- Migração para sistema de convites e ajustes de permissões
-- Cria tabela de convites e trigger para auto-admin

-- 1. Tabela de convites por email
CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinic_settings(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES profiles(id),
  role user_role DEFAULT 'professional',
  permissions jsonb DEFAULT '[]'::jsonb, -- Array de permission IDs específicas
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone,
  
  UNIQUE(clinic_id, email)
);

-- RLS para user_invitations
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations from their clinic" ON user_invitations FOR SELECT USING (
  clinic_id = (SELECT clinic_id FROM profiles WHERE id = auth.uid())
  OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'super')
);

CREATE POLICY "Admins can manage invitations" ON user_invitations FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super')
  AND (clinic_id = (SELECT clinic_id FROM profiles WHERE id = auth.uid()) OR 
       (SELECT role FROM profiles WHERE id = auth.uid()) = 'super')
);

-- 2. Função para aplicar permissões ao aceitar convite
CREATE OR REPLACE FUNCTION apply_invitation_permissions(
  user_id uuid,
  invitation_id uuid
) RETURNS void AS $$
DECLARE
  invitation_record user_invitations%ROWTYPE;
  perm_id uuid;
BEGIN
  -- Buscar convite
  SELECT * INTO invitation_record 
  FROM user_invitations 
  WHERE id = invitation_id AND status = 'pending' AND expires_at > now();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;
  
  -- Atualizar perfil do usuário
  UPDATE profiles 
  SET 
    clinic_id = invitation_record.clinic_id,
    role = invitation_record.role
  WHERE id = user_id;
  
  -- Aplicar permissões específicas se houver
  IF invitation_record.permissions IS NOT NULL THEN
    FOR perm_id IN 
      SELECT value::uuid FROM jsonb_array_elements_text(invitation_record.permissions)
    LOOP
      INSERT INTO user_permissions (user_id, permission_id, granted)
      VALUES (user_id, perm_id, true)
      ON CONFLICT (user_id, permission_id) 
      DO UPDATE SET granted = true;
    END LOOP;
  END IF;
  
  -- Marcar convite como aceito
  UPDATE user_invitations 
  SET status = 'accepted', accepted_at = now()
  WHERE id = invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função trigger para dar admin ao criador da clínica
CREATE OR REPLACE FUNCTION auto_assign_admin_on_clinic_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o usuário que criou a clínica como admin
  UPDATE profiles 
  SET role = 'admin'
  WHERE id = auth.uid() AND clinic_id = NEW.id;
  
  -- Dar todas as permissões de admin para o criador
  INSERT INTO user_permissions (user_id, permission_id, granted)
  SELECT auth.uid(), pp.permission_id, true
  FROM permission_presets pp
  WHERE pp.role = 'admin'
  ON CONFLICT (user_id, permission_id) 
  DO UPDATE SET granted = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger na tabela clinic_settings
DROP TRIGGER IF EXISTS auto_admin_trigger ON clinic_settings;
CREATE TRIGGER auto_admin_trigger
  AFTER INSERT ON clinic_settings
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_admin_on_clinic_creation();

-- 4. View para listar usuários com suas permissões
CREATE OR REPLACE VIEW clinic_users_with_permissions AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.clinic_id,
  p.is_active,
  p.created_at,
  -- Permissões customizadas
  COALESCE(
    json_agg(
      CASE WHEN up.permission_id IS NOT NULL THEN
        json_build_object(
          'id', perm.id,
          'name', perm.name,
          'resource', perm.resource,
          'action', perm.action,
          'granted', up.granted
        )
      END
    ) FILTER (WHERE up.permission_id IS NOT NULL), 
    '[]'::json
  ) as custom_permissions,
  -- Permissões do preset do role
  (
    SELECT json_agg(
      json_build_object(
        'id', perm_preset.id,
        'name', perm_preset.name,
        'resource', perm_preset.resource,
        'action', perm_preset.action
      )
    )
    FROM permission_presets pp
    JOIN permissions perm_preset ON perm_preset.id = pp.permission_id
    WHERE pp.role = p.role
  ) as role_permissions
FROM profiles p
LEFT JOIN user_permissions up ON up.user_id = p.id
LEFT JOIN permissions perm ON perm.id = up.permission_id
GROUP BY p.id, p.full_name, p.email, p.role, p.clinic_id, p.is_active, p.created_at;

-- RLS para a view
CREATE POLICY "Users can view clinic users" ON profiles FOR SELECT USING (
  clinic_id = (SELECT clinic_id FROM profiles WHERE id = auth.uid())
  OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'super')
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_invitations_clinic_email ON user_invitations(clinic_id, email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_permission ON user_permissions(user_id, permission_id);