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

  // Calcular horário de fim (sem segundos)
  const getEndTime = (startTime: string, duration: number = 60) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Função para pegar os dois primeiros nomes
  const getTwoFirstNames = (fullName: string) => {
    if (!fullName) return '';
    const names = fullName.split(' ');
    return names.slice(0, 2).join(' ');
  };

  const startTime = appointment.time.slice(0, 5);
  const endTime = getEndTime(startTime, appointment.duration || 60);

  // Função para obter o texto do status com confirmação do paciente
  const getStatusText = (status: string, whatsappConfirmed: boolean) => {
    const statusTexts = {
      marcado: "Marcado",
      confirmado: "Confirmado",
      realizado: "Realizado",
      faltante: "Faltante",
      cancelado: "Cancelado"
    };
    
    const baseStatus = statusTexts[status] || status;
    
    // Se foi confirmado pelo WhatsApp, adicionar o ícone
    if (whatsappConfirmed && (status === 'confirmado' || status === 'marcado')) {
      return `${baseStatus} ✅`;
    }
    
    return baseStatus;
  };

  // Nova variante mini para agenda diária
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
          {/* Nome do paciente - compacto */}
          <div className="text-center">
            <Badge 
              className={`${getStatusColor(appointment.status)} text-xs px-1.5 py-0 border-none font-medium`} 
              style={{ borderRadius: '8px', fontSize: '10px' }} 
              title={patient?.fullName || 'Paciente'}
            >
              {getTwoFirstNames(patient?.fullName || 'Paciente')}
            </Badge>
          </div>

          {/* Horário - super compacto */}
          <div className="text-center">
            <div className="text-xs font-bold text-gray-700 leading-tight">
              <div style={{ fontSize: '11px' }}>{startTime}</div>
            </div>
          </div>

          {/* Profissional - só primeiro nome */}
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
          {/* Nome do paciente - dois primeiros nomes */}
          <div className="text-center">
            <Badge 
              className={`${getStatusColor(appointment.status)} text-xs px-2 py-0.5 border-none font-medium`} 
              style={{ borderRadius: '12px' }} 
              title={patient?.fullName || 'Paciente'}
            >
              {getTwoFirstNames(patient?.fullName || 'Paciente')}
            </Badge>
          </div>

          {/* Horário compacto */}
          <div className="text-center">
            <div className="text-xs font-bold text-gray-700 py-1 px-2">
              <div>{startTime}</div>
              <div>{endTime}</div>
            </div>
          </div>

          {/* Profissional - dois primeiros nomes */}
          <div className="text-xs text-gray-600 text-center font-medium truncate px-1">
            {getTwoFirstNames(professional?.name || 'N/A')}
          </div>

          {/* Sala (opcional, só se tiver espaço) */}
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
      className="cursor-pointer hover:shadow-xl transition-all duration-300 border-none" 
      style={{ 
        borderRadius: '20px'
      }}
    >
      <CardContent className="p-3" style={{ borderRadius: '20px' }}> {/* Mudei de p-2 para p-3 */}
        <div className="space-y-1.5">
          <div className="flex items-start justify-between">
            <Badge 
              className={`${getStatusColor(appointment.status)} text-sm px-3 py-1.5 border-none font-medium`} 
              style={{ borderRadius: '16px' }} 
              title={`${patient?.fullName || 'Paciente'}${appointment.whatsappConfirmed ? ' - Confirmado pelo paciente' : ''}`}
            >
              {getStatusText(appointment.status, appointment.whatsappConfirmed)}
            </Badge>
            
            {/* Horário */}
            <div className="text-right">
              <div className="text-sm font-bold text-gray-700 py-1 px-2">
                <div>{startTime}</div>
                <div className="text-xs text-gray-500 font-normal">até</div>
                <div>{endTime}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4"> {/* Mudei de space-y-1 para space-y-1.5 */}
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-semibold text-gray-700 truncate">{patient?.fullName || 'Paciente não encontrado'}</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
              </div>
              <span className="font-medium truncate">{professional?.name || 'Fisioterapeuta não encontrado'}</span>
            </div>

            {room && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium truncate">{room.name}</span>
              </div>
            )}
          </div>

          {/* Apenas mostrar quando confirmação foi enviada (sem ocupar muito espaço) */}
          {appointment.confirmationSentAt && (
            <div className="text-xs text-blue-600 font-medium leading-tight truncate">
              📱 {format(new Date(appointment.confirmationSentAt), 'dd/MM HH:mm', { locale: ptBR })}
            </div>
          )}

          {/* Ações rápidas */}
          <div className="flex flex-wrap gap-1 pt-1.5 border-t"> {/* Mudei de pt-1 para pt-1.5 */}
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
                  style={{ borderRadius: '12px' }}
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
                    style={{ borderRadius: '12px' }}
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
                style={{ borderRadius: '12px' }}
              >
                ✅ Realizado
              </Button>
            )}

            {appointment.status === 'realizado' && (
              <Badge className="bg-green-100 text-green-700 text-xs" style={{ borderRadius: '12px' }}>Realizada</Badge>
            )}

            {appointment.status === 'faltante' && (
              <Badge className="bg-yellow-100 text-yellow-700 text-xs" style={{ borderRadius: '12px' }}>Faltante</Badge>
            )}

            {appointment.status === 'cancelado' && (
              <Badge className="bg-red-100 text-red-700 text-xs" style={{ borderRadius: '12px' }}>Cancelado</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}