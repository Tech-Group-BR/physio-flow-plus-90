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

  const getAppointmentForSlot = (date: Date, slotStart: string, excludeAppointmentId?: string) => {
    // slotStart: "08:00", "08:30", etc
    const [slotHour, slotMinute] = slotStart.split(':').map(Number);
    const slotStartDate = new Date(date);
    slotStartDate.setHours(slotHour, slotMinute, 0, 0);

    // Slot dura 30 minutos
    const slotEndDate = new Date(slotStartDate);
    slotEndDate.setMinutes(slotEndDate.getMinutes() + 30);

    // Normalizar data do slot para comparação (sem hora)
    const slotDateOnly = new Date(date);
    slotDateOnly.setHours(0, 0, 0, 0);

    return filteredAppointments.find(apt => {
      // Excluir o próprio agendamento que está sendo editado
      if (excludeAppointmentId && apt.id === excludeAppointmentId) {
        return false;
      }

      // Constrói a data da consulta
      const [year, month, day] = apt.date.split('-').map(Number);
      const aptDateOnly = new Date(year, month - 1, day);
      aptDateOnly.setHours(0, 0, 0, 0);

      // PRIMEIRO verifica se é o mesmo dia (sem considerar hora)
      const sameDay = aptDateOnly.getTime() === slotDateOnly.getTime();
      
      if (!sameDay) {
        return false; // Se não for o mesmo dia, não há conflito
      }

      // Se for o mesmo dia, então verifica se há conflito de horário
      const [aptHour, aptMinute] = apt.time.split(':').map(Number);
      const aptDate = new Date(year, month - 1, day, aptHour, aptMinute, 0, 0);
      const inSlot = aptDate >= slotStartDate && aptDate < slotEndDate;

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
        const appointmentDate = new Date(updates.date);
        console.log('🔍 Verificando conflito - Data:', updates.date, 'Hora:', updates.time, 'ID excluído:', appointmentId);
        
        const conflictingAppointment = getAppointmentForSlot(appointmentDate, updates.time, appointmentId);
        
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