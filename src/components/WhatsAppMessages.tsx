import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";

interface WhatsAppMessagesProps {
  pendingConfirmations: any[];
  tomorrowAppointments: any[];
  patients: any[];
  onSendMessage: (appointmentId: string, type: 'confirmation' | 'reminder') => void;
  onSendBulkMessages: (appointmentIds: string[], type: 'confirmation' | 'reminder') => void;
}

export function WhatsAppMessages({ 
  pendingConfirmations, 
  tomorrowAppointments, 
  patients, 
  onSendMessage, 
  onSendBulkMessages 
}: WhatsAppMessagesProps) {
  const [confirmationDateFilter, setConfirmationDateFilter] = useState('');
  const [reminderDateFilter, setReminderDateFilter] = useState('');
  
  // Helper para formatar data sem problemas de timezone
  const formatDateFromInput = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
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
                onClick={() => onSendBulkMessages(filteredPendingConfirmations.map(a => a.id), 'confirmation')}
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
                onClick={() => onSendBulkMessages(filteredTomorrowAppointments.map(a => a.id), 'reminder')}
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
    </div>
  );
}