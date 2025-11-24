import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Patient, MedicalRecord, Evolution } from "@/types";
import { formatLocalDate } from '@/shared/utils';

interface PatientMedicalTabProps {
  patient: Patient;
  patientMedicalRecord?: MedicalRecord;
  patientEvolutions: Evolution[];
  onShowMedicalRecordForm: () => void;
}

export function PatientMedicalTab({ 
  patient, 
  patientMedicalRecord, 
  patientEvolutions, 
  onShowMedicalRecordForm 
}: PatientMedicalTabProps) {
  if (!patientMedicalRecord) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma anamnese registrada</h3>
          <p className="text-gray-500 mb-4">
            Crie uma anamnese para começar o acompanhamento médico deste paciente.
          </p>
          <Button onClick={onShowMedicalRecordForm}>
            <FileText className="mr-2 h-4 w-4" />
            Criar Anamnese
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
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
                      {formatLocalDate(evolution.date)}
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
  );
}