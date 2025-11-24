import { useState, useEffect } from "react";
import { addDays, startOfWeek, endOfWeek, isSameDay, addWeeks, subWeeks } from "date-fns";
import { useClinic } from "@/contexts/ClinicContext";
import { supabase } from "@/integrations/supabase/client";

export const useAgendaLogic = () => {
  const { appointments, patients, professionals, rooms, updateAppointment } = useClinic();
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPhysio, setSelectedPhysio] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [viewMode, setViewMode] = useState<"day" | "week">("week");

  // Configurar realtime para appointments
  useEffect(() => {
    console.log('🔄 Configurando realtime para appointments');
    
    const channel = supabase
      .channel('appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('📡 Appointment change detected:', payload);
          window.dispatchEvent(new CustomEvent('appointmentsUpdated'));
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Desconectando realtime');
      supabase.removeChannel(channel);
    };
  }, []);

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const filteredAppointments = appointments.filter(appointment => {
    // CORREÇÃO: Constrói a data a partir das partes para evitar o problema de fuso horário.
    const parts = appointment.date.split('-').map(Number);
    const appointmentDate = new Date(parts[0], parts[1] - 1, parts[2]);

    let dateMatch = false;

    if (viewMode === "day") {
      dateMatch = isSameDay(appointmentDate, selectedDate);
    } else {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      dateMatch = appointmentDate >= weekStart && appointmentDate <= weekEnd;
    }
    
    const physioMatch = selectedPhysio === "all" || appointment.professionalId === selectedPhysio;
    const roomMatch = selectedRoom === "all" || appointment.roomId === selectedRoom;
    
    return dateMatch && physioMatch && roomMatch;
  });

  const getAppointmentForSlot = (dateString: string | Date, slotStart: string, excludeAppointmentId?: string) => {
    // Converter para string "YYYY-MM-DD" se for Date
    const slotDateStr = typeof dateString === 'string' ? dateString : dateString.toISOString().split('T')[0];
    
    // Extrair hora e minuto do slot (ex: "11:30" -> [11, 30])
    const [slotHour, slotMinute] = slotStart.split(':').map(Number);
    
    console.log('🔎 getAppointmentForSlot - Buscando conflito:', {
      dateString: slotDateStr,
      slotStart,
      slotTime: `${slotHour}:${slotMinute}`,
      excludeAppointmentId,
      totalAppointments: filteredAppointments.length
    });

    return filteredAppointments.find(apt => {
      console.log('🔎 Verificando agendamento:', { id: apt.id, date: apt.date, time: apt.time });
      
      // Excluir o próprio agendamento que está sendo editado
      if (excludeAppointmentId && apt.id === excludeAppointmentId) {
        console.log('✅ Ignorando agendamento sendo editado:', apt.id);
        return false;
      }

      // PRIMEIRO verifica se é o mesmo dia (comparação simples de strings)
      const sameDay = apt.date === slotDateStr;
      
      console.log('📅 Comparando datas:', {
        slotDate: slotDateStr,
        aptDate: apt.date,
        sameDay
      });
      
      if (!sameDay) {
        console.log('✅ Dias diferentes, sem conflito');
        return false; // Se não for o mesmo dia, não há conflito
      }

      // Se for o mesmo dia, verifica conflito de horário
      // Extrair hora e minuto do agendamento (ex: "11:30:00" -> [11, 30])
      const [aptHour, aptMinute] = apt.time.split(':').map(Number);
      
      // Converter tudo para minutos desde meia-noite para facilitar comparação
      const aptTimeInMinutes = aptHour * 60 + aptMinute;
      const slotStartInMinutes = slotHour * 60 + slotMinute;
      const slotEndInMinutes = slotStartInMinutes + 30; // Slot dura 30 minutos
      
      // Verifica se o horário do agendamento está dentro do slot
      const inSlot = aptTimeInMinutes >= slotStartInMinutes && aptTimeInMinutes < slotEndInMinutes;

      console.log('⏰ Conflito de horário?', inSlot, {
        aptTime: `${aptHour}:${aptMinute}`,
        aptTimeInMinutes,
        slotStartInMinutes,
        slotEndInMinutes
      });

      return inSlot;
    });
  };

  const updateAppointmentStatus = (appointmentId: string, status: 'confirmado' | 'faltante' | 'cancelado' | 'marcado' | 'realizado') => {
    updateAppointment(appointmentId, { status });
  };

  const updateAppointmentDetails = async (appointmentId: string, updates: any) => {
    try {
      console.log('📝 Atualizando agendamento:', appointmentId, updates);
      
      // Verificar conflitos de horário se data/hora foram alterados
      if (updates.date && updates.time) {
        console.log('🔍 Verificando conflito - Data:', updates.date, 'Hora:', updates.time, 'ID excluído:', appointmentId);
        
        const conflictingAppointment = getAppointmentForSlot(updates.date, updates.time, appointmentId);
        
        console.log('🔍 Agendamento conflitante encontrado:', conflictingAppointment);
        
        if (conflictingAppointment) {
          const patient = patients.find(p => p.id === conflictingAppointment.patientId);
          console.log('❌ CONFLITO! Agendamento existente:', {
            id: conflictingAppointment.id,
            date: conflictingAppointment.date,
            time: conflictingAppointment.time,
            patient: patient?.fullName
          });
          throw new Error(`Conflito de horário: já existe um agendamento para ${patient?.fullName || 'um paciente'} neste horário`);
        }
      }
      
      // Usar a função do contexto que já faz a transformação correta
      await updateAppointment(appointmentId, updates);
      
      console.log('✅ Agendamento atualizado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao atualizar agendamento:', error);
      throw error;
    }
  };

  const sendWhatsAppConfirmation = async (appointmentId: string) => {
    try {
      console.log('📤 Enviando confirmação WhatsApp para:', appointmentId);
      
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          appointmentId,
          messageType: 'confirmation',
          recipientType: 'patient'
        }
      });

      if (error) {
        console.error('❌ Erro ao enviar WhatsApp:', error);
        throw error;
      }

      console.log('✅ WhatsApp enviado com sucesso:', data);

      updateAppointment(appointmentId, { 
        whatsappSentAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erro ao enviar confirmação WhatsApp:', error);
      throw error;
    }
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setSelectedDate(new Date());
    } else if (viewMode === 'day') {
      setSelectedDate(prevDate => addDays(prevDate, direction === 'next' ? 1 : -1));
    } else {
      setSelectedDate(prevDate => addWeeks(prevDate, direction === 'next' ? 1 : -1));
    }
  };

  return {
    showForm,
    setShowForm,
    selectedDate,
    setSelectedDate,
    selectedPhysio,
    setSelectedPhysio,
    selectedRoom,
    setSelectedRoom,
    viewMode,
    setViewMode,
    appointments: filteredAppointments,
    patients,
    professionals,
    rooms,
    filteredAppointments,
    getWeekDays,
    getAppointmentForSlot,
    updateAppointmentStatus,
    updateAppointmentDetails,
    sendWhatsAppConfirmation,
    navigateDate
  };
};