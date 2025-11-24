import { Card, CardContent } from "@/components/ui/card";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { timeSlots } from "@/shared/utils";
import { AppointmentCard } from "./AppointmentCard";
import { Plus } from "lucide-react";

interface AgendaWeekViewProps {
  weekDays: Date[];
  getAppointmentForSlot: (date: Date, time: string) => any;
  patients: any[];
  professionals: any[];
  rooms: any[];
  onUpdateStatus: (appointmentId: string, status: 'confirmado' | 'faltante' | 'cancelado') => void;
  onSendWhatsApp: (appointmentId: string) => void;
  onCreateAppointment?: (date: Date, time: string) => void; // Nova prop para criar agendamento
}

export function AgendaWeekView({
  weekDays,
  getAppointmentForSlot,
  patients,
  professionals,
  rooms,
  onUpdateStatus,
  onSendWhatsApp,
  onCreateAppointment
}: AgendaWeekViewProps) {
  
  const handleEmptySlotClick = (date: Date, time: string) => {
    if (onCreateAppointment) {
      onCreateAppointment(date, time);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[800px] grid grid-cols-8">
            {/* Time column */}
            <div className="border-r bg-gray-50">
              <div className="h-16 border-b flex items-center justify-center font-semibold text-sm bg-gray-100">
                Horário
              </div>
              {timeSlots.map((time) => (
                <div key={time} className="h-16 border-b flex items-center justify-center text-sm text-gray-600 bg-gray-50">
                  {time}
                </div>
              ))}
            </div>

            {/* Days columns */}
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="border-r">
                <div className="h-16 border-b flex flex-col items-center justify-center bg-gray-100">
                  <div className="text-sm font-medium text-gray-700">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={`text-lg font-bold ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-900'}`}>
                    {format(day, 'dd')}
                  </div>
                </div>
                
                {timeSlots.map((time) => {
                  const appointment = getAppointmentForSlot(day, time);
                  return (
                    <div 
                      key={`${day.toISOString()}-${time}`} 
                      className={`h-16 border-b p-1 relative transition-all duration-200 ${
                        appointment 
                          ? 'bg-white' 
                          : 'bg-white hover:bg-gray-100 cursor-pointer group'
                      }`}
                      onClick={() => !appointment && handleEmptySlotClick(day, time)}
                    >
                      {appointment ? (
                        <div style={{ borderRadius: '24px', overflow: 'hidden' }}>
                          <AppointmentCard
                            appointment={appointment}
                            patients={patients}
                            professionals={professionals}
                            rooms={rooms}
                            onUpdateStatus={onUpdateStatus}
                            onSendWhatsApp={onSendWhatsApp}
                            variant="compact"
                          />
                        </div>
                      ) : (
                        /* Slot vazio - mostra ícone + ao hover */
                        <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-50 transition-opacity duration-200">
                          <Plus className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}