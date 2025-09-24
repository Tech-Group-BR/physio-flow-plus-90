import { Card, CardContent } from "@/components/ui/card";
import { timeSlots } from "@/utils/agendaUtils";
import { DragDropContext } from "@hello-pangea/dnd";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";
import { AppointmentFormWithRecurrence } from "./AppointmentFormWithRecurrence";

interface DragDropAgendaDayViewProps {
  selectedDate: Date;
  // Mudança: ao invés de receber appointments, receber a função do useAgendaLogic
  getAppointmentForSlot: (date: Date, time: string) => any;
  patients: any[];
  professionals: any[];
  rooms: any[];
  onUpdateStatus: (appointmentId: string, status: 'confirmado' | 'faltante' | 'cancelado' | 'marcado' | 'realizado') => void;
  onSendWhatsApp: (appointmentId: string) => void;
  onUpdateAppointment: (appointmentId: string, updates: any) => void;
  onCreateAppointment?: (appointmentData: any) => void;
}

export function DragDropAgendaDayView({
  selectedDate,
  getAppointmentForSlot,
  patients,
  professionals,
  rooms,
  onUpdateStatus,
  onSendWhatsApp,
  onUpdateAppointment,
  onCreateAppointment
}: DragDropAgendaDayViewProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('');

  console.log('DragDropAgendaDayView - Props recebidas:', {
    selectedDate,
    patients: patients?.length || 0,
    professionals: professionals?.length || 0,
    rooms: rooms?.length || 0
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newTime = destination.droppableId.replace('day_', '');

    onUpdateAppointment(draggableId, {
      time: newTime
    });
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const handleEmptySlotClick = (time: string) => {
    console.log('Slot clicado:', time, 'onCreateAppointment:', onCreateAppointment ? 'existe' : 'não existe');
    setSelectedTime(time);
    setShowNewAppointmentModal(true);
  };

  const handleSaveNewAppointment = async (appointmentData: any) => {
    console.log('Salvando novo agendamento:', appointmentData);
    if (onCreateAppointment) {
      // Adicionar a data e horário selecionados aos dados do agendamento
      const appointmentWithDateTime = {
        ...appointmentData,
        date: selectedDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
        time: selectedTime
      };
      console.log('Dados finais do agendamento:', appointmentWithDateTime);
      await onCreateAppointment(appointmentWithDateTime);
    }
    setShowNewAppointmentModal(false);
    setSelectedTime('');
  };

  const handleCancelNewAppointment = () => {
    setShowNewAppointmentModal(false);
    setSelectedTime('');
  };

  const getPatient = (patientId: string) => patients?.find(p => p.id === patientId);
  const getProfessional = (physioId: string) => professionals?.find(p => p.id === physioId);
  const getRoom = (roomId: string) => rooms?.find(r => r.id === roomId);

  // Coletar todos os agendamentos do dia usando a função getAppointmentForSlot
  const dayAppointments = timeSlots
    .map(time => getAppointmentForSlot(selectedDate, time))
    .filter(appointment => appointment !== undefined);

  console.log('Debug - Day appointments found:', dayAppointments.length);
  dayAppointments.forEach(apt => {
    console.log('Agendamento do dia:', {
      id: apt.id,
      date: apt.date,
      time: apt.time,
      patientId: apt.patientId,
      status: apt.status
    });
  });

  const hourHeight = 128;
  const startHour = 7;
  const endHour = 20;
  const totalMinutes = (endHour - startHour) * 60;
  const dayHeight = (totalMinutes / 60) * hourHeight;

  console.log('Estado do modal:', {
    showNewAppointmentModal,
    selectedTime,
    onCreateAppointment: !!onCreateAppointment
  });

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Coluna de horários */}
            <div className="w-20 border-r bg-gray-50">
              <div className="h-16 border-b flex items-center justify-center font-semibold text-sm bg-gray-100">
                Horário
              </div>
              {timeSlots.map((time) => (
                <div key={time} className="h-16 border-b flex items-center justify-center text-sm text-gray-600 bg-gray-50">
                  {time}
                </div>
              ))}
            </div>

            {/* Área dos agendamentos */}
            <div className="flex-1 relative" style={{ height: dayHeight + 64 }}>
              {/* Header do dia */}
              <div className="h-16 border-b flex items-center justify-center bg-gray-100 font-semibold">
                {selectedDate.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: '2-digit', 
                  month: 'long' 
                })}
                <span className="ml-4 text-xs text-gray-500">
                  ({dayAppointments.length} agendamentos)
                </span>
              </div>

              {/* Container da grade */}
              <div style={{ position: "relative", height: dayHeight }}>
                {/* Linhas de grade com slots clicáveis */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: dayHeight, zIndex: 1 }}>
                  {timeSlots.map((time, idx) => {
                    const appointment = getAppointmentForSlot(selectedDate, time);
                    
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
                          !appointment 
                            ? 'hover:bg-gray-100 cursor-pointer group transition-colors duration-200' 
                            : ''
                        }`}
                        onClick={() => !appointment && handleEmptySlotClick(time)}
                      >
                        {!appointment && (
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
                  if (!appointment?.time) {
                    console.log('Agendamento sem horário:', appointment);
                    return null;
                  }

                  const timeWithoutSeconds = appointment.time.slice(0, 5);
                  const [h, m] = timeWithoutSeconds.split(':').map(Number);
                  
                  if (isNaN(h) || isNaN(m)) {
                    console.log('Horário inválido:', appointment.time, appointment);
                    return null;
                  }

                  const startMinutes = h * 60 + m;
                  const minutesFromStart = startMinutes - startHour * 60;
                  
                  if (minutesFromStart < 0 || minutesFromStart >= totalMinutes) {
                    console.log('Horário fora do range:', appointment.time, 'Range:', startHour, '-', endHour);
                    return null;
                  }

                  const top = (minutesFromStart / 60) * hourHeight;
                  // Altura totalmente proporcional à duração, sem subtração fixa
                  const height = Math.max(((appointment.duration || 60) / 60) * hourHeight, 30);

                  let backgroundColor = "#f6fff6";
                  switch (appointment.status) {
                    case 'cancelado':
                      backgroundColor = "#ffe6e6";
                      break;
                    case 'confirmado':
                      backgroundColor = "#e6ffe6";
                      break;
                    case 'marcado':
                      backgroundColor = "#e6f7ff";
                      break;
                    default:
                      backgroundColor = "#f6fff6";
                      break;
                  }

                  console.log('Renderizando agendamento:', {
                    id: appointment.id,
                    time: timeWithoutSeconds,
                    top,
                    height,
                    minutesFromStart,
                    backgroundColor
                  });

                  return (
                    <div
                      key={appointment.id}
                      style={{
                        position: "absolute",
                        top: top + 2, // Pequena margem superior
                        height,
                        left: 8,
                        right: 8,
                        zIndex: 10,
                        background: backgroundColor,
                        boxShadow: "0 2px 5px 0 rgba(0,0,0,0.1)",
                        borderRadius: '16px',
                      }}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleAppointmentClick(appointment)}
                    >
                      <AppointmentCard
                        appointment={appointment}
                        patients={patients || []}
                        professionals={professionals || []}
                        rooms={rooms || []}
                        onUpdateStatus={onUpdateStatus}
                        onSendWhatsApp={onSendWhatsApp}
                        variant="detailed" // Sempre usar detailed na day view
                        onClick={() => handleAppointmentClick(appointment)}
                      />
                    </div>
                  );
                })}

                {/* Mensagem quando não há agendamentos */}
                {dayAppointments.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                    Nenhum agendamento para este dia
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
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

      {/* Modal para novo agendamento - com log adicional */}
      {showNewAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
            <AppointmentFormWithRecurrence
              initialDate={selectedDate}
              initialTime={selectedTime}
              onSave={handleSaveNewAppointment}
              onCancel={handleCancelNewAppointment}
            />
          </div>
        </div>
      )}
    </DragDropContext>
  );
}