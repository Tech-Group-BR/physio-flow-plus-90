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

  const getFirstAndLastName = (fullName: string) => {
    if (!fullName) return '';
    const names = fullName.split(' ');
    if (names.length === 1) return names[0];
    return `${names[0]} ${names[names.length - 1]}`;
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
        className="h-full cursor-pointer hover:shadow-md transition-all duration-200 flex flex-col justify-center p-1"
        style={{ 
          borderRadius: '8px', 
          overflow: 'hidden'
        }}
        onClick={onClick}
      >
        <div className="space-y-1">
          <div className="text-center">
            <Badge 
              className={`${getStatusColor(appointment.status)} text-sm px-1.5 py-0.5 border-none font-medium`}
              style={{ borderRadius: '4px' }} 
              title={patient?.fullName || 'Paciente'}
            >
              {getTwoFirstNames(patient?.fullName || 'Paciente')}
            </Badge>
          </div>

          <div className="text-center">
            <div className="text-sm font-bold text-gray-700 leading-tight">
              {startTime}
            </div>
          </div>

          <div className="text-xs text-gray-600 text-center font-medium truncate">
            {professional?.name?.split(' ')[0] || 'N/A'}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className="h-full cursor-pointer hover:shadow-md transition-all duration-200 p-1"
        style={{ 
          borderRadius: '8px', 
          overflow: 'hidden'
        }}
        onClick={onClick}
      >
        <div className="h-full flex flex-col justify-between">
          {/* Header com horário centralizado */}
          <div className="flex justify-center mb-1">
            <div className="text-xs font-bold text-gray-700 leading-none">
              {startTime}
            </div>
          </div>

          {/* Nome do paciente - linha principal com mais destaque */}
          <div className="flex items-center space-x-1 mb-1">
            <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
            <span className="font-bold text-gray-900 truncate text-sm leading-tight flex-1">
              {getFirstAndLastName(patient?.fullName || 'Paciente')}
            </span>
          </div>

          {/* Informações secundárias mais compactas */}
          <div className="flex-1 space-y-0.5 overflow-hidden">
            <div className="flex items-center space-x-1">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <div className="h-1 w-1 rounded-full bg-blue-500"></div>
              </div>
              <span className="font-medium text-gray-600 truncate text-xs leading-tight">
                {professional?.name?.split(' ')[0] || 'Prof'}
              </span>
            </div>

            {room && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-2.5 w-2.5 text-gray-500 flex-shrink-0" />
                <span className="font-medium text-gray-500 truncate text-xs leading-tight">
                  {room.name}
                </span>
              </div>
            )}
          </div>

          {/* Ações compactas */}
          <div className="flex gap-1 mt-1">
            {appointment.status === 'marcado' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(appointment.id, 'confirmado');
                  }}
                  className="text-sm h-5 px-1.5 flex-shrink-0"
                  style={{ borderRadius: '3px' }}
                  title="Confirmar agendamento"
                >
                  ✅
                </Button>
                {!appointment.confirmationSentAt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendWhatsApp(appointment.id);
                    }}
                    className="text-sm h-5 px-1.5 flex-shrink-0"
                    style={{ borderRadius: '3px' }}
                    title="Enviar confirmação via WhatsApp"
                  >
                    📱
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
                className="text-sm h-5 px-1.5 flex-shrink-0"
                style={{ borderRadius: '3px' }}
                title="Marcar como realizado"
              >
                ✅
              </Button>
            )}

            {appointment.status === 'realizado' && (
              <Badge 
                className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 flex-shrink-0"
                style={{ borderRadius: '3px' }}
                title="Agendamento realizado"
              >
                ✅
              </Badge>
            )}

            {appointment.status === 'faltante' && (
              <Badge 
                className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 flex-shrink-0"
                style={{ borderRadius: '3px' }}
                title="Paciente faltou ao agendamento"
              >
                ❌
              </Badge>
            )}

            {appointment.status === 'cancelado' && (
              <Badge 
                className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 flex-shrink-0"
                style={{ borderRadius: '3px' }}
                title="Agendamento cancelado"
              >
                🚫
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-xl transition-all duration-300 border-none h-full overflow-hidden" 
      style={{ 
        borderRadius: '8px'
      }}
    >
      <CardContent className="p-1 h-full flex flex-col" style={{ borderRadius: '8px' }}>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-start justify-between mb-1 gap-1">
            <Badge 
              className={`${getStatusColor(appointment.status)} text-xs px-1 py-0.5 border-none font-medium flex-shrink-0`}
              style={{ borderRadius: '4px' }}
              title={`${patient?.fullName || 'Paciente'}${appointment.whatsappConfirmed ? ' - Confirmado pelo paciente' : ''}`}
            >
              {isShortAppointment ? getStatusText(appointment.status, appointment.whatsappConfirmed).slice(0, 3) : getStatusText(appointment.status, appointment.whatsappConfirmed)}
            </Badge>
            
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-bold text-gray-700 leading-tight">
                <span className="whitespace-nowrap">{startTime}-{endTime}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-xs min-w-0">
              <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
              <span className="font-semibold text-gray-700 truncate text-sm flex-1 min-w-0">{patient?.fullName || 'Paciente'}</span>
            </div>

            <div className="flex items-center space-x-1 text-xs text-gray-600 min-w-0">
              <div className="h-3 w-3 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
              </div>
              <span className="font-medium truncate text-sm flex-1 min-w-0">{professional?.name || 'Profissional'}</span>
            </div>

            {room && (
              <div className="flex items-center space-x-1 text-xs text-gray-600 min-w-0">
                <MapPin className="h-3 w-3 text-gray-500 flex-shrink-0" />
                <span className="font-medium truncate text-sm flex-1 min-w-0">{room.name}</span>
              </div>
            )}

            {appointment.confirmationSentAt && (
              <div className="text-sm text-blue-600 font-medium truncate">
                📱 {isShortAppointment ? 'OK' : 'Enviado'}
              </div>
            )}
          </div>
        </div>

        <div 
          className="flex flex-wrap gap-1 border-t pt-1 mt-1"
          style={{ 
            minHeight: '20px',
            height: 'auto'
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
                className="text-xs h-6 px-2 flex-shrink-0"
                style={{ borderRadius: '4px' }}
                title="Confirmar agendamento"
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
                  className="text-xs h-6 px-2 flex-shrink-0"
                  style={{ borderRadius: '4px' }}
                  title="Enviar confirmação via WhatsApp"
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
              className="text-xs h-6 px-2 flex-shrink-0"
              style={{ borderRadius: '4px' }}
              title="Marcar como realizado"
            >
              ✅ Realizado
            </Button>
          )}

          {appointment.status === 'realizado' && (
            <Badge 
              className="bg-green-100 text-green-700 text-xs px-2 py-1 flex-shrink-0"
              style={{ borderRadius: '4px' }}
              title="Agendamento realizado"
            >
              ✅ Concluído
            </Badge>
          )}

          {appointment.status === 'faltante' && (
            <Badge 
              className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 flex-shrink-0"
              style={{ borderRadius: '4px' }}
              title="Paciente faltou ao agendamento"
            >
              ❌ Faltou
            </Badge>
          )}

          {appointment.status === 'cancelado' && (
            <Badge 
              className="bg-red-100 text-red-700 text-xs px-2 py-1 flex-shrink-0"
              style={{ borderRadius: '4px' }}
              title="Agendamento cancelado"
            >
              🚫 Cancelado
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}