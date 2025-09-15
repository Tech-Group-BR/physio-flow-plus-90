import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Evolution } from '@/types';
import { ArrowLeft, FilePlus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useClinic } from '@/contexts/ClinicContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EvolutionForm } from './EvolutionForm';

export function AnamnesisDetailsPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { medicalRecords, evolutions, fetchMedicalRecords, patients, addEvolution } = useClinic();

  // >>> NOVOS ESTADOS PARA O MODAL DE EVOLUÇÃO
  const [isEvolutionFormOpen, setIsEvolutionFormOpen] = useState(false);
  const [selectedRecordForEvolution, setSelectedRecordForEvolution] = useState<any | undefined>();

  const [isLoading, setIsLoading] = useState(true);

  const patient = patients.find(p => p.id === patientId);
  const medicalRecord = medicalRecords.find(r => r.patientId === patientId);
  
  const patientEvolutions = evolutions
    .filter(e => e.recordId === medicalRecord?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  useEffect(() => {
    if (!medicalRecord) {
      fetchMedicalRecords().then(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [patientId, medicalRecord, fetchMedicalRecords]);

  // >>> NOVO HANDLER PARA ABRIR O MODAL
  const handleAddEvolution = (record: any) => {
    setSelectedRecordForEvolution(record);
    setIsEvolutionFormOpen(true);
  };
  
  // >>> HANDLER PARA FECHAR O MODAL
  const handleCloseEvolutionForm = () => {
    setIsEvolutionFormOpen(false);
    setSelectedRecordForEvolution(undefined);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient || !medicalRecord) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-600">
          Prontuário de {patient?.fullName || "paciente"} não encontrado.
        </h1>
        <Button className="mt-4" onClick={() => navigate('/pacientes')}>
          Voltar para a lista de pacientes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pacientes')}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold">Prontuário de {patient.fullName}</h1>
      </div>
      
      {/* Detalhes da Anamnese */}
      <Card>
        <CardHeader><CardTitle>Anamnese</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p><strong>Queixa Principal:</strong> {medicalRecord.anamnesis.chiefComplaint}</p>
          <p><strong>Histórico Médico:</strong> {medicalRecord.anamnesis.pastMedicalHistory}</p>
          <p><strong>Histórico de doenças:</strong> {medicalRecord.anamnesis.historyOfPresentIllness}</p>
          <p><strong>Alergias:</strong> {medicalRecord.anamnesis.allergies}</p>
        </CardContent>
      </Card>
      
      {/* Lista de Evoluções */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Evoluções ({patientEvolutions.length})</CardTitle>
          <Button size="sm" onClick={() => handleAddEvolution(medicalRecord)}>
             <FilePlus className="h-4 w-4 mr-1"/> Nova Evolução
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {patientEvolutions.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-3 pr-4">
              {patientEvolutions.map((evo) => (
                 <Link to={`/prontuario/evolucao/${evo.id}`} key={evo.id}>
                    <div className="border-l-2 border-primary pl-4 cursor-pointer hover:bg-muted/50 transition-colors duration-200">
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(evo.date), 'dd/MM/yyyy')}</span>
                      </div>
                      <p className="text-sm">{evo.observations}</p>
                    </div>
                  </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma evolução registrada.</p>
          )}
        </CardContent>
      </Card>

      {/* >>> NOVO MODAL PARA ADICIONAR EVOLUÇÃO <<< */}
      <Dialog open={isEvolutionFormOpen} onOpenChange={setIsEvolutionFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Evolução para: {patient.fullName}</DialogTitle>
            <DialogDescription>
              Registre a evolução do tratamento para o paciente.
            </DialogDescription>
          </DialogHeader>
          {selectedRecordForEvolution && (
            <EvolutionForm 
              record={selectedRecordForEvolution} 
              onSave={handleCloseEvolutionForm} 
              onCancel={handleCloseEvolutionForm} 
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}