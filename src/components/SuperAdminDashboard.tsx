import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown,
  Database, 
  Users, 
  Building2, 
  BarChart3,
  CreditCard,
  Activity,
  AlertTriangle,
  Shield,
  Settings,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionActions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClinicStats {
  clinic_id: string;
  clinic_name: string;
  clinic_created: string;
  clinic_users: number;
  clinic_patients: number;
  clinic_appointments: number;
}

interface GlobalStats {
  total_clinics: number;
  total_users: number;
  total_patients: number;
  appointments_last_30_days: number;
}

export function SuperAdminDashboard() {
  const { user } = useAuth();
  const { isSuperAdmin, superAdmin } = usePermissionActions();
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [clinicStats, setClinicStats] = useState<ClinicStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Verificar se é super admin
  if (!isSuperAdmin()) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
          <p className="text-muted-foreground">
            Apenas Super Administradores podem acessar este painel
          </p>
        </CardContent>
      </Card>
    );
  }

  // Carregar estatísticas (simuladas por enquanto, até migration ser executada)
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Por enquanto, dados simulados
      // Após migration, usar: SELECT * FROM super_admin_dashboard;
      
      setGlobalStats({
        total_clinics: 5,
        total_users: 25,
        total_patients: 150,
        appointments_last_30_days: 300
      });

      setClinicStats([
        {
          clinic_id: '1',
          clinic_name: 'FisioTech Centro',
          clinic_created: '2024-01-15',
          clinic_users: 8,
          clinic_patients: 45,
          clinic_appointments: 120
        },
        {
          clinic_id: '2', 
          clinic_name: 'FisioTech Norte',
          clinic_created: '2024-03-20',
          clinic_users: 6,
          clinic_patients: 35,
          clinic_appointments: 80
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar dados do sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClinic = () => {
    if (superAdmin.canCreateClinics()) {
      toast.success('Função de criar clínica será implementada');
    }
  };

  const handleManageSystemUsers = () => {
    if (superAdmin.canManageSystemUsers()) {
      toast.success('Painel de usuários do sistema será implementado');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Super Admin */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Crown className="h-8 w-8 text-yellow-500" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Painel de controle do sistema • Usuário: {user?.profile?.full_name}
          </p>
        </div>
        
        <div className="flex gap-2">
          {superAdmin.canCreateClinics() && (
            <Button onClick={handleCreateClinic}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Clínica
            </Button>
          )}
        </div>
      </div>

      {/* Alert de Funcionalidade */}
      <Alert>
        <Crown className="h-4 w-4" />
        <AlertDescription>
          <strong>Super Admin Ativo:</strong> Você tem acesso a todas as clínicas e funcionalidades do sistema.
          Execute a migration para ativar todas as funcionalidades.
        </AlertDescription>
      </Alert>

      {/* Estatísticas Globais */}
      {globalStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clínicas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.total_clinics}</div>
              <p className="text-xs text-muted-foreground">Ativas no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.total_users}</div>
              <p className="text-xs text-muted-foreground">Todas as clínicas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.total_patients}</div>
              <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos (30d)</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.appointments_last_30_days}</div>
              <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de Funcionalidades */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="clinics">Clínicas</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="logs">Logs & Debug</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Clínicas por Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance das Clínicas</CardTitle>
                <CardDescription>Agendamentos nos últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clinicStats.map((clinic) => (
                    <div key={clinic.clinic_id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{clinic.clinic_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {clinic.clinic_users} usuários • {clinic.clinic_patients} pacientes
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {clinic.clinic_appointments} agend.
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações de Super Admin</CardTitle>
                <CardDescription>Funcionalidades exclusivas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {superAdmin.canManageSystemUsers() && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleManageSystemUsers}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Gerenciar Usuários do Sistema
                  </Button>
                )}

                {superAdmin.canViewGlobalStats() && (
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Relatórios Globais
                  </Button>
                )}

                {superAdmin.canManageBilling() && (
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Gerenciar Cobrança
                  </Button>
                )}

                {superAdmin.canAccessDatabase() && (
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="mr-2 h-4 w-4" />
                    Acesso ao Banco de Dados
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gerenciar Clínicas */}
        <TabsContent value="clinics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Todas as Clínicas do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clinicStats.map((clinic) => (
                  <Card key={clinic.clinic_id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{clinic.clinic_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Criada em: {new Date(clinic.clinic_created).toLocaleDateString('pt-BR')}
                          </p>
                          <div className="flex gap-4 mt-2">
                            <span className="text-sm">👥 {clinic.clinic_users} usuários</span>
                            <span className="text-sm">🏥 {clinic.clinic_patients} pacientes</span>
                            <span className="text-sm">📅 {clinic.clinic_appointments} agendamentos</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Settings className="mr-2 h-4 w-4" />
                            Configurar
                          </Button>
                          {superAdmin.canDeleteClinics() && (
                            <Button variant="destructive" size="sm">
                              Suspender
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sistema */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="mr-2 h-4 w-4" />
                  Backup do Sistema
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações Globais
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  Gerenciar Permissões
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Status do Banco</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>API Status</span>
                    <Badge className="bg-green-100 text-green-800">Funcionando</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sistema de Permissões</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Aguardando Migration</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs & Debug */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Sistema de Logs
              </CardTitle>
              <CardDescription>
                Disponível após executar a migration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  Execute <code>supabase db push</code> para ativar o sistema de logs completo.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}