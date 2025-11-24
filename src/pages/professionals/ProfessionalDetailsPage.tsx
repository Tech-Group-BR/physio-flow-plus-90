import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProfessionalHeader } from "@/components/professionals/ProfessionalHeader";
import { ProfessionalTabs } from "@/components/professionals/ProfessionalTabs";
import { useProfessionalDetails } from "@/hooks/useProfessionalDetails";

export function ProfessionalDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    professional,
    professionalPatients,
    professionalAppointments,
    professionalRevenue,
    stats,
    isLoading,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editFormData,
    setEditFormData,
    handleSaveProfessional
  } = useProfessionalDetails(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes do profissional...</p>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profissional não encontrado</h2>
          <p className="text-gray-600 mb-4">O profissional solicitado não existe ou foi removido.</p>
          <button
            onClick={() => navigate('/fisioterapeutas')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Voltar para Profissionais
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProfessionalHeader 
        professional={professional}
        onBack={() => navigate('/fisioterapeutas')}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        onSave={handleSaveProfessional}
      />
      
      <ProfessionalTabs
        professional={professional}
        professionalPatients={professionalPatients}
        professionalAppointments={professionalAppointments}
        professionalRevenue={professionalRevenue}
        stats={stats}
      />
    </div>
  );
}