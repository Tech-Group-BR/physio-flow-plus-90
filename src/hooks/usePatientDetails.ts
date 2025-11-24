import { useState, useEffect } from "react";
import { Patient, MedicalRecord, Evolution } from "@/types";
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePatientDetails(patientId: string | undefined) {
  const { 
    patients, 
    medicalRecords, 
    evolutions, 
    appointments, 
    accountsReceivable, 
    fetchMedicalRecords, 
    fetchEvolutions,
    bulkMarkReceivablesAsPaid,
    bulkDeleteReceivables,
    deleteAppointment
  } = useClinic();
  const { clinicId } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
  const [showEvolutionForm, setShowEvolutionForm] = useState(false);
  const [patientPackages, setPatientPackages] = useState<any[]>([]);

  // Estados para ações em massa - Agendamentos
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<Set<string>>(new Set());
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState("all");
  const [appointmentDateFilter, setAppointmentDateFilter] = useState("all");
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState("");
  const [showAppointmentFilters, setShowAppointmentFilters] = useState(false);

  // Estados para ações em massa - Financeiro
  const [selectedReceivableIds, setSelectedReceivableIds] = useState<Set<string>>(new Set());
  const [financialStatusFilter, setFinancialStatusFilter] = useState("all");
  const [financialDateFilter, setFinancialDateFilter] = useState("all");
  const [financialSearchTerm, setFinancialSearchTerm] = useState("");
  const [showFinancialFilters, setShowFinancialFilters] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const patient = patients.find(p => p.id === patientId);
  const patientMedicalRecord = medicalRecords.find(mr => mr.patientId === patientId);
  const patientEvolutions = evolutions
    .filter(e => e.recordId === patientMedicalRecord?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Função helper para determinar status dos agendamentos
  const getAppointmentStatus = (appointment: any) => {
    return appointment.status || 'marcado';
  };

  // Função helper para determinar status financeiro
  const getFinancialStatus = (receivable: any) => {
    if (receivable.receivedDate || receivable.paidDate) return 'recebido';
    const dueDate = new Date(receivable.dueDate);
    const today = new Date();
    if (dueDate < today) return 'vencido';
    return 'pendente';
  };

  // Filtrar agendamentos com filtros avançados
  const filteredAppointments = appointments.filter(a => {
    if (a.patientId !== patientId) return false;
    
    // Filtro por status
    if (appointmentStatusFilter !== "all" && getAppointmentStatus(a) !== appointmentStatusFilter) {
      return false;
    }
    
    // Filtro por data
    const appointmentDate = new Date(a.date);
    if (appointmentDateFilter === "thisMonth") {
      const now = new Date();
      if (appointmentDate.getMonth() !== now.getMonth() || appointmentDate.getFullYear() !== now.getFullYear()) {
        return false;
      }
    } else if (appointmentDateFilter === "lastMonth") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      if (appointmentDate.getMonth() !== lastMonth.getMonth() || appointmentDate.getFullYear() !== lastMonth.getFullYear()) {
        return false;
      }
    } else if (appointmentDateFilter === "custom") {
      if (customStartDate && appointmentDate < new Date(customStartDate)) return false;
      if (customEndDate && appointmentDate > new Date(customEndDate)) return false;
    }
    
    // Filtro por busca
    if (appointmentSearchTerm && !a.notes?.toLowerCase().includes(appointmentSearchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filtrar contas a receber com filtros avançados
  const filteredReceivables = accountsReceivable.filter(ar => {
    if (ar.patientId !== patientId) return false;
    
    // Filtro por status
    if (financialStatusFilter !== "all" && getFinancialStatus(ar) !== financialStatusFilter) {
      return false;
    }
    
    // Filtro por data
    const receivableDate = new Date(ar.dueDate);
    if (financialDateFilter === "thisMonth") {
      const now = new Date();
      if (receivableDate.getMonth() !== now.getMonth() || receivableDate.getFullYear() !== now.getFullYear()) {
        return false;
      }
    } else if (financialDateFilter === "lastMonth") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      if (receivableDate.getMonth() !== lastMonth.getMonth() || receivableDate.getFullYear() !== lastMonth.getFullYear()) {
        return false;
      }
    } else if (financialDateFilter === "custom") {
      if (customStartDate && receivableDate < new Date(customStartDate)) return false;
      if (customEndDate && receivableDate > new Date(customEndDate)) return false;
    }
    
    // Filtro por busca
    if (financialSearchTerm && !ar.description?.toLowerCase().includes(financialSearchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const patientAppointments = filteredAppointments;
  const patientReceivables = filteredReceivables;

  // Buscar pacotes do paciente
  useEffect(() => {
    if (!patientId) return;
    
    const fetchPatientPackages = async () => {
      const { data, error } = await supabase
        .from('patient_packages')
        .select(`
          id,
          sessions_used,
          purchase_date,
          expiry_date,
          status,
          is_paid,
          session_packages (
            name,
            sessions,
            price
          )
        `)
        .eq('patient_id', patientId)
        .order('purchase_date', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar pacotes:', error);
        return;
      }
      
      setPatientPackages(data || []);
    };
    
    fetchPatientPackages();
  }, [patientId]);

  useEffect(() => {
    if (patient) {
      setIsLoading(false);
    }
  }, [patient]);

  // Funções para seleção de agendamentos
  const handleAppointmentSelectionChange = (appointmentId: string, selected: boolean) => {
    const newSelected = new Set(selectedAppointmentIds);
    if (selected) {
      newSelected.add(appointmentId);
    } else {
      newSelected.delete(appointmentId);
    }
    setSelectedAppointmentIds(newSelected);
  };

  // Funções para seleção de contas a receber
  const handleReceivableSelectionChange = (receivableId: string, selected: boolean) => {
    const newSelected = new Set(selectedReceivableIds);
    if (selected) {
      newSelected.add(receivableId);
    } else {
      newSelected.delete(receivableId);
    }
    setSelectedReceivableIds(newSelected);
  };

  // Ações em massa para agendamentos
  const handleBulkDeleteAppointments = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedAppointmentIds.size} agendamentos?`)) {
      return;
    }

    try {
      const idsArray = Array.from(selectedAppointmentIds);
      for (const id of idsArray) {
        await deleteAppointment(id);
      }
      setSelectedAppointmentIds(new Set());
      toast.success(`${idsArray.length} agendamentos excluídos com sucesso!`);
    } catch (error) {
      console.error('Erro ao excluir agendamentos:', error);
      toast.error('Erro ao excluir agendamentos');
    }
  };

  // Ações em massa para financeiro
  const handleBulkMarkReceivablesAsPaid = async () => {
    try {
      const idsArray = Array.from(selectedReceivableIds);
      await bulkMarkReceivablesAsPaid(idsArray, 'cash');
      setSelectedReceivableIds(new Set());
    } catch (error) {
      console.error('Erro ao marcar como recebido:', error);
    }
  };

  const handleBulkDeleteReceivables = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedReceivableIds.size} contas a receber?`)) {
      return;
    }

    try {
      const idsArray = Array.from(selectedReceivableIds);
      await bulkDeleteReceivables(idsArray);
      setSelectedReceivableIds(new Set());
    } catch (error) {
      console.error('Erro ao excluir contas a receber:', error);
    }
  };

  return {
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
  };
}