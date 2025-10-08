import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Database } from '@/integrations/supabase/types';

// Types
type Permission = Database['public']['Tables']['permissions']['Row'];
type UserPermission = Database['public']['Tables']['user_permissions']['Row'];
type PermissionPreset = Database['public']['Tables']['permission_presets']['Row'];

export interface PermissionWithDetails extends Permission {
  granted?: boolean;
  isCustom?: boolean;
}

interface PermissionsContextType {
  // Permissões do usuário atual
  userPermissions: string[];
  permissionsWithDetails: PermissionWithDetails[];
  loading: boolean;
  
  // Verificação de permissões
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  canAccess: (resource: string, action: string) => boolean;
  
  // Gerenciamento (para admins)
  allPermissions: Permission[];
  getUserPermissions: (userId: string) => Promise<PermissionWithDetails[]>;
  updateUserPermissions: (userId: string, permissions: string[]) => Promise<boolean>;
  applyRolePreset: (userId: string, role: string) => Promise<boolean>;
  getRolePresets: (role: string) => Promise<string[]>;
  
  // Refresh
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [permissionsWithDetails, setPermissionsWithDetails] = useState<PermissionWithDetails[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar todas as permissões disponíveis
  const loadAllPermissions = useCallback(async () => {
    try {
      const { data: permissions, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('is_active', true)
        .order('resource', { ascending: true })
        .order('action', { ascending: true });

      if (error) throw error;
      setAllPermissions(permissions || []);
    } catch (error) {
      console.error('❌ Erro ao carregar permissões:', error);
    }
  }, []);

  // Carregar permissões do usuário atual
  const loadUserPermissions = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Buscar permissões customizadas do usuário
      const { data: customPermissions, error: customError } = await supabase
        .from('user_permissions')
        .select(`
          granted,
          permissions:permission_id (
            id, name, resource, action, description
          )
        `)
        .eq('user_id', user.id)
        .eq('granted', true);

      if (customError) throw customError;

      // Buscar presets do role do usuário
      const { data: rolePresets, error: presetsError } = await supabase
        .from('permission_presets')
        .select(`
          permissions:permission_id (
            id, name, resource, action, description
          )
        `)
        .eq('role', user.profile?.role || 'guardian');

      if (presetsError) throw presetsError;

      // Combinar permissões customizadas e presets
      const customPermissionNames = new Set(
        customPermissions?.map(cp => cp.permissions?.name).filter(Boolean) || []
      );

      const presetPermissionNames = new Set(
        rolePresets?.map(rp => rp.permissions?.name).filter(Boolean) || []
      );

      // Se usuário tem permissões customizadas, usar elas
      // Senão, usar presets do role
      const finalPermissions = customPermissionNames.size > 0 
        ? Array.from(customPermissionNames)
        : Array.from(presetPermissionNames);

      setUserPermissions(finalPermissions);

      // Montar detalhes para interface de configuração
      const permissionsDetails: PermissionWithDetails[] = allPermissions.map(permission => ({
        ...permission,
        granted: finalPermissions.includes(permission.name),
        isCustom: customPermissionNames.has(permission.name)
      }));

      setPermissionsWithDetails(permissionsDetails);

    } catch (error) {
      console.error('❌ Erro ao carregar permissões do usuário:', error);
    } finally {
      setLoading(false);
    }
  }, [user, allPermissions]);

  // Verificar se usuário tem permissão específica
  const hasPermission = useCallback((permission: string): boolean => {
    // Super admin tem todas as permissões (incluindo cross-clinic)
    if (user?.profile?.role === 'super') return true;
    
    return userPermissions.includes(permission);
  }, [user?.profile?.role, userPermissions]);

  // Verificar se usuário tem alguma das permissões
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  // Verificar acesso por recurso e ação
  const canAccess = useCallback((resource: string, action: string): boolean => {
    const permission = `${resource}.${action}`;
    const managePermission = `${resource}.manage`;
    
    return hasPermission(permission) || hasPermission(managePermission);
  }, [hasPermission]);

  // Buscar permissões de um usuário específico (para admins)
  const getUserPermissions = useCallback(async (userId: string): Promise<PermissionWithDetails[]> => {
    try {
      // Verificar se usuário atual pode gerenciar permissões
      if (!hasPermission('settings.manage') && user?.profile?.role !== 'admin') {
        throw new Error('Sem permissão para visualizar permissões de outros usuários');
      }

      // Buscar perfil do usuário alvo
      const { data: targetProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Buscar permissões customizadas
      const { data: customPermissions, error: customError } = await supabase
        .from('user_permissions')
        .select(`
          granted,
          permissions:permission_id (
            id, name, resource, action, description
          )
        `)
        .eq('user_id', userId);

      if (customError) throw customError;

      // Buscar presets do role
      const { data: rolePresets, error: presetsError } = await supabase
        .from('permission_presets')
        .select(`
          permissions:permission_id (
            id, name, resource, action, description
          )
        `)
        .eq('role', targetProfile.role);

      if (presetsError) throw presetsError;

      // Mapear permissões customizadas
      const customPermissionMap = new Map(
        customPermissions?.map(cp => [
          cp.permissions?.name || '', 
          cp.granted
        ]) || []
      );

      // Mapear presets
      const presetPermissions = new Set(
        rolePresets?.map(rp => rp.permissions?.name).filter(Boolean) || []
      );

      // Montar resultado
      const result: PermissionWithDetails[] = allPermissions.map(permission => {
        const hasCustom = customPermissionMap.has(permission.name);
        const customValue = customPermissionMap.get(permission.name);
        const presetValue = presetPermissions.has(permission.name);

        return {
          ...permission,
          granted: hasCustom ? customValue : presetValue,
          isCustom: hasCustom
        };
      });

      return result;

    } catch (error) {
      console.error('❌ Erro ao buscar permissões do usuário:', error);
      throw error;
    }
  }, [hasPermission, user?.profile?.role, allPermissions]);

  // Atualizar permissões de um usuário
  const updateUserPermissions = useCallback(async (userId: string, permissions: string[]): Promise<boolean> => {
    try {
      // Verificar se usuário atual pode gerenciar permissões
      if (!hasPermission('settings.manage') && user?.profile?.role !== 'admin') {
        throw new Error('Sem permissão para alterar permissões de outros usuários');
      }

      // Remover permissões existentes
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId);

      // Inserir novas permissões
      if (permissions.length > 0) {
        const { data: permissionIds, error: idsError } = await supabase
          .from('permissions')
          .select('id, name')
          .in('name', permissions);

        if (idsError) throw idsError;

        const userPermissionsData = permissionIds.map(permission => ({
          user_id: userId,
          permission_id: permission.id,
          granted: true,
          granted_by: user?.id,
          clinic_id: user?.profile?.clinic_id
        }));

        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert(userPermissionsData);

        if (insertError) throw insertError;
      }

      return true;

    } catch (error) {
      console.error('❌ Erro ao atualizar permissões do usuário:', error);
      throw error;
    }
  }, [hasPermission, user]);

  // Aplicar preset de role
  const applyRolePreset = useCallback(async (userId: string, role: string): Promise<boolean> => {
    try {
      // Verificar permissão
      if (!hasPermission('settings.manage') && user?.profile?.role !== 'admin') {
        throw new Error('Sem permissão para aplicar presets');
      }

      // Chamar função do banco
      const { error } = await supabase.rpc('apply_role_preset_permissions', {
        target_user_id: userId,
        target_role: role as any,
        granted_by_user_id: user?.id
      });

      if (error) throw error;

      return true;

    } catch (error) {
      console.error('❌ Erro ao aplicar preset:', error);
      throw error;
    }
  }, [hasPermission, user]);

  // Buscar presets de um role
  const getRolePresets = useCallback(async (role: string): Promise<string[]> => {
    try {
      const { data: presets, error } = await supabase
        .from('permission_presets')
        .select(`
          permissions:permission_id (name)
        `)
        .eq('role', role);

      if (error) throw error;

      return presets?.map(p => p.permissions?.name).filter(Boolean) || [];

    } catch (error) {
      console.error('❌ Erro ao buscar presets do role:', error);
      return [];
    }
  }, []);

  // Atualizar permissões
  const refreshPermissions = useCallback(async () => {
    await Promise.all([
      loadAllPermissions(),
      loadUserPermissions()
    ]);
  }, [loadAllPermissions, loadUserPermissions]);

  // Efeitos
  useEffect(() => {
    loadAllPermissions();
  }, [loadAllPermissions]);

  useEffect(() => {
    if (!authLoading && allPermissions.length > 0) {
      loadUserPermissions();
    }
  }, [authLoading, allPermissions.length, loadUserPermissions]);

  const value: PermissionsContextType = {
    userPermissions,
    permissionsWithDetails,
    loading: loading || authLoading,
    
    hasPermission,
    hasAnyPermission,
    canAccess,
    
    allPermissions,
    getUserPermissions,
    updateUserPermissions,
    applyRolePreset,
    getRolePresets,
    
    refreshPermissions
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}