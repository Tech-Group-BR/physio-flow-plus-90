-- Migration: Remover permissão de gerenciar cobrança/assinaturas
-- Esta permissão é específica de super admin e não deve aparecer para admins normais

-- Remover permissão system.manage_billing
DELETE FROM user_permissions WHERE permission_id = 'system.manage_billing';
DELETE FROM permission_presets WHERE permission_id = 'system.manage_billing';
DELETE FROM permissions WHERE id = 'system.manage_billing';
