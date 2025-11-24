import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Patient } from "@/types";

interface PatientHeaderProps {
  patient: Patient;
  onBack: () => void;
}

export function PatientHeader({ patient, onBack }: PatientHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack} className="hidden sm:inline-flex">
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
    </div>
  );
}