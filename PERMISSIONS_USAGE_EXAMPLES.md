// Exemplo de como usar o sistema de permissões nos componentes existentes

// 1. IMPORTAR O HOOK
import { usePermissionActions } from '@/hooks/usePermissions';

// 2. NO COMPONENTE
export function ExamplePatientPage() {
  const { patients, requirePermission } = usePermissionActions();
  
  // 3. VERIFICAÇÃO SIMPLES (CONDICIONAL)
  return (
    <div>
      {/* Só mostra botão se pode criar */}
      {patients.canCreate() && (
        <Button onClick={handleCreatePatient}>
          Novo Paciente
        </Button>
      )}
      
      {/* Só mostra lista se pode visualizar */}
      {patients.canView() ? (
        <PatientsList />
      ) : (
        <div>Sem permissão para ver pacientes</div>
      )}
    </div>
  );
}

// 4. VERIFICAÇÃO COM FEEDBACK (EM FUNÇÕES)
const handleDeletePatient = (id: string) => {
  // Verifica permissão e mostra toast se não tiver
  if (!requirePermission('patients.delete', 'Você não pode excluir pacientes')) {
    return; // Para aqui se não tiver permissão
  }
  
  // Código de exclusão continua apenas se tiver permissão
  deletePatient(id);
  toast.success('Paciente excluído com sucesso!');
};

// 5. EXEMPLO COMPLETO - BOTÃO CONDICIONAL COM AÇÃO PROTEGIDA
function PatientActionButton({ patientId }: { patientId: string }) {
  const { patients, requirePermission } = usePermissionActions();
  
  const handleEdit = () => {
    if (requirePermission('patients.update', 'Sem permissão para editar')) {
      // Redirecionar para edição
      navigate(`/patients/edit/${patientId}`);
    }
  };
  
  const handleDelete = () => {
    if (requirePermission('patients.delete', 'Sem permissão para excluir')) {
      // Confirmar e excluir
      if (confirm('Tem certeza?')) {
        deletePatient(patientId);
      }
    }
  };
  
  return (
    <div className="flex gap-2">
      {/* Botão só aparece se pode editar */}
      {patients.canEdit() && (
        <Button onClick={handleEdit} variant="outline">
          Editar
        </Button>
      )}
      
      {/* Botão só aparece se pode excluir */}
      {patients.canDelete() && (
        <Button onClick={handleDelete} variant="destructive">
          Excluir
        </Button>
      )}
    </div>
  );
}

// 6. EXEMPLO SUPER ADMIN - FUNCIONALIDADES CROSS-CLINIC
function SuperAdminExample() {
  const { superAdmin, isSuperAdmin } = usePermissionActions();
  
  // Verificar se é super admin
  if (!isSuperAdmin()) {
    return <div>Acesso negado</div>;
  }

  const handleSwitchClinic = (clinicId: string) => {
    if (superAdmin.canManageAllClinics()) {
      // Super admin pode "entrar" em qualquer clínica
      switchToClinic(clinicId);
      toast.success('Clínica alterada com sucesso');
    }
  };

  const handleCreateClinic = () => {
    if (superAdmin.canCreateClinics()) {
      // Abrir modal de criação de clínica
      openCreateClinicModal();
    }
  };

  const handleViewGlobalReports = () => {
    if (superAdmin.canViewGlobalStats()) {
      // Navegar para relatórios cross-clinic
      navigate('/super-admin/reports');
    }
  };

  return (
    <div>
      {/* Seletor de clínicas (só super admin vê) */}
      {superAdmin.canManageAllClinics() && (
        <select onChange={(e) => handleSwitchClinic(e.target.value)}>
          <option value="">Selecionar Clínica</option>
          <option value="clinic1">FisioTech Centro</option>
          <option value="clinic2">FisioTech Norte</option>
        </select>
      )}

      {/* Botões exclusivos */}
      <div className="super-admin-actions">
        {superAdmin.canCreateClinics() && (
          <Button onClick={handleCreateClinic}>
            Nova Clínica
          </Button>
        )}
        
        {superAdmin.canViewGlobalStats() && (
          <Button onClick={handleViewGlobalReports}>
            Relatórios Globais
          </Button>
        )}
        
        {superAdmin.canManageSystemUsers() && (
          <Button onClick={() => navigate('/super-admin/users')}>
            Usuários do Sistema
          </Button>
        )}
      </div>
    </div>
  );
}

// 7. EXEMPLO DE USO EM SIDEBAR (AppSidebar.tsx)
function AppSidebarExample() {
  const { patients, professionals, settings, financial, isSuperAdmin } = usePermissionActions();
  
  const menuItems = [
    // Item sempre visível
    { 
      label: 'Dashboard', 
      path: '/dashboard', 
      icon: Home 
    },
    
    // Itens condicionais
    ...(patients.canView() ? [{
      label: 'Pacientes',
      path: '/patients', 
      icon: Users
    }] : []),
    
    ...(professionals.canView() ? [{
      label: 'Profissionais',
      path: '/professionals',
      icon: UserCheck
    }] : []),
    
    ...(financial.canView() ? [{
      label: 'Financeiro',
      path: '/financial',
      icon: DollarSign
    }] : []),
    
    ...(settings.canView() ? [{
      label: 'Configurações',
      path: '/settings',
      icon: Settings
    }] : []),
    
    // Item exclusivo para super admin
    ...(isSuperAdmin() ? [{
      label: '👑 Super Admin',
      path: '/super-admin',
      icon: Crown,
      className: 'border-yellow-500 bg-yellow-50'
    }] : [])
  ];
  
  return (
    <nav>
      {menuItems.map(item => (
        <NavItem key={item.path} {...item} />
      ))}
    </nav>
  );
}

/*
RESUMO DE PERMISSÕES DISPONÍVEIS:

PACIENTES:
- patients.canView() - Ver lista e detalhes
- patients.canCreate() - Criar novos
- patients.canEdit() - Editar existentes  
- patients.canDelete() - Excluir
- patients.canManage() - Acesso total

PROFISSIONAIS:
- professionals.canView() 
- professionals.canCreate()
- professionals.canEdit()
- professionals.canDelete()
- professionals.canManage()

AGENDAMENTOS:
- appointments.canView()
- appointments.canCreate() 
- appointments.canEdit()
- appointments.canDelete()
- appointments.canManage()

FINANCEIRO:
- financial.canView()
- financial.canCreate()
- financial.canEdit() 
- financial.canDelete()
- financial.canManage()

CONFIGURAÇÕES:
- settings.canView()
- settings.canEdit()
- settings.canManage() - Incluindo permissões

RELATÓRIOS:
- reports.canView()
- reports.canManage()

WHATSAPP:
- whatsapp.canView()
- whatsapp.canManage()

SUPER ADMIN (cross-clinic):
- superAdmin.canManageAllClinics() - Acesso a todas as clínicas
- superAdmin.canCreateClinics() - Criar novas clínicas
- superAdmin.canDeleteClinics() - Excluir/suspender clínicas  
- superAdmin.canViewGlobalStats() - Estatísticas globais
- superAdmin.canManageBilling() - Gerenciar cobrança/assinaturas
- superAdmin.canManageSystemUsers() - Usuários de todas clínicas
- superAdmin.canAccessSystemLogs() - Logs do sistema
- superAdmin.canAccessDatabase() - Acesso direto ao DB

UTILITÁRIOS:
- isAdmin() - Se é administrador
- isSuperAdmin() - Se é super admin
- getRoleLabel() - Label do role atual
- requirePermission(perm, msg) - Com toast de erro

COMO CONFIGURAR (PARA ADMINS):

1. Acesse Configurações → Aba Permissões
2. Selecione um usuário na lista
3. Opção A: Clique em um preset (Admin, Profissional, etc.)
4. Opção B: Configure permissões individuais manualmente  
5. Clique em Salvar

SUPER ADMIN (CONFIGURAÇÃO):

1. Execute a query: UPDATE profiles SET role = 'super' WHERE email = 'seuemail@email.com';
2. Acesse Configurações → Aba Super Admin (aparece automaticamente)
3. Tenha acesso a todas as clínicas e funcionalidades cross-clinic
4. Gerencie usuários, clínicas, permissões e sistema global

NOTAS IMPORTANTES:

- Super Admin só vê/gerencia outros Super Admins
- Super Admin tem acesso automático a todas as permissões
- Super Admin pode "entrar" em qualquer clínica do sistema
- Funcionalidades específicas ficam na aba "Super Admin" nas configurações
- Execute a migration para ativar completamente o sistema
*/