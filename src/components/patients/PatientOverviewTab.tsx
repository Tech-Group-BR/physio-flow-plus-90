import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Patient } from "@/types";
import { formatLocalDate } from '@/shared/utils';

interface PatientOverviewTabProps {
  patient: Patient;
}

export function PatientOverviewTab({ patient }: PatientOverviewTabProps) {
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
          {patient.birth_date && renderDetail("Data de nascimento", formatLocalDate(patient.birth_date))}
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
  );
}