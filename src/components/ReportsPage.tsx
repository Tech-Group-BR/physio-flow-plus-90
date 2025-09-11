
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClinic } from "@/contexts/ClinicContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { CalendarDays, Users, DollarSign, TrendingUp, FileText, Download, Calendar, User, Package, Phone } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ReportsPage() {
  const { appointments, patients, payments, physiotherapists } = useClinic();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedPhysio, setSelectedPhysio] = useState('all');
  const [reportType, setReportType] = useState('summary');

  // Filtrar dados por período
  const filteredAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    const withinDateRange = isWithinInterval(aptDate, { start: fromDate, end: toDate });
    const matchesPhysio = selectedPhysio === 'all' || apt.physiotherapistId === selectedPhysio;
    return withinDateRange && matchesPhysio;
  });

  const filteredPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.createdAt);
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    return isWithinInterval(paymentDate, { start: fromDate, end: toDate });
  });

  // Dados para gráficos e relatórios
  const appointmentsByStatus = [
    { name: 'Confirmados', value: filteredAppointments.filter(apt => apt.status === 'confirmado').length, color: '#22c55e' },
    { name: 'Marcados', value: filteredAppointments.filter(apt => apt.status === 'marcado').length, color: '#3b82f6' },
    { name: 'Faltantes', value: filteredAppointments.filter(apt => apt.status === 'faltante').length, color: '#ef4444' },
    { name: 'Cancelados', value: filteredAppointments.filter(apt => apt.status === 'cancelado').length, color: '#6b7280' },
  ];

  const appointmentsByTreatment = filteredAppointments.reduce((acc, apt) => {
    acc[apt.treatmentType] = (acc[apt.treatmentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const treatmentData = Object.entries(appointmentsByTreatment).map(([name, value]) => ({ name, value }));

  // Faturamento por mês (últimos 12 meses)
  const last12Months = Array.from({length: 12}, (_, i) => {
    const date = subMonths(new Date(), 11 - i);
    return {
      month: format(date, 'MMM/yyyy', { locale: ptBR }),
      revenue: payments.filter(p => {
        const paymentMonth = format(new Date(p.createdAt), 'MMM/yyyy', { locale: ptBR });
        return paymentMonth === format(date, 'MMM/yyyy', { locale: ptBR });
      }).reduce((sum, p) => sum + p.amount, 0),
      appointments: appointments.filter(a => {
        const aptMonth = format(new Date(a.date), 'MMM/yyyy', { locale: ptBR });
        return aptMonth === format(date, 'MMM/yyyy', { locale: ptBR });
      }).length
    };
  });

  // Faturamento por paciente
  const revenueByPatient = patients.map(patient => {
    const patientPayments = payments.filter(p => p.patientId === patient.id);
    const totalRevenue = patientPayments.reduce((sum, p) => sum + p.amount, 0);
    const appointmentsCount = appointments.filter(a => a.patientId === patient.id).length;
    
    return {
      name: patient.fullName,
      revenue: totalRevenue,
      appointments: appointmentsCount,
      avgPerSession: appointmentsCount > 0 ? totalRevenue / appointmentsCount : 0
    };
  }).filter(p => p.revenue > 0).sort((a, b) => b.revenue - a.revenue);

  // Performance dos fisioterapeutas
  const physiotherapistStats = physiotherapists.map(physio => {
    const physioAppointments = filteredAppointments.filter(apt => apt.physiotherapistId === physio.id);
    const physioRevenue = filteredPayments.filter(p => {
      const appointment = appointments.find(a => a.patientId === p.patientId);
      return appointment?.physiotherapistId === physio.id;
    }).reduce((sum, p) => sum + p.amount, 0);

    return {
      name: physio.name,
      appointments: physioAppointments.length,
      confirmed: physioAppointments.filter(apt => apt.status === 'confirmado').length,
      missed: physioAppointments.filter(apt => apt.status === 'faltante').length,
      revenue: physioRevenue,
      confirmationRate: physioAppointments.length > 0 ? 
        (physioAppointments.filter(apt => apt.status === 'confirmado').length / physioAppointments.length) * 100 : 0
    };
  });

  // Dados de crescimento
  const growthData = last12Months.map((month, index) => {
    const previousMonth = index > 0 ? last12Months[index - 1] : null;
    const revenueGrowth = previousMonth ? 
      ((month.revenue - previousMonth.revenue) / (previousMonth.revenue || 1)) * 100 : 0;
    
    return {
      ...month,
      revenueGrowth,
      cumulativeRevenue: last12Months.slice(0, index + 1).reduce((sum, m) => sum + m.revenue, 0)
    };
  });

  const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalAppointments = filteredAppointments.length;
  const confirmedAppointments = filteredAppointments.filter(apt => apt.status === 'confirmado').length;
  const missedAppointments = filteredAppointments.filter(apt => apt.status === 'faltante').length;
  const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      period: `${dateFrom} - ${dateTo}`,
      summary: {
        totalAppointments,
        confirmedAppointments,
        missedAppointments,
        totalRevenue,
        averageTicket,
        activePatients: patients.filter(p => p.isActive).length
      },
      appointmentsByStatus,
      treatmentData,
      revenueByPatient: revenueByPatient.slice(0, 10),
      physiotherapistStats,
      monthlyData: last12Months,
      growthData
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-completo-${dateFrom}-${dateTo}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const csvContent = [
      headers,
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Relatórios Avançados</h1>
        <div className="flex items-center space-x-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo de relatório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Resumo Geral</SelectItem>
              <SelectItem value="detailed">Relatório Detalhado</SelectItem>
              <SelectItem value="financial">Análise Financeira</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros e Configurações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom">Data Início</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Data Fim</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="physiotherapist">Fisioterapeuta</Label>
              <Select value={selectedPhysio} onValueChange={setSelectedPhysio}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos fisioterapeutas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {physiotherapists.map((physio) => (
                    <SelectItem key={physio.id} value={physio.id}>
                      {physio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDateFrom(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
                  setDateTo(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
                }}
              >
                Este Mês
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Consultas</p>
                <p className="text-xl font-bold">{totalAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Confirmadas</p>
                <p className="text-xl font-bold">{confirmedAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-muted-foreground">Faltas</p>
                <p className="text-xl font-bold">{missedAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-xs text-muted-foreground">Faturamento</p>
                <p className="text-xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                <p className="text-xl font-bold">R$ {averageTicket.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-indigo-600" />
              <div>
                <p className="text-xs text-muted-foreground">Taxa Confirm.</p>
                <p className="text-xl font-bold">
                  {totalAppointments > 0 ? ((confirmedAppointments / totalAppointments) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="appointments">Consultas</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
          <TabsTrigger value="physiotherapists">Fisioterapeutas</TabsTrigger>
          <TabsTrigger value="growth">Crescimento</TabsTrigger>
          <TabsTrigger value="detailed">Detalhado</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Faturamento Mensal</CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => exportCSV(last12Months, 'faturamento-mensal')}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={last12Months}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']} />
                    <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Top 10 Pacientes - Faturamento</CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => exportCSV(revenueByPatient, 'faturamento-por-paciente')}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByPatient.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']} />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status das Consultas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={appointmentsByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {appointmentsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consultas por Tratamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={treatmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Consultas vs Faturamento Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={last12Months}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Area yAxisId="left" type="monotone" dataKey="appointments" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Area yAxisId="right" type="monotone" dataKey="revenue" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Pacientes por Gênero</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Feminino', value: patients.filter(p => p.gender === 'female').length, color: '#ec4899' },
                        { name: 'Masculino', value: patients.filter(p => p.gender === 'male').length, color: '#3b82f6' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      <Cell fill="#ec4899" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pacientes por Tipo de Tratamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(
                    patients.reduce((acc, patient) => {
                      acc[patient.treatmentType] = (acc[patient.treatmentType] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([name, value]) => ({ name, value }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="physiotherapists" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Performance dos Fisioterapeutas</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => exportCSV(physiotherapistStats, 'performance-fisioterapeutas')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={physiotherapistStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="appointments" fill="#3b82f6" name="Total Consultas" />
                  <Bar dataKey="confirmed" fill="#22c55e" name="Confirmadas" />
                  <Bar dataKey="missed" fill="#ef4444" name="Faltas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Crescimento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Area yAxisId="left" type="monotone" dataKey="cumulativeRevenue" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Line yAxisId="right" type="monotone" dataKey="revenueGrowth" stroke="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Executivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Resumo Operacional</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Total de consultas realizadas: <strong>{totalAppointments}</strong></li>
                    <li>• Taxa de confirmação: <strong>{totalAppointments > 0 ? ((confirmedAppointments / totalAppointments) * 100).toFixed(1) : 0}%</strong></li>
                    <li>• Taxa de falta: <strong>{totalAppointments > 0 ? ((missedAppointments / totalAppointments) * 100).toFixed(1) : 0}%</strong></li>
                    <li>• Pacientes ativos: <strong>{patients.filter(p => p.isActive).length}</strong></li>
                    <li>• Fisioterapeutas: <strong>{physiotherapists.length}</strong></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Resumo Financeiro</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Faturamento total: <strong>R$ {totalRevenue.toFixed(2)}</strong></li>
                    <li>• Ticket médio: <strong>R$ {averageTicket.toFixed(2)}</strong></li>
                    <li>• Melhor cliente: <strong>{revenueByPatient[0]?.name || 'N/A'}</strong></li>
                    <li>• Tratamento mais popular: <strong>{treatmentData[0]?.name || 'N/A'}</strong></li>
                    <li>• Crescimento do mês: <strong>{growthData.length > 0 ? growthData[growthData.length - 1].revenueGrowth.toFixed(1) : 0}%</strong></li>
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
