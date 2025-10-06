import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Filter, 
  CheckSquare, 
  Square, 
  CheckCircle, 
  Trash2, 
  Users,
  Search 
} from "lucide-react";
import { Patient, MedicalRecord, Evolution } from "@/types";
import { useClinic } from '@/contexts/ClinicContext';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { MedicalRecordForm } from './MedicalRecordForm';
import { EvolutionForm } from './EvolutionForm';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';

export function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const patient = patients.find(p => p.id === id);
  const patientMedicalRecord = medicalRecords.find(mr => mr.patientId === id);
  const patientEvolutions = evolutions.filter(e => e.recordId === patientMedicalRecord?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
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
    if (a.patientId !== id) return false;
    
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
    if (ar.patientId !== id) return false;
    
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

  // Calcular resumo financeiro diretamente dos dados do contexto
  const calculateFinancialSummary = () => {
    const patientReceivables = accountsReceivable.filter(ar => ar.patientId === id);
    
    let totalBilled = 0;
    let totalPaid = 0;
    let totalPending = 0;
    
    patientReceivables.forEach(receivable => {
      const amount = Number(receivable.amount);
      totalBilled += amount;
      
      if (receivable.status === 'recebido') {
        totalPaid += amount;
      } else {
        totalPending += amount;
      }
    });
    
    return {
      totalBilled,
      totalPaid,
      totalPending,
      balance: totalBilled - totalPaid
    };
  };

  const financialSummary = calculateFinancialSummary();

  useEffect(() => {
    if (patient) {
      setIsLoading(false);
    }
  }, [patient]);

  const handleSaveMedicalRecord = () => {
    setShowMedicalRecordForm(false);
    fetchMedicalRecords();
    toast.success('Anamnese salva com sucesso!');
  };

  const handleSaveEvolution = () => {
    setShowEvolutionForm(false);
    fetchEvolutions();
    toast.success('Evolução salva com sucesso!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/pacientes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Lista de Pacientes
        </Button>
        <div className="text-center text-gray-500">
          Paciente não encontrado.
        </div>
      </div>
    );
  }

  // Funções para seleção de agendamentos
  const toggleAppointmentSelection = (appointmentId: string) => {
    const newSelected = new Set(selectedAppointmentIds);
    if (newSelected.has(appointmentId)) {
      newSelected.delete(appointmentId);
    } else {
      newSelected.add(appointmentId);
    }
    setSelectedAppointmentIds(newSelected);
  };

  const selectAllAppointments = () => {
    const allIds = patientAppointments.map(a => a.id);
    setSelectedAppointmentIds(new Set(allIds));
  };

  const clearAppointmentSelection = () => {
    setSelectedAppointmentIds(new Set());
  };

  // Funções para seleção de contas a receber
  const toggleReceivableSelection = (receivableId: string) => {
    const newSelected = new Set(selectedReceivableIds);
    if (newSelected.has(receivableId)) {
      newSelected.delete(receivableId);
    } else {
      newSelected.add(receivableId);
    }
    setSelectedReceivableIds(newSelected);
  };

  const selectAllReceivables = () => {
    const allIds = patientReceivables.map(r => r.id);
    setSelectedReceivableIds(new Set(allIds));
  };

  const clearReceivableSelection = () => {
    setSelectedReceivableIds(new Set());
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
      clearAppointmentSelection();
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
      clearReceivableSelection();
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
      clearReceivableSelection();
    } catch (error) {
      console.error('Erro ao excluir contas a receber:', error);
    }
  };

  const renderDetail = (label: string, value: string | undefined | null) => {
    if (!value || value.trim() === '') return null;
    return (
      <div>
        <span className="font-medium text-gray-900">{label}:</span>
        <span className="ml-2 text-gray-600">{value}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/pacientes')} className="hidden sm:inline-flex">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{patient.fullName}</h1>
            <Badge variant={patient.isActive ? "default" : "secondary"}>
              {patient.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          {!patientMedicalRecord && (
            <Dialog open={showMedicalRecordForm} onOpenChange={setShowMedicalRecordForm}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Criar Anamnese
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <MedicalRecordForm 
                  patient={patient}
                  onSave={handleSaveMedicalRecord}
                  onCancel={() => setShowMedicalRecordForm(false)}
                />
              </DialogContent>
            </Dialog>
          )}
          
          {patientMedicalRecord && (
            <Dialog open={showEvolutionForm} onOpenChange={setShowEvolutionForm}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Evolução
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <EvolutionForm 
                  record={patientMedicalRecord}
                  onSave={handleSaveEvolution}
                  onCancel={() => setShowEvolutionForm(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto w-full justify-start sm:grid sm:grid-cols-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Dados Gerais</TabsTrigger>
          <TabsTrigger value="medical" className="text-xs sm:text-sm py-2">Prontuário</TabsTrigger>
          <TabsTrigger value="appointments" className="text-xs sm:text-sm py-2">Agendamentos</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs sm:text-sm py-2">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {renderDetail("Nome completo", patient.fullName)}
                {renderDetail("Telefone", patient.phone)}
                {renderDetail("Email", patient.email)}
                {renderDetail("CPF", patient.cpf)}
                {patient.birth_date && renderDetail("Data de nascimento", format(new Date(patient.birth_date), 'dd/MM/yyyy'))}
                {renderDetail("Gênero", patient.gender)}
              </CardContent>
            </Card>

            {/* Informações Médicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Médicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {renderDetail("Histórico médico", patient.medicalHistory)}
                {renderDetail("Tipo de tratamento", patient.treatmentType)}
                {renderDetail("Convênio", patient.insurance)}
                {renderDetail("Observações", patient.notes)}
              </CardContent>
            </Card>

            {/* Endereço */}
            {patient.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {renderDetail("Rua", patient.address.street)}
                  {renderDetail("Número", patient.address.number)}
                  {renderDetail("Complemento", patient.address.complement)}
                  {renderDetail("Bairro", patient.address.neighborhood)}
                  {renderDetail("Cidade", patient.address.city)}
                  {renderDetail("Estado", patient.address.state)}
                  {renderDetail("CEP", patient.address.zipCode)}
                </CardContent>
              </Card>
            )}

            {/* Contato de Emergência */}
            {patient.emergencyContact && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contato de Emergência</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {renderDetail("Nome", patient.emergencyContact.name)}
                  {renderDetail("Telefone", patient.emergencyContact.phone)}
                  {renderDetail("Relacionamento", patient.emergencyContact.relationship)}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="medical" className="space-y-6">
          {patientMedicalRecord ? (
            <div className="space-y-6">
              {/* Anamnese */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-lg sm:text-xl">
                    Anamnese
                    <Link 
                      to={`/prontuario/${patient.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Ver detalhes completos
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {patientMedicalRecord.anamnesis?.chiefComplaint && (
                      <div>
                        <span className="font-medium">Queixa principal:</span>
                        <p className="text-gray-600 mt-1">{patientMedicalRecord.anamnesis.chiefComplaint}</p>
                      </div>
                    )}
                    {patientMedicalRecord.anamnesis?.historyOfPresentIllness && (
                      <div>
                        <span className="font-medium">História da doença atual:</span>
                        <p className="text-gray-600 mt-1">{patientMedicalRecord.anamnesis.historyOfPresentIllness}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Evoluções */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Evoluções do Tratamento</CardTitle>
                </CardHeader>
                <CardContent>
                  {patientEvolutions.length > 0 ? (
                    <div className="space-y-4">
                      {patientEvolutions.slice(0, 3).map((evolution) => (
                        <div key={evolution.id} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <span className="font-medium text-sm">
                              {format(new Date(evolution.date), 'dd/MM/yyyy')}
                            </span>
                            <Link 
                              to={`/prontuario/evolucao/${evolution.id}`}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Ver detalhes
                            </Link>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {evolution.observations}
                          </p>
                        </div>
                      ))}
                      {patientEvolutions.length > 3 && (
                        <Link 
                          to={`/prontuario/${patient.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 block mt-4"
                        >
                          Ver todas as {patientEvolutions.length} evoluções
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhuma evolução registrada.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma anamnese registrada</h3>
                <p className="text-gray-500 mb-4">Crie uma anamnese para começar o acompanhamento médico deste paciente.</p>
                <Button onClick={() => setShowMedicalRecordForm(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Criar Anamnese
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          {/* Filtros Avançados - Agendamentos */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Button
              variant="outline"
              onClick={() => setShowAppointmentFilters(!showAppointmentFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar em observações..."
                  value={appointmentSearchTerm}
                  onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>
              <Select value={appointmentStatusFilter} onValueChange={setAppointmentStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="marcado">Marcado</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="faltante">Faltante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showAppointmentFilters && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Período</label>
                    <Select value={appointmentDateFilter} onValueChange={setAppointmentDateFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os períodos</SelectItem>
                        <SelectItem value="thisMonth">Este mês</SelectItem>
                        <SelectItem value="lastMonth">Mês passado</SelectItem>
                        <SelectItem value="custom">Período personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {appointmentDateFilter === "custom" && (
                    <>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Data inicial</label>
                        <Input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Data final</label>
                        <Input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Barra de Ações em Massa - Agendamentos */}
          {selectedAppointmentIds.size > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">
                      {selectedAppointmentIds.size} agendamentos selecionados
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDeleteAppointments}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAppointmentSelection}
                    >
                      Limpar Seleção
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="mr-2 h-5 w-5" />
                  Histórico de Agendamentos ({patientAppointments.length})
                </CardTitle>
                {patientAppointments.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectedAppointmentIds.size === patientAppointments.length ? clearAppointmentSelection : selectAllAppointments}
                  >
                    {selectedAppointmentIds.size === patientAppointments.length ? (
                      <CheckSquare className="h-4 w-4 mr-2" />
                    ) : (
                      <Square className="h-4 w-4 mr-2" />
                    )}
                    {selectedAppointmentIds.size === patientAppointments.length ? "Desmarcar Todos" : "Selecionar Todos"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {patientAppointments.length > 0 ? (
                <div className="space-y-4">
                  {patientAppointments.map((appointment) => {
                    const isSelected = selectedAppointmentIds.has(appointment.id);
                    return (
                      <div 
                        key={appointment.id} 
                        className={`flex items-start p-4 border rounded-lg gap-3 ${
                          isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
                        }`}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAppointmentSelection(appointment.id)}
                          className="p-1 h-auto mt-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </Button>
                        <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-medium">
                              {format(new Date(appointment.date), 'dd/MM/yyyy')} às {appointment.time}
                            </div>
                            <div className="text-sm text-gray-600">
                              {appointment.treatmentType || 'Consulta'}
                            </div>
                            {appointment.notes && (
                              <div className="text-sm text-gray-500 mt-1">{appointment.notes}</div>
                            )}
                          </div>
                          <Badge variant={
                            appointment.status === 'realizado' ? 'default' :
                            appointment.status === 'confirmado' ? 'secondary' :
                            appointment.status === 'cancelado' ? 'destructive' :
                            appointment.status === 'faltante' ? 'destructive' : 'outline'
                          }>
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhum agendamento encontrado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {/* Filtros Avançados - Financeiro */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Button
              variant="outline"
              onClick={() => setShowFinancialFilters(!showFinancialFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar descrição..."
                  value={financialSearchTerm}
                  onChange={(e) => setFinancialSearchTerm(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>
              <Select value={financialStatusFilter} onValueChange={setFinancialStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showFinancialFilters && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Período</label>
                    <Select value={financialDateFilter} onValueChange={setFinancialDateFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os períodos</SelectItem>
                        <SelectItem value="thisMonth">Este mês</SelectItem>
                        <SelectItem value="lastMonth">Mês passado</SelectItem>
                        <SelectItem value="custom">Período personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {financialDateFilter === "custom" && (
                    <>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Data inicial</label>
                        <Input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Data final</label>
                        <Input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Barra de Ações em Massa - Financeiro */}
          {selectedReceivableIds.size > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">
                      {selectedReceivableIds.size} contas selecionadas
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkMarkReceivablesAsPaid}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como Recebido
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDeleteReceivables}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearReceivableSelection}
                    >
                      Limpar Seleção
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <DollarSign className="mr-2 h-5 w-5" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {financialSummary.totalBilled.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Faturado</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {financialSummary.totalPaid.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Pago</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    R$ {financialSummary.totalPending.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">A Receber</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Contas a Receber</h4>
                  {patientReceivables.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectedReceivableIds.size === patientReceivables.length ? clearReceivableSelection : selectAllReceivables}
                    >
                      <input
                        type="checkbox"
                        checked={selectedReceivableIds.size === patientReceivables.length && patientReceivables.length > 0}
                        readOnly
                        className="mr-2"
                      />
                      Selecionar todos
                    </Button>
                  )}
                </div>
                
                {patientReceivables.length > 0 ? (
                  <div className="space-y-2">
                    {patientReceivables.map((receivable) => (
                      <div key={receivable.id} className="flex items-center gap-3 p-3 border rounded">
                        <Checkbox
                          checked={selectedReceivableIds.has(receivable.id)}
                          onCheckedChange={() => toggleReceivableSelection(receivable.id)}
                        />
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2">
                          <div>
                            <div className="font-medium">{receivable.description}</div>
                            <div className="text-sm text-gray-600">
                              Vencimento: {format(new Date(receivable.dueDate), 'dd/MM/yyyy')}
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="font-medium">R$ {Number(receivable.amount).toFixed(2)}</div>
                            <Badge variant={receivable.status === 'recebido' ? 'default' : 'secondary'}>
                              {receivable.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhuma conta a receber.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}