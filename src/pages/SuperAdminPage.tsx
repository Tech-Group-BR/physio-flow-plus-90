import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Users, 
  Building, 
  Activity, 
  TrendingUp, 
  Database, 
  Settings, 
  AlertTriangle,
  Shield,
  Monitor,
  Clock
} from 'lucide-react';

interface GlobalStats {
  totalClinics: number;
  totalUsers: number;
  totalPatients: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  systemLoad: number;
}

interface ClinicInfo {
  id: string;
  name: string;
  email: string;
  created_at: string;
  is_active: boolean;
  users_count: number;
  patients_count: number;
  plan: string;
  last_login: string;
}

interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  source: string;
}

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [clinics, setClinics] = useState<ClinicInfo[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  // Verificar se é super admin
  useEffect(() => {
    if (user && user.role !== 'super') {
      toast.error('Acesso negado. Apenas super administradores podem acessar esta página.');
    }
  }, [user]);

  if (!user || user.role !== 'super') {
    return <Navigate to="/" replace />;
  }

  const fetchGlobalStats = async () => {
    try {
      // Buscar estatísticas de forma separada
      const [clinicsResult, usersResult, patientsResult] = await Promise.all([
        supabase.from('clinic_settings').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('patients').select('*', { count: 'exact', head: true })
      ]);

      setGlobalStats({
        totalClinics: clinicsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalPatients: patientsResult.count || 0,
        activeSubscriptions: clinicsResult.count || 0, // Aproximação
        monthlyRevenue: 0, // TODO: Implementar sistema de cobrança
        systemLoad: Math.floor(Math.random() * 100) // Mock
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas globais:', error);
      toast.error('Erro ao carregar estatísticas');
    }
  };

  const fetchClinics = async () => {
    try {
      // Super admin pode ver todas as clínicas
      const { data, error } = await supabase
        .from('clinic_settings')
        .select(`
          id,
          name,
          email,
          created_at,
          is_active,
          clinic_code
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar contagem de usuários para cada clínica
      const clinicsWithStats = await Promise.all(
        data.map(async (clinic) => {
          const { count: usersCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinic.id);

          const { count: patientsCount } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinic.id);

          return {
            id: clinic.id,
            name: clinic.name,
            email: clinic.email,
            created_at: clinic.created_at,
            is_active: clinic.is_active,
            users_count: usersCount || 0,
            patients_count: patientsCount || 0,
            plan: 'Premium', // Mock
            last_login: '2024-10-06' // Mock
          };
        })
      );

      setClinics(clinicsWithStats);
    } catch (error) {
      console.error('Erro ao buscar clínicas:', error);
      toast.error('Erro ao carregar clínicas');
    }
  };

  const fetchSystemLogs = async () => {
    // Mock de logs do sistema
    setSystemLogs([
      {
        id: '1',
        level: 'info',
        message: 'Nova clínica criada: PhysioFlow Centro',
        timestamp: new Date().toISOString(),
        source: 'system'
      },
      {
        id: '2',
        level: 'warning',
        message: 'Alto uso de CPU detectado no servidor',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        source: 'monitoring'
      },
      {
        id: '3',
        level: 'error',
        message: 'Falha na sincronização do WhatsApp API',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        source: 'whatsapp'
      }
    ]);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchGlobalStats(),
        fetchClinics(),
        fetchSystemLogs()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  const toggleClinicStatus = async (clinicId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('clinic_settings')
        .update({ is_active: !currentStatus })
        .eq('id', clinicId);

      if (error) throw error;

      toast.success(`Clínica ${!currentStatus ? 'ativada' : 'desativada'} com sucesso`);
      fetchClinics(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao alterar status da clínica:', error);
      toast.error('Erro ao alterar status da clínica');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel Super Administrador</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema PhysioFlow Plus
          </p>
        </div>
        <Badge variant="destructive" className="text-sm">
          <Shield className="w-4 h-4 mr-1" />
          Super Admin
        </Badge>
      </div>

      {/* Estatísticas Globais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clínicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-blue-500" />
              <span className="text-2xl font-bold">{globalStats?.totalClinics || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold">{globalStats?.totalUsers || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-2xl font-bold">{globalStats?.totalPatients || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="text-2xl font-bold">{globalStats?.activeSubscriptions || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold">R$ {globalStats?.monthlyRevenue || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Carga do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4 text-red-500" />
              <span className="text-2xl font-bold">{globalStats?.systemLoad || 0}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clinics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clinics">Clínicas</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="clinics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Clínicas</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as clínicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clinics.map((clinic) => (
                  <div
                    key={clinic.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{clinic.name}</h3>
                        <Badge variant={clinic.is_active ? "default" : "secondary"}>
                          {clinic.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{clinic.email}</p>
                      <div className="flex space-x-4 text-sm text-muted-foreground">
                        <span>{clinic.users_count} usuários</span>
                        <span>{clinic.patients_count} pacientes</span>
                        <span>Plano: {clinic.plan}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant={clinic.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleClinicStatus(clinic.id, clinic.is_active)}
                      >
                        {clinic.is_active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button variant="outline" size="sm">
                        Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>
                Monitore atividades e problemas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemLogs.map((log) => (
                  <div key={log.id} className="flex items-center space-x-3 p-3 border rounded">
                    {log.level === 'error' && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    {log.level === 'warning' && (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                    {log.level === 'info' && (
                      <Database className="w-4 h-4 text-blue-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{log.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()} • {log.source}
                      </p>
                    </div>
                    <Badge variant={
                      log.level === 'error' ? 'destructive' : 
                      log.level === 'warning' ? 'secondary' : 'default'
                    }>
                      {log.level}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações Globais
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="w-4 h-4 mr-2" />
                  Backup do Banco
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Monitor className="w-4 h-4 mr-2" />
                  Manutenção
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Administrativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Gerenciar Usuários
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Permissões Globais
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Relatórios Gerais
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}