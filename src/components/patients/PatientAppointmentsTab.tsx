import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Filter, 
  Search, 
  Calendar, 
  CheckSquare, 
  Square, 
  Trash2, 
  Users 
} from "lucide-react";
import { Patient } from "@/types";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientAppointmentsTabProps {
  patient: Patient;
  appointments: any[];
  selectedAppointmentIds: Set<string>;
  appointmentStatusFilter: string;
  setAppointmentStatusFilter: (filter: string) => void;
  appointmentDateFilter: string;
  setAppointmentDateFilter: (filter: string) => void;
  appointmentSearchTerm: string;
  setAppointmentSearchTerm: (term: string) => void;
  showAppointmentFilters: boolean;
  setShowAppointmentFilters: (show: boolean) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  onBulkDeleteAppointments: () => void;
  onAppointmentSelectionChange: (id: string, selected: boolean) => void;
  getAppointmentStatus: (appointment: any) => string;
}

export function PatientAppointmentsTab({
  patient,
  appointments,
  selectedAppointmentIds,
  appointmentStatusFilter,
  setAppointmentStatusFilter,
  appointmentDateFilter,
  setAppointmentDateFilter,
  appointmentSearchTerm,
  setAppointmentSearchTerm,
  showAppointmentFilters,
  setShowAppointmentFilters,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  onBulkDeleteAppointments,
  onAppointmentSelectionChange,
  getAppointmentStatus
}: PatientAppointmentsTabProps) {
  
  const selectAllAppointments = () => {
    appointments.forEach(appointment => {
      onAppointmentSelectionChange(appointment.id, true);
    });
  };

  const clearAppointmentSelection = () => {
    appointments.forEach(appointment => {
      onAppointmentSelectionChange(appointment.id, false);
    });
  };

  const toggleAppointmentSelection = (appointmentId: string) => {
    const isSelected = selectedAppointmentIds.has(appointmentId);
    onAppointmentSelectionChange(appointmentId, !isSelected);
  };

  return (
    <>
      {/* Filtros Avançados - Agendamentos */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Button
          variant="outline"
          onClick={() => setShowAppointmentFilters(!showAppointmentFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar em observações..."
              value={appointmentSearchTerm}
              onChange={(e) => setAppointmentSearchTerm(e.target.value)}
              className="pl-10 w-48"
            />
          </div>
          <Select value={appointmentStatusFilter} onValueChange={setAppointmentStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="marcado">Marcado</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="realizado">Realizado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
              <SelectItem value="faltante">Faltante</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showAppointmentFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={appointmentDateFilter} onValueChange={setAppointmentDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                    <SelectItem value="thisMonth">Este mês</SelectItem>
                    <SelectItem value="lastMonth">Mês passado</SelectItem>
                    <SelectItem value="custom">Período personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {appointmentDateFilter === "custom" && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data inicial</label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data final</label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barra de Ações em Massa - Agendamentos */}
      {selectedAppointmentIds.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">
                  {selectedAppointmentIds.size} agendamentos selecionados
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkDeleteAppointments}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAppointmentSelection}
                >
                  Limpar Seleção
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Calendar className="mr-2 h-5 w-5" />
              Histórico de Agendamentos ({appointments.length})
            </CardTitle>
            {appointments.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectedAppointmentIds.size === appointments.length ? clearAppointmentSelection : selectAllAppointments}
              >
                {selectedAppointmentIds.size === appointments.length ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                {selectedAppointmentIds.size === appointments.length ? "Desmarcar Todos" : "Selecionar Todos"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => {
                const isSelected = selectedAppointmentIds.has(appointment.id);
                return (
                  <div 
                    key={appointment.id} 
                    className={`flex items-start p-4 border rounded-lg gap-3 ${
                      isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
                    }`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAppointmentSelection(appointment.id)}
                      className="p-1 h-auto mt-1"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">
                          {format(new Date(appointment.date + 'T' + appointment.time), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {appointment.treatmentType || 'Consulta'}
                        </div>
                        {appointment.notes && (
                          <div className="text-sm text-gray-500 mt-1">{appointment.notes}</div>
                        )}
                      </div>
                      <Badge variant={
                        appointment.status === 'realizado' ? 'default' :
                        appointment.status === 'confirmado' ? 'secondary' :
                        appointment.status === 'cancelado' ? 'destructive' :
                        appointment.status === 'faltante' ? 'destructive' : 'outline'
                      }>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Nenhum agendamento encontrado.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}