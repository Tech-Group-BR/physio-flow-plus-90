import { Card, CardContent } from "@/components/ui/card";
import { DragDropContext } from "@hello-pangea/dnd";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";
import { AppointmentFormWithRecurrence } from "./AppointmentFormWithRecurrence";

interface DragDropAgendaDayViewProps {
  selectedDate: Date;
  getAppointmentForSlot: (date: Date, time: string) => any;
  appointments?: any[]; // Adicionar prop para todos os agendamentos
  patients: any[];
  professionals: any[];
  rooms: any[];
  onUpdateStatus: (appointmentId: string, status: 'confirmado' | 'faltante' | 'cancelado' | 'marcado' | 'realizado') => void;
  onSendWhatsApp: (appointmentId: string) => void;
  onUpdateAppointment: (appointmentId: string, updates: any) => void;
  onDeleteAppointment?: (appointmentId: string) => void;
  onCreateAppointment?: (appointmentData: any) => void;
}

export function DragDropAgendaDayView({
  selectedDate,
  getAppointmentForSlot,
  appointments = [], // Usar prop diretamente se disponível
  patients,
  professionals,
  rooms,
  onUpdateStatus,
  onSendWhatsApp,
  onUpdateAppointment,
  onDeleteAppointment,
  onCreateAppointment
}: DragDropAgendaDayViewProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  // Gerar todos os slots de horário de 7:00 às 20:00 (30 em 30 minutos)
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 7;
    const endHour = 20;
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    // Adicionar 20:00 como último slot
    slots.push('20:00');
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Detectar se é mobile de forma segura
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  console.log('DragDropAgendaDayView - Props recebidas:', {
    selectedDate,
    appointments: appointments?.length || 0,
    patients: patients?.length || 0,
    professionals: professionals?.length || 0,
    rooms: rooms?.length || 0,
    timeSlots: timeSlots.length
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
      const appointmentWithDateTime = {
        ...appointmentData,
        date: selectedDate.toISOString().split('T')[0],
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

  // Buscar TODOS os agendamentos do dia
  const dayAppointments = appointments && appointments.length > 0 
    ? appointments.filter(apt => {
        const dayString = selectedDate.toISOString().split('T')[0];
        return apt.date === dayString;
      })
    : // Fallback: buscar usando a função original para todos os slots
      timeSlots
        .map(time => getAppointmentForSlot(selectedDate, time))
        .filter(appointment => appointment !== undefined);

  console.log('Debug - Agendamentos do dia:', {
    selectedDateString: selectedDate.toISOString().split('T')[0],
    totalAppointments: appointments?.length || 0,
    dayAppointmentsFound: dayAppointments.length,
    usingAppointmentsProp: appointments && appointments.length > 0,
    dayAppointments: dayAppointments.map(apt => ({ 
      id: apt.id, 
      time: apt.time, 
      patient: apt.patientId,
      status: apt.status 
    }))
  });

  // Definir alturas consistentes para alinhamento - corrigidas
  const slotHeight = isMobile ? 96 : 128; // Voltando aos valores corretos
  const headerHeight = isMobile ? 77 : 102; // Voltando aos valores corretos

  // Função para calcular posição do agendamento baseado no horário
  const getAppointmentPosition = (timeString: string) => {
    const [hours, minutes] = timeString.slice(0, 5).split(':').map(Number);
    const totalMinutes = (hours - 7) * 60 + minutes; // Relativo às 7:00
    const position = (totalMinutes / 30) * slotHeight; // Cada slot é 30min
    return Math.max(0, position);
  };

  // Função para verificar se há agendamento em um slot específico
  const hasAppointmentInSlot = (time: string) => {
    // Se temos appointments prop, usar ela
    if (appointments && appointments.length > 0) {
      const dayString = selectedDate.toISOString().split('T')[0];
      return appointments.some(apt => {
        const aptDate = apt.date;
        const aptTime = apt.time.slice(0, 5);
        return aptDate === dayString && aptTime === time;
      });
    }
    
    // Fallback: usar a função original
    return !!getAppointmentForSlot(selectedDate, time);
  };

  console.log('Estado do modal:', {
    showNewAppointmentModal,
    selectedTime,
    onCreateAppointment: !!onCreateAppointment,
    totalTimeSlots: timeSlots.length,
    isMobile
  });

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Coluna de horários - alturas reduzidas */}
            <div className="w-12 sm:w-16 md:w-20 border-r bg-gray-50 flex-shrink-0">
              {/* Header alinhado - altura reduzida */}
              <div 
                className="border-b flex items-center justify-center font-semibold text-xs sm:text-sm bg-gray-100"
                style={{ height: `${headerHeight}px` }}
              >
                <span className="hidden sm:inline">Horário</span>
                <span className="sm:hidden">Hora</span>
              </div>
              
              {/* TODOS os slots de horário - alturas reduzidas */}
              {timeSlots.map((time, index) => (
                <div 
                  key={`time-${time}`}
                  className="border-b flex items-center justify-center text-xs sm:text-sm text-gray-600 bg-gray-50"
                  style={{ height: `${slotHeight}px` }}
                >
                  {/* Mobile: mostra HH:MM mais compacto */}
                  <span className="block sm:hidden text-xs font-medium">{time}</span>
                  {/* Desktop: mostra horário completo */}
                  <span className="hidden sm:inline">{time}</span>
                </div>
              ))}
            </div>

            {/* Área dos agendamentos */}
            <div className="flex-1 relative overflow-hidden">
              {/* Header do dia - altura reduzida */}
              <div 
                className="border-b flex items-center justify-center bg-gray-100 font-semibold text-xs sm:text-sm md:text-base px-2 sticky top-0 z-20"
                style={{ height: `${headerHeight}px` }}
              >
                <div className="text-center truncate">
                  {/* Mobile: formato curto */}
                  <span className="block sm:hidden">
                    {selectedDate.toLocaleDateString('pt-BR', { 
                      weekday: 'short', 
                      day: '2-digit', 
                      month: 'short' 
                    })}
                  </span>
                  {/* Desktop: formato completo */}
                  <span className="hidden sm:block">
                    {selectedDate.toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      day: '2-digit', 
                      month: 'long' 
                    })}
                  </span>
                  <span className="ml-1 sm:ml-4 text-xs text-gray-500">
                    ({dayAppointments.length} agendamentos)
                  </span>
                </div>
              </div>

              {/* Container da grade - altura total reduzida */}
              <div 
                style={{ 
                  position: "relative", 
                  height: `${timeSlots.length * slotHeight}px`, 
                  width: "100%"
                }}
              >
                {/* Linhas de grade - alturas reduzidas */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
                  {timeSlots.map((time, idx) => {
                    const hasAppointment = hasAppointmentInSlot(time);
                    
                    return (
                      <div
                        key={`slot-${time}`}
                        style={{
                          position: "absolute",
                          top: idx * slotHeight,
                          left: 0,
                          right: 0,
                          height: slotHeight,
                          borderTop: idx === 0 ? "none" : "1px solid #e5e7eb",
                        }}
                        className={`${
                          !hasAppointment 
                            ? 'hover:bg-gray-100 cursor-pointer group transition-colors duration-200' 
                            : ''
                        }`}
                        onClick={() => !hasAppointment && handleEmptySlotClick(time)}
                      >
                        {!hasAppointment && (
                          <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-30 transition-opacity duration-200">
                            <Plus className="h-3 w-3 sm:h-5 sm:w-5 text-gray-500" /> {/* Ícone ainda menor para se adequar à nova altura */}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Cards de agendamento - renderizar TODOS */}
                {dayAppointments.map((appointment) => {
                  if (!appointment?.time) {
                    console.log('Agendamento sem horário:', appointment);
                    return null;
                  }

                  const timeWithoutSeconds = appointment.time.slice(0, 5);
                  
                  let top;
                  if (appointments && appointments.length > 0) {
                    top = getAppointmentPosition(appointment.time);
                    
                    const [hours] = timeWithoutSeconds.split(':').map(Number);
                    if (hours < 7 || hours > 20) {
                      console.log('Agendamento fora do range:', timeWithoutSeconds);
                      return null;
                    }
                  } else {
                    const slotIndex = timeSlots.findIndex(slot => slot === timeWithoutSeconds);
                    if (slotIndex === -1) {
                      top = getAppointmentPosition(appointment.time);
                      const [hours] = timeWithoutSeconds.split(':').map(Number);
                      if (hours < 7 || hours > 20) {
                        return null;
                      }
                    } else {
                      top = slotIndex * slotHeight;
                    }
                  }

                  const duration = appointment.duration || 60;
                  const height = Math.max((duration / 30) * slotHeight - 8, 80); // Altura mínima aumentada de 64 para 80

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

                  return (
                    <div
                      key={appointment.id}
                      style={{
                        position: "absolute",
                        top: top + 4,
                        height,
                        left: 4,
                        right: 4,
                        zIndex: 10,
                        background: backgroundColor,
                        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)",
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.15)',
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
                        variant="detailed"
                        onClick={() => handleAppointmentClick(appointment)}
                      />
                    </div>
                  );
                })}

                {/* Mensagem quando não há agendamentos */}
                {dayAppointments.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm sm:text-base p-4">
                    <span className="text-center">
                      <span className="block sm:hidden">Nenhum agendamento</span>
                      <span className="hidden sm:block">Nenhum agendamento para este dia</span>
                      <div className="text-xs mt-1">({timeSlots.length} slots disponíveis: 7:00 - 20:00)</div>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals permanecem iguais */}
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
          onDelete={onDeleteAppointment}
        />
      )}

      {showNewAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
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