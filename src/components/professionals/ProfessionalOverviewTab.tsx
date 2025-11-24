import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  Star
} from "lucide-react";
import { Professional } from "@/types";

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

interface ProfessionalOverviewTabProps {
  professional: Professional;
  stats: Stats;
}

export function ProfessionalOverviewTab({ professional, stats }: ProfessionalOverviewTabProps) {
  const renderDetail = (label: string, value: string | undefined | null) => {
    if (!value || value.trim() === '') return null;
    return (
      <div>
        <span className="font-medium text-gray-900">{label}:</span>
        <span className="ml-2 text-gray-600">{value}</span>
      </div>
    );
  };

  return (
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
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Taxa de Conclusão</span>
              <span className="font-semibold text-green-600">{stats.completionRate.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}