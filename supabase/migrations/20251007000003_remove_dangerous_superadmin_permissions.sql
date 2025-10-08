-- Migration: Remover permissões perigosas de super admin
-- Descrição: Remove permissões que não devem ser atribuíveis por administradores de clínicas

-- Remover permissões específicas que são muito sensíveis
DELETE FROM public.permissions 
WHERE name IN (
  'system.delete_clinics',
  'system.view_global_stats',
  'dev.debug_mode',
  'dev.api_access',
  'dev.system_maintenance'
);

-- Remover essas permissões dos presets (caso existam)
DELETE FROM public.permission_presets
WHERE permission_id IN (
  SELECT id FROM public.permissions 
  WHERE name IN (
    'system.delete_clinics',
    'system.view_global_stats',
    'dev.debug_mode',
    'dev.api_access',
    'dev.system_maintenance'
  )
);

-- Remover essas permissões dos usuários (caso tenham sido atribuídas)
DELETE FROM public.user_permissions
WHERE permission_id IN (
  SELECT id FROM public.permissions 
  WHERE name IN (
    'system.delete_clinics',
    'system.view_global_stats',
    'dev.debug_mode',
    'dev.api_access',
    'dev.system_maintenance'
  )
);

-- Comentário explicativo
COMMENT ON TABLE public.permissions IS 
'Tabela de permissões do sistema. Permissões que começam com "superadmin." são reservadas para super administradores e não podem ser atribuídas por administradores de clínicas. Permissões removidas: system.delete_clinics, system.view_global_stats, dev.debug_mode, dev.api_access, dev.system_maintenance';
