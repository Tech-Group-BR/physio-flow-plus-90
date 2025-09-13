import { PatientForm } from "@/components/PatientForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useClinic } from "@/contexts/ClinicContext";
import { Patient } from "@/types";
import { Edit, Mail, Phone, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";

export function PatientsPage() {
  const { patients, updatePatient } = useClinic();
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = patients.filter(patient =>
    patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    patient.cpf.includes(searchTerm)
  );

  const handleEdit = (patient: Patient) => {
    console.log('Editando paciente:', patient.id, patient.fullName);
    setEditingPatient(patient);
    setShowForm(true);
  };

  const handleSave = async (updatedPatientData?: Partial<Patient>) => {
    try {
      console.log('handleSave chamado com dados:', updatedPatientData);

      if (editingPatient && updatedPatientData) {
        console.log('Salvando alterações do paciente:', editingPatient.id);
        console.log('Dados para atualização:', updatedPatientData);

        // Use the correct signature: (id: string, updates: Partial<Patient>)
        await updatePatient(editingPatient.id, updatedPatientData);
        console.log('Paciente atualizado com sucesso');
      } else if (!editingPatient) {
        console.log('Novo paciente criado com sucesso');
      } else {
        console.log('Nenhum dado para atualizar');
      }

      console.log('Fechando formulário');
      setShowForm(false);
      setEditingPatient(undefined);
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
    }
  };

  const handleCancel = () => {
    console.log('Cancelando edição/criação de paciente');
    setShowForm(false);
    setEditingPatient(undefined);
  };

  const togglePatientStatus = async (patient: Patient) => {
    try {
      console.log('Alterando status do paciente:', patient.id, 'de', patient.isActive, 'para', !patient.isActive);
      // Use the correct signature: (id: string, updates: Partial<Patient>)
      await updatePatient(patient.id, { isActive: !patient.isActive });
      console.log('Status do paciente alterado com sucesso');
    } catch (error) {
      console.error('Erro ao alterar status do paciente:', error);
    }
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
          </h1>
        </div>
        <PatientForm
          patient={editingPatient}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Pacientes</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Novo Paciente</span>
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, telefone ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{patient.fullName}</h3>
                    <Badge variant={patient.isActive ? "default" : "secondary"}>
                      {patient.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{patient.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{patient.email || "Não informado"}</span>
                    </div>
                    <div>
                      <strong>Tratamento:</strong> {patient.treatmentType}
                    </div>
                  </div>

                  {patient.insurance && (
                    <div className="mt-2 text-sm">
                      <strong>Convênio:</strong> {patient.insurance}
                    </div>
                  )}

                  {patient.notes && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <strong>Observações:</strong> {patient.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(patient)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={patient.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => togglePatientStatus(patient)}
                  >
                    {patient.isActive ? (
                      <Trash2 className="h-4 w-4" />
                    ) : (
                      "Reativar"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://wa.me/${patient.phone.replace(/\D/g, '')}`)}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPatients.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum paciente encontrado com os critérios de busca." : "Nenhum paciente cadastrado."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
