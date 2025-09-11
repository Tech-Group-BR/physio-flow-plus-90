import { Card, CardContent } from "@/components/ui/card";
import { timeSlots } from "@/utils/agendaUtils";
import { AppointmentCard } from "./AppointmentCard";

interface AgendaDayViewProps {
  selectedDate: Date;
  getAppointmentForSlot: (date: Date, time: string) => any;
  patients: any[];
  physiotherapists: any[];
  rooms: any[];
  onUpdateStatus: (appointmentId: string, status: 'confirmado' | 'faltante' | 'cancelado') => void;
  onSendWhatsApp: (appointmentId: string) => void;
}

export function AgendaDayView({
  selectedDate,
  getAppointmentForSlot,
  patients,
  physiotherapists,
  rooms,
  onUpdateStatus,
  onSendWhatsApp
}: AgendaDayViewProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 lg:p-6">
        <div className="space-y-3">
          {timeSlots.map((time) => {
            const appointment = getAppointmentForSlot(selectedDate, time);
            return (
              <div key={time} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                <div className="w-full sm:w-20 text-sm font-medium text-gray-600 sm:text-center">
                  {time}
                </div>
                {appointment ? (
                  <AppointmentCard
                    appointment={appointment}
                    patients={patients}
                    physiotherapists={physiotherapists}
                    rooms={rooms}
                    onUpdateStatus={onUpdateStatus}
                    onSendWhatsApp={onSendWhatsApp}
                    variant="detailed"
                  />
                ) : (
                  <div className="flex-1 p-4 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400">
                    Horário disponível
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}