import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Send, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";

interface WhatsAppMessagesProps {
  pendingConfirmations: any[];
  tomorrowAppointments: any[];
  completedAppointments: any[];
  newPatients: any[];
  patients: any[];
  pendingPayments: any[];
  onSendMessage: (appointmentId: string, type: 'confirmation' | 'reminder' | 'followup' | 'payment') => void;
  onSendBulkMessages: (appointmentIds: string[], type: 'confirmation' | 'reminder' | 'followup' | 'payment') => void;
  onSendIndividualWelcome: (patientId: string) => void;
  onSendBulkWelcome: () => void;
}

export function WhatsAppMessages({ 
  pendingConfirmations, 
  tomorrowAppointments,
  completedAppointments,
  newPatients, 
  patients,
  pendingPayments, 
  onSendMessage, 
  onSendBulkMessages,
  onSendIndividualWelcome,
  onSendBulkWelcome
}: WhatsAppMessagesProps) {
  const [confirmationDateFilter, setConfirmationDateFilter] = useState('');
  const [reminderDateFilter, setReminderDateFilter] = useState('');
  const [followupDateFilter, setFollowupDateFilter] = useState('');
  const [paymentDateFilter, setPaymentDateFilter] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isWelcomeDialogOpen, setIsWelcomeDialogOpen] = useState(false);
  const [bulkSendAction, setBulkSendAction] = useState<{ ids: string[], type: 'confirmation' | 'reminder' | 'followup' | 'payment' } | null>(null);
  
  // Helper para formatar data sem problemas de timezone
  const formatDateFromInput = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };
  
  // Função para abrir diálogo de confirmação
  const handleBulkSendClick = (appointmentIds: string[], type: 'confirmation' | 'reminder' | 'followup' | 'payment') => {
    setBulkSendAction({ ids: appointmentIds, type });
    setIsConfirmDialogOpen(true);
  };
  
  // Função para confirmar envio em massa
  const handleConfirmBulkSend = () => {
    if (bulkSendAction) {
      onSendBulkMessages(bulkSendAction.ids, bulkSendAction.type);
    }
    setIsConfirmDialogOpen(false);
    setBulkSendAction(null);
  };

  // Função para abrir diálogo de boas-vindas
  const handleWelcomeSendClick = () => {
    setIsWelcomeDialogOpen(true);
  };

  // Função para confirmar envio de boas-vindas
  const handleConfirmWelcomeSend = () => {
    onSendBulkWelcome();
    setIsWelcomeDialogOpen(false);
  };
  
  // Debug logs
  console.log('WhatsAppMessages - pendingConfirmations:', pendingConfirmations);
  console.log('WhatsAppMessages - patients:', patients);
  
  // Filtrar confirmações por data se houver filtro
  const filteredPendingConfirmations = confirmationDateFilter 
    ? pendingConfirmations.filter(appointment => appointment.date === confirmationDateFilter)
    : pendingConfirmations;
  
  // Filtrar lembretes por data se houver filtro  
  const filteredTomorrowAppointments = reminderDateFilter
    ? tomorrowAppointments.filter(appointment => appointment.date === reminderDateFilter)
    : tomorrowAppointments;

  // Buscar consultas concluídas para follow-up (ontem ou filtro personalizado)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Filtrar por data se necessário
  const filteredCompletedAppointments = followupDateFilter 
    ? completedAppointments.filter(apt => apt.date === followupDateFilter)
    : completedAppointments;

  // Filtrar pagamentos pendentes por data
  const filteredPendingPayments = paymentDateFilter
    ? pendingPayments.filter(apt => apt.date === paymentDateFilter)
    : pendingPayments;
  
  return (
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Confirmações Pendentes Card */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5" />
            Confirmações Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col">
          {/* Filtro por data */}
          <div className="space-y-2">
            <Label htmlFor="confirmation-date" className="text-sm font-medium flex items-center gap-1">
              <Filter className="h-4 w-4" />
              Filtrar por data:
            </Label>
            <Input
              id="confirmation-date"
              type="date"
              value={confirmationDateFilter}
              onChange={(e) => setConfirmationDateFilter(e.target.value)}
              className="text-sm"
            />
            {confirmationDateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmationDateFilter('')}
                className="text-xs h-6 px-2"
              >
                Limpar filtro
              </Button>
            )}
          </div>
          
          {filteredPendingConfirmations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 flex-1 flex items-center justify-center">
              {confirmationDateFilter 
                ? `Nenhuma confirmação pendente para ${formatDateFromInput(confirmationDateFilter)}`
                : 'Nenhuma confirmação pendente'
              }
            </p>
          ) : (
            <>
              {/* Botão de envio em massa com largura total */}
              <Button
                onClick={() => handleBulkSendClick(filteredPendingConfirmations.map(a => a.id), 'confirmation')}
                className="w-full"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {confirmationDateFilter 
                  ? `Enviar Confirmações (${formatDateFromInput(confirmationDateFilter)})`
                  : `Enviar Todas as Confirmações (${filteredPendingConfirmations.length})`
                }
              </Button>
              
              {/* Lista de agendamentos com scroll */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 -mr-2">
                {filteredPendingConfirmations.map((appointment) => {
                  const patient = patients.find(p => p.id === appointment.patientId);
                  return (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{patient?.fullName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                         {appointment.date.slice(0, 10).split('-').reverse().join('/')} às {appointment.time}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onSendMessage(appointment.id, 'confirmation')}
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lembretes para Amanhã Card */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lembretes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col">
          {/* Filtro por data */}
          <div className="space-y-2">
            <Label htmlFor="reminder-date" className="text-sm font-medium flex items-center gap-1">
              <Filter className="h-4 w-4" />
              Filtrar por data:
            </Label>
            <Input
              id="reminder-date"
              type="date"
              value={reminderDateFilter}
              onChange={(e) => setReminderDateFilter(e.target.value)}
              className="text-sm"
            />
            {reminderDateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReminderDateFilter('')}
                className="text-xs h-6 px-2"
              >
                Limpar filtro
              </Button>
            )}
          </div>
          
          {filteredTomorrowAppointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 flex-1 flex items-center justify-center">
              {reminderDateFilter 
                ? `Nenhuma consulta para ${formatDateFromInput(reminderDateFilter)}`
                : 'Nenhuma consulta para lembrete'
              }
            </p>
          ) : (
            <>
              {/* Botão de envio em massa com largura total */}
              <Button
                onClick={() => handleBulkSendClick(filteredTomorrowAppointments.map(a => a.id), 'reminder')}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {reminderDateFilter 
                  ? `Enviar Lembretes (${formatDateFromInput(reminderDateFilter)})`
                  : `Enviar Todos os Lembretes (${filteredTomorrowAppointments.length})`
                }
              </Button>
              
              {/* Lista de agendamentos com scroll */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 -mr-2">
                {filteredTomorrowAppointments.map((appointment) => {
                  const patient = patients.find(p => p.id === appointment.patientId);
                  return (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{patient?.fullName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {appointment.time} - {appointment.treatmentType}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSendMessage(appointment.id, 'reminder')}
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Follow-up Pós-Consulta Card */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5" />
            Follow-up Pós-Consulta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col">
          <div className="space-y-2">
            <Label htmlFor="followup-date" className="text-sm font-medium flex items-center gap-1">
              <Filter className="h-4 w-4" />
              Filtrar por data:
            </Label>
            <Input
              id="followup-date"
              type="date"
              value={followupDateFilter}
              onChange={(e) => setFollowupDateFilter(e.target.value)}
              className="text-sm"
            />
            {followupDateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFollowupDateFilter('')}
                className="text-xs h-6 px-2"
              >
                Limpar filtro
              </Button>
            )}
          </div>
          
          {filteredCompletedAppointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 flex-1 flex items-center justify-center">
              {followupDateFilter 
                ? `Nenhuma consulta concluída em ${formatDateFromInput(followupDateFilter)}`
                : 'Nenhuma consulta concluída ontem'
              }
            </p>
          ) : (
            <>
              <Button
                onClick={() => handleBulkSendClick(filteredCompletedAppointments.map(a => a.id), 'followup')}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {followupDateFilter 
                  ? `Enviar Follow-ups (${formatDateFromInput(followupDateFilter)})`
                  : `Enviar Todos os Follow-ups (${filteredCompletedAppointments.length})`
                }
              </Button>
              
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 -mr-2">
                {filteredCompletedAppointments.map((appointment) => {
                  const patient = patients.find(p => p.id === appointment.patientId);
                  return (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{patient?.fullName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {appointment.date.slice(0, 10).split('-').reverse().join('/')} às {appointment.time}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSendMessage(appointment.id, 'followup')}
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Boas-vindas Card */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5" />
            Boas-vindas
          </CardTitle>
          <CardDescription>
            {newPatients.length} {newPatients.length === 1 ? 'paciente novo' : 'pacientes novos'} nas últimas 24h
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col">
          {newPatients.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 flex-1 flex items-center justify-center">
              Nenhum paciente novo nas últimas 24 horas
            </p>
          ) : (
            <>
              <Button
                onClick={handleWelcomeSendClick}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Todas as Boas-vindas ({newPatients.length})
              </Button>
              
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 -mr-2">
                {newPatients.map((patient) => {
                  const createdDate = patient.createdAt 
                    ? new Date(patient.createdAt).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Data não disponível';
                  
                  return (
                    <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{patient.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          Cadastrado em: {createdDate}
                        </p>
                        {patient.phone && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📱 {patient.phone}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => onSendIndividualWelcome(patient.id)}
                        size="sm"
                        variant="outline"
                        className="ml-2 shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cobrança de Pagamentos Pendentes Card */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            💰 Cobranças de Pagamento
          </CardTitle>
          <CardDescription>
            Agendamentos realizados com pagamento pendente ou atrasado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col">
          {/* Filtro por data */}
          <div className="space-y-2">
            <Label htmlFor="payment-date" className="text-sm font-medium flex items-center gap-1">
              <Filter className="h-4 w-4" />
              Filtrar por data:
            </Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDateFilter}
              onChange={(e) => setPaymentDateFilter(e.target.value)}
              className="text-sm"
            />
            {paymentDateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPaymentDateFilter('')}
                className="text-xs h-6 px-2"
              >
                Limpar filtro
              </Button>
            )}
          </div>
          
          {filteredPendingPayments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 flex-1 flex items-center justify-center">
              {paymentDateFilter 
                ? `Nenhum pagamento pendente para ${formatDateFromInput(paymentDateFilter)}`
                : 'Nenhum pagamento pendente'
              }
            </p>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-2">
                {filteredPendingPayments.length} agendamento(s) com pagamento pendente
              </div>
              <div className="space-y-2 flex-1 overflow-auto max-h-[400px] pr-2">
                {filteredPendingPayments.map((appointment: any) => {
                  const patient = patients.find((p: any) => p.id === appointment.patientId);
                  const appointmentDate = format(new Date(appointment.date + 'T00:00:00'), 'dd/MM/yyyy');
                  
                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg border hover:border-primary transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{patient?.fullName || 'Paciente desconhecido'}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointmentDate} às {appointment.time}
                        </p>
                        {appointment.price && (
                          <p className="text-sm font-semibold text-orange-600 mt-1">
                            Valor: R$ {appointment.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => onSendMessage(appointment.id, 'payment')}
                        size="sm"
                        variant="outline"
                        className="ml-2 shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              <Button 
                onClick={() => handleBulkSendClick(filteredPendingPayments.map((a: any) => a.id), 'payment')} 
                className="w-full"
                variant="default"
              >
                Enviar Todas as Cobranças
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Confirmação para Envio em Massa */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Envio em Massa</AlertDialogTitle>
            <AlertDialogDescription>
              {bulkSendAction?.type === 'confirmation' ? (
                <>
                  Você está prestes a enviar <strong>{bulkSendAction.ids.length} mensagens de confirmação</strong> via WhatsApp.
                  {confirmationDateFilter && (
                    <> para a data <strong>{formatDateFromInput(confirmationDateFilter)}</strong></>
                  )}
                  <br /><br />
                  Deseja continuar com o envio?
                </>
              ) : bulkSendAction?.type === 'reminder' ? (
                <>
                  Você está prestes a enviar <strong>{bulkSendAction?.ids.length} mensagens de lembrete</strong> via WhatsApp.
                  {reminderDateFilter && (
                    <> para a data <strong>{formatDateFromInput(reminderDateFilter)}</strong></>
                  )}
                  <br /><br />
                  Deseja continuar com o envio?
                </>
              ) : bulkSendAction?.type === 'payment' ? (
                <>
                  Você está prestes a enviar <strong>{bulkSendAction?.ids.length} mensagens de cobrança</strong> via WhatsApp para agendamentos com pagamento pendente.
                  {paymentDateFilter && (
                    <> para a data <strong>{formatDateFromInput(paymentDateFilter)}</strong></>
                  )}
                  <br /><br />
                  Deseja continuar com o envio?
                </>
              ) : (
                <>
                  Você está prestes a enviar <strong>{bulkSendAction?.ids.length} mensagens de follow-up</strong> via WhatsApp.
                  {followupDateFilter && (
                    <> para a data <strong>{formatDateFromInput(followupDateFilter)}</strong></>
                  )}
                  <br /><br />
                  Deseja continuar com o envio?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBulkSend}>
              Confirmar Envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Confirmação para Boas-vindas */}
      <AlertDialog open={isWelcomeDialogOpen} onOpenChange={setIsWelcomeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Envio de Boas-vindas</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a enviar <strong>mensagens de boas-vindas</strong> para todos os pacientes novos (últimas 24h) que ainda não receberam via WhatsApp.
              <br /><br />
              Deseja continuar com o envio?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmWelcomeSend}>
              Confirmar Envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}