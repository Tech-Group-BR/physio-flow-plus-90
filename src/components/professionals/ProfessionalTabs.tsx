import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  Target,
  UserCheck,
  TrendingUp,
  CheckCircle2,
  Star
} from "lucide-react";
import { Professional, Patient, Appointment } from "@/types";
import { ProfessionalOverviewTab } from "./ProfessionalOverviewTab";
import { ProfessionalPatientsTab } from "./ProfessionalPatientsTab";
import { ProfessionalAppointmentsTab } from "./ProfessionalAppointmentsTab";
import { ProfessionalFinancialTab } from "./ProfessionalFinancialTab";
import { ProfessionalAnalyticsTab } from "./ProfessionalAnalyticsTab";

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

interface ProfessionalTabsProps {
  professional: Professional;
  professionalPatients: Patient[];
  professionalAppointments: Appointment[];
  professionalRevenue: any[];
  stats: Stats;
}

export function ProfessionalTabs({
  professional,
  professionalPatients,
  professionalAppointments,
  professionalRevenue,
  stats
}: ProfessionalTabsProps) {
  return (
    <>
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto w-full justify-start sm:grid sm:grid-cols-5">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Visão Geral</TabsTrigger>
          <TabsTrigger value="patients" className="text-xs sm:text-sm py-2">Pacientes</TabsTrigger>
          <TabsTrigger value="appointments" className="text-xs sm:text-sm py-2">Consultas</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs sm:text-sm py-2">Financeiro</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProfessionalOverviewTab professional={professional} stats={stats} />
        </TabsContent>

        <TabsContent value="patients" className="space-y-6">
          <ProfessionalPatientsTab 
            professional={professional}
            patients={professionalPatients}
            appointments={professionalAppointments}
          />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <ProfessionalAppointmentsTab 
            professional={professional}
            appointments={professionalAppointments}
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <ProfessionalFinancialTab 
            professional={professional}
            revenue={professionalRevenue}
            stats={stats}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ProfessionalAnalyticsTab 
            professional={professional}
            appointments={professionalAppointments}
            revenue={professionalRevenue}
            stats={stats}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}