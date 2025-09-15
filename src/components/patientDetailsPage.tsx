import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Mail, FileText } from "lucide-react";
import { Patient, MedicalRecord, Evolution } from "@/types";
import { useClinic } from '@/contexts/ClinicContext';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { patients, medicalRecords, evolutions, fetchPatients } = useClinic();

  const [isLoading, setIsLoading] = useState(true);

  // Find the patient using the ID from the URL
  const patient = patients.find(p => p.id === id);

  useEffect(() => {
    // If patient data is not loaded, fetch it
    if (!patient) {
      fetchPatients().then(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [id, patient, fetchPatients]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    // Handle the case where the patient ID doesn't exist
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-600">Paciente não encontrado.</h1>
        <Button className="mt-4" onClick={() => navigate('/pacientes')}>
          Voltar para a lista de pacientes
        </Button>
      </div>
    );
  }

  // Find medical records and evolutions for the found patient
  const patientRecord = medicalRecords.find(r => r.patientId === patient.id);
  const patientEvolutions = evolutions
    .filter(e => e.recordId === patientRecord?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pacientes')}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold">{patient.fullName}</h1>
      </div>

      {/* Dados Pessoais e de Contato */}
      <Card>
        <CardHeader><CardTitle>Informações Pessoais</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p><strong>E-mail:</strong> {patient.email || "Não informado"}</p>
          <p><strong>Telefone:</strong> {patient.phone}</p>
          <p><strong>CPF:</strong> {patient.cpf}</p>
          <p><strong>Data de Nascimento:</strong> {format(new Date(patient.birthDate), 'dd/MM/yyyy')}</p>
          <p><strong>Gênero:</strong> {patient.gender === 'male' ? 'Masculino' : 'Feminino'}</p>
          <Badge variant={patient.isActive ? 'default' : 'secondary'}>{patient.isActive ? 'Ativo' : 'Inativo'}</Badge>
        </CardContent>
      </Card>

      {/* Endereço */}
      {patient.address && (
        <Card>
          <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p>{patient.address.street}, {patient.address.number}{patient.address.complement && `, ${patient.address.complement}`}</p>
            <p>{patient.address.neighborhood}, {patient.address.city} - {patient.address.state}</p>
            <p>CEP: {patient.address.zipCode}</p>
          </CardContent>
        </Card>
      )}

      {/* Histórico Médico e Tratamento */}
      <Card>
        <CardHeader><CardTitle>Histórico Médico e Tratamento</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Convênio:</strong> {patient.insurance || "Não informado"}</p>
          <p><strong>Tipo de Tratamento:</strong> {patient.treatmentType || "Não informado"}</p>
          <p><strong>Histórico Médico:</strong> {patient.medicalHistory || "Não informado"}</p>
        </CardContent>
      </Card>

      {/* Prontuário Médico (Anamnese e Evoluções) */}
      {patientRecord ? (
        <Card>
          <CardHeader><CardTitle>Prontuário Médico</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg">Anamnese</h4>
              <p className="mt-2 text-sm text-muted-foreground">{patientRecord.anamnesis.chiefComplaint}</p>
              <p className="mt-1 text-sm text-muted-foreground"><strong>Histórico:</strong> {patientRecord.anamnesis.historyOfPresentIllness}</p>
            </div>
            {patientEvolutions.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg">Evoluções ({patientEvolutions.length})</h4>
                <div className="mt-2 space-y-4 max-h-96 overflow-y-auto">
                  {patientEvolutions.map((evo) => (
                         <Link to={`/prontuarios/evolucao/${evo.id}`} key={evo.id}>
          <div 
            className="border-l-4 border-primary pl-4 cursor-pointer hover:bg-muted/50 transition-colors duration-200"
          >
            <p className="text-sm text-muted-foreground mb-1">{format(new Date(evo.date), 'dd/MM/yyyy')}</p>
            <p className="text-sm">{evo.observations}</p>
          </div>
        </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma anamnese registrada para este paciente.</CardContent></Card>
      )}

      {/* Contato de Emergência */}
      {patient.emergencyContact && (
        <Card>
          <CardHeader><CardTitle>Contato de Emergência</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Nome:</strong> {patient.emergencyContact.name}</p>
            <p><strong>Telefone:</strong> {patient.emergencyContact.phone}</p>
            <p><strong>Parentesco:</strong> {patient.emergencyContact.relationship}</p>
          </CardContent>
        </Card>
      )}

      {/* Observações */}
      {patient.notes && (
        <Card>
          <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
          <CardContent><p>{patient.notes}</p></CardContent>
        </Card>
      )}
    </div>
  );
}