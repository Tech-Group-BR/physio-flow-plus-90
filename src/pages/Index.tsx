import React from 'react';
import { Routes, Route, useLocation } from "react-router-dom";

// Componentes da UI e Layout
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";

// Componentes das Páginas
import { PatientsPage } from "@/components/PatientsPage";
import { AgendaPage } from "@/components/AgendaPage";
import { AgendaPageWithRecurrence } from "@/components/AgendaPageWithRecurrence";
import { MedicalRecordsPage } from "@/components/MedicalRecordsPage";
import { FinancialPage } from "@/components/FinancialPage";
import { ReportsPage } from "@/components/ReportsPage";
import { WhatsAppPage } from "@/components/WhatsAppPage";
import { PackagesPage } from "@/components/PackagesPage";
import { ProfessionalsPage } from "@/components/ProfessionalsPage";
import { ConfigurationsPage } from "@/components/ConfigurationsPage";

import { SalesPage } from "@/components/SalesPage";
import { CRMPage } from "@/components/CRMPage";
import { GuardianPortal } from "@/components/GuardianPortal";
import { PatientFinancialReport } from "@/components/PatientFinancialReport";
import { PatientDetailsPage } from "@/components/PatientDetailsPage";
import { EvolutionDetailsPage } from "@/components/EvolutionDetailsPage";
import { AnamnesisDetailsPage } from "@/components/AnamnesisDetailsPage";

const Index = () => {
  const location = useLocation();

  console.log('🎯 Current route:', location.pathname);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex w-full min-h-screen bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-4">
              <SidebarTrigger />
              <div className="flex items-center space-x-2">
                <h1 className="font-semibold">FisioTech</h1>
                <span className="text-muted-foreground hidden sm:inline">Sistema de Gestão</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6">
              {/* CORREÇÃO: Coloque as rotas aqui dentro do componente de layout */}
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/agenda" element={<AgendaPageWithRecurrence />} />
                <Route path="/pacientes" element={<PatientsPage />} />
                <Route path="/pacientes/:id" element={<PatientDetailsPage />} />
                <Route path="/prontuarios" element={<MedicalRecordsPage />} />
                <Route path="/prontuario/:patientId" element={<AnamnesisDetailsPage />} />
                <Route path="/prontuario/evolucao/:evoId" element={<EvolutionDetailsPage />} />
                <Route path="/financeiro" element={<FinancialPage />} />
                <Route path="/pacotes" element={<PackagesPage />} />
                <Route path="/whatsapp" element={<WhatsAppPage />} />
                <Route path="/relatorios" element={<ReportsPage />} />
                <Route path="/fisioterapeutas" element={<ProfessionalsPage />} />
                <Route path="/configuracoes" element={<ConfigurationsPage />} />
                <Route path="/vendas" element={<SalesPage />} />
                <Route path="/crm" element={<CRMPage />} />
                <Route path="/portal-responsavel" element={<GuardianPortal />} />
                <Route path="/relatorios/pacientes" element={<PatientFinancialReport />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;