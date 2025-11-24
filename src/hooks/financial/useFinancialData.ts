import { useState, useMemo } from "react";
import { useClinic } from "@/contexts/ClinicContext";
import { isBefore, parseISO, startOfDay } from "date-fns";

// Helper para determinar o status dinamicamente
const getAccountStatus = (account: {
  dueDate: string;
  paidDate?: string | null;
  receivedDate?: string | null;
}) => {
  if (account.paidDate || account.receivedDate) {
    return account.paidDate ? "pago" : "recebido";
  }
  if (isBefore(parseISO(account.dueDate), startOfDay(new Date()))) {
    return "vencido";
  }
  return "pendente";
};

export function useFinancialData() {
  const {
    patients,
    accountsPayable,
    accountsReceivable,
    markReceivableAsPaid,
    markPayableAsPaid,
    deleteAccountsPayable,
    deleteAccountsReceivable,
    bulkMarkReceivablesAsPaid,
    bulkMarkPayablesAsPaid,
    bulkDeleteReceivables,
    bulkDeletePayables,
  } = useClinic();

  // Estados para filtros
  const [searchPayable, setSearchPayable] = useState("");
  const [searchReceivable, setSearchReceivable] = useState("");
  const [statusFilterPayable, setStatusFilterPayable] = useState("all");
  const [statusFilterReceivable, setStatusFilterReceivable] = useState("all");
  
  // Estados para ações em massa
  const [selectedPayableIds, setSelectedPayableIds] = useState<Set<string>>(new Set());
  const [selectedReceivableIds, setSelectedReceivableIds] = useState<Set<string>>(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Estados para filtros avançados
  const [dateFilterPayable, setDateFilterPayable] = useState("all");
  const [dateFilterReceivable, setDateFilterReceivable] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [patientFilter, setPatientFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  
  // Estados para formulários
  const [showReceivableForm, setShowReceivableForm] = useState(false);
  const [showPayableForm, setShowPayableForm] = useState(false);

  // Cálculos financeiros memoizados
  const financialData = useMemo(() => {
    const allPayables = accountsPayable || [];
    const allReceivables = accountsReceivable || [];
    const data = {
      totalReceivablesReceived: 0,
      totalReceivablesPending: 0,
      totalPayablesPaid: 0,
      totalPayablesPending: 0,
    };

    allReceivables.forEach((ar) => {
      const status = getAccountStatus(ar);
      if (status === "recebido") {
        data.totalReceivablesReceived += Number(ar.amount);
      } else if (status === "pendente" || status === "vencido") {
        data.totalReceivablesPending += Number(ar.amount);
      }
    });

    allPayables.forEach((ap) => {
      const status = getAccountStatus(ap);
      if (status === "pago") {
        data.totalPayablesPaid += Number(ap.amount);
      } else if (status === "pendente" || status === "vencido") {
        data.totalPayablesPending += Number(ap.amount);
      }
    });

    return data;
  }, [accountsPayable, accountsReceivable]);

  // Lista de contas a pagar filtrada
  const filteredPayables = useMemo(() => {
    return (accountsPayable || []).filter((account) => {
      const status = getAccountStatus(account);
      const accountDate = new Date(account.dueDate);
      const amount = Number(account.amount);
      
      // Filtro por status
      const matchesStatus = statusFilterPayable === "all" || status === statusFilterPayable;
      
      // Filtro por busca
      const matchesSearch = searchPayable.trim() === "" ||
        account.description.toLowerCase().includes(searchPayable.toLowerCase());
      
      // Filtro por data
      let matchesDate = true;
      if (dateFilterPayable === "thisMonth") {
        const now = new Date();
        matchesDate = accountDate.getMonth() === now.getMonth() && 
                     accountDate.getFullYear() === now.getFullYear();
      } else if (dateFilterPayable === "lastMonth") {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        matchesDate = accountDate.getMonth() === lastMonth.getMonth() && 
                     accountDate.getFullYear() === lastMonth.getFullYear();
      } else if (dateFilterPayable === "custom") {
        if (customStartDate) {
          matchesDate = matchesDate && accountDate >= new Date(customStartDate);
        }
        if (customEndDate) {
          matchesDate = matchesDate && accountDate <= new Date(customEndDate);
        }
      }
      
      // Filtro por valor
      const matchesAmount = (!minAmount || amount >= Number(minAmount)) &&
                           (!maxAmount || amount <= Number(maxAmount));
      
      return matchesStatus && matchesSearch && matchesDate && matchesAmount;
    });
  }, [accountsPayable, searchPayable, statusFilterPayable, dateFilterPayable, customStartDate, customEndDate, minAmount, maxAmount]);

  // Lista de contas a receber filtrada
  const filteredReceivables = useMemo(() => {
    return (accountsReceivable || []).filter((account) => {
      const status = getAccountStatus(account);
      const patient = patients?.find((p) => p.id === account.patientId);
      const accountDate = new Date(account.dueDate);
      const amount = Number(account.amount);
      
      // Filtro por status
      const matchesStatus = statusFilterReceivable === "all" || status === statusFilterReceivable;
      
      // Filtro por busca
      const matchesSearch = searchReceivable.trim() === "" ||
        account.description.toLowerCase().includes(searchReceivable.toLowerCase()) ||
        patient?.fullName.toLowerCase().includes(searchReceivable.toLowerCase());
      
      // Filtro por paciente
      const matchesPatient = patientFilter === "all" || account.patientId === patientFilter;
      
      // Filtro por data
      let matchesDate = true;
      if (dateFilterReceivable === "thisMonth") {
        const now = new Date();
        matchesDate = accountDate.getMonth() === now.getMonth() && 
                     accountDate.getFullYear() === now.getFullYear();
      } else if (dateFilterReceivable === "lastMonth") {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        matchesDate = accountDate.getMonth() === lastMonth.getMonth() && 
                     accountDate.getFullYear() === lastMonth.getFullYear();
      } else if (dateFilterReceivable === "custom") {
        if (customStartDate) {
          matchesDate = matchesDate && accountDate >= new Date(customStartDate);
        }
        if (customEndDate) {
          matchesDate = matchesDate && accountDate <= new Date(customEndDate);
        }
      }
      
      // Filtro por valor
      const matchesAmount = (!minAmount || amount >= Number(minAmount)) &&
                           (!maxAmount || amount <= Number(maxAmount));
      
      return matchesStatus && matchesSearch && matchesPatient && matchesDate && matchesAmount;
    });
  }, [accountsReceivable, patients, searchReceivable, statusFilterReceivable, patientFilter, dateFilterReceivable, customStartDate, customEndDate, minAmount, maxAmount]);

  // Handlers para seleção
  const handleReceivableSelectionChange = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedReceivableIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedReceivableIds(newSelected);
  };

  const handlePayableSelectionChange = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedPayableIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedPayableIds(newSelected);
  };

  // Ações em massa
  const handleBulkMarkReceivablesAsPaid = async () => {
    try {
      const idsArray = Array.from(selectedReceivableIds);
      await bulkMarkReceivablesAsPaid(idsArray, 'cash');
      setSelectedReceivableIds(new Set());
    } catch (error) {
      console.error('Erro ao marcar como pago em massa:', error);
    }
  };

  const handleBulkMarkPayablesAsPaid = async () => {
    try {
      const idsArray = Array.from(selectedPayableIds);
      await bulkMarkPayablesAsPaid(idsArray);
      setSelectedPayableIds(new Set());
    } catch (error) {
      console.error('Erro ao marcar como pago em massa:', error);
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
      console.error('Erro ao excluir em massa:', error);
    }
  };

  const handleBulkDeletePayables = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedPayableIds.size} contas a pagar?`)) {
      return;
    }

    try {
      const idsArray = Array.from(selectedPayableIds);
      await bulkDeletePayables(idsArray);
      setSelectedPayableIds(new Set());
    } catch (error) {
      console.error('Erro ao excluir em massa:', error);
    }
  };

  return {
    financialData,
    filteredPayables,
    filteredReceivables,
    searchPayable,
    setSearchPayable,
    searchReceivable,
    setSearchReceivable,
    statusFilterPayable,
    setStatusFilterPayable,
    statusFilterReceivable,
    setStatusFilterReceivable,
    selectedPayableIds,
    setSelectedPayableIds,
    selectedReceivableIds,
    setSelectedReceivableIds,
    showAdvancedFilters,
    setShowAdvancedFilters,
    dateFilterPayable,
    setDateFilterPayable,
    dateFilterReceivable,
    setDateFilterReceivable,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    patientFilter,
    setPatientFilter,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    // Individual functions
    handleMarkReceivableAsPaid: markReceivableAsPaid,
    handleMarkPayableAsPaid: markPayableAsPaid,
    handleDeleteReceivable: deleteAccountsReceivable,
    handleDeletePayable: deleteAccountsPayable,
    // Bulk functions
    handleBulkMarkReceivablesAsPaid,
    handleBulkMarkPayablesAsPaid,
    handleBulkDeleteReceivables,
    handleBulkDeletePayables,
    // Selection functions
    toggleReceivableSelection: handleReceivableSelectionChange,
    togglePayableSelection: handlePayableSelectionChange,
    selectAllReceivables: () => setSelectedReceivableIds(new Set(filteredReceivables.map(r => r.id))),
    selectAllPayables: () => setSelectedPayableIds(new Set(filteredPayables.map(p => p.id))),
    clearReceivableSelection: () => setSelectedReceivableIds(new Set()),
    clearPayableSelection: () => setSelectedPayableIds(new Set()),
    // Data access
    accountsReceivable,
    accountsPayable,
    // Form state
    showReceivableForm,
    setShowReceivableForm,
    showPayableForm,
    setShowPayableForm,
    getAccountStatus
  };
}