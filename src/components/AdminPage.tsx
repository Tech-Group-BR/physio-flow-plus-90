import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { 
  Settings, 
  Users, 
  CreditCard, 
  FileText, 
  Crown, 
  BarChart3, 
  Shield,
  LogOut,
  Building2,
  DollarSign,
  Package,
  UserCheck,
  Globe,
  HeadphonesIcon,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search
} from "lucide-react"
import { toast } from "sonner"
import { PaymentDashboard } from "@/components/PaymentDashboard"

// Tipos para os dados
interface Clinic {
  id: string;
  name: string;
  clinic_code: string;
  created_at: string;
  is_active: boolean;
  plan_type?: string;
  users_count?: number;
  last_payment?: string;
}

interface Payment {
  id: string;
  clinic_name: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  max_users: number;
  is_active: boolean;
}

export function AdminPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Estados principais
  const [activeTab, setActiveTab] = useState("dashboard");
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState({
    totalClinics: 0,
    activeClinics: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });

  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Só permite acesso se for super admin
  useEffect(() => {
    if (!loading && user?.profile?.role !== "super") {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.profile?.role === "super") {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Carregar clínicas
      const { data: clinicsData } = await supabase
        .from("clinic_settings")
        .select("*")
        .order("created_at", { ascending: false });
      
      setClinics(clinicsData || []);
      
      // Calcular estatísticas
      const totalClinics = clinicsData?.length || 0;
      const activeClinics = clinicsData?.filter(c => c.is_active).length || 0;
      
      setStats({
        totalClinics,
        activeClinics,
        totalRevenue: 0, // Implementar quando integrar com Asaas
        monthlyRevenue: 0
      });
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do painel");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
      toast.success("Logout realizado com sucesso");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              <h1 className="text-xl font-bold text-gray-900">Super Admin</h1>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              GoPhysioTech Administrator
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.profile?.full_name || user?.email}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4 space-y-2">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("dashboard")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            
            <Button
              variant={activeTab === "clinics" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("clinics")}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Clínicas
            </Button>
            
            <Button
              variant={activeTab === "payments" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("payments")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pagamentos
            </Button>
            
            <Button
              variant={activeTab === "plans" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("plans")}
            >
              <Package className="mr-2 h-4 w-4" />
              Planos
            </Button>
            
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("users")}
            >
              <Users className="mr-2 h-4 w-4" />
              Usuários
            </Button>
            
            <Button
              variant={activeTab === "landing" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("landing")}
            >
              <Globe className="mr-2 h-4 w-4" />
              Landing Page
            </Button>
            
            <Button
              variant={activeTab === "support" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("support")}
            >
              <HeadphonesIcon className="mr-2 h-4 w-4" />
              Suporte
            </Button>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Dashboard */}
            <TabsContent value="dashboard" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
                <p className="text-gray-600">Visão geral do sistema GoPhysioTech</p>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Clínicas</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalClinics}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.activeClinics} ativas
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">R$ {stats.totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      +R$ {stats.monthlyRevenue} este mês
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clínicas Ativas</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeClinics}</div>
                    <p className="text-xs text-muted-foreground">
                      {((stats.activeClinics / stats.totalClinics) * 100 || 0).toFixed(1)}% do total
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Suporte Pendente</CardTitle>
                    <HeadphonesIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Tickets abertos
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Clínicas Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clinics.slice(0, 5).map((clinic) => (
                        <div key={clinic.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{clinic.name}</p>
                            <p className="text-sm text-gray-500">
                              Código: {clinic.clinic_code}
                            </p>
                          </div>
                          <Badge 
                            variant={clinic.is_active ? "default" : "secondary"}
                            className={clinic.is_active ? "bg-green-100 text-green-800" : ""}
                          >
                            {clinic.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Próximas Funcionalidades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Integração completa com Asaas</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Sistema de tickets de suporte</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Analytics avançadas</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm">Gestão de períodos grátis</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Clínicas */}
            <TabsContent value="clinics" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestão de Clínicas</h2>
                  <p className="text-gray-600">Gerenciar todas as clínicas do sistema</p>
                </div>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Nova Clínica</span>
                </Button>
              </div>

              {/* Filtros */}
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar clínicas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="inactive">Inativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabela de Clínicas */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Clínicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clinics.map((clinic) => (
                        <TableRow key={clinic.id}>
                          <TableCell className="font-medium">{clinic.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{clinic.clinic_code}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={clinic.is_active ? "default" : "secondary"}
                              className={clinic.is_active ? "bg-green-100 text-green-800" : ""}
                            >
                              {clinic.is_active ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                          <TableCell>{clinic.plan_type || "Básico"}</TableCell>
                          <TableCell>
                            {new Date(clinic.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pagamentos */}
            <TabsContent value="payments" className="space-y-6">
              <PaymentDashboard />
            </TabsContent>

            {/* Planos */}
            <TabsContent value="plans" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestão de Planos</h2>
                  <p className="text-gray-600">Criar e gerenciar planos de assinatura</p>
                </div>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Novo Plano</span>
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>CRUD de Planos - Em Desenvolvimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Sistema de Planos
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Interface completa para criar, editar e gerenciar planos será implementada aqui.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium">Plano Básico</h4>
                        <p className="text-2xl font-bold">R$ 99/mês</p>
                        <p className="text-sm text-gray-600">Até 3 usuários</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium">Plano Pro</h4>
                        <p className="text-2xl font-bold">R$ 199/mês</p>
                        <p className="text-sm text-gray-600">Até 10 usuários</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium">Plano Enterprise</h4>
                        <p className="text-2xl font-bold">R$ 399/mês</p>
                        <p className="text-sm text-gray-600">Usuários ilimitados</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Outras abas com placeholder */}
            <TabsContent value="users" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestão de Usuários</h2>
                <p className="text-gray-600">Gerenciar usuários do sistema</p>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Interface de usuários será implementada</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="landing" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Landing Page Manager</h2>
                <p className="text-gray-600">Editar conteúdo da landing page</p>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Editor de landing page será implementado</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sistema de Suporte</h2>
                <p className="text-gray-600">Gerenciar tickets e suporte aos clientes</p>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <HeadphonesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Sistema de tickets será implementado</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}