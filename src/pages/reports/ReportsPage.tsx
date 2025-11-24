import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClinic } from "@/contexts/ClinicContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, Legend } from 'recharts';
import { CalendarDays, Users, DollarSign, TrendingUp, Download, Calendar, User, Package, Phone } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ReportsPage() {
  const { appointments, patients, accountsReceivable, professionals } = useClinic();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedPhysio, setSelectedPhysio] = useState('all');

  // --- Otimização Centralizada com useMemo ---
  // Todos os cálculos são feitos aqui, uma única vez por mudança nos filtros ou dados.
  const reportData = useMemo(() => {
    // 1. Dados seguros com fallback para evitar erros
    const safeAppointments = appointments || [];
    const safePatients = patients || [];
    const safeReceivables = accountsReceivable || [];
    const safeProfessionals = professionals || [];

    const fromDate = parseISO(dateFrom);
    const toDate = endOfMonth(parseISO(dateTo));

    // 2. Filtros principais aplicados uma vez
    const filteredAppointments = safeAppointments.filter(apt => {
      const aptDate = parseISO(apt.date);
      const withinDateRange = isWithinInterval(aptDate, { start: fromDate, end: toDate });
      const matchesPhysio = selectedPhysio === 'all' || apt.professionalId === selectedPhysio;
      return withinDateRange && matchesPhysio;
    });

    const receivedInPeriod = safeReceivables.filter(r => {
      if (!r.receivedDate || r.status !== 'recebido') return false;
      const receivedDate = parseISO(r.receivedDate);
      return isWithinInterval(receivedDate, { start: fromDate, end: toDate });
    });

    // 3. KPIs e métricas principais
    const totalAppointments = filteredAppointments.length;
    const confirmedAppointments = filteredAppointments.filter(apt => apt.status === 'confirmado').length;
    const missedAppointments = filteredAppointments.filter(apt => apt.status === 'faltante').length;
    const totalRevenue = receivedInPeriod.reduce((sum, r) => sum + Number(r.amount), 0);
    const averageTicket = confirmedAppointments > 0 ? totalRevenue / confirmedAppointments : 0;
    const confirmationRate = totalAppointments > 0 ? (confirmedAppointments / totalAppointments) * 100 : 0;

    // 4. Dados para gráficos e tabelas
    const appointmentsByStatus = [
      { name: 'Realizados', value: confirmedAppointments, color: '#22c55e' },
      { name: 'Marcados', value: filteredAppointments.filter(apt => apt.status === 'marcado').length, color: '#3b82f6' },
      { name: 'Faltantes', value: missedAppointments, color: '#ef4444' },
      { name: 'Cancelados', value: filteredAppointments.filter(apt => apt.status === 'cancelado').length, color: '#6b7280' },
    ];

    const treatmentData = Object.entries(filteredAppointments.reduce((acc, apt) => {
      const type = apt.treatmentType || 'Não especificado';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const revenue = safeReceivables
        .filter(r => r.status === 'recebido' && r.receivedDate && isWithinInterval(parseISO(r.receivedDate), { start: monthStart, end: monthEnd }))
        .reduce((sum, r) => sum + Number(r.amount), 0);
      
      const appointmentsCount = safeAppointments
        .filter(a => isWithinInterval(parseISO(a.date), { start: monthStart, end: monthEnd })).length;
        
      return { month: format(date, 'MMM/yy', { locale: ptBR }), revenue, appointments: appointmentsCount };
    }).reverse();

    const revenueByPatient = safePatients.map(patient => {
      const patientReceivables = safeReceivables.filter(r => r.patientId === patient.id && r.status === 'recebido');
      const totalRevenue = patientReceivables.reduce((sum, r) => sum + Number(r.amount), 0);
      const appointmentsCount = safeAppointments.filter(a => a.patientId === patient.id && a.status === 'confirmado').length;
      return {
        name: patient.fullName,
        revenue: totalRevenue,
        appointments: appointmentsCount,
        avgPerSession: appointmentsCount > 0 ? totalRevenue / appointmentsCount : 0
      };
    }).filter(p => p.revenue > 0).sort((a, b) => b.revenue - a.revenue);

    const professionalStats = safeProfessionals.map(physio => {
      const physioAppointments = filteredAppointments.filter(apt => apt.professionalId === physio.id);
      const physioAppointmentIds = new Set(physioAppointments.map(a => a.id));
      const physioRevenue = receivedInPeriod
        .filter(r => r.appointment_id && physioAppointmentIds.has(r.appointment_id))
        .reduce((sum, r) => sum + Number(r.amount), 0);
      return {
        name: physio.name,
        appointments: physioAppointments.length,
        confirmed: physioAppointments.filter(apt => apt.status === 'confirmado').length,
        missed: physioAppointments.filter(apt => apt.status === 'faltante').length,
        revenue: physioRevenue,
        confirmationRate: physioAppointments.length > 0 ? (physioAppointments.filter(a => a.status === 'confirmado').length / physioAppointments.length) * 100 : 0
      };
    });
    
    const growthData = last12Months.map((month, index) => {
      const previousMonth = index > 0 ? last12Months[index - 1] : { revenue: 0 };
      const revenueGrowth = previousMonth.revenue > 0 ? ((month.revenue - previousMonth.revenue) / previousMonth.revenue) * 100 : (month.revenue > 0 ? 100 : 0);
      return {
        ...month,
        revenueGrowth,
        cumulativeRevenue: last12Months.slice(0, index + 1).reduce((sum, m) => sum + m.revenue, 0)
      };
    });
    
    const patientGenderData = [
      { name: 'Feminino', value: safePatients.filter(p => p.gender === 'female').length, color: '#ec4899' },
      { name: 'Masculino', value: safePatients.filter(p => p.gender === 'male').length, color: '#3b82f6' },
      { name: 'Outro', value: safePatients.filter(p => p.gender !== 'female' && p.gender !== 'male').length, color: '#6b7280' }
    ];

    const patientTreatmentData = Object.entries(safePatients.reduce((acc, patient) => {
        const type = patient.treatmentType || 'Não definido';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    // 5. Retornar um único objeto com todos os dados calculados
    return {
      totalAppointments, confirmedAppointments, missedAppointments, totalRevenue, averageTicket, confirmationRate,
      appointmentsByStatus, treatmentData, last12Months, revenueByPatient, professionalStats, growthData,
      patientGenderData, patientTreatmentData, safeProfessionals, safePatients
    };
  }, [appointments, accountsReceivable, patients, professionals, dateFrom, dateTo, selectedPhysio]);

  const exportCSV = (data: any[], filename: string) => {
    // ... (função de exportação sem alteração)
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Relatórios Avançados</h1>
        <Button onClick={() => exportCSV(reportData.professionalStats, `relatorio-completo-${dateFrom}-${dateTo}`)} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Exportar</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros e Configurações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom">Data Início</Label>
              <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="dateTo">Data Fim</Label>
              <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="Professional">Fisioterapeuta</Label>
              <Select value={selectedPhysio} onValueChange={setSelectedPhysio}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos fisioterapeutas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {reportData.safeProfessionals.map((physio) => (
                    <SelectItem key={physio.id} value={physio.id}>{physio.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                  setDateFrom(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
                  setDateTo(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
                }}>
                Este Mês
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><CalendarDays className="h-4 w-4 text-blue-600" /><div><p className="text-xs text-muted-foreground">Consultas</p><p className="text-xl font-bold">{reportData.totalAppointments}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><Users className="h-4 w-4 text-green-600" /><div><p className="text-xs text-muted-foreground">Realizadas</p><p className="text-xl font-bold">{reportData.confirmedAppointments}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><TrendingUp className="h-4 w-4 text-red-600" /><div><p className="text-xs text-muted-foreground">Faltas</p><p className="text-xl font-bold">{reportData.missedAppointments}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><DollarSign className="h-4 w-4 text-yellow-600" /><div><p className="text-xs text-muted-foreground">Faturamento</p><p className="text-xl font-bold">R$ {reportData.totalRevenue.toFixed(2)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><Package className="h-4 w-4 text-purple-600" /><div><p className="text-xs text-muted-foreground">Ticket Médio</p><p className="text-xl font-bold">R$ {reportData.averageTicket.toFixed(2)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><User className="h-4 w-4 text-indigo-600" /><div><p className="text-xs text-muted-foreground">Taxa Comp.</p><p className="text-xl font-bold">{reportData.confirmationRate.toFixed(1)}%</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="appointments">Consultas</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
          <TabsTrigger value="professionals">Fisioterapeutas</TabsTrigger>
          <TabsTrigger value="growth">Crescimento</TabsTrigger>
          <TabsTrigger value="detailed">Detalhado</TabsTrigger>
        </TabsList>
        
        {/* Todas as abas e seus conteúdos, exatamente como no seu original */}
        <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><div className="flex items-center justify-between"><CardTitle>Faturamento Mensal</CardTitle><Button size="sm" variant="outline" onClick={() => exportCSV(reportData.last12Months, 'faturamento-mensal')}><Download className="h-3 w-3 mr-1" />CSV</Button></div></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={reportData.last12Months}>
                                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']} /><Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><div className="flex items-center justify-between"><CardTitle>Top 10 Pacientes - Faturamento</CardTitle><Button size="sm" variant="outline" onClick={() => exportCSV(reportData.revenueByPatient, 'faturamento-por-paciente')}><Download className="h-3 w-3 mr-1" />CSV</Button></div></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={reportData.revenueByPatient.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} /><YAxis /><Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']} /><Bar dataKey="revenue" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Status das Consultas</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={reportData.appointmentsByStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}>
                                    {reportData.appointmentsByStatus.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                </Pie><Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Consultas por Tratamento</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={reportData.treatmentData}>
                                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#3b82f6" name="Consultas" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader><CardTitle>Consultas vs Faturamento Mensal</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={reportData.last12Months}>
                            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis yAxisId="left" stroke="#8884d8" name="Consultas" /><YAxis yAxisId="right" orientation="right" stroke="#82ca9d" name="Faturamento" /><Tooltip /><Legend /><Area yAxisId="left" type="monotone" dataKey="appointments" stroke="#8884d8" fill="#8884d8" name="Consultas" fillOpacity={0.6} /><Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" fill="#82ca9d" name="Faturamento" fillOpacity={0.6} />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Distribuição de Pacientes por Gênero</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={reportData.patientGenderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}>
                                    {reportData.patientGenderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie><Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Pacientes por Tipo de Tratamento</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={reportData.patientTreatmentData}>
                                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#10b981" name="Pacientes" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="professionals" className="space-y-4">
            <Card>
                <CardHeader><div className="flex items-center justify-between"><CardTitle>Performance dos Fisioterapeutas</CardTitle><Button size="sm" variant="outline" onClick={() => exportCSV(reportData.professionalStats, 'performance-fisioterapeutas')}><Download className="h-3 w-3 mr-1" />CSV</Button></div></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={reportData.professionalStats}>
                            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis yAxisId="left" orientation="left" stroke="#3b82f6" name="Consultas" /><YAxis yAxisId="right" orientation="right" stroke="#22c55e" name="Faturamento" /><Tooltip /><Legend /><Bar yAxisId="left" dataKey="appointments" fill="#3b82f6" name="Total Consultas" /><Bar yAxisId="right" dataKey="revenue" fill="#22c55e" name="Faturamento" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
            <Card>
                <CardHeader><CardTitle>Análise de Crescimento</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={reportData.growthData}>
                            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis yAxisId="left" label={{ value: 'Faturamento Acumulado', angle: -90, position: 'insideLeft' }} stroke="#8884d8" /><YAxis yAxisId="right" orientation="right" label={{ value: 'Crescimento (%)', angle: 90, position: 'insideRight' }} stroke="#82ca9d" /><Tooltip /><Legend /><Area yAxisId="left" type="monotone" dataKey="cumulativeRevenue" name="Acumulado" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} /><Line yAxisId="right" type="monotone" dataKey="revenueGrowth" name="Crescimento %" stroke="#82ca9d" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
            <Card>
                <CardHeader><CardTitle>Relatório Executivo</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-2">Resumo Operacional</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• Total de consultas no período: <strong>{reportData.totalAppointments}</strong></li>
                                <li>• Taxa de comparecimento: <strong>{reportData.confirmationRate.toFixed(1)}%</strong></li>
                                <li>• Taxa de falta: <strong>{reportData.totalAppointments > 0 ? ((reportData.missedAppointments / reportData.totalAppointments) * 100).toFixed(1) : 0}%</strong></li>
                                <li>• Pacientes ativos no sistema: <strong>{reportData.safePatients.filter(p => p.isActive).length}</strong></li>
                                <li>• Fisioterapeutas ativos: <strong>{reportData.safeProfessionals.filter(p => p.isActive).length}</strong></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Resumo Financeiro</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• Faturamento no período: <strong>R$ {reportData.totalRevenue.toFixed(2)}</strong></li>
                                <li>• Ticket médio por consulta: <strong>R$ {reportData.averageTicket.toFixed(2)}</strong></li>
                                <li>• Melhor cliente: <strong>{reportData.revenueByPatient[0]?.name || 'N/A'} (R$ {reportData.revenueByPatient[0]?.revenue.toFixed(2) || '0.00'})</strong></li>
                                <li>• Tratamento mais popular: <strong>{reportData.treatmentData[0]?.name || 'N/A'}</strong></li>
                                <li>• Crescimento do faturamento (último mês): <strong>{reportData.growthData.length > 0 ? reportData.growthData[reportData.growthData.length - 1].revenueGrowth.toFixed(1) : 0}%</strong></li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}