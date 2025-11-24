import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartBar } from "lucide-react";
import { Professional, Appointment } from "@/types";

interface Stats {
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

interface ProfessionalAnalyticsTabProps {
  professional: Professional;
  appointments: Appointment[];
  revenue: any[];
  stats: Stats;
}

export function ProfessionalAnalyticsTab({ 
  professional, 
  appointments, 
  revenue, 
  stats 
}: ProfessionalAnalyticsTabProps) {
  
  // Análise por status de consulta
  const appointmentsByStatus = appointments.reduce((acc, appointment) => {
    const status = appointment.status || 'marcado';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Análise mensal dos últimos 6 meses
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthAppointments = appointments.filter(a => {
      const appointmentDate = new Date(a.date);
      return appointmentDate >= monthStart && appointmentDate <= monthEnd && a.status === 'realizado';
    });
    
    const monthRevenue = revenue.filter(r => {
      const revenueDate = new Date(r.dueDate);
      return revenueDate >= monthStart && revenueDate <= monthEnd && r.status === 'pago';
    }).reduce((sum, r) => sum + r.amount, 0);
    
    monthlyData.push({
      month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      appointments: monthAppointments.length,
      revenue: monthRevenue
    });
  }

  return (
    <div className="space-y-6">
      {/* Análise de Consultas por Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <ChartBar className="mr-2 h-5 w-5" />
            Análise de Consultas por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(appointmentsByStatus).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{status}</div>
                <div className="text-xs text-gray-500">
                  {((count / stats.totalAppointments) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução dos Últimos 6 Meses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="font-medium">{month.month}</div>
                <div className="flex space-x-6 text-sm">
                  <div>
                    <span className="text-gray-600">Consultas: </span>
                    <span className="font-semibold">{month.appointments}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Receita: </span>
                    <span className="font-semibold">R$ {month.revenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumo de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Indicadores Gerais</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de Conclusão</span>
                  <span className="font-semibold">{stats.completionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consultas por Paciente</span>
                  <span className="font-semibold">
                    {stats.totalPatients > 0 ? (stats.completedAppointments / stats.totalPatients).toFixed(1) : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Receita por Consulta</span>
                  <span className="font-semibold">
                    R$ {stats.completedAppointments > 0 ? (stats.monthlyRevenue / stats.completedAppointments).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Crescimento</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Receita Mensal</span>
                  <span className={`font-semibold ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base de Pacientes</span>
                  <span className={`font-semibold ${stats.patientsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.patientsGrowth >= 0 ? '+' : ''}{stats.patientsGrowth.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consultas Próximas</span>
                  <span className="font-semibold">{stats.upcomingAppointments}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}