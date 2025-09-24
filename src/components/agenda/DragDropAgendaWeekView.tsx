import { Card, CardContent } from "@/components/ui/card";
import { timeSlots } from "@/utils/agendaUtils";
import { DragDropContext } from "@hello-pangea/dnd";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";
import { Plus } from "lucide-react";

interface DragDropAgendaWeekViewProps {
  weekDays: Date[];
  appointments: any[];
  patients: any[];
  professionals: any[];
  rooms: any[];
  onUpdateStatus: (appointmentId: string, status: 'confirmado' | 'faltante' | 'cancelado' | 'marcado' | 'realizado') => void;
  onSendWhatsApp: (appointmentId: string) => void;
  onUpdateAppointment: (appointmentId: string, updates: any) => void;
  onCreateAppointment?: (date: Date, time: string) => void; // Nova prop
}

export function DragDropAgendaWeekView({
  weekDays,
  appointments,
  patients,
  professionals,
  rooms,
  onUpdateStatus,
  onSendWhatsApp,
  onUpdateAppointment,
  onCreateAppointment
}: DragDropAgendaWeekViewProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const [newDate, newTime] = destination.droppableId.split('_');

    onUpdateAppointment(draggableId, {
      date: newDate,
      time: newTime
    });
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const handleEmptySlotClick = (date: Date, time: string) => {
    if (onCreateAppointment) {
      onCreateAppointment(date, time);
    }
  };

  const getPatient = (patientId: string) => patients.find(p => p.id === patientId);
  const getProfessional = (physioId: string) => professionals.find(p => p.id === physioId);
  const getRoom = (roomId: string) => rooms.find(r => r.id === roomId);

  const hourHeight = 128;
  const startHour = 7;
  const endHour = 20;
  const totalMinutes = (endHour - startHour) * 60;
  const dayHeight = (totalMinutes / 60) * hourHeight;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
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
              {weekDays.map((day) => {
                const dayAppointments = (appointments || []).filter(appt => {
                  const apptDate = new Date(appt.date);
                  return (
                    apptDate.getUTCDate() === day.getUTCDate() &&
                    apptDate.getUTCMonth() === day.getUTCMonth() &&
                    apptDate.getUTCFullYear() === day.getUTCFullYear()
                  );
                });

                return (
                  <div key={day.toISOString()} className="border-r">
                    <div className="h-16 border-b flex flex-col items-center justify-center bg-gray-100">
                      <div className="text-sm font-medium text-gray-700">
                        {format(day, 'EEE', { locale: ptBR })}
                      </div>
                      <div className={`text-lg font-bold ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-900'}`}>
                        {format(day, 'dd')}
                      </div>
                    </div>

                    <div style={{ position: "relative", height: dayHeight }}>
                      {/* Grade com slots clicáveis */}
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: dayHeight, zIndex: 1 }}>
                        {timeSlots.map((time, idx) => {
                          const hasAppointment = dayAppointments.some(appt => appt.time.startsWith(time));
                          
                          return (
                            <div
                              key={time}
                              style={{
                                position: "absolute",
                                top: idx * (hourHeight / 2),
                                left: 0,
                                right: 0,
                                height: hourHeight / 2,
                                borderTop: "1px solid #e5e7eb",
                              }}
                              className={`${
                                !hasAppointment 
                                  ? 'hover:bg-gray-100 cursor-pointer group transition-colors duration-200' 
                                  : ''
                              }`}
                              onClick={() => !hasAppointment && handleEmptySlotClick(day, time)}
                            >
                              {/* Ícone + que aparece no hover dos slots vazios */}
                              {!hasAppointment && (
                                <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-30 transition-opacity duration-200">
                                  <Plus className="h-6 w-6 text-gray-500" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Cards de agendamento */}
                      {dayAppointments.map((appointment) => {
                        const [h, m] = appointment.time.split(':').map(Number);
                        const startMinutes = h * 60 + m;
                        const minutesFromStart = startMinutes - startHour * 60;
                        const top = (minutesFromStart / 60) * hourHeight;
                        const height = ((appointment.duration || 60) / 60) * hourHeight;

                        let backgroundColor = "#f6fff6";
                        let textColor = "black";

                        switch (appointment.status) {
                          case 'cancelado':
                            backgroundColor = "#ffe6e6";
                            textColor = "red";
                            break;
                          case 'confirmado':
                            backgroundColor = "#e6ffe6";
                            textColor = "green";
                            break;
                          case 'marcado':
                            backgroundColor = "#e6f7ff";
                            textColor = "blue";
                            break;
                          default:
                            break;
                        }

                        return (
                          <div
                            key={appointment.id}
                            style={{
                              position: "absolute",
                              top,
                              height,
                              left: 0,
                              right: 0,
                              zIndex: 10,
                              background: backgroundColor,
                              boxShadow: "0 1px 4px 0 rgba(0,0,0,0.03)",
                              borderRadius: '24px',
                            }}
                            onClick={() => handleAppointmentClick(appointment)}
                          >
                            <div className="w-full h-full" style={{ background: backgroundColor, borderRadius: '24px' }}>
                              <AppointmentCard
                                appointment={appointment}
                                patients={patients}
                                professionals={professionals}
                                rooms={rooms}
                                onUpdateStatus={onUpdateStatus}
                                onSendWhatsApp={onSendWhatsApp}
                                variant="compact"
                                onClick={() => handleAppointmentClick(appointment)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          patient={getPatient(selectedAppointment.patientId)}
          professional={getProfessional(selectedAppointment.professionalId)}
          room={getRoom(selectedAppointment.roomId)}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedAppointment(null);
          }}
          onUpdateStatus={onUpdateStatus}
          onSendWhatsApp={onSendWhatsApp}
          onUpdateAppointment={onUpdateAppointment}
        />
      )}
    </DragDropContext>
  );
}