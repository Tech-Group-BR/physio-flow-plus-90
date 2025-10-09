import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Database, 
  Users, 
  Settings, 
  CheckCircle,
  AlertTriangle,
  Info,
  UserPlus,
  Mail,
  FileText,
  Calendar,
  MessageSquare,
  DollarSign,
  UserCog,
  BarChart,
  HardDrive,
  CreditCard,
  Building
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UserPermissionsManager from './UserPermissionsManager';
import InviteUserForm from './InviteUserForm';

// Função para traduzir permissões
const translatePermission = (permissionName: string): { label: string; description: string; icon: any } => {
  const translations: { [key: string]: { label: string; description: string; icon: any } } = {
    // Pacientes
    'patients.read': { label: 'Visualizar Pacientes', description: 'Ver lista e detalhes de pacientes', icon: Users },
    'patients.create': { label: 'Cadastrar Pacientes', description: 'Criar novos registros de pacientes', icon: Users },
    'patients.update': { label: 'Editar Pacientes', description: 'Modificar dados de pacientes', icon: Users },
    'patients.delete': { label: 'Excluir Pacientes', description: 'Remover pacientes do sistema', icon: Users },
    'patients.manage': { label: 'Gerenciar Pacientes', description: 'Acesso total aos pacientes', icon: Users },
    
    // Profissionais
    'professionals.read': { label: 'Visualizar Profissionais', description: 'Ver lista de profissionais', icon: UserCog },
    'professionals.create': { label: 'Cadastrar Profissionais', description: 'Adicionar novos profissionais', icon: UserCog },
    'professionals.update': { label: 'Editar Profissionais', description: 'Modificar dados de profissionais', icon: UserCog },
    'professionals.delete': { label: 'Excluir Profissionais', description: 'Remover profissionais', icon: UserCog },
    'professionals.manage': { label: 'Gerenciar Profissionais', description: 'Acesso total aos profissionais', icon: UserCog },
    
    // Agendamentos
    'appointments.read': { label: 'Visualizar Agenda', description: 'Ver agendamentos', icon: Calendar },
    'appointments.create': { label: 'Criar Agendamentos', description: 'Marcar novas consultas', icon: Calendar },
    'appointments.update': { label: 'Editar Agendamentos', description: 'Modificar consultas', icon: Calendar },
    'appointments.delete': { label: 'Cancelar Agendamentos', description: 'Remover consultas', icon: Calendar },
    'appointments.manage': { label: 'Gerenciar Agenda', description: 'Acesso total à agenda', icon: Calendar },
    
    // Financeiro
    'financial.read': { label: 'Visualizar Financeiro', description: 'Ver dados financeiros', icon: DollarSign },
    'financial.create': { label: 'Criar Lançamentos', description: 'Adicionar receitas/despesas', icon: DollarSign },
    'financial.update': { label: 'Editar Financeiro', description: 'Modificar lançamentos', icon: DollarSign },
    'financial.delete': { label: 'Excluir Lançamentos', description: 'Remover registros financeiros', icon: DollarSign },
    'financial.manage': { label: 'Gerenciar Financeiro', description: 'Acesso total ao financeiro', icon: DollarSign },
    
    // Dashboard
    'dashboard.read': { label: 'Visualizar Dashboard', description: 'Ver dashboard principal', icon: BarChart },
    
    // Relatórios
    'reports.read': { label: 'Visualizar Relatórios', description: 'Ver relatórios do sistema', icon: FileText },
    'reports.manage': { label: 'Gerenciar Relatórios', description: 'Acesso total aos relatórios', icon: FileText },
    
    // Confirmações (antigo WhatsApp)
    'whatsapp.read': { label: 'Visualizar Confirmações', description: 'Ver mensagens e configurações do WhatsApp', icon: MessageSquare },
    'whatsapp.manage': { label: 'Gerenciar Confirmações', description: 'Acesso total ao WhatsApp', icon: MessageSquare },
    'confirmations.read': { label: 'Visualizar Confirmações', description: 'Ver logs e configurações de confirmações WhatsApp', icon: MessageSquare },
    'confirmations.manage': { label: 'Gerenciar Confirmações', description: 'Acesso completo às confirmações WhatsApp', icon: MessageSquare },
    
    // Configurações
    'settings.read': { label: 'Visualizar Configurações', description: 'Ver configurações', icon: Settings },
    'settings.update': { label: 'Editar Configurações', description: 'Modificar configurações básicas', icon: Settings },
    'settings.manage': { label: 'Gerenciar Configurações', description: 'Acesso total às configurações', icon: Settings },
    
    // Super Admin
    'superadmin.manage_users': { label: 'Gerenciar Usuários', description: 'Gerenciar usuários de todas as clínicas', icon: Users },
    'superadmin.manage_permissions': { label: 'Gerenciar Permissões', description: 'Gerenciar sistema de permissões', icon: Shield },
    'superadmin.database_access': { label: 'Acesso ao Banco', description: 'Acesso direto ao banco de dados', icon: Database },
    'superadmin.system_logs': { label: 'Logs do Sistema', description: 'Acessar logs do sistema', icon: FileText },
    'superadmin.backup_restore': { label: 'Backup/Restore', description: 'Realizar backup e restore do sistema', icon: HardDrive },
    
    // Sistema
    'system.manage_billing': { label: 'Gerenciar Cobrança', description: 'Gerenciar cobrança e assinaturas das clínicas', icon: CreditCard },
    'system.create_clinics': { label: 'Criar Clínicas', description: 'Criar novas clínicas no sistema', icon: Building },
    'system.manage_all_clinics': { label: 'Gerenciar Todas Clínicas', description: 'Acesso a todas as clínicas do sistema', icon: Building },
  };
  
  return translations[permissionName] || { 
    label: permissionName, 
    description: 'Permissão customizada',
    icon: Shield 
  };
};

// Exportar para uso em outros componentes
export { translatePermission };

export function PermissionsSetupPage() {
  const { user } = useAuth();

  // Verificar se é admin ou super admin
  const canSetupPermissions = user?.profile?.role === 'admin' || user?.profile?.role === 'super';

  if (!canSetupPermissions) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
          <p className="text-muted-foreground">
            Apenas administradores podem configurar permissões
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Gerenciar Usuários
        </h2>
        <p className="text-muted-foreground">
          Configure permissões e convide novos usuários para sua clínica
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="invite" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Convidar usuário
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserPermissionsManager />
        </TabsContent>

        <TabsContent value="invite">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Convidar Novos Usuários
              </CardTitle>
              <CardDescription>
                Envie convites por email para adicionar usuários à sua clínica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteUserForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <div className="space-y-6">
            {/* Permissões Padrão por Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissões Padrão por Cargo
                </CardTitle>
                <CardDescription>
                  Permissões automáticas concedidas a cada tipo de usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Administrador */}
                <div className="border rounded-lg p-4 bg-red-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-lg">Administrador</h3>
                    <Badge className="bg-red-100 text-red-800">Acesso Total</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Acesso completo a todas as funcionalidades do sistema
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {['patients.manage', 'professionals.manage', 'appointments.manage', 'financial.manage', 'reports.manage', 'confirmations.manage', 'settings.manage'].map(perm => {
                      const trans = translatePermission(perm);
                      const Icon = trans.icon;
                      return (
                        <div key={perm} className="flex items-center gap-2 text-sm bg-white p-2 rounded border">
                          <Icon className="h-4 w-4 text-red-600" />
                          <span className="font-medium">{trans.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Profissional */}
                <div className="border rounded-lg p-4 bg-blue-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCog className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">Profissional</h3>
                    <Badge className="bg-blue-100 text-blue-800">Operacional</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Acesso à agenda, pacientes e prontuários
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {['patients.read', 'patients.create', 'patients.update', 'appointments.read', 'appointments.create', 'appointments.update'].map(perm => {
                      const trans = translatePermission(perm);
                      const Icon = trans.icon;
                      return (
                        <div key={perm} className="flex items-center gap-2 text-sm bg-white p-2 rounded border">
                          <Icon className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{trans.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recepcionista */}
                <div className="border rounded-lg p-4 bg-green-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-lg">Recepcionista</h3>
                    <Badge className="bg-green-100 text-green-800">Atendimento</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Gerenciamento de pacientes, agenda e financeiro básico
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {['patients.read', 'patients.create', 'patients.update', 'appointments.read', 'appointments.create', 'appointments.update', 'financial.read', 'financial.create'].map(perm => {
                      const trans = translatePermission(perm);
                      const Icon = trans.icon;
                      return (
                        <div key={perm} className="flex items-center gap-2 text-sm bg-white p-2 rounded border">
                          <Icon className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{trans.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Responsável/Guardian */}
                <div className="border rounded-lg p-4 bg-purple-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-lg">Responsável</h3>
                    <Badge className="bg-purple-100 text-purple-800">Acesso Limitado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Visualização de informações dos pacientes vinculados
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {['patients.read', 'appointments.read'].map(perm => {
                      const trans = translatePermission(perm);
                      const Icon = trans.icon;
                      return (
                        <div key={perm} className="flex items-center gap-2 text-sm bg-white p-2 rounded border">
                          <Icon className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">{trans.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações Adicionais */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Permissões Customizadas:</strong> Você pode conceder permissões adicionais específicas 
                para cada usuário na aba "Usuários" clicando no botão "Editar".
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}