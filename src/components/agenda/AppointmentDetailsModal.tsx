import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStatusColor } from "@/utils/agendaUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Edit, FileText, Phone, User, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppointmentEditForm } from "./AppointmentEditForm";
import { Link } from "react-router-dom"; // adicione o import

interface AppointmentDetailsModalProps {
  appointment: any;
  patient: any;
  professional: any;
  room: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (appointmentId: string, status: 'confirmado' | 'faltante' | 'cancelado' | 'marcado' | 'realizado') => void;
  onSendWhatsApp: (appointmentId: string) => void;
  onUpdateAppointment: (appointmentId: string, updates: any) => void;
}

export function AppointmentDetailsModal({
  appointment,
  patient,
  professional,
  room,
  isOpen,
  onClose,
  onUpdateStatus,
  onSendWhatsApp,
  onUpdateAppointment
}: AppointmentDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!appointment || !patient) return null;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async (updatedData: any) => {
    try {
      await onUpdateAppointment(appointment.id, updatedData);
      setIsEditing(false);
      toast.success('Agendamento atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento. Tente novamente.');
    }
  };

  const handleUpdateStatus = async (status: 'confirmado' | 'faltante' | 'cancelado' | 'marcado' | 'realizado') => {
    try {
      await onUpdateStatus(appointment.id, status);
      toast.success(`Status alterado para ${status} com sucesso!`);
      onClose(); // <-- fecha o modal após atualizar
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status. Tente novamente.');
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      await onSendWhatsApp(appointment.id);
      toast.success('Mensagem WhatsApp enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      toast.error('Erro ao enviar WhatsApp. Tente novamente.');
    }
  };

  if (isEditing) {
    console.log('Renderizando modal de edição:', { appointment, patient, professional, room });
    
    if (!appointment || !patient) {
      console.error('Dados necessários não encontrados para edição');
      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Erro ao carregar dados</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p>Erro ao carregar dados para edição. Tente novamente.</p>
              <Button onClick={handleCancelEdit} className="mt-4">
                Voltar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Edit className="h-5 w-5" />
                <span>Editar Agendamento</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <AppointmentEditForm
            appointment={appointment}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Detalhes do Agendamento</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Editar</span>
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status.toUpperCase()}
            </Badge>
            <div className="text-sm text-gray-500">
              {/* Formatação corrigida para evitar problemas de fuso horário */}
              {format(new Date(appointment.date + 'T' + appointment.time), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </div>
          </div>

          {/* Informações do Paciente */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Paciente</span>
              <Link
                to={`/pacientes/${patient.id}`}
                className="ml-2 text-blue-600 underline text-xs"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver ficha
              </Link>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Nome:</span> {patient.fullName}
              </div>
              <div>
                <span className="font-medium">Telefone:</span> {patient.phone}
              </div>
              {patient.email && (
                <div>
                  <span className="font-medium">Email:</span> {patient.email}
                </div>
              )}
              {patient.cpf && (
                <div>
                  <span className="font-medium">CPF:</span> {patient.cpf}
                </div>
              )}
            </div>
          </div>

          {/* Informações do Atendimento */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Atendimento</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Fisioterapeuta:</span> {professional?.name}
              </div>
              <div>
                <span className="font-medium">Sala:</span> {room?.name || 'Não definida'}
              </div>
              <div>
                <span className="font-medium">Duração:</span> {appointment.duration || 60} minutos
              </div>
              <div>
                <span className="font-medium">Tratamento:</span> {appointment.treatmentType}
              </div>
            </div>
          </div>

          {/* Status WhatsApp */}
          {(appointment.whatsappConfirmed || appointment.confirmationSentAt) && (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>WhatsApp</span>
              </h3>
              <div className="space-y-2 text-sm">
                {appointment.confirmationSentAt && (
                  <div className="text-blue-700">
                    📱 Confirmação enviada: {format(new Date(appointment.confirmationSentAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                )}
                {appointment.whatsappConfirmed && (
                  <div className="text-green-700">
                    ✅ Confirmado pelo paciente
                  </div>
                )}
                {appointment.physioNotifiedAt && (
                  <div className="text-purple-700">
                    👨‍⚕️ Fisioterapeuta notificado: {format(new Date(appointment.physioNotifiedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observações */}
          {appointment.notes && (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Observações</span>
              </h3>
              <p className="text-sm text-gray-600">{appointment.notes}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {appointment.status === 'marcado' && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleUpdateStatus('confirmado')}
                >
                  ✅ Confirmar
                </Button>
                {!appointment.confirmationSentAt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendWhatsApp}
                  >
                    📱 Enviar WhatsApp
                  </Button>
                )}
              </>
            )}

            {appointment.status === 'confirmado' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleUpdateStatus('realizado')}
              >
                ✅ Marcar Realizado
              </Button>
            )}

            {appointment.status !== 'cancelado' && appointment.status !== 'faltante' && appointment.status !== 'realizado' && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleUpdateStatus('faltante')}
                >
                  ❌ Falta
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus('cancelado')}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  🚫 Cancelar
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}