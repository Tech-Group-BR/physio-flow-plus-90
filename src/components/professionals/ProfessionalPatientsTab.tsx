import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { Users, Eye } from "lucide-react";
import { Professional, Patient, Appointment } from "@/types";

interface ProfessionalPatientsTabProps {
  professional: Professional;
  patients: Patient[];
  appointments: Appointment[];
}

export function ProfessionalPatientsTab({ 
  professional, 
  patients, 
  appointments 
}: ProfessionalPatientsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Users className="mr-2 h-5 w-5" />
          Pacientes Atendidos ({patients.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {patients.length > 0 ? (
          <div className="space-y-4">
            {patients.map((patient) => {
              const patientAppointments = appointments.filter(a => 
                a.patientId === patient.id && a.status === 'realizado'
              );
              
              return (
                <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{patient.fullName}</div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {patient.phone && <p>Telefone: {patient.phone}</p>}
                      {patient.email && <p>Email: {patient.email}</p>}
                      <p>Consultas realizadas: {patientAppointments.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={patient.isActive ? "default" : "secondary"}>
                      {patient.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <Link 
                      to={`/pacientes/${patient.id}`}
                      className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhum paciente atendido ainda</p>
            <p className="text-sm text-gray-400 mt-1">
              Pacientes aparecerão aqui após consultas realizadas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}