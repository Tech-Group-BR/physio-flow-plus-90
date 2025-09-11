
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStatusColor } from "@/utils/agendaUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, MapPin, User } from "lucide-react";

interface AppointmentCardProps {
  appointment: any;
  patients: any[];
  physiotherapists: any[];
  rooms: any[];
  onUpdateStatus: (appointmentId: string, status: 'confirmado' | 'faltante' | 'cancelado' | 'marcado' | 'realizado') => void;
  onSendWhatsApp: (appointmentId: string) => void;
  variant?: 'compact' | 'detailed';
  onClick?: () => void;
}

export function AppointmentCard({
  appointment,
  patients,
  physiotherapists,
  rooms,
  onUpdateStatus,
  onSendWhatsApp,
  variant = 'detailed',
  onClick
}: AppointmentCardProps) {
  const patient = patients.find(p => p.id === appointment.patientId);
  const physiotherapist = physiotherapists.find(p => p.id === appointment.physiotherapistId);
  const room = rooms.find(r => r.id === appointment.roomId);

  if (variant === 'compact') {
    return (
      <div
        className="h-full bg-white border rounded p-1 cursor-pointer hover:shadow-sm transition-shadow"
        onClick={onClick}
      >
        <div className="space-y-1">
          <Badge className={`${getStatusColor(appointment.status)} text-xs px-1 py-0`} title={patient?.fullName || 'Paciente'}>
            {patient?.fullName || 'Paciente'}
          </Badge>
          <div className="text-xs text-gray-600 truncate">
            {physiotherapist?.name}
          </div>
          {room && (
            <div className="text-xs text-gray-500 truncate">
              📍 {room.name}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(appointment.status)} title={patient?.fullName || 'Paciente'}>
              {appointment.status.toUpperCase()}
            </Badge>
            <span className="text-sm text-gray-500">
              {appointment.time}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{patient?.fullName || 'Paciente não encontrado'}</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{physiotherapist?.name || 'Fisioterapeuta não encontrado'}</span>
            </div>

            {room && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{room.name}</span>
              </div>
            )}
          </div>

          {/* Status WhatsApp */}
          {(appointment.whatsappConfirmed || appointment.confirmationSentAt) && (
            <div className="text-xs space-y-1">
              {appointment.confirmationSentAt && (
                <div className="text-blue-600">
                  📱 Confirmação enviada: {format(new Date(appointment.confirmationSentAt), 'dd/MM HH:mm', { locale: ptBR })}
                </div>
              )}
              {appointment.whatsappConfirmed && (
                <div className="text-green-600">
                  ✅ Confirmado pelo paciente
                </div>
              )}
            </div>
          )}

          {/* Ações rápidas */}
          <div className="flex flex-wrap gap-1 pt-2 border-t">
            {appointment.status === 'marcado' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(appointment.id, 'confirmado');
                  }}
                  className="text-xs h-6"
                >
                  ✅ Confirmar
                </Button>
                {!appointment.confirmationSentAt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendWhatsApp(appointment.id);
                    }}
                    className="text-xs h-6"
                  >
                    📱 WhatsApp
                  </Button>
                )}
              </>
            )}

            {appointment.status === 'confirmado' && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(appointment.id, 'realizado');
                }}
                className="text-xs h-6"
              >
                ✅ Realizado
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
