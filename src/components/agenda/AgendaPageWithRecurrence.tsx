import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, Users, Settings } from "lucide-react";
import { AgendaFilters } from "./AgendaFilters";
import { DragDropAgendaDayView } from "./DragDropAgendaDayView";
import { DragDropAgendaWeekView } from "./DragDropAgendaWeekView";
import { AppointmentFormWithRecurrence } from "./AppointmentFormWithRecurrence";
import { useAgendaLogic } from "@/hooks/useAgendaLogic";
import { useClinic } from "@/contexts/ClinicContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function AgendaPageWithRecurrence() {
  const {
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
    appointments,
    filteredAppointments,
    getWeekDays,
    getAppointmentForSlot,
    updateAppointmentStatus,
    updateAppointmentDetails,
    sendWhatsAppConfirmation,
    navigateDate
  } = useAgendaLogic();

  const { patients, professionals, rooms, fetchAppointments, addAppointment } = useClinic();
  const { clinicId, user } = useAuth();

  // Função para criar novo agendamento usando o useClinic
  const handleCreateAppointment = async (appointmentData: any) => {
    try {
      console.log('Criando agendamento:', appointmentData);
      
      if (!clinicId) {
        toast.error('ID da clínica não encontrado');
        return;
      }

      // Preparar dados no formato esperado pelo ClinicContext
      const appointmentToCreate: any = {
        patientId: appointmentData.patientId,
        professionalId: appointmentData.professionalId,
        roomId: appointmentData.roomId && appointmentData.roomId.trim() !== '' ? appointmentData.roomId : null,
        date: appointmentData.date,
        time: appointmentData.time,
        duration: appointmentData.duration,
        treatmentType: appointmentData.type || 'consulta',
        status: 'marcado' as const,
        notes: appointmentData.notes || '',
        price: appointmentData.price || 0,
        whatsappConfirmed: false,
        whatsappSentAt: undefined
      };

      // Se for pacote, incluir o patient_package_id
      if (appointmentData.patient_package_id) {
        appointmentToCreate.patientPackageId = appointmentData.patient_package_id;
      }

      console.log('Dados preparados para ClinicContext:', appointmentToCreate);

      // Usar a função addAppointment do ClinicContext
      await addAppointment(appointmentToCreate);
      
      console.log('Agendamento criado com sucesso');
      
      toast.success('Agendamento criado com sucesso!');
      
      return appointmentToCreate;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento: ' + (error.message || 'Erro desconhecido'));
      throw error;
    }
  };

  // Escutar eventos de atualização de agendamentos
  useEffect(() => {
    const handleAppointmentsUpdate = () => {
      fetchAppointments();
    };

    window.addEventListener('appointmentsUpdated', handleAppointmentsUpdate);
    return () => window.removeEventListener('appointmentsUpdated', handleAppointmentsUpdate);
  }, [fetchAppointments]);

  const handleSave = async (appointmentData?: any) => {
    if (appointmentData) {
      await handleCreateAppointment(appointmentData);
    }
    setShowForm(false);
    // Trigger update event to refresh agenda
    window.dispatchEvent(new CustomEvent('appointmentsUpdated'));
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novo Agendamento</h1>
            <p className="text-muted-foreground">Criar novo agendamento com opção de recorrência</p>
          </div>
        </div>
        <AppointmentFormWithRecurrence
          initialDate={selectedDate}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie os agendamentos dos pacientes
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-90" />
          Novo Agendamento
        </Button>
      </div>

      <AgendaFilters
        selectedDate={selectedDate}
        viewMode={viewMode}
        selectedPhysio={selectedPhysio}
        selectedRoom={selectedRoom}
        professionals={professionals}
        rooms={rooms}
        onViewModeChange={setViewMode}
        onPhysioChange={setSelectedPhysio}
        onRoomChange={setSelectedRoom}
        onNavigateDate={navigateDate}
      />

      {viewMode === "week" ? (
        <DragDropAgendaWeekView
          weekDays={getWeekDays()}
          appointments={appointments}
          patients={patients}
          professionals={professionals}
          rooms={rooms}
          onUpdateStatus={updateAppointmentStatus}
          onSendWhatsApp={sendWhatsAppConfirmation}
          onUpdateAppointment={updateAppointmentDetails}
          onCreateAppointment={handleCreateAppointment}
        />
      ) : (
        <DragDropAgendaDayView
          selectedDate={selectedDate}
          getAppointmentForSlot={getAppointmentForSlot}
          patients={patients}
          professionals={professionals}
          rooms={rooms}
          onUpdateStatus={updateAppointmentStatus}
          onSendWhatsApp={sendWhatsAppConfirmation}
          onUpdateAppointment={updateAppointmentDetails}
          onCreateAppointment={handleCreateAppointment}
        />
      )}
    </div>
  );
}