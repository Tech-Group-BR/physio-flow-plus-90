
import { Card, CardContent } from "@/components/ui/card";
import { timeSlots } from "@/utils/agendaUtils";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";

interface DragDropAgendaWeekViewProps {
  weekDays: Date[];
  getAppointmentForSlot: (date: Date, time: string) => any;
  patients: any[];
  professionals: any[];
  rooms: any[];
  onUpdateStatus: (appointmentId: string, status: 'confirmado' | 'faltante' | 'cancelado' | 'marcado' | 'realizado') => void;
  onSendWhatsApp: (appointmentId: string) => void;
  onUpdateAppointment: (appointmentId: string, updates: any) => void;
}

export function DragDropAgendaWeekView({
  weekDays,
  getAppointmentForSlot,
  patients,
  professionals,
  rooms,
  onUpdateStatus,
  onSendWhatsApp,
  onUpdateAppointment
}: DragDropAgendaWeekViewProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const [newDate, newTime] = destination.droppableId.split('_');

    // Atualizar o agendamento com nova data e horário
    onUpdateAppointment(draggableId, {
      date: newDate,
      time: newTime
    });
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const getPatient = (patientId: string) => patients.find(p => p.id === patientId);
  const getProfessional = (physioId: string) => professionals.find(p => p.id === physioId);
  const getRoom = (roomId: string) => rooms.find(r => r.id === roomId);

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
                    const dayTimeId = `${format(day, 'yyyy-MM-dd')}_${time}`;

                    return (
                      <Droppable key={dayTimeId} droppableId={dayTimeId}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`h-16 border-b p-1 relative ${snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                              }`}
                          >
                            {appointment && (
                              <Draggable
                                draggableId={appointment.id}
                                index={0}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`h-full ${snapshot.isDragging ? 'opacity-50' : ''}`}
                                    onClick={() => handleAppointmentClick(appointment)}
                                  >
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
                                )}
                              </Draggable>
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          patient={getPatient(selectedAppointment.patientId)}
          Professional={getProfessional(selectedAppointment.professionalId)}
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
