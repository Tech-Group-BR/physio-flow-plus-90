import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClinic } from "@/contexts/ClinicContext";
import { useAuth } from "@/hooks/useAuth"; // ✅ MUDANÇA: Import correto
import { format, isToday, isThisWeek, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  PiggyBank,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { useMemo, useEffect } from "react";

// Componente para o estado de Carregamento (Loading)
function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", {
            locale: ptBR,
          })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-28"></div>
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

export function Dashboard() {
  const {
    dashboardStats,
    appointments,
    patients,
    professionals,
    accountsReceivable,
    accountsPayable,
    leads,
    loading,
    clinicSettings,
    fetchClinicSettings,
  } = useClinic();

  // ✅ CORREÇÃO: Usar useAuth correto e acessar user como AppUser
  const { user, clinicId, clinicCode } = useAuth();

  // Buscar configurações da clínica ao montar o componente
  useEffect(() => {
    fetchClinicSettings();
  }, [fetchClinicSettings]);

  // 💰 Função para determinar status da conta (mesma lógica do FinancialPage)
  const getAccountStatus = (account: {
    dueDate: string;
    paidDate?: string | null;
    receivedDate?: string | null;
  }) => {
    if (account.paidDate || account.receivedDate) {
      return account.paidDate ? "pago" : "recebido";
    }
    if (isBefore(parseISO(account.dueDate), startOfDay(new Date()))) {
      return "vencido";
    }
    return "pendente";
  };

  // --- 1. Cálculos e Lógica com useMemo para Performance e Segurança ---

  const stats = useMemo(() => {
    const safePatients = patients || [];
    const safeAppointments = appointments || [];
    const safeReceivables = accountsReceivable || [];
    const safePayables = accountsPayable || [];

    // 💰 Calcular valores financeiros reais (mesma lógica do FinancialPage)
    let totalRevenue = 0; // Total recebido
    let pendingRevenue = 0; // Total pendente para receber
    let accountsReceivableTotal = 0; // Total de contas a receber
    let accountsPayableTotal = 0; // Total de contas a pagar
    let totalPayablesPaid = 0; // Total pago
    let totalPayablesPending = 0; // Total pendente para pagar
    
    // Processar contas a receber
    safeReceivables.forEach((ar) => {
      const status = getAccountStatus(ar);
      const amount = Number(ar.amount) || 0;
      accountsReceivableTotal += amount;
      
      if (status === "recebido") {
        totalRevenue += amount;
      } else if (status === "pendente" || status === "vencido") {
        pendingRevenue += amount;
      }
    });

    // Processar contas a pagar
    safePayables.forEach((ap) => {
      const status = getAccountStatus(ap);
      const amount = Number(ap.amount) || 0;
      accountsPayableTotal += amount;
      
      if (status === "pago") {
        totalPayablesPaid += amount;
      } else if (status === "pendente" || status === "vencido") {
        totalPayablesPending += amount;
      }
    });

    const calculatedStats = {
      todayAppointments: safeAppointments.filter((apt) => isToday(parseISO(apt.date))).length,
      weekAppointments: safeAppointments.filter((apt) => isThisWeek(parseISO(apt.date), { weekStartsOn: 1 })).length,
      activePatients: safePatients.filter((p) => p.isActive).length,
      inactivePatients: safePatients.filter((p) => !p.isActive).length,
      totalRevenue, // Total já recebido
      pendingRevenue, // Total pendente
      accountsReceivableTotal, // Total contas a receber
      accountsPayableTotal, // Total contas a pagar
      totalPayablesPaid, // Total já pago
      totalPayablesPending, // Total pendente para pagar
      missedAppointments: 0,
      newLeads: 0,
      convertedLeads: 0,
    };
    return { ...calculatedStats, ...(dashboardStats || {}) };
  }, [dashboardStats, appointments, patients, accountsReceivable, accountsPayable]);

  const upcomingAppointments = useMemo(
    () =>
      (appointments || [])
        .filter((apt) => isToday(parseISO(apt.date)))
        .sort((a, b) => a.time.localeCompare(b.time))
        .slice(0, 5),
    [appointments],
  );

  const recentPaidReceivables = useMemo(
    () =>
      (accountsReceivable || [])
        .filter(
          (r) =>
            r.status === "recebido" &&
            r.receivedDate &&
            isThisWeek(parseISO(r.receivedDate), { weekStartsOn: 1 })
        )
        .slice(0, 3),
    [accountsReceivable],
  );

  const newLeadsThisWeek = useMemo(
    () =>
      (leads || [])
        .filter((l) => l.createdAt && isThisWeek(parseISO(l.createdAt), { weekStartsOn: 1 }))
        .slice(0, 3),
    [leads],
  );
  
  const activeProfessionalsCount = useMemo(
      () => (professionals || []).filter(p => p.isActive).length,
      [professionals]
  );

  // ✅ CORREÇÃO: Informações da clínica usando clinicSettings
  const clinicInfo = useMemo(() => {
    if (!clinicSettings || !user?.profile) return null;
    
    return {
      clinicCode: clinicSettings.clinicCode,
      clinicName: clinicSettings.name,
      userRole: user.profile.role,
      userName: user.profile.full_name,
      userEmail: user.profile.email
    };
  }, [clinicSettings, user]);

  // --- 2. Renderização ---

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          {/* ✅ CORREÇÃO: Mostrar informações da clínica */}
          {clinicInfo && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Clínica: <span className="font-medium text-foreground">{clinicInfo.clinicName}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Código: {clinicInfo.clinicCode} | {clinicInfo.userName} ({clinicInfo.userRole})
              </p>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", {
            locale: ptBR,
          })}
        </p>
      </div>

      {/* ✅ Card de boas-vindas específico da clínica */}
      {clinicInfo && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Bem-vindo, {clinicInfo.userName}!</h3>
               
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid Principal de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">{stats.weekAppointments} esta semana</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activePatients}</div>
            <p className="text-xs text-muted-foreground">{stats.inactivePatients} inativos</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              R$ {stats.pendingRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} pendente
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
            <p className="text-xs text-muted-foreground">{stats.convertedLeads} convertidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid Secundário de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Fisioterapeutas</CardTitle><Activity className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{activeProfessionalsCount}</div><p className="text-xs text-muted-foreground">ativos</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Faltas no Mês</CardTitle><UserX className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.missedAppointments}</div><p className="text-xs text-muted-foreground">este mês</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">R$ {stats.totalPayablesPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div><p className="text-xs text-muted-foreground">pendentes</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Contas a Receber</CardTitle><PiggyBank className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">R$ {stats.pendingRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div><p className="text-xs text-muted-foreground">pendentes</p></CardContent></Card>
      </div>
      
      {/* Agendamentos e Atividades Recentes */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center space-x-2"><Clock className="h-5 w-5" /><span>Próximos Atendimentos de Hoje</span></CardTitle></CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => {
                  const patient = (patients || []).find((p) => p.id === appointment.patientId);
                  const physio = (professionals || []).find((p) => p.id === appointment.professionalId);
                  return (
                    <div key={appointment.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium">{patient?.fullName || "Paciente"}</div>
                        <div className="text-sm text-muted-foreground">{appointment.time} - {physio?.name || "Profissional"}</div>
                      </div>
                      <Badge variant={appointment.status === 'confirmado' ? 'default' : 'secondary'}>{appointment.status}</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (<p className="text-muted-foreground text-center py-8">Nenhum atendimento agendado para hoje.</p>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center space-x-2"><Activity className="h-5 w-5" /><span>Atividades Recentes</span></CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPaidReceivables.map((receivable) => {
                  const patient = (patients || []).find(p => p.id === receivable.patientId);
                  return (
                      <div key={receivable.id} className="flex items-center space-x-3 p-2 rounded">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div className="flex-1">
                              <div className="text-sm font-medium">Recebimento - {patient?.fullName || 'Paciente'}</div>
                              <div className="text-xs text-muted-foreground">
                                R$ {receivable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">{receivable.status}</Badge>
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
              {recentPaidReceivables.length === 0 && newLeadsThisWeek.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Nenhuma atividade recente na última semana.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}