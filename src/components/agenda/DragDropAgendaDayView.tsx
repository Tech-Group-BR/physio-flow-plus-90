
import { Card, CardContent } from "@/components/ui/card";
import { timeSlots } from "@/utils/agendaUtils";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useState } from "react";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";

interface DragDropAgendaDayViewProps {
  selectedDate: Date;
  getAppointmentForSlot: (date: Date, time: string) => any;
  patients: any[];
  professionals: any[];
  rooms: any[];
  onUpdateStatus: (appointmentId: string, status: 'confirmado' | 'faltante' | 'cancelado' | 'marcado' | 'realizado') => void;
  onSendWhatsApp: (appointmentId: string) => void;
  onUpdateAppointment: (appointmentId: string, updates: any) => void;
}

export function DragDropAgendaDayView({
  selectedDate,
  getAppointmentForSlot,
  patients,
  professionals,
  rooms,
  onUpdateStatus,
  onSendWhatsApp,
  onUpdateAppointment
}: DragDropAgendaDayViewProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newTime = destination.droppableId.replace('day_', '');

    // Atualizar o agendamento com novo horário
    onUpdateAppointment(draggableId, {
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
        <CardContent className="p-4 lg:p-6">
          <div className="space-y-3">
            {timeSlots.map((time) => {
              const appointment = getAppointmentForSlot(selectedDate, time);
              return (
                <Droppable key={time} droppableId={`day_${time}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-4 border rounded-lg ${snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                        }`}
                    >
                      <div className="w-full sm:w-20 text-sm font-medium text-gray-600 sm:text-center">
                        {time}
                      </div>
                      {appointment ? (
                        <Draggable draggableId={appointment.id} index={0}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex-1 ${snapshot.isDragging ? 'opacity-50' : ''}`}
                              onClick={() => handleAppointmentClick(appointment)}
                            >
                              <AppointmentCard
                                appointment={appointment}
                                patients={patients}
                                professionals={professionals}
                                rooms={rooms}
                                onUpdateStatus={onUpdateStatus}
                                onSendWhatsApp={onSendWhatsApp}
                                variant="detailed"
                                onClick={() => handleAppointmentClick(appointment)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ) : (
                        <div className="flex-1 p-4 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400">
                          Horário disponível
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              );
            })}
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
