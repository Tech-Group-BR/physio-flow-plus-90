import { useState } from "react";
import { useClinic } from "@/contexts/ClinicContext";
import { Patient, MedicalRecord, Evolution } from "@/types";

// Componentes da UI (shadcn/ui)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Ícones
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  FileText, 
  DollarSign, 
  FilePlus,
  MoreHorizontal, // Novo ícone para o menu
  AlertTriangle // Ícone para o alerta de exclusão
} from "lucide-react";

// Formulários
import { PatientForm } from "@/components/PatientForm";
import { MedicalRecordForm } from "@/components/MedicalRecordForm";
import { EvolutionForm } from "@/components/EvolutionForm";

export function PatientsPage() {
  // Hooks do Contexto da Clínica
  const { 
    patients, 
    medicalRecords, 
    updatePatient,
    deletePatient, // <<< NOVA FUNÇÃO (precisa ser criada no seu contexto)
    addMedicalRecord, 
    addEvolution 
  } = useClinic();

  // Estados de Controle da UI
  const [searchTerm, setSearchTerm] = useState("");
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [isAnamnesisFormOpen, setIsAnamnesisFormOpen] = useState(false);
  const [isEvolutionFormOpen, setIsEvolutionFormOpen] = useState(false);
  const [isConfirmInactivateOpen, setIsConfirmInactivateOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false); // <<< NOVO ESTADO

  // Estados para Gerenciar Dados Selecionados
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>();
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | undefined>();

  const filteredPatients = patients.filter(patient =>
    patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    patient.cpf.includes(searchTerm)
  );

  // --- Handlers para Abrir Modais e Menus ---
  const handleNewPatient = () => {
    setSelectedPatient(undefined);
    setIsPatientFormOpen(true);
  };
  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsPatientFormOpen(true);
  };
  const handleCreateAnamnesis = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsAnamnesisFormOpen(true);
  };
  const handleAddEvolution = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsEvolutionFormOpen(true);
  };
  const handleOpenDeleteConfirm = (patient: Patient) => { // <<< NOVO HANDLER
    setSelectedPatient(patient);
    setIsConfirmDeleteOpen(true);
  };

  // --- Funções de Ação ---
  const handleCloseForms = () => {
    setIsPatientFormOpen(false);
    setIsAnamnesisFormOpen(false);
    setIsEvolutionFormOpen(false);
    setIsConfirmInactivateOpen(false);
    setIsConfirmDeleteOpen(false);
    setSelectedPatient(undefined);
    setSelectedRecord(undefined);
  };

  const handleToggleStatus = (patient: Patient) => {
    if (patient.isActive) {
      setSelectedPatient(patient);
      setIsConfirmInactivateOpen(true);
    } else {
      togglePatientStatus(patient); // Reativa direto
    }
  };

  const togglePatientStatus = async (patient: Patient) => {
    try {
      await updatePatient(patient.id, { isActive: !patient.isActive });
      handleCloseForms();
    } catch (error) {
      console.error("Erro ao alterar status do paciente:", error);
    }
  };

  const handleConfirmDelete = async () => { // <<< NOVA FUNÇÃO
    if (!selectedPatient) return;
    try {
      await deletePatient(selectedPatient.id);
      handleCloseForms();
    } catch (error) {
      console.error("Erro ao excluir paciente:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Ações Principais */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Pacientes e Prontuários</h1>
        <Button onClick={handleNewPatient} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Novo Paciente</span>
        </Button>
      </div>

      {/* Barra de Busca */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Buscar por nome, telefone ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
        </div>
      </div>

      {/* Grid de Pacientes */}
      <div className="grid gap-6">
        {filteredPatients.map((patient) => {
          const patientRecord = medicalRecords.find(r => r.patientId === patient.id);
          return (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold">{patient.fullName}</h3>
                      {/* // <<< ALTERAÇÃO AQUI: Badge agora é clicável */}
                      <Badge 
                        variant={patient.isActive ? "default" : "secondary"} 
                        onClick={() => handleToggleStatus(patient)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {patient.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm text-muted-foreground">
                       <div className="flex items-center space-x-2 truncate"><Phone className="h-4 w-4 flex-shrink-0" /><span>{patient.phone}</span></div>
                       <div className="flex items-center space-x-2 truncate"><Mail className="h-4 w-4 flex-shrink-0" /><span>{patient.email || "Não informado"}</span></div>
                       <div className="flex items-center space-x-2 truncate font-medium"><strong>Tratamento:</strong> {patient.treatmentType}</div>
                    </div>
                  </div>

                  {/* // <<< ALTERAÇÃO AQUI: Novo DropdownMenu de Ações */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditPatient(patient)}>
                        <Edit className="mr-2 h-4 w-4" /><span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`https://wa.me/${patient.phone.replace(/\D/g, '')}`)}>
                        <Phone className="mr-2 h-4 w-4" /><span>WhatsApp</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <DollarSign className="mr-2 h-4 w-4" /><span>Financeiro</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleOpenDeleteConfirm(patient)} 
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /><span>Excluir Permanentemente</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Seção do Prontuário (sem alterações) */}
                <Accordion type="single" collapsible className="w-full mt-4">
                  {/* ... (o conteúdo do Accordion continua exatamente o mesmo de antes) ... */}
                   <AccordionItem value="item-1">
                    <AccordionTrigger className="font-semibold text-base">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5"/>
                        <span>Prontuário Médico</span>
                         {patientRecord ? (
                           <Badge variant="outline">{patientRecord.evolutions.length} Evoluções</Badge>
                         ) : (
                           <Badge variant="secondary">Sem Anamnese</Badge>
                         )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                      {patientRecord ? (
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold">Resumo da Anamnese</h4>
                             <Button size="sm" onClick={() => handleAddEvolution(patientRecord)}>
                                <Plus className="h-4 w-4 mr-1"/> Nova Evolução
                            </Button>
                          </div>
                          <div className="p-4 border rounded-md bg-muted/50 space-y-2">
                            <p><strong>Queixa Principal:</strong> {patientRecord.anamnesis.chiefComplaint}</p>
                             <p className="text-sm text-muted-foreground">
                               <strong>Histórico:</strong> {patientRecord.anamnesis.historyOfPresentIllness}
                             </p>
                          </div>

                          <h4 className="font-bold mt-4 mb-2">Últimas Evoluções</h4>
                          {patientRecord.evolutions.length > 0 ? (
                            <div className="space-y-3">
                              {patientRecord.evolutions.slice(-3).reverse().map((evo: Evolution) => (
                                <div key={evo.id} className="border-l-2 border-primary pl-4">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {new Date(evo.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                  </p>
                                  <p className="text-sm">{evo.observations}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                             <p className="text-sm text-muted-foreground">Nenhuma evolução registrada.</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground mb-4">Este paciente ainda não possui uma anamnese.</p>
                          <Button onClick={() => handleCreateAnamnesis(patient)}>
                            <FilePlus className="h-4 w-4 mr-2" /> Criar Anamnese
                          </Button>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )
        })}
        {filteredPatients.length === 0 && (
          <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">{searchTerm ? "Nenhum paciente encontrado." : "Nenhum paciente cadastrado."}</p></CardContent></Card>
        )}
      </div>
      
      {/* Modais (a maioria sem alteração, exceto pelo nome e um novo modal adicionado) */}

      {/* Modal de Inativação */}
      <Dialog open={isConfirmInactivateOpen} onOpenChange={setIsConfirmInactivateOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Confirmar Inativação</DialogTitle><DialogDescription>Tem certeza que deseja inativar o paciente <strong>{selectedPatient?.fullName}</strong>? Ele não aparecerá em novos agendamentos, mas seu histórico será mantido.</DialogDescription></DialogHeader>
            <DialogFooter className="sm:justify-end gap-2"><Button type="button" variant="secondary" onClick={handleCloseForms}>Cancelar</Button><Button type="button" variant="destructive" onClick={() => selectedPatient && togglePatientStatus(selectedPatient)}>Sim, Inativar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* // <<< NOVO MODAL: Confirmação de Exclusão Permanente */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-red-600" /> Ação Irreversível
              </DialogTitle>
              <DialogDescription>
                Você está prestes a **excluir permanentemente** o paciente <strong>{selectedPatient?.fullName}</strong>. Todos os seus dados, incluindo prontuários e agendamentos, serão perdidos para sempre.
                <br/><br/>
                Se deseja apenas impedir novos agendamentos, considere <strong className="text-yellow-600">Inativar</strong> o paciente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-end gap-2">
              <Button type="button" variant="secondary" onClick={handleCloseForms}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
                Eu entendo, Excluir Tudo
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Demais modais (Formulários) continuam os mesmos */}
      <Dialog open={isPatientFormOpen} onOpenChange={setIsPatientFormOpen}><DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{selectedPatient ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle><DialogDescription>{selectedPatient ? 'Altere os dados do paciente.' : 'Preencha os dados para cadastrar um novo paciente.'}</DialogDescription></DialogHeader><PatientForm patient={selectedPatient} onSave={handleCloseForms} onCancel={handleCloseForms}/></DialogContent></Dialog>
      <Dialog open={isAnamnesisFormOpen} onOpenChange={setIsAnamnesisFormOpen}><DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova Anamnese para: {selectedPatient?.fullName}</DialogTitle><DialogDescription>Preencha as informações do prontuário inicial do paciente.</DialogDescription></DialogHeader>{selectedPatient && (<MedicalRecordForm patient={selectedPatient} onSave={handleCloseForms} onCancel={handleCloseForms}/>)}</DialogContent></Dialog>
      <Dialog open={isEvolutionFormOpen} onOpenChange={setIsEvolutionFormOpen}><DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova Evolução</DialogTitle><DialogDescription>Registre a evolução do tratamento para o paciente.</DialogDescription></DialogHeader>{selectedRecord && (<EvolutionForm record={selectedRecord} onSave={handleCloseForms} onCancel={handleCloseForms}/>)}</DialogContent></Dialog>
    </div>
  );
}