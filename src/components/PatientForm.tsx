import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClinic } from "@/contexts/ClinicContext";
import { Patient } from "@/types";
import { useState } from "react";

interface PatientFormProps {
  patient?: Patient;
  onSave: (updatedPatientData?: Partial<Patient>) => void;
  onCancel: () => void;
}

export function PatientForm({ patient, onSave, onCancel }: PatientFormProps) {
  const { addPatient, updatePatient } = useClinic();

  const [formData, setFormData] = useState({
    fullName: patient?.fullName || '',
    phone: patient?.phone || '',
    email: patient?.email || '',
    cpf: patient?.cpf || '',
    birthDate: patient?.birthDate ? patient.birthDate.split('T')[0] : '',
    gender: patient?.gender || '',
    street: patient?.address?.street || '',
    number: patient?.address?.number || '',
    complement: patient?.address?.complement || '',
    neighborhood: patient?.address?.neighborhood || '',
    city: patient?.address?.city || '',
    state: patient?.address?.state || '',
    zipCode: patient?.address?.zipCode || '',
    insurance: patient?.insurance || '',
    treatmentType: patient?.treatmentType || '',
    emergencyName: patient?.emergencyContact?.name || '',
    emergencyPhone: patient?.emergencyContact?.phone || '',
    emergencyRelationship: patient?.emergencyContact?.relationship || '',
    notes: patient?.notes || '',
    medicalHistory: patient?.medicalHistory || '',
    sessionValue: patient?.sessionValue || 0
  });

  const genderOptions = [
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Feminino' }
  ];

  const treatmentTypes = [
    { value: 'ortopedica', label: 'Fisioterapia Ortopédica' },
    { value: 'neurologica', label: 'Fisioterapia Neurológica' },
    { value: 'respiratoria', label: 'Fisioterapia Respiratória' },
    { value: 'rpg', label: 'RPG' },
    { value: 'pilates', label: 'Pilates Clínico' },
    { value: 'hidroterapia', label: 'Hidroterapia' }
  ];

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.cpf || !formData.birthDate || !formData.gender) {
      alert('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    try {
      const age = calculateAge(formData.birthDate);
      const isMinor = age < 18;

      const patientData = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        cpf: formData.cpf,
        birthDate: formData.birthDate,
        gender: formData.gender as 'male' | 'female',
        address: {
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        insurance: formData.insurance,
        treatmentType: formData.treatmentType,
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relationship: formData.emergencyRelationship
        },
        emergencyPhone: formData.emergencyPhone,
        medicalHistory: formData.medicalHistory,
        appointments: [],
        payments: [],
        notes: formData.notes,
        isActive: true,
        isMinor: isMinor,
        sessionValue: formData.sessionValue
      };

      console.log('Dados do paciente preparados:', patientData);

      if (patient) {
        console.log('Editando paciente existente:', patient.id);
        // Para edição, passar apenas os campos que devem ser atualizados
        const updateData = {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          cpf: formData.cpf,
          birthDate: formData.birthDate,
          gender: formData.gender as 'male' | 'female',
          address: {
            street: formData.street,
            number: formData.number,
            complement: formData.complement,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode
          },
          insurance: formData.insurance,
          treatmentType: formData.treatmentType,
          emergencyContact: {
            name: formData.emergencyName,
            phone: formData.emergencyPhone,
            relationship: formData.emergencyRelationship
          },
          emergencyPhone: formData.emergencyPhone,
          medicalHistory: formData.medicalHistory,
          notes: formData.notes,
          isActive: patient.isActive, // Manter o status atual
          isMinor: isMinor,
          sessionValue: formData.sessionValue
        };

        console.log('Dados para atualização preparados:', updateData);

        try {
          onSave(updateData);
          console.log('Dados enviados para atualização');
        } catch (error) {
          console.error('Erro ao enviar dados para atualização:', error);
          throw error; // Re-throw para ser capturado pelo try-catch externo
        }
      } else {
        console.log('Criando novo paciente');
        // Para novo paciente, adicionar e depois chamar onSave
        try {
          await addPatient(patientData);
          console.log('Paciente criado com sucesso');
          onSave();
        } catch (error) {
          console.error('Erro ao criar paciente:', error);
          throw error; // Re-throw para ser capturado pelo try-catch externo
        }
      }
    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      alert('Erro ao salvar paciente: ' + (error as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div>
              <Label htmlFor="birthDate">Data de Nascimento *</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Gênero *</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="street">Rua/Avenida</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={formData.complement}
                onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                placeholder="00000-000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="SP"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações Médicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="medicalHistory">Histórico Médico</Label>
            <Textarea
              id="medicalHistory"
              value={formData.medicalHistory}
              onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
              placeholder="Histórico médico do paciente..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="insurance">Convênio</Label>
              <Input
                id="insurance"
                value={formData.insurance}
                onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                placeholder="Ex: Unimed, Bradesco Saúde"
              />
            </div>

            <div>
              <Label htmlFor="treatmentType">Tipo de Tratamento</Label>
              <Select value={formData.treatmentType} onValueChange={(value) => setFormData({ ...formData, treatmentType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tratamento" />
                </SelectTrigger>
                <SelectContent>
                  {treatmentTypes.map((treatment) => (
                    <SelectItem key={treatment.value} value={treatment.value}>
                      {treatment.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sessionValue">Valor da Sessão (R$)</Label>
              <Input
                id="sessionValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.sessionValue || 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setFormData({ ...formData, sessionValue: isNaN(value) ? 0 : value });
                }}
                placeholder="0,00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato de Emergência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="emergencyName">Nome</Label>
              <Input
                id="emergencyName"
                value={formData.emergencyName}
                onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="emergencyPhone">Telefone</Label>
              <Input
                id="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="emergencyRelationship">Parentesco</Label>
              <Input
                id="emergencyRelationship"
                value={formData.emergencyRelationship}
                onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                placeholder="Ex: Cônjuge, Filho(a)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="notes">Observações Gerais</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Informações adicionais sobre o paciente..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {patient ? 'Atualizar' : 'Cadastrar'} Paciente
        </Button>
      </div>
    </form>
  );
}
