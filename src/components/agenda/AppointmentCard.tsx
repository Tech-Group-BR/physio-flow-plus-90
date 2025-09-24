import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStatusColor } from "@/utils/agendaUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, User } from "lucide-react";

interface AppointmentCardProps {
  appointment: any;
  patients: any[];
  professionals: any[];
  rooms: any[];
  onUpdateStatus: (appointmentId: string, status: 'confirmado' | 'faltante' | 'cancelado' | 'marcado' | 'realizado') => void;
  onSendWhatsApp: (appointmentId: string) => void;
  variant?: 'compact' | 'detailed' | 'mini';
  onClick?: () => void;
}

export function AppointmentCard({
  appointment,
  patients,
  professionals,
  rooms,
  onUpdateStatus,
  onSendWhatsApp,
  variant = 'detailed',
  onClick
}: AppointmentCardProps) {
  const patient = patients.find(p => p.id === appointment.patientId);
  const professional = professionals.find(p => p.id === appointment.professionalId);
  const room = rooms.find(r => r.id === appointment.roomId);

  const getEndTime = (startTime: string, duration: number = 60) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const getTwoFirstNames = (fullName: string) => {
    if (!fullName) return '';
    const names = fullName.split(' ');
    return names.slice(0, 2).join(' ');
  };

  const startTime = appointment.time.slice(0, 5);
  const endTime = getEndTime(startTime, appointment.duration || 60);

  const getStatusText = (status: string, whatsappConfirmed: boolean) => {
    const statusTexts = {
      marcado: "Marcado",
      confirmado: "Confirmado",
      realizado: "Realizado",
      faltante: "Faltante",
      cancelado: "Cancelado"
    };
    
    const baseStatus = statusTexts[status] || status;
    
    if (whatsappConfirmed && (status === 'confirmado' || status === 'marcado')) {
      return `${baseStatus} ✅`;
    }
    
    return baseStatus;
  };

  const isShortAppointment = (appointment.duration || 60) <= 30;

  if (variant === 'mini') {
    return (
      <div
        className="h-full cursor-pointer hover:shadow-md transition-all duration-200 flex flex-col justify-center"
        style={{ 
          borderRadius: '12px', 
          overflow: 'hidden'
        }}
        onClick={onClick}
      >
        <div className="space-y-0.5 p-1" style={{ borderRadius: '12px' }}>
          <div className="text-center">
            <Badge 
              className={`${getStatusColor(appointment.status)} text-xs px-1.5 py-0 border-none font-medium`} 
              style={{ borderRadius: '8px', fontSize: '10px' }} 
              title={patient?.fullName || 'Paciente'}
            >
              {getTwoFirstNames(patient?.fullName || 'Paciente')}
            </Badge>
          </div>

          <div className="text-center">
            <div className="text-xs font-bold text-gray-700 leading-tight">
              <div style={{ fontSize: '11px' }}>{startTime}</div>
            </div>
          </div>

          <div className="text-xs text-gray-600 text-center font-medium truncate" style={{ fontSize: '10px' }}>
            {professional?.name?.split(' ')[0] || 'N/A'}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className="h-full cursor-pointer hover:shadow-md transition-all duration-200"
        style={{ 
          borderRadius: '16px', 
          overflow: 'hidden'
        }}
        onClick={onClick}
      >
        <div className="space-y-1 p-1.5" style={{ borderRadius: '16px' }}>
          <div className="text-center">
            <Badge 
              className={`${getStatusColor(appointment.status)} text-xs px-2 py-0.5 border-none font-medium`} 
              style={{ borderRadius: '12px' }} 
              title={patient?.fullName || 'Paciente'}
            >
              {getTwoFirstNames(patient?.fullName || 'Paciente')}
            </Badge>
          </div>

          <div className="text-center">
            <div className="text-xs font-bold text-gray-700 py-1 px-2">
              <div>{startTime}</div>
              <div>{endTime}</div>
            </div>
          </div>

          <div className="text-xs text-gray-600 text-center font-medium truncate px-1">
            {getTwoFirstNames(professional?.name || 'N/A')}
          </div>

          {room && (
            <div className="text-xs text-gray-500 text-center truncate px-1">
              {room.name}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-xl transition-all duration-300 border-none h-full overflow-hidden" 
      style={{ 
        borderRadius: '12px' // Reduzi de '20px' para '12px'
      }}
    >
      <CardContent className="p-0.5 h-full flex flex-col" style={{ borderRadius: '12px' }}> {/* Também ajustei aqui */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <Badge 
              className={`${getStatusColor(appointment.status)} text-xs px-1 py-0 border-none font-medium`}
              style={{ borderRadius: '8px' }} 
              title={`${patient?.fullName || 'Paciente'}${appointment.whatsappConfirmed ? ' - Confirmado pelo paciente' : ''}`}
            >
              {isShortAppointment ? getStatusText(appointment.status, appointment.whatsappConfirmed).slice(0, 3) : getStatusText(appointment.status, appointment.whatsappConfirmed)}
            </Badge>
            
            <div className="text-right">
              <div className="text-xs font-bold text-gray-700">
                {startTime}-{endTime}
              </div>
            </div>
          </div>

          <div className="space-y-0">
            <div className="flex items-center space-x-1 text-xs">
              <User className="h-2.5 w-2.5 text-gray-500 flex-shrink-0" />
              <span className="font-semibold text-gray-700 truncate text-xs">{patient?.fullName || 'Paciente'}</span>
            </div>

            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <div className="h-1 w-1 rounded-full bg-blue-500"></div>
              </div>
              <span className="font-medium truncate text-xs">{professional?.name || 'Profissional'}</span>
            </div>

            {room && (
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <MapPin className="h-2.5 w-2.5 text-gray-500 flex-shrink-0" />
                <span className="font-medium truncate text-xs">{room.name}</span>
              </div>
            )}

            {appointment.confirmationSentAt && (
              <div className="text-xs text-blue-600 font-medium truncate">
                📱 {isShortAppointment ? 'OK' : 'Enviado'}
              </div>
            )}
          </div>
        </div>

        <div 
          className="flex flex-wrap gap-0.5 border-t pt-0.5 mt-0.5" 
          style={{ 
            minHeight: isShortAppointment ? '18px' : '22px', 
            height: isShortAppointment ? '18px' : '22px' 
          }}
        >
          {appointment.status === 'marcado' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(appointment.id, 'confirmado');
                }}
                className={`text-xs ${isShortAppointment ? 'h-4 px-1' : 'h-5 px-2'} flex-shrink-0`}
                style={{ borderRadius: '4px' }}
              >
                {isShortAppointment ? '✅' : '✅ Confirmar'}
              </Button>
              {!appointment.confirmationSentAt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendWhatsApp(appointment.id);
                  }}
                  className={`text-xs ${isShortAppointment ? 'h-4 px-1' : 'h-5 px-2'} flex-shrink-0`}
                  style={{ borderRadius: '4px' }}
                >
                  {isShortAppointment ? '📱' : '📱 WhatsApp'}
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
              className={`text-xs ${isShortAppointment ? 'h-4 px-1' : 'h-5 px-2'} flex-shrink-0`}
              style={{ borderRadius: '4px' }}
            >
              {isShortAppointment ? '✅' : '✅ Realizado'}
            </Button>
          )}

          {appointment.status === 'realizado' && (
            <Badge 
              className={`bg-green-100 text-green-700 text-xs ${isShortAppointment ? 'px-1 py-0' : 'px-2 py-0.5'} flex-shrink-0`}
              style={{ borderRadius: '4px' }}
            >
              {isShortAppointment ? '✅' : 'Realizada'}
            </Badge>
          )}

          {appointment.status === 'faltante' && (
            <Badge 
              className={`bg-yellow-100 text-yellow-700 text-xs ${isShortAppointment ? 'px-1 py-0' : 'px-2 py-0.5'} flex-shrink-0`}
              style={{ borderRadius: '4px' }}
            >
              {isShortAppointment ? '❌' : 'Faltante'}
            </Badge>
          )}

          {appointment.status === 'cancelado' && (
            <Badge 
              className={`bg-red-100 text-red-700 text-xs ${isShortAppointment ? 'px-1 py-0' : 'px-2 py-0.5'} flex-shrink-0`}
              style={{ borderRadius: '4px' }}
            >
              {isShortAppointment ? '🚫' : 'Cancelado'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}