import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, Users, Settings } from "lucide-react";
import { AgendaFilters } from "./agenda/AgendaFilters";
import { DragDropAgendaDayView } from "./agenda/DragDropAgendaDayView";
import { DragDropAgendaWeekView } from "./agenda/DragDropAgendaWeekView";
import { AppointmentFormWithRecurrence } from "./AppointmentFormWithRecurrence";
import { useAgendaLogic } from "@/hooks/useAgendaLogic";
import { useClinic } from "@/contexts/ClinicContext";

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
    filteredAppointments,
    getWeekDays,
    getAppointmentForSlot,
    updateAppointmentStatus,
    updateAppointmentDetails,
    sendWhatsAppConfirmation,
    navigateDate
  } = useAgendaLogic();

  const { patients, professionals, rooms, fetchAppointments } = useClinic();

  // Escutar eventos de atualização de agendamentos
  useEffect(() => {
    const handleAppointmentsUpdate = () => {
      fetchAppointments();
    };

    window.addEventListener('appointmentsUpdated', handleAppointmentsUpdate);
    return () => window.removeEventListener('appointmentsUpdated', handleAppointmentsUpdate);
  }, [fetchAppointments]);

  const handleSave = () => {
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
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
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
          getAppointmentForSlot={getAppointmentForSlot}
          patients={patients}
          professionals={professionals}
          rooms={rooms}
          onUpdateStatus={updateAppointmentStatus}
          onSendWhatsApp={sendWhatsAppConfirmation}
          onUpdateAppointment={updateAppointmentDetails}
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
        />
      )}
    </div>
  );
}