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
          // Recarregar appointments automaticamente sem reload da página
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
    const appointmentDate = new Date(appointment.date + 'T00:00:00');
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

  const getAppointmentForSlot = (date: Date, time: string) => {
    console.log('🔍 Buscando agendamento para:', { date, time, totalAppointments: filteredAppointments.length });
    
    const appointment = filteredAppointments.find(apt => {
      if (!apt.date || !apt.time) {
        console.log('❌ Agendamento sem data/hora:', apt);
        return false;
      }
      
      const appointmentDate = new Date(apt.date + 'T00:00:00');
      const timeMatches = apt.time === time || apt.time === time + ':00';
      const dateMatches = isSameDay(appointmentDate, date);
      
      if (timeMatches && dateMatches) {
        console.log('✅ Agendamento encontrado:', apt);
      }
      
      return timeMatches && dateMatches;
    });
    
    return appointment;
  };

  const updateAppointmentStatus = (appointmentId: string, status: 'confirmado' | 'faltante' | 'cancelado' | 'marcado' | 'realizado') => {
    updateAppointment(appointmentId, { status });
  };

  const updateAppointmentDetails = async (appointmentId: string, updates: any) => {
    try {
      console.log('📝 Atualizando agendamento:', appointmentId, updates);
      
      const { error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', appointmentId);

      if (error) {
        console.error('❌ Erro ao atualizar agendamento:', error);
        throw error;
      }

      console.log('✅ Agendamento atualizado com sucesso');
      
      // Update locally using the correct signature
      updateAppointment(appointmentId, updates);
      
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

      // Update appointment using the correct signature
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
    } else if (direction === 'prev') {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(addWeeks(selectedDate, 1));
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
