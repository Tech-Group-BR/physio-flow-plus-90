import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getStatusColor } from "@/shared/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Edit, FileText, Phone, User, X, Loader2, BookOpen, ClipboardList } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppointmentEditForm } from "@/components/forms/appointments/AppointmentEditForm";
import { Link } from "react-router-dom";
import { useClinic } from "@/contexts/ClinicContext";
import { MedicalRecordForm } from "@/components/forms/medical/MedicalRecordForm";
import { EvolutionForm } from "@/components/forms/medical/EvolutionForm";

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
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ action: 'confirm' | 'realize' | 'miss' | 'cancel' | 'whatsapp' | null, title: string, description: string }>({ action: null, title: '', description: '' });
  const [showAnamneseForm, setShowAnamneseForm] = useState(false);
  const [showEvolutionForm, setShowEvolutionForm] = useState(false);
  const [creatingBasicRecord, setCreatingBasicRecord] = useState(false);
  const { medicalRecords, addMedicalRecord } = useClinic();

  if (!appointment || !patient) return null;

  // Verificar se o paciente já tem anamnese (medical record)
  const patientMedicalRecord = medicalRecords.find(record => record.patientId === patient.id);
  const hasAnamnese = !!patientMedicalRecord;

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
      setIsLoading(true);
      await onUpdateStatus(appointment.id, status);
      toast.success(`Status alterado para ${status} com sucesso!`);
      onClose(); // <-- fecha o modal após atualizar
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status. Tente novamente.');
    } finally {
      setIsLoading(false);
      setConfirmAction({ action: null, title: '', description: '' });
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      setIsLoading(true);
      await onSendWhatsApp(appointment.id);
      toast.success('Mensagem WhatsApp enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      toast.error('Erro ao enviar WhatsApp. Tente novamente.');
    } finally {
      setIsLoading(false);
      setConfirmAction({ action: null, title: '', description: '' });
    }
  };

  const showConfirmDialog = (action: 'confirm' | 'realize' | 'miss' | 'cancel' | 'whatsapp', title: string, description: string) => {
    setConfirmAction({ action, title, description });
  };

  const createBasicMedicalRecord = async () => {
    try {
      setCreatingBasicRecord(true);
      
      const basicRecord = {
        patientId: patient.id,
        anamnesis: {
          chiefComplaint: 'Registro criado automaticamente para evolução',
          historyOfPresentIllness: '',
          pastMedicalHistory: '',
          medications: '',
          allergies: '',
          socialHistory: ''
        },
        evolutions: [],
        files: []
      };

      await addMedicalRecord(basicRecord);
      
      // Aguardar um pouco para o contexto atualizar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('Erro ao criar registro médico básico:', error);
      toast.error('Erro ao criar registro médico. Tente novamente.');
      return false;
    } finally {
      setCreatingBasicRecord(false);
    }
  };

  const handleEvolutionButtonClick = async () => {
    if (patientMedicalRecord) {
      // Se já tem medical record, abrir direto
      setShowEvolutionForm(true);
    } else {
      // Se não tem medical record, criar um básico primeiro
      const created = await createBasicMedicalRecord();
      if (created) {
        setShowEvolutionForm(true);
      }
    }
  };



  const handleConfirmedAction = () => {
    switch (confirmAction.action) {
      case 'confirm':
        handleUpdateStatus('confirmado');
        break;
      case 'realize':
        handleUpdateStatus('realizado');
        break;
      case 'miss':
        handleUpdateStatus('faltante');
        break;
      case 'cancel':
        handleUpdateStatus('cancelado');
        break;
      case 'whatsapp':
        handleSendWhatsApp();
        break;
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
    <>
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
            <h3 className="font-semibold flex items-center justify-between">
              <div className="flex items-center space-x-2">
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
              </div>
              <div className="flex items-center space-x-2">
                {hasAnamnese ? (
                  // Se já tem anamnese, mostrar botão para ver anamnese (ir para página do paciente)
                  <Link
                    to={`/pacientes/${patient.id}`}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ClipboardList className="h-3 w-3" />
                    <span>Ver Anamnese</span>
                  </Link>
                ) : (
                  // Se não tem anamnese, mostrar botão para criar
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors border-0 h-auto"
                    onClick={() => setShowAnamneseForm(true)}
                  >
                    <ClipboardList className="h-3 w-3" />
                    <span>Criar Anamnese</span>
                  </Button>
                )}
                {/* Sempre mostrar botão de evolução */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors border-0 h-auto"
                  onClick={handleEvolutionButtonClick}
                  disabled={creatingBasicRecord}
                >
                  {creatingBasicRecord ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Preparando...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-3 w-3" />
                      <span>Nova Evolução</span>
                    </>
                  )}
                </Button>
              </div>
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
                  onClick={() => showConfirmDialog('confirm', 'Confirmar Agendamento', `Deseja realmente confirmar o agendamento de ${patient?.fullName} para ${format(new Date(appointment.date), "dd/MM/yyyy", { locale: ptBR })} às ${appointment.time}?`)}
                  disabled={isLoading}
                  className="hover:shadow-md transition-all duration-200"
                >
                  {isLoading && confirmAction.action === 'confirm' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                    onClick={() => showConfirmDialog('whatsapp', 'Enviar WhatsApp', `Deseja enviar uma mensagem de confirmação via WhatsApp para ${patient?.fullName}?`)}
                    disabled={isLoading}
                    className="hover:shadow-md transition-all duration-200"
                  >
                    {isLoading && confirmAction.action === 'whatsapp' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      '📱 Enviar WhatsApp'
                    )}
                  </Button>
                )}
              </>
            )}

            {appointment.status === 'confirmado' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => showConfirmDialog('realize', 'Marcar como Realizado', `Deseja marcar o agendamento de ${patient?.fullName} como realizado?`)}
                disabled={isLoading}
                className="hover:shadow-md transition-all duration-200"
              >
                {isLoading && confirmAction.action === 'realize' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Marcando...
                  </>
                ) : (
                  '✅ Marcar Realizado'
                )}
              </Button>
            )}

            {appointment.status !== 'cancelado' && appointment.status !== 'faltante' && appointment.status !== 'realizado' && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => showConfirmDialog('miss', 'Marcar Falta', `Deseja marcar que ${patient?.fullName} faltou ao agendamento?`)}
                  disabled={isLoading}
                  className="hover:shadow-md transition-all duration-200"
                >
                  {isLoading && confirmAction.action === 'miss' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Marcando...
                    </>
                  ) : (
                    '❌ Falta'
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showConfirmDialog('cancel', 'Cancelar Agendamento', `Deseja realmente cancelar o agendamento de ${patient?.fullName}? Esta ação não pode ser desfeita.`)}
                  disabled={isLoading}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:shadow-md transition-all duration-200"
                >
                  {isLoading && confirmAction.action === 'cancel' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    '🚫 Cancelar'
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

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
            className={
              confirmAction.action === 'miss' || confirmAction.action === 'cancel'
                ? 'bg-red-600 hover:bg-red-700'
                : ''
            }
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

    {/* Modal de Anamnese */}
    <Dialog open={showAnamneseForm} onOpenChange={setShowAnamneseForm}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <ClipboardList className="h-5 w-5" />
              <span>Anamnese - {patient.fullName}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnamneseForm(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <MedicalRecordForm
          patient={patient}
          onSave={() => {
            setShowAnamneseForm(false);
            toast.success('Anamnese salva com sucesso!');
          }}
          onCancel={() => setShowAnamneseForm(false)}
        />
      </DialogContent>
    </Dialog>

    {/* Modal de Evolução */}
    <Dialog open={showEvolutionForm} onOpenChange={setShowEvolutionForm}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Evolução - {patient.fullName}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEvolutionForm(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        {patientMedicalRecord ? (
          <EvolutionForm
            record={patientMedicalRecord}
            onSave={() => {
              setShowEvolutionForm(false);
              toast.success('Evolução salva com sucesso!');
            }}
            onCancel={() => setShowEvolutionForm(false)}
          />
        ) : (
          <div className="p-4 text-center">
            <p className="text-gray-600 mb-4">Preparando formulário de evolução...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}