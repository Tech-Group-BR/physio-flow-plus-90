
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClinic } from "@/contexts/ClinicContext";
import { Plus, Search, FileText, User, Calendar } from "lucide-react";
import { MedicalRecordForm } from "./MedicalRecordForm";
import { EvolutionForm } from "./EvolutionForm";
import { Patient, MedicalRecord } from "@/types";

export function MedicalRecordsPage() {
  const { patients, medicalRecords, addMedicalRecord, addEvolution } = useClinic();
  const [showForm, setShowForm] = useState(false);
  const [showEvolutionForm, setShowEvolutionForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>();
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | undefined>();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = patients.filter(patient =>
    patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const handleCreateRecord = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowForm(true);
  };

  const handleAddEvolution = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowEvolutionForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setShowEvolutionForm(false);
    setSelectedPatient(undefined);
    setSelectedRecord(undefined);
  };

  const handleCancel = () => {
    setShowForm(false);
    setShowEvolutionForm(false);
    setSelectedPatient(undefined);
    setSelectedRecord(undefined);
  };

  if (showForm && selectedPatient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Nova Anamnese - {selectedPatient.fullName}</h1>
        </div>
        <MedicalRecordForm
          patient={selectedPatient}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  if (showEvolutionForm && selectedRecord) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Nova Evolução</h1>
        </div>
        <EvolutionForm
          record={selectedRecord}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Prontuários Médicos</h1>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
          <TabsTrigger value="records">Prontuários</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <div className="grid gap-4">
            {filteredPatients.map((patient) => {
              const patientRecord = medicalRecords.find(r => r.patientId === patient.id);
              return (
                <Card key={patient.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <User className="h-5 w-5" />
                          <h3 className="text-lg font-semibold">{patient.fullName}</h3>
                          <Badge variant={patientRecord ? "default" : "secondary"}>
                            {patientRecord ? "Com Prontuário" : "Sem Prontuário"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <strong>Telefone:</strong> {patient.phone}
                          </div>
                          <div>
                            <strong>Tratamento:</strong> {patient.treatmentType}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!patientRecord ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleCreateRecord(patient)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Criar Anamnese
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddEvolution(patientRecord)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Nova Evolução
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <div className="grid gap-4">
            {medicalRecords.map((record) => {
              const patient = patients.find(p => p.id === record.patientId);
              if (!patient) return null;

              return (
                <Card key={record.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">{patient.fullName}</h3>
                        <Badge variant="outline">
                          {record.evolutions.length} Evolução(ões)
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddEvolution(record)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Nova Evolução
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Queixa Principal</h4>
                        <p className="text-sm text-muted-foreground">{record.anamnesis.chiefComplaint}</p>
                      </div>

                      {record.evolutions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Últimas Evoluções</h4>
                          <div className="space-y-2">
                            {record.evolutions.slice(-3).map((evolution) => (
                              <div key={evolution.id} className="border-l-2 border-primary pl-4">
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(evolution.date).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <p className="text-sm">{evolution.observations}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {medicalRecords.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Nenhum prontuário cadastrado. Crie uma anamnese para começar.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
