import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { Professional, Appointment } from "@/types";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfessionalAppointmentsTabProps {
  professional: Professional;
  appointments: Appointment[];
}

export function ProfessionalAppointmentsTab({ 
  professional, 
  appointments 
}: ProfessionalAppointmentsTabProps) {
  const sortedAppointments = appointments
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20); // Mostrar apenas os 20 mais recentes

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Calendar className="mr-2 h-5 w-5" />
          Histórico de Consultas ({appointments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedAppointments.length > 0 ? (
          <div className="space-y-4">
            {sortedAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
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
            ))}
            {appointments.length > 20 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Mostrando 20 consultas mais recentes de {appointments.length} total
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhuma consulta registrada</p>
            <p className="text-sm text-gray-400 mt-1">
              Consultas aparecerão aqui quando forem agendadas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}