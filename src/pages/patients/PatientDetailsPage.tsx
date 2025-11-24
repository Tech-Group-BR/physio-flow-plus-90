import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PatientHeader } from "@/components/patients/PatientHeader";
import { PatientTabs } from "@/components/patients/PatientTabs";
import { usePatientDetails } from "@/hooks/usePatientDetails";

export function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    patient,
    patientMedicalRecord,
    patientEvolutions,
    patientAppointments,
    patientReceivables,
    patientPackages,
    isLoading,
    showMedicalRecordForm,
    setShowMedicalRecordForm,
    showEvolutionForm,
    setShowEvolutionForm,
    selectedAppointmentIds,
    setSelectedAppointmentIds,
    appointmentStatusFilter,
    setAppointmentStatusFilter,
    appointmentDateFilter,
    setAppointmentDateFilter,
    appointmentSearchTerm,
    setAppointmentSearchTerm,
    showAppointmentFilters,
    setShowAppointmentFilters,
    selectedReceivableIds,
    setSelectedReceivableIds,
    financialStatusFilter,
    setFinancialStatusFilter,
    financialDateFilter,
    setFinancialDateFilter,
    financialSearchTerm,
    setFinancialSearchTerm,
    showFinancialFilters,
    setShowFinancialFilters,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    handleBulkMarkReceivablesAsPaid,
    handleBulkDeleteReceivables,
    handleBulkDeleteAppointments,
    handleAppointmentSelectionChange,
    handleReceivableSelectionChange,
    getAppointmentStatus,
    getFinancialStatus
  } = usePatientDetails(id);

  // Detectar rota e abrir modais automaticamente
  useEffect(() => {
    if (location.pathname.includes('/anamnese')) {
      setShowMedicalRecordForm(true);
    } else if (location.pathname.includes('/evolucao')) {
      setShowEvolutionForm(true);
    }
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes do paciente...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Paciente não encontrado</h2>
          <p className="text-gray-600 mb-4">O paciente solicitado não existe ou foi removido.</p>
          <button
            onClick={() => navigate('/pacientes')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Voltar para Pacientes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PatientHeader 
        patient={patient}
        onBack={() => navigate('/pacientes')}
      />
      
      <PatientTabs
        patient={patient}
        patientMedicalRecord={patientMedicalRecord}
        patientEvolutions={patientEvolutions}
        patientAppointments={patientAppointments}
        patientReceivables={patientReceivables}
        patientPackages={patientPackages}
        showMedicalRecordForm={showMedicalRecordForm}
        setShowMedicalRecordForm={setShowMedicalRecordForm}
        showEvolutionForm={showEvolutionForm}
        setShowEvolutionForm={setShowEvolutionForm}
        selectedAppointmentIds={selectedAppointmentIds}
        setSelectedAppointmentIds={setSelectedAppointmentIds}
        appointmentStatusFilter={appointmentStatusFilter}
        setAppointmentStatusFilter={setAppointmentStatusFilter}
        appointmentDateFilter={appointmentDateFilter}
        setAppointmentDateFilter={setAppointmentDateFilter}
        appointmentSearchTerm={appointmentSearchTerm}
        setAppointmentSearchTerm={setAppointmentSearchTerm}
        showAppointmentFilters={showAppointmentFilters}
        setShowAppointmentFilters={setShowAppointmentFilters}
        selectedReceivableIds={selectedReceivableIds}
        setSelectedReceivableIds={setSelectedReceivableIds}
        financialStatusFilter={financialStatusFilter}
        setFinancialStatusFilter={setFinancialStatusFilter}
        financialDateFilter={financialDateFilter}
        setFinancialDateFilter={setFinancialDateFilter}
        financialSearchTerm={financialSearchTerm}
        setFinancialSearchTerm={setFinancialSearchTerm}
        showFinancialFilters={showFinancialFilters}
        setShowFinancialFilters={setShowFinancialFilters}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        onBulkMarkReceivablesAsPaid={handleBulkMarkReceivablesAsPaid}
        onBulkDeleteReceivables={handleBulkDeleteReceivables}
        onBulkDeleteAppointments={handleBulkDeleteAppointments}
        onAppointmentSelectionChange={handleAppointmentSelectionChange}
        onReceivableSelectionChange={handleReceivableSelectionChange}
        getAppointmentStatus={getAppointmentStatus}
        getFinancialStatus={getFinancialStatus}
      />
    </div>
  );
}