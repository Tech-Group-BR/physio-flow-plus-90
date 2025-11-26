import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getStatusColor } from "@/shared/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, User, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ action: 'confirm' | 'realize' | 'whatsapp' | null, title: string, description: string }>({ action: null, title: '', description: '' });
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

  const showConfirmDialog = (action: 'confirm' | 'realize' | 'whatsapp', title: string, description: string) => {
    setConfirmAction({ action, title, description });
  };

  const handleConfirmedAction = async () => {
    try {
      setIsLoading(true);
      switch (confirmAction.action) {
        case 'confirm':
          await onUpdateStatus(appointment.id, 'confirmado');
          toast.success('Agendamento confirmado com sucesso!');
          break;
        case 'realize':
          await onUpdateStatus(appointment.id, 'realizado');
          toast.success('Agendamento marcado como realizado com sucesso!');
          break;
        case 'whatsapp':
          await onSendWhatsApp(appointment.id);
          toast.success('Mensagem WhatsApp enviada com sucesso!');
          break;
      }
    } catch (error) {
      console.error('Erro na ação:', error);
      toast.error('Erro ao executar ação. Tente novamente.');
    } finally {
      setIsLoading(false);
      setConfirmAction({ action: null, title: '', description: '' });
    }
  };

  // Renderizar o AlertDialog sempre
  const alertDialog = (
    <AlertDialog open={confirmAction.action !== null} onOpenChange={() => setConfirmAction({ action: null, title: '', description: '' })}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmAction.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmAction.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmedAction}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (variant === 'mini') {
    return (
      <>
        <div
          className="h-full cursor-pointer hover:shadow-md transition-all duration-200 flex flex-col justify-center p-1"
          style={{ 
            borderRadius: '4px', 
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
        {alertDialog}
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <div
          className="h-full cursor-pointer hover:shadow-md transition-all duration-200 p-1"
          style={{ 
            borderRadius: '4px', 
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
                      showConfirmDialog('confirm', 'Confirmar Agendamento', `Deseja confirmar o agendamento de ${patient?.fullName}?`);
                    }}
                    disabled={isLoading}
                    className="text-sm h-5 px-1.5 flex-shrink-0 hover:shadow-md transition-all duration-200"
                    style={{ borderRadius: '3px' }}
                    title="Confirmar agendamento"
                  >
                    {isLoading && confirmAction.action === 'confirm' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      '✅'
                    )}
                  </Button>
                  {!appointment.confirmationSentAt && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        showConfirmDialog('whatsapp', 'Enviar WhatsApp', `Deseja enviar confirmação via WhatsApp para ${patient?.fullName}?`);
                      }}
                      disabled={isLoading}
                      className="text-sm h-5 px-1.5 flex-shrink-0 hover:shadow-md transition-all duration-200"
                      style={{ borderRadius: '3px' }}
                      title="Enviar confirmação via WhatsApp"
                    >
                      {isLoading && confirmAction.action === 'whatsapp' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        '📱'
                      )}
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
                    showConfirmDialog('realize', 'Marcar como Realizado', `Deseja marcar o agendamento de ${patient?.fullName} como realizado?`);
                  }}
                  disabled={isLoading}
                  className="text-sm h-5 px-1.5 flex-shrink-0 hover:shadow-md transition-all duration-200"
                  style={{ borderRadius: '3px' }}
                  title="Marcar como realizado"
                >
                  {isLoading && confirmAction.action === 'realize' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    '✅'
                  )}
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
        {alertDialog}
      </>
    );
  }

  return (
    <>
    <Card 
      className="cursor-pointer hover:shadow-xl transition-all duration-300 border-none h-full overflow-hidden" 
      style={{ 
        borderRadius: '4px'
      }}
    >
      <CardContent className="p-1 h-full flex flex-col" style={{ borderRadius: '4px' }}>
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
                  showConfirmDialog('confirm', 'Confirmar Agendamento', `Confirmar agendamento de ${patient?.fullName}?`);
                }}
                disabled={isLoading}
                className="text-xs h-6 px-2 flex-shrink-0 hover:shadow-md transition-all duration-200"
                style={{ borderRadius: '4px' }}
                title="Confirmar agendamento"
              >
                {isLoading && confirmAction.action === 'confirm' ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  '✅ Confirmar'
                )}
              </Button>
              {!appointment.confirmationSentAt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    showConfirmDialog('whatsapp', 'Enviar WhatsApp', `Enviar confirmação para ${patient?.fullName}?`);
                  }}
                  disabled={isLoading}
                  className="text-xs h-6 px-2 flex-shrink-0 hover:shadow-md transition-all duration-200"
                  style={{ borderRadius: '4px' }}
                  title="Enviar confirmação via WhatsApp"
                >
                  {isLoading && confirmAction.action === 'whatsapp' ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    '📱 WhatsApp'
                  )}
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
                showConfirmDialog('realize', 'Marcar como Realizado', `Deseja marcar o agendamento de ${patient?.fullName} como realizado?`);
              }}
              disabled={isLoading}
              className="text-xs h-6 px-2 flex-shrink-0 hover:shadow-md transition-all duration-200"
              style={{ borderRadius: '4px' }}
              title="Marcar como realizado"
            >
              {isLoading && confirmAction.action === 'realize' ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Marcando...
                </>
              ) : (
                '✅ Realizado'
              )}
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
    {alertDialog}
    </>
  );
}