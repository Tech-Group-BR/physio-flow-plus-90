-- Migration: Fix admin permissions to include settings.manage
-- Date: 2025-01-06
-- Description: Add settings.manage permission to admin role preset so admins can manage users and permissions

-- Update admin preset to include settings.manage instead of just settings.update
DELETE FROM permission_presets WHERE role = 'admin';

INSERT INTO permission_presets (role, permission_id)
SELECT 'admin', id FROM permissions 
WHERE name IN (
  'patients.manage',
  'professionals.manage', 
  'appointments.manage',
  'financial.manage',
  'settings.manage',  -- Changed from settings.update to settings.manage
  'reports.manage',
  'whatsapp.manage',
  'dashboard.manage'
);

-- Apply the updated permissions to all existing admin users
DO $$
DECLARE
  admin_user RECORD;
BEGIN
  FOR admin_user IN 
    SELECT id, clinic_id FROM profiles WHERE role = 'admin'
  LOOP
    -- Clear existing permissions
    DELETE FROM user_permissions WHERE user_id = admin_user.id;
    
    -- Apply new permissions from preset
    INSERT INTO user_permissions (user_id, permission_id, granted_by, clinic_id)
    SELECT 
      admin_user.id,
      pp.permission_id,
      admin_user.id,  -- Self-granted for existing admins
      admin_user.clinic_id
    FROM permission_presets pp
    WHERE pp.role = 'admin';
  END LOOP;
END $$;

COMMENT ON MIGRATION IS 'Fix admin permissions to include settings.manage for user/permissions management';
