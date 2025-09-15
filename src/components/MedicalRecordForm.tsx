import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClinic } from "@/contexts/ClinicContext";
import { Patient } from "@/types";
import { useAuth } from "@/hooks/useAuth"; // Certifique-se de que este hook existe para obter o usuário

interface MedicalRecordFormProps {
  patient: Patient;
  onSave: () => void;
  onCancel: () => void;
}

export function MedicalRecordForm({ patient, onSave, onCancel }: MedicalRecordFormProps) {
  const { addMedicalRecord } = useClinic();
  const { user } = useAuth(); // Usando useAuth para obter o usuário logado

  const [formData, setFormData] = useState({
    chiefComplaint: '',
    historyOfPresentIllness: '',
    pastMedicalHistory: '',
    medications: '',
    allergies: '',
    socialHistory: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.chiefComplaint) {
      alert('Por favor, preencha pelo menos a queixa principal.');
      return;
    }

    // Verifica se o usuário está logado para obter o professional_id
    if (!user) {
      alert('Erro: Profissional não autenticado.');
      return;
    }

    const recordData = {
      patientId: patient.id,
      // Adicione o ID do profissional aqui!
      professional_id: user.id,
      anamnesis: formData,
      evolutions: [],
      files: []
    };

    try {
      await addMedicalRecord(recordData);
      onSave();
    } catch (error) {
      console.error("Erro ao salvar anamnese:", error);
      alert("Ocorreu um erro ao salvar a anamnese. Por favor, tente novamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Anamnese - {patient.fullName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="chiefComplaint">Queixa Principal *</Label>
            <Textarea
              id="chiefComplaint"
              value={formData.chiefComplaint}
              onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
              placeholder="Descreva a queixa principal do paciente..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="historyOfPresentIllness">História da Doença Atual</Label>
            <Textarea
              id="historyOfPresentIllness"
              value={formData.historyOfPresentIllness}
              onChange={(e) => setFormData({ ...formData, historyOfPresentIllness: e.target.value })}
              placeholder="História detalhada da doença atual..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="pastMedicalHistory">História Médica Pregressa</Label>
            <Textarea
              id="pastMedicalHistory"
              value={formData.pastMedicalHistory}
              onChange={(e) => setFormData({ ...formData, pastMedicalHistory: e.target.value })}
              placeholder="Doenças anteriores, cirurgias, internações..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="medications">Medicamentos em Uso</Label>
            <Textarea
              id="medications"
              value={formData.medications}
              onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
              placeholder="Liste os medicamentos que o paciente está usando..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="allergies">Alergias</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="Alergias conhecidas do paciente..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="socialHistory">História Social</Label>
            <Textarea
              id="socialHistory"
              value={formData.socialHistory}
              onChange={(e) => setFormData({ ...formData, socialHistory: e.target.value })}
              placeholder="Ocupação, hábitos, estilo de vida..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar Anamnese
        </Button>
      </div>
    </form>
  );
}