import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, FileText, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Patient, MedicalRecord, Evolution } from "@/types";
import { useClinic } from '@/contexts/ClinicContext';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { MedicalRecordForm } from './MedicalRecordForm';
import { EvolutionForm } from './EvolutionForm';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';

export function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, medicalRecords, evolutions, appointments, accountsReceivable, fetchMedicalRecords, fetchEvolutions } = useClinic();
  const { clinicId } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
  const [showEvolutionForm, setShowEvolutionForm] = useState(false);
  const [financialData, setFinancialData] = useState<any>(null);

  const patient = patients.find(p => p.id === id);
  const patientMedicalRecord = medicalRecords.find(mr => mr.patientId === id);
  const patientEvolutions = evolutions.filter(e => e.recordId === patientMedicalRecord?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const patientAppointments = appointments.filter(a => a.patientId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const patientReceivables = accountsReceivable.filter(ar => ar.patientId === id);

  useEffect(() => {
    const fetchData = async () => {
      if (!patient) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // @ts-ignore
        const { data: financialResult, error } = await supabase.rpc('get_patient_financial_report', {
          p_patient_id: id
        });

        if (error) {
          console.error('Erro ao buscar dados financeiros:', error);
          toast.error('Erro ao carregar dados financeiros.');
        } else {
          setFinancialData(financialResult);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados do paciente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [patient, id]);

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calendar className="mr-2 h-5 w-5" />
                Histórico de Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patientAppointments.length > 0 ? (
                <div className="space-y-4">
                  {patientAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-2">
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
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhum agendamento encontrado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <DollarSign className="mr-2 h-5 w-5" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              {financialData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {Number(financialData.summary.totalBilled || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Total Faturado</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      R$ {Number(financialData.summary.totalPaid || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Total Pago</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      R$ {Number(financialData.summary.balance || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Saldo Pendente</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-500 mt-2">Carregando dados financeiros...</p>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-medium">Contas a Receber</h4>
                {patientReceivables.length > 0 ? (
                  <div className="space-y-2">
                    {patientReceivables.map((receivable) => (
                      <div key={receivable.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded gap-2">
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