import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus } from "lucide-react";
import { Patient, MedicalRecord, Evolution } from "@/types";
import { PatientOverviewTab } from "./PatientOverviewTab";
import { PatientMedicalTab } from "./PatientMedicalTab";
import { PatientAppointmentsTab } from "./PatientAppointmentsTab";
import { PatientFinancialTab } from "./PatientFinancialTab";
import { MedicalRecordForm } from "@/components/forms/medical/MedicalRecordForm";
import { EvolutionForm } from "@/components/forms/medical/EvolutionForm";
import { toast } from "sonner";

interface PatientTabsProps {
  patient: Patient;
  patientMedicalRecord?: MedicalRecord;
  patientEvolutions: Evolution[];
  patientAppointments: any[];
  patientReceivables: any[];
  patientPackages: any[];
  showMedicalRecordForm: boolean;
  setShowMedicalRecordForm: (show: boolean) => void;
  showEvolutionForm: boolean;
  setShowEvolutionForm: (show: boolean) => void;
  selectedAppointmentIds: Set<string>;
  setSelectedAppointmentIds: (ids: Set<string>) => void;
  appointmentStatusFilter: string;
  setAppointmentStatusFilter: (filter: string) => void;
  appointmentDateFilter: string;
  setAppointmentDateFilter: (filter: string) => void;
  appointmentSearchTerm: string;
  setAppointmentSearchTerm: (term: string) => void;
  showAppointmentFilters: boolean;
  setShowAppointmentFilters: (show: boolean) => void;
  selectedReceivableIds: Set<string>;
  setSelectedReceivableIds: (ids: Set<string>) => void;
  financialStatusFilter: string;
  setFinancialStatusFilter: (filter: string) => void;
  financialDateFilter: string;
  setFinancialDateFilter: (filter: string) => void;
  financialSearchTerm: string;
  setFinancialSearchTerm: (term: string) => void;
  showFinancialFilters: boolean;
  setShowFinancialFilters: (show: boolean) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  onBulkMarkReceivablesAsPaid: () => void;
  onBulkDeleteReceivables: () => void;
  onBulkDeleteAppointments: () => void;
  onAppointmentSelectionChange: (id: string, selected: boolean) => void;
  onReceivableSelectionChange: (id: string, selected: boolean) => void;
  getAppointmentStatus: (appointment: any) => string;
  getFinancialStatus: (receivable: any) => string;
}

export function PatientTabs(props: PatientTabsProps) {
  const navigate = useNavigate();
  
  const handleSaveMedicalRecord = () => {
    props.setShowMedicalRecordForm(false);
    toast.success('Anamnese salva com sucesso!');
  };

  const handleSaveEvolution = () => {
    props.setShowEvolutionForm(false);
    toast.success('Evolução salva com sucesso!');
  };

  const handleCancelMedicalRecord = () => {
    props.setShowMedicalRecordForm(false);
  };

  const handleCancelEvolution = () => {
    props.setShowEvolutionForm(false);
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
        {!props.patientMedicalRecord && (
          <Dialog open={props.showMedicalRecordForm} onOpenChange={props.setShowMedicalRecordForm}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Criar Anamnese
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <MedicalRecordForm 
                patient={props.patient}
                onSave={handleSaveMedicalRecord}
                onCancel={handleCancelMedicalRecord}
              />
            </DialogContent>
          </Dialog>
        )}
        
        <Dialog open={props.showEvolutionForm} onOpenChange={props.setShowEvolutionForm}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Nova Evolução
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <EvolutionForm 
              record={props.patientMedicalRecord || {
                id: 'temp-' + props.patient.id,
                patientId: props.patient.id,
                anamnesis: {
                  chiefComplaint: '',
                  historyOfPresentIllness: '',
                  pastMedicalHistory: '',
                  medications: '',
                  allergies: '',
                  socialHistory: ''
                },
                evolutions: [],
                files: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }}
              onSave={handleSaveEvolution}
              onCancel={handleCancelEvolution}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto w-full justify-start sm:grid sm:grid-cols-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Dados Gerais</TabsTrigger>
          <TabsTrigger value="medical" className="text-xs sm:text-sm py-2">Prontuário</TabsTrigger>
          <TabsTrigger value="appointments" className="text-xs sm:text-sm py-2">Agendamentos</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs sm:text-sm py-2">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PatientOverviewTab patient={props.patient} />
        </TabsContent>

        <TabsContent value="medical" className="space-y-6">
          <PatientMedicalTab 
            patient={props.patient}
            patientMedicalRecord={props.patientMedicalRecord}
            patientEvolutions={props.patientEvolutions}
            onShowMedicalRecordForm={() => props.setShowMedicalRecordForm(true)}
          />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <PatientAppointmentsTab 
            patient={props.patient}
            appointments={props.patientAppointments}
            selectedAppointmentIds={props.selectedAppointmentIds}
            appointmentStatusFilter={props.appointmentStatusFilter}
            setAppointmentStatusFilter={props.setAppointmentStatusFilter}
            appointmentDateFilter={props.appointmentDateFilter}
            setAppointmentDateFilter={props.setAppointmentDateFilter}
            appointmentSearchTerm={props.appointmentSearchTerm}
            setAppointmentSearchTerm={props.setAppointmentSearchTerm}
            showAppointmentFilters={props.showAppointmentFilters}
            setShowAppointmentFilters={props.setShowAppointmentFilters}
            customStartDate={props.customStartDate}
            setCustomStartDate={props.setCustomStartDate}
            customEndDate={props.customEndDate}
            setCustomEndDate={props.setCustomEndDate}
            onBulkDeleteAppointments={props.onBulkDeleteAppointments}
            onAppointmentSelectionChange={props.onAppointmentSelectionChange}
            getAppointmentStatus={props.getAppointmentStatus}
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <PatientFinancialTab 
            patient={props.patient}
            receivables={props.patientReceivables}
            packages={props.patientPackages}
            selectedReceivableIds={props.selectedReceivableIds}
            financialStatusFilter={props.financialStatusFilter}
            setFinancialStatusFilter={props.setFinancialStatusFilter}
            financialDateFilter={props.financialDateFilter}
            setFinancialDateFilter={props.setFinancialDateFilter}
            financialSearchTerm={props.financialSearchTerm}
            setFinancialSearchTerm={props.setFinancialSearchTerm}
            showFinancialFilters={props.showFinancialFilters}
            setShowFinancialFilters={props.setShowFinancialFilters}
            customStartDate={props.customStartDate}
            setCustomStartDate={props.setCustomStartDate}
            customEndDate={props.customEndDate}
            setCustomEndDate={props.setCustomEndDate}
            onBulkMarkReceivablesAsPaid={props.onBulkMarkReceivablesAsPaid}
            onBulkDeleteReceivables={props.onBulkDeleteReceivables}
            onReceivableSelectionChange={props.onReceivableSelectionChange}
            getFinancialStatus={props.getFinancialStatus}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}