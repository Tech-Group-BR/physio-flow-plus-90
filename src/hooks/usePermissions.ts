import { useCallback } from 'react';
import { usePermissions as usePermissionsContext } from '@/contexts/PermissionsContext';
import { toast } from 'sonner';

// Tipos para melhor autocomplete
export type PermissionResource = 
  | 'patients' 
  | 'professionals' 
  | 'appointments' 
  | 'settings' 
  | 'financial' 
  | 'reports' 
  | 'whatsapp' 
  | 'dashboard';

export type PermissionAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'manage';

// Mapeamento de permissões comuns
export const PERMISSIONS = {
  // Pacientes
  PATIENTS_VIEW: 'patients.read',
  PATIENTS_CREATE: 'patients.create',
  PATIENTS_EDIT: 'patients.update',
  PATIENTS_DELETE: 'patients.delete',
  PATIENTS_MANAGE: 'patients.manage',
  
  // Profissionais
  PROFESSIONALS_VIEW: 'professionals.read',
  PROFESSIONALS_CREATE: 'professionals.create',
  PROFESSIONALS_EDIT: 'professionals.update',
  PROFESSIONALS_DELETE: 'professionals.delete',
  PROFESSIONALS_MANAGE: 'professionals.manage',
  
  // Agendamentos
  APPOINTMENTS_VIEW: 'appointments.read',
  APPOINTMENTS_CREATE: 'appointments.create',
  APPOINTMENTS_EDIT: 'appointments.update',
  APPOINTMENTS_DELETE: 'appointments.delete',
  APPOINTMENTS_MANAGE: 'appointments.manage',
  
  // Financeiro
  FINANCIAL_VIEW: 'financial.read',
  FINANCIAL_CREATE: 'financial.create',
  FINANCIAL_EDIT: 'financial.update',
  FINANCIAL_DELETE: 'financial.delete',
  FINANCIAL_MANAGE: 'financial.manage',
  
  // Configurações
  SETTINGS_VIEW: 'settings.read',
  SETTINGS_EDIT: 'settings.update',
  SETTINGS_MANAGE: 'settings.manage',
  
  // Relatórios
  REPORTS_VIEW: 'reports.read',
  REPORTS_MANAGE: 'reports.manage',
  
  // WhatsApp
  WHATSAPP_VIEW: 'whatsapp.read',
  WHATSAPP_MANAGE: 'whatsapp.manage',
  
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.read',
  
  // Super Admin (apenas visível para outros super admins)
  SYSTEM_MANAGE_ALL_CLINICS: 'system.manage_all_clinics',
  SYSTEM_CREATE_CLINICS: 'system.create_clinics',
  SYSTEM_DELETE_CLINICS: 'system.delete_clinics',
  SYSTEM_VIEW_GLOBAL_STATS: 'system.view_global_stats',
  SYSTEM_MANAGE_BILLING: 'system.manage_billing',
  
  SUPERADMIN_MANAGE_USERS: 'superadmin.manage_users',
  SUPERADMIN_MANAGE_PERMISSIONS: 'superadmin.manage_permissions',
  SUPERADMIN_SYSTEM_LOGS: 'superadmin.system_logs',
  SUPERADMIN_DATABASE_ACCESS: 'superadmin.database_access',
  SUPERADMIN_BACKUP_RESTORE: 'superadmin.backup_restore'
} as const;

// Presets por role para interface
export const ROLE_PRESETS = {
  admin: {
    label: 'Administrador',
    description: 'Acesso quase completo ao sistema',
    permissions: [
      PERMISSIONS.PATIENTS_MANAGE,
      PERMISSIONS.PROFESSIONALS_MANAGE,
      PERMISSIONS.APPOINTMENTS_MANAGE,
      PERMISSIONS.FINANCIAL_MANAGE,
      PERMISSIONS.SETTINGS_EDIT,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.WHATSAPP_VIEW,
      PERMISSIONS.DASHBOARD_VIEW
    ]
  },
  professional: {
    label: 'Fisioterapeuta',
    description: 'Foco em pacientes e agenda',
    permissions: [
      PERMISSIONS.PATIENTS_VIEW,
      PERMISSIONS.PATIENTS_EDIT,
      PERMISSIONS.APPOINTMENTS_VIEW,
      PERMISSIONS.APPOINTMENTS_CREATE,
      PERMISSIONS.APPOINTMENTS_EDIT,
      PERMISSIONS.FINANCIAL_VIEW,
      PERMISSIONS.DASHBOARD_VIEW
    ]
  },
  receptionist: {
    label: 'Recepcionista',
    description: 'Foco em atendimento e agenda',
    permissions: [
      PERMISSIONS.PATIENTS_CREATE,
      PERMISSIONS.PATIENTS_VIEW,
      PERMISSIONS.PATIENTS_EDIT,
      PERMISSIONS.APPOINTMENTS_MANAGE,
      PERMISSIONS.FINANCIAL_VIEW,
      PERMISSIONS.DASHBOARD_VIEW
    ]
  },
  guardian: {
    label: 'Responsável',
    description: 'Acesso limitado aos dados do dependente',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW
    ]
  },
  super: {
    label: 'Super Administrador',
    description: 'Acesso completo ao sistema (todas as clínicas)',
    permissions: [
      // Todas as permissões básicas
      ...Object.values(PERMISSIONS).filter(p => !p.startsWith('superadmin.') && !p.startsWith('system.')),
      // Permissões específicas de super admin
      PERMISSIONS.SYSTEM_MANAGE_ALL_CLINICS,
      PERMISSIONS.SYSTEM_CREATE_CLINICS,
      PERMISSIONS.SYSTEM_DELETE_CLINICS,
      PERMISSIONS.SYSTEM_VIEW_GLOBAL_STATS,
      PERMISSIONS.SYSTEM_MANAGE_BILLING,
      PERMISSIONS.SUPERADMIN_MANAGE_USERS,
      PERMISSIONS.SUPERADMIN_MANAGE_PERMISSIONS,
      PERMISSIONS.SUPERADMIN_SYSTEM_LOGS,
      PERMISSIONS.SUPERADMIN_DATABASE_ACCESS,
      PERMISSIONS.SUPERADMIN_BACKUP_RESTORE
    ]
  }
} as const;

export interface UsePermissionActionsReturn {
  // Verificação básica
  check: (permission: string) => boolean;
  checkAny: (permissions: string[]) => boolean;
  checkAccess: (resource: PermissionResource, action: PermissionAction) => boolean;
  
  // Verificação com feedback visual
  checkWithFeedback: (permission: string, errorMessage?: string) => boolean;
  requirePermission: (permission: string, errorMessage?: string) => boolean;
  
  // Helpers para recursos específicos
  patients: {
    canView: () => boolean;
    canCreate: () => boolean;
    canEdit: () => boolean;
    canDelete: () => boolean;
    canManage: () => boolean;
  };
  
  professionals: {
    canView: () => boolean;
    canCreate: () => boolean;
    canEdit: () => boolean;
    canDelete: () => boolean;
    canManage: () => boolean;
  };
  
  appointments: {
    canView: () => boolean;
    canCreate: () => boolean;
    canEdit: () => boolean;
    canDelete: () => boolean;
    canManage: () => boolean;
  };
  
  financial: {
    canView: () => boolean;
    canCreate: () => boolean;
    canEdit: () => boolean;
    canDelete: () => boolean;
    canManage: () => boolean;
  };
  
  settings: {
    canView: () => boolean;
    canEdit: () => boolean;
    canManage: () => boolean;
  };
  
  reports: {
    canView: () => boolean;
    canManage: () => boolean;
  };
  
  whatsapp: {
    canView: () => boolean;
    canManage: () => boolean;
  };
  
  // Super Admin específicas
  superAdmin: {
    canManageAllClinics: () => boolean;
    canCreateClinics: () => boolean;
    canDeleteClinics: () => boolean;
    canViewGlobalStats: () => boolean;
    canManageBilling: () => boolean;
    canManageSystemUsers: () => boolean;
    canAccessSystemLogs: () => boolean;
    canAccessDatabase: () => boolean;
  };
  
  // Utilitários
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  getRoleLabel: () => string;
  getPermissionsList: () => string[];
}

/**
 * Hook principal para verificação e gerenciamento de permissões
 */
export function usePermissionActions(): UsePermissionActionsReturn {
  const { 
    hasPermission, 
    hasAnyPermission, 
    canAccess, 
    userPermissions 
  } = usePermissionsContext();

  // Verificação básica
  const check = useCallback((permission: string): boolean => {
    return hasPermission(permission);
  }, [hasPermission]);

  const checkAny = useCallback((permissions: string[]): boolean => {
    return hasAnyPermission(permissions);
  }, [hasAnyPermission]);

  const checkAccess = useCallback((resource: PermissionResource, action: PermissionAction): boolean => {
    return canAccess(resource, action);
  }, [canAccess]);

  // Verificação com feedback
  const checkWithFeedback = useCallback((permission: string, errorMessage?: string): boolean => {
    const hasAccess = hasPermission(permission);
    if (!hasAccess && errorMessage) {
      toast.error(errorMessage);
    }
    return hasAccess;
  }, [hasPermission]);

  const requirePermission = useCallback((permission: string, errorMessage?: string): boolean => {
    const defaultMessage = 'Você não tem permissão para realizar esta ação';
    return checkWithFeedback(permission, errorMessage || defaultMessage);
  }, [checkWithFeedback]);

  // Helpers para recursos específicos
  const patients = {
    canView: () => check(PERMISSIONS.PATIENTS_VIEW) || check(PERMISSIONS.PATIENTS_MANAGE),
    canCreate: () => check(PERMISSIONS.PATIENTS_CREATE) || check(PERMISSIONS.PATIENTS_MANAGE),
    canEdit: () => check(PERMISSIONS.PATIENTS_EDIT) || check(PERMISSIONS.PATIENTS_MANAGE),
    canDelete: () => check(PERMISSIONS.PATIENTS_DELETE) || check(PERMISSIONS.PATIENTS_MANAGE),
    canManage: () => check(PERMISSIONS.PATIENTS_MANAGE)
  };

  const professionals = {
    canView: () => check(PERMISSIONS.PROFESSIONALS_VIEW) || check(PERMISSIONS.PROFESSIONALS_MANAGE),
    canCreate: () => check(PERMISSIONS.PROFESSIONALS_CREATE) || check(PERMISSIONS.PROFESSIONALS_MANAGE),
    canEdit: () => check(PERMISSIONS.PROFESSIONALS_EDIT) || check(PERMISSIONS.PROFESSIONALS_MANAGE),
    canDelete: () => check(PERMISSIONS.PROFESSIONALS_DELETE) || check(PERMISSIONS.PROFESSIONALS_MANAGE),
    canManage: () => check(PERMISSIONS.PROFESSIONALS_MANAGE)
  };

  const appointments = {
    canView: () => check(PERMISSIONS.APPOINTMENTS_VIEW) || check(PERMISSIONS.APPOINTMENTS_MANAGE),
    canCreate: () => check(PERMISSIONS.APPOINTMENTS_CREATE) || check(PERMISSIONS.APPOINTMENTS_MANAGE),
    canEdit: () => check(PERMISSIONS.APPOINTMENTS_EDIT) || check(PERMISSIONS.APPOINTMENTS_MANAGE),
    canDelete: () => check(PERMISSIONS.APPOINTMENTS_DELETE) || check(PERMISSIONS.APPOINTMENTS_MANAGE),
    canManage: () => check(PERMISSIONS.APPOINTMENTS_MANAGE)
  };

  const financial = {
    canView: () => check(PERMISSIONS.FINANCIAL_VIEW) || check(PERMISSIONS.FINANCIAL_MANAGE),
    canCreate: () => check(PERMISSIONS.FINANCIAL_CREATE) || check(PERMISSIONS.FINANCIAL_MANAGE),
    canEdit: () => check(PERMISSIONS.FINANCIAL_EDIT) || check(PERMISSIONS.FINANCIAL_MANAGE),
    canDelete: () => check(PERMISSIONS.FINANCIAL_DELETE) || check(PERMISSIONS.FINANCIAL_MANAGE),
    canManage: () => check(PERMISSIONS.FINANCIAL_MANAGE)
  };

  const settings = {
    canView: () => check(PERMISSIONS.SETTINGS_VIEW) || check(PERMISSIONS.SETTINGS_MANAGE),
    canEdit: () => check(PERMISSIONS.SETTINGS_EDIT) || check(PERMISSIONS.SETTINGS_MANAGE),
    canManage: () => check(PERMISSIONS.SETTINGS_MANAGE)
  };

  const reports = {
    canView: () => check(PERMISSIONS.REPORTS_VIEW) || check(PERMISSIONS.REPORTS_MANAGE),
    canManage: () => check(PERMISSIONS.REPORTS_MANAGE)
  };

  const whatsapp = {
    canView: () => check(PERMISSIONS.WHATSAPP_VIEW) || check(PERMISSIONS.WHATSAPP_MANAGE),
    canManage: () => check(PERMISSIONS.WHATSAPP_MANAGE)
  };

  // Helpers para Super Admin
  const superAdmin = {
    canManageAllClinics: () => check(PERMISSIONS.SYSTEM_MANAGE_ALL_CLINICS),
    canCreateClinics: () => check(PERMISSIONS.SYSTEM_CREATE_CLINICS),
    canDeleteClinics: () => check(PERMISSIONS.SYSTEM_DELETE_CLINICS),
    canViewGlobalStats: () => check(PERMISSIONS.SYSTEM_VIEW_GLOBAL_STATS),
    canManageBilling: () => check(PERMISSIONS.SYSTEM_MANAGE_BILLING),
    canManageSystemUsers: () => check(PERMISSIONS.SUPERADMIN_MANAGE_USERS),
    canAccessSystemLogs: () => check(PERMISSIONS.SUPERADMIN_SYSTEM_LOGS),
    canAccessDatabase: () => check(PERMISSIONS.SUPERADMIN_DATABASE_ACCESS)
  };

  // Utilitários
  const isAdmin = useCallback((): boolean => {
    return check(PERMISSIONS.SETTINGS_MANAGE) || 
           checkAny([PERMISSIONS.PATIENTS_MANAGE, PERMISSIONS.PROFESSIONALS_MANAGE]);
  }, [check, checkAny]);

  const isSuperAdmin = useCallback((): boolean => {
    // Super admin é verificado automaticamente no contexto
    return hasPermission('settings.manage') && userPermissions.length > 10;
  }, [hasPermission, userPermissions.length]);

  const getRoleLabel = useCallback((): string => {
    if (isSuperAdmin()) return 'Super Administrador';
    if (isAdmin()) return 'Administrador';
    if (professionals.canManage() || appointments.canManage()) return 'Profissional';
    if (appointments.canCreate()) return 'Recepcionista';
    return 'Usuário';
  }, [isSuperAdmin, isAdmin, professionals, appointments]);

  const getPermissionsList = useCallback((): string[] => {
    return userPermissions;
  }, [userPermissions]);

  return {
    check,
    checkAny,
    checkAccess,
    checkWithFeedback,
    requirePermission,
    
    patients,
    professionals,
    appointments,
    financial,
    settings,
    reports,
    whatsapp,
    superAdmin,
    
    isAdmin,
    isSuperAdmin,
    getRoleLabel,
    getPermissionsList
  };
}

/**
 * Hook específico para verificações condicionais em componentes
 */
export function usePermissionGuard() {
  const { check, requirePermission } = usePermissionActions();

  return {
    /**
     * Verifica permissão e retorna JSX ou null
     */
    guard: (permission: string, component: React.ReactNode, fallback?: React.ReactNode) => {
      return check(permission) ? component : (fallback || null);
    },

    /**
     * Wrapper para funções que precisam de permissão
     */
    withPermission: (permission: string, fn: () => void, errorMessage?: string) => {
      return () => {
        if (requirePermission(permission, errorMessage)) {
          fn();
        }
      };
    },

    /**
     * Verifica múltiplas permissões (OR)
     */
    guardAny: (permissions: string[], component: React.ReactNode, fallback?: React.ReactNode) => {
      return permissions.some(p => check(p)) ? component : (fallback || null);
    }
  };
}