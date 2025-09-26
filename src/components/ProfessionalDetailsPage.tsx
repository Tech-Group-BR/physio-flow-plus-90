import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock,
  Star,
  Award,
  Phone,
  Mail,
  MapPin,
  ChartBar,
  FileText,
  Activity,
  Target,
  CheckCircle2,
  UserCheck,
  Eye
} from "lucide-react";
import { Professional, Patient, Appointment } from "@/types";
import { useClinic } from '@/contexts/ClinicContext';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';

interface ProfessionalStats {
  totalAppointments: number;
  completedAppointments: number;
  totalPatients: number;
  monthlyRevenue: number;
  monthlyPending: number;
  averageRating: number;
  completionRate: number;
  upcomingAppointments: number;
  cancelledAppointments: number;
  revenueGrowth: number;
  patientsGrowth: number;
}

export function ProfessionalDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    professionals, 
    patients, 
    appointments, 
    accountsReceivable,
    updateProfessional 
  } = useClinic();
  const { clinicId } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState<ProfessionalStats>({
    totalAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0,
    monthlyRevenue: 0,
    monthlyPending: 0,
    averageRating: 4.8,
    completionRate: 0,
    upcomingAppointments: 0,
    cancelledAppointments: 0,
    revenueGrowth: 0,
    patientsGrowth: 0
  });

  const professional = professionals.find(p => p.id === id);

  // Calcular estatísticas
  useEffect(() => {
    if (!professional || !id) {
      setIsLoading(false);
      return;
    }

    console.log('🔄 Calculando estatísticas para profissional:', professional.name);
    console.log('📊 AccountsReceivable disponíveis:', accountsReceivable.length);
    console.log('📅 Appointments disponíveis:', appointments.length);

    const professionalAppointments = appointments.filter(a => a.professionalId === id);
    const now = new Date();
    const currentMonth = {
      start: startOfMonth(now),
      end: endOfMonth(now)
    };

    console.log('👤 Appointments do profissional:', professionalAppointments.length);

    const completedAppointments = professionalAppointments.filter(a => 
      a.status === 'realizado'
    );
    
    const upcomingAppointments = professionalAppointments.filter(a => 
      new Date(a.date) > now && (a.status === 'marcado' || a.status === 'confirmado')
    );

    const cancelledAppointments = professionalAppointments.filter(a => 
      a.status === 'cancelado'
    );

    console.log('✅ Appointments realizados:', completedAppointments.length);

    // Receita mensal baseada no professional_id direto do banco
    const monthlyReceivables = accountsReceivable.filter(ar => 
      ar.professional_id === id &&
      isWithinInterval(new Date(ar.dueDate), currentMonth) &&
      ar.status === 'recebido'
    );

    const monthlyRevenue = monthlyReceivables.reduce((sum, ar) => sum + ar.amount, 0);

    console.log('💰 Recebimentos do mês:', monthlyReceivables.length, 'Total:', monthlyRevenue);

    // Valores a receber (pendentes) do mês atual
    const pendingReceivables = accountsReceivable.filter(ar => 
      ar.professional_id === id &&
      isWithinInterval(new Date(ar.dueDate), currentMonth) &&
      ar.status === 'pendente'
    );

    const monthlyPending = pendingReceivables.reduce((sum, ar) => sum + ar.amount, 0);

    console.log('⏳ Pendentes do mês:', pendingReceivables.length, 'Total:', monthlyPending);

    // Calcular evolução mensal real (mês atual vs anterior)
    const lastMonth = {
      start: startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      end: endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    };

    const lastMonthRevenue = accountsReceivable
      .filter(ar => 
        ar.professional_id === id &&
        isWithinInterval(new Date(ar.dueDate), lastMonth) &&
        ar.status === 'recebido'
      )
      .reduce((sum, ar) => sum + ar.amount, 0);

    const lastMonthPatients = new Set(
      professionalAppointments
        .filter(a => 
          isWithinInterval(new Date(a.date), lastMonth) && 
          a.status === 'realizado' // Apenas consultas realizadas no mês anterior
        )
        .map(a => a.patientId)
    ).size;

    const revenueGrowth = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : monthlyRevenue > 0 ? 100 : 0;

    const uniquePatients = new Set(
      professionalAppointments
        .filter(a => a.status === 'realizado') // Apenas consultas realizadas
        .map(a => a.patientId)
    ).size;
    
    console.log('👥 Pacientes únicos com consultas realizadas:', uniquePatients);
    
    const completionRate = professionalAppointments.length > 0 
      ? (completedAppointments.length / professionalAppointments.length) * 100 
      : 0;

    const patientsGrowth = lastMonthPatients > 0 
      ? ((uniquePatients - lastMonthPatients) / lastMonthPatients) * 100 
      : uniquePatients > 0 ? 100 : 0;

    setStats({
      totalAppointments: professionalAppointments.length,
      completedAppointments: completedAppointments.length,
      totalPatients: uniquePatients,
      monthlyRevenue,
      monthlyPending,
      averageRating: 0, // N/A - sistema de avaliação não implementado ainda
      completionRate,
      upcomingAppointments: upcomingAppointments.length,
      cancelledAppointments: cancelledAppointments.length,
      revenueGrowth,
      patientsGrowth
    });

    setIsLoading(false);
  }, [professional?.id, appointments, accountsReceivable, id]);

  const handleEditProfessional = async (updatedData: Partial<Professional>) => {
    if (!professional) return;
    
    try {
      await updateProfessional(professional.id, updatedData);
      setIsEditing(false);
      toast.success('Dados atualizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar dados');
      console.error('Erro:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/profissionais')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Lista de Profissionais
        </Button>
        <div className="text-center text-gray-500">
          Profissional não encontrado.
        </div>
      </div>
    );
  }

  const renderDetail = (label: string, value: string | undefined | null) => {
    if (!value || value.trim() === '') return null;
    return (
      <div>
        <span className="font-medium text-gray-900">{label}:</span>
        <span className="ml-2 text-gray-600">{value}</span>
      </div>
    );
  };

  const getRecentAppointments = () => {
    const professionalAppointments = appointments.filter(a => a.professionalId === id);
    return professionalAppointments
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    const professionalAppointments = appointments.filter(a => a.professionalId === id);
    return professionalAppointments
      .filter(a => new Date(a.date) > now && (a.status === 'marcado' || a.status === 'confirmado'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  };

  const getProfessionalPatients = () => {
    return patients.filter(p => 
      appointments.some(a => 
        a.patientId === p.id && 
        a.professionalId === id && 
        a.status === 'realizado' // Apenas pacientes com consultas realizadas
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/profissionais')} className="hidden sm:inline-flex">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center space-x-4">
            {professional.profile_picture_url && (
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                <img 
                  src={professional.profile_picture_url} 
                  alt={professional.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{professional.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={professional.isActive ? "default" : "secondary"}>
                  {professional.isActive ? "Ativo" : "Inativo"}
                </Badge>
                {professional.crefito && (
                  <Badge variant="outline">CREFITO: {professional.crefito}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4" />
            Editar Perfil
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Consultas</p>
                <p className="text-2xl font-bold">{stats.totalAppointments}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pacientes Atendidos</p>
                <p className="text-2xl font-bold">{stats.totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Mensal</p>
                <p className="text-2xl font-bold">R$ {stats.monthlyRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">A Receber (Mês)</p>
                <p className="text-2xl font-bold">R$ {stats.monthlyPending.toFixed(2)}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Conclusão</p>
                <p className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto w-full justify-start sm:grid sm:grid-cols-5">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Visão Geral</TabsTrigger>
          <TabsTrigger value="patients" className="text-xs sm:text-sm py-2">Pacientes</TabsTrigger>
          <TabsTrigger value="appointments" className="text-xs sm:text-sm py-2">Consultas</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs sm:text-sm py-2">Financeiro</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">Relatórios</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <UserCheck className="mr-2 h-5 w-5" />
                  Informações Profissionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {renderDetail("Nome completo", professional.name)}
                {renderDetail("Email", professional.email)}
                {renderDetail("Telefone", professional.phone)}
                {renderDetail("CREFITO", professional.crefito)}
                {professional.specialties && professional.specialties.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-900">Especialidades:</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {professional.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {renderDetail("Biografia", professional.bio)}
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Consultas Concluídas</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{stats.completedAppointments}</span>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Próximas Consultas</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{stats.upcomingAppointments}</span>
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avaliação Média</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-500">N/A</span>
                    <Star className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cancelamentos</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{stats.cancelledAppointments}</span>
                    <Activity className="h-4 w-4 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Próximas Consultas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Próximas Consultas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getUpcomingAppointments().length > 0 ? (
                <div className="space-y-3">
                  {getUpcomingAppointments().map((appointment) => {
                    const patient = patients.find(p => p.id === appointment.patientId);
                    return (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div>
                            <Link 
                              to={`/pacientes/${patient?.id}`}
                              className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              {patient?.fullName || 'Paciente não encontrado'}
                            </Link>
                            <p className="text-sm text-gray-600">
                              {format(new Date(appointment.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{appointment.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhuma consulta agendada.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Pacientes Atendidos ({getProfessionalPatients().length})
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (apenas consultas realizadas)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getProfessionalPatients().length > 0 ? (
                <div className="grid gap-4">
                  {getProfessionalPatients().map((patient) => {
                    const patientAppointments = appointments.filter(a => 
                      a.patientId === patient.id && a.professionalId === id
                    );
                    const realizedAppointments = patientAppointments.filter(a => a.status === 'realizado');
                    const lastAppointment = realizedAppointments
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    
                    return (
                      <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <Link 
                              to={`/pacientes/${patient.id}`}
                              className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              {patient.fullName}
                            </Link>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {realizedAppointments.length} consultas realizadas
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {patientAppointments.length} total
                              </Badge>
                              {lastAppointment && (
                                <span className="text-xs text-gray-500">
                                  Última: {format(new Date(lastAppointment.date), 'dd/MM/yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={patient.isActive ? "default" : "secondary"}>
                            {patient.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                          <Link to={`/pacientes/${patient.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhum paciente atendido ainda.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consultas Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Consultas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getRecentAppointments().length > 0 ? (
                  <div className="space-y-3">
                    {getRecentAppointments().map((appointment) => {
                      const patient = patients.find(p => p.id === appointment.patientId);
                      return (
                        <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <Link 
                              to={`/pacientes/${patient?.id}`}
                              className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              {patient?.fullName || 'Paciente não encontrado'}
                            </Link>
                            <p className="text-sm text-gray-600">
                              {format(new Date(appointment.date), "dd/MM/yyyy 'às' HH:mm")}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              appointment.status === 'realizado' ? 'default' :
                              appointment.status === 'cancelado' ? 'destructive' : 'secondary'
                            }
                          >
                            {appointment.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhuma consulta registrada.</p>
                )}
              </CardContent>
            </Card>

            {/* Status das Consultas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <ChartBar className="mr-2 h-5 w-5" />
                  Status das Consultas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Agendadas</span>
                  <Badge variant="secondary">{stats.upcomingAppointments}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Concluídas</span>
                  <Badge variant="default">{stats.completedAppointments}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Canceladas</span>
                  <Badge variant="destructive">{stats.cancelledAppointments}</Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Taxa de Conclusão</span>
                    <span className="font-bold text-green-600">{stats.completionRate.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Receita Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  R$ {stats.monthlyRevenue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consultas Pagas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {accountsReceivable.filter(ar => 
                    ar.professional_id === id && 
                    ar.status === 'recebido'
                  ).length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Este mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">A Receber</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">
                  R$ {stats.monthlyPending.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Pendente este mês</p>
              </CardContent>
            </Card>
          </div>

          {/* Recebimentos Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recebimentos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {accountsReceivable
                .filter(ar => 
                  ar.professional_id === id && 
                  ar.status === 'recebido'
                )
                .slice(0, 10)
                .map((receivable) => {
                  const patient = patients.find(p => p.id === receivable.patientId);
                  return (
                    <div key={receivable.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                      <div>
                        <Link 
                          to={`/pacientes/${patient?.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          {patient?.fullName || 'Paciente não encontrado'}
                        </Link>
                        <p className="text-sm text-gray-600">
                          {format(new Date(receivable.dueDate), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          R$ {receivable.amount.toFixed(2)}
                        </p>
                        <Badge variant="default" className="text-xs">Pago</Badge>
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  Métricas de Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Taxa de Conclusão</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${stats.completionRate}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold">{stats.completionRate.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Satisfação do Cliente</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${(stats.averageRating / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold">{stats.averageRating}/5.0</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Retenção de Pacientes</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-400 h-2 rounded-full w-0"></div>
                    </div>
                    <span className="font-semibold text-gray-500">N/A</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Evolução Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Crescimento de Pacientes</p>
                    <p className={`text-2xl font-bold ${
                      stats.patientsGrowth === 0 ? 'text-gray-500' :
                      stats.patientsGrowth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.patientsGrowth === 0 ? 'N/A' : 
                        (stats.patientsGrowth > 0 ? '+' : '') + stats.patientsGrowth.toFixed(1) + '%'
                      }
                    </p>
                    <p className="text-xs text-gray-500">vs. mês anterior</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Crescimento de Receita</p>
                    <p className={`text-2xl font-bold ${
                      stats.revenueGrowth === 0 ? 'text-gray-500' :
                      stats.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.revenueGrowth === 0 ? 'N/A' : 
                        (stats.revenueGrowth > 0 ? '+' : '') + stats.revenueGrowth.toFixed(1) + '%'
                      }
                    </p>
                    <p className="text-xs text-gray-500">vs. mês anterior</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Relatório Detalhado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm">
                <p>
                  O profissional <strong>{professional.name}</strong> demonstrou excelente performance 
                  no período analisado, com uma taxa de conclusão de <strong>{stats.completionRate.toFixed(1)}%</strong> 
                  e um total de <strong>{stats.totalPatients} pacientes únicos</strong> atendidos.
                </p>
                
                <p>
                  A receita mensal atual de <strong>R$ {stats.monthlyRevenue.toFixed(2)}</strong> 
                  {stats.completedAppointments > 0 && (
                    <> representa um valor médio de <strong>R$ {(stats.monthlyRevenue / stats.completedAppointments).toFixed(2)}</strong> por consulta realizada.</>
                  )}
                  {stats.monthlyPending > 0 && (
                    <> Há ainda <strong>R$ {stats.monthlyPending.toFixed(2)}</strong> a receber este mês.</>
                  )}
                </p>

                {professional.specialties && professional.specialties.length > 0 && (
                  <p>
                    Suas especialidades em <strong>{professional.specialties.join(', ')}</strong> 
                    contribuem para um atendimento especializado e diferenciado.
                  </p>
                )}
                
                <p className="text-sm text-gray-600 mt-4">
                  <em>Nota: Algumas métricas como avaliação de pacientes e taxa de retenção ainda não estão implementadas no sistema.</em>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Professional Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Editar Informações</h2>
            <p className="text-sm text-gray-600">
              Funcionalidade de edição será implementada aqui...
            </p>
            <Button onClick={() => setIsEditing(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}