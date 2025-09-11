
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  UserX, 
  AlertCircle, 
  Phone,
  Activity,
  CreditCard,
  FileText,
  UserPlus,
  CalendarPlus,
  PiggyBank
} from "lucide-react";
import { useClinic } from "@/contexts/ClinicContext";
import { format, isToday, isThisWeek, isThisMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Dashboard() {
  const { dashboardStats, appointments, patients, physiotherapists, payments, leads, loading } = useClinic();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-12 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do sistema...</p>
        </div>
      </div>
    );
  }

  // Get today's appointments with details
  const todayAppointments = appointments.filter(apt => isToday(new Date(apt.date)));
  const upcomingAppointments = todayAppointments.slice(0, 5);

  // Recent activities
  const recentPayments = payments
    .filter(p => isThisWeek(new Date(p.createdAt)))
    .slice(0, 3);

  const newLeadsThisWeek = leads
    .filter(l => isThisWeek(new Date(l.createdAt)))
    .slice(0, 3);

  // Usar estatísticas calculadas ou valores padrão
  const stats = dashboardStats || {
    todayAppointments: 0,
    weekAppointments: 0,
    monthAppointments: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    activePatients: patients.filter(p => p.isActive).length,
    inactivePatients: patients.filter(p => !p.isActive).length,
    missedAppointments: 0,
    newLeads: 0,
    convertedLeads: 0,
    accountsPayableTotal: 0,
    accountsReceivableTotal: 0
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.weekAppointments} esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activePatients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.inactivePatients} inativos
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              R$ {stats.pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendente
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.newLeads}</div>
            <p className="text-xs text-muted-foreground">
              {stats.convertedLeads} convertidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fisioterapeutas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{physiotherapists.filter(p => p.isActive).length}</div>
            <p className="text-xs text-muted-foreground">ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faltas</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.missedAppointments}</div>
            <p className="text-xs text-muted-foreground">este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {stats.accountsPayableTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.accountsReceivableTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Atendimentos de Hoje</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => {
                  const patient = patients.find(p => p.id === appointment.patientId);
                  const physio = physiotherapists.find(p => p.id === appointment.physiotherapistId);
                  
                  return (
                    <div key={appointment.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium">{patient?.fullName || 'Paciente'}</div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.time} - {physio?.name || 'Fisioterapeuta'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {appointment.treatmentType}
                        </div>
                      </div>
                      <Badge 
                        variant={appointment.status === 'confirmado' ? 'default' : 'secondary'}
                        className={
                          appointment.status === 'confirmado' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'marcado' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'faltante' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhum atendimento agendado para hoje
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Atividades Recentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.map((payment) => {
                const patient = patients.find(p => p.id === payment.patientId);
                return (
                  <div key={payment.id} className="flex items-center space-x-3 p-2 rounded">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        Pagamento - {patient?.fullName || 'Paciente'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <Badge variant={payment.status === 'pago' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                  </div>
                );
              })}

              {newLeadsThisWeek.map((lead) => (
                <div key={lead.id} className="flex items-center space-x-3 p-2 rounded">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Novo Lead - {lead.name}</div>
                    <div className="text-xs text-muted-foreground">{lead.source}</div>
                  </div>
                  <Badge variant="outline">{lead.status}</Badge>
                </div>
              ))}

              {recentPayments.length === 0 && newLeadsThisWeek.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>Sistema Funcionando</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Pacientes:</span> {patients.length}
            </div>
            <div>
              <span className="font-medium">Fisioterapeutas:</span> {physiotherapists.length}
            </div>
            <div>
              <span className="font-medium">Agendamentos:</span> {appointments.length}
            </div>
            <div>
              <span className="font-medium">Status:</span> <span className="text-green-600">Online</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
