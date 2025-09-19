import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Calendar } from "lucide-react";
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
  // Debug logs
  console.log('WhatsAppMessages - pendingConfirmations:', pendingConfirmations);
  console.log('WhatsAppMessages - patients:', patients);
  
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Confirmações Pendentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingConfirmations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma confirmação pendente
            </p>
          ) : (
            <>
              <Button
                onClick={() => onSendBulkMessages(pendingConfirmations.map(a => a.id), 'confirmation')}
                className="w-full mb-4"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Todas as Confirmações
              </Button>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingConfirmations.map((appointment) => {
                  const patient = patients.find(p => p.id === appointment.patientId);
                  return (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{patient?.fullName}</p>
                        <p className="text-sm text-muted-foreground">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lembretes para Amanhã</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tomorrowAppointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma consulta amanhã
            </p>
          ) : (
            <>
              <Button
                onClick={() => onSendBulkMessages(tomorrowAppointments.map(a => a.id), 'reminder')}
                variant="outline"
                className="w-full mb-4"
                size="sm"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Enviar Todos os Lembretes
              </Button>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tomorrowAppointments.map((appointment) => {
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