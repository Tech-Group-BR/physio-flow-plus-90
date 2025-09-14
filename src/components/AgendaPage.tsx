
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AppointmentForm } from "./AppointmentForm";
import { useAgendaLogic } from "@/hooks/useAgendaLogic";
import { AgendaFilters } from "./agenda/AgendaFilters";
import { DragDropAgendaWeekView } from "./agenda/DragDropAgendaWeekView";
import { DragDropAgendaDayView } from "./agenda/DragDropAgendaDayView";

export function AgendaPage() {
  const {
    showForm,
    setShowForm,
    selectedDate,
    selectedPhysio,
    setSelectedPhysio,
    selectedRoom,
    setSelectedRoom,
    viewMode,
    setViewMode,
    patients,
    professionals,
    rooms,
    getWeekDays,
    getAppointmentForSlot,
    updateAppointmentStatus,
    updateAppointmentDetails,
    sendWhatsAppConfirmation,
    navigateDate
  } = useAgendaLogic();

  const handleSave = () => {
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  if (showForm) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Novo Agendamento</h1>
        </div>
        <AppointmentForm onSave={handleSave} onCancel={handleCancel} />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-600 mt-1">Gerencie seus agendamentos</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          <span>Novo Agendamento</span>
        </Button>
      </div>

      {/* Filters */}
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

      {/* Calendar View */}
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
