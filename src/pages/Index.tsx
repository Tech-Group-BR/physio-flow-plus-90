import React from 'react';
import { Routes, Route, useLocation } from "react-router-dom";

// Componentes da UI e Layout
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LazyWrapper, LoadingSpinner } from "@/components/common/LazyWrapper";

// Lazy loading dos componentes das páginas
import {
  Dashboard,
  PatientsPage,
  AgendaPageWithRecurrence,
  FinancialPage,
  ReportsPage,
  WhatsAppPage,
  PackagesPage,
  ProfessionalsPage,
  ConfigurationsPage,
  SalesPage,
  GuardianPortal,
  PatientFinancialReport,
  PatientDetailsPage,
  ProfessionalDetailsPage,
  EvolutionDetailsPage,
  AnamnesisDetailsPage,
  FinancialReports,
  RoomsManager
} from "@/utils/lazyComponents";

const Index = () => {
  const location = useLocation();

  console.log('🎯 Current route:', location.pathname);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex w-full min-h-screen bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-3 sm:px-4 lg:px-6 gap-2 sm:gap-4">
              <SidebarTrigger className="shrink-0" />
              <div className="flex items-center space-x-2 min-w-0">
                <h1 className="font-semibold text-sm sm:text-base truncate">GoPhysioTech</h1>
                <span className="text-muted-foreground hidden sm:inline text-xs sm:text-sm truncate">Sistema de Gestão</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-3 sm:p-4 md:p-6 max-w-full">
              <Routes>
                <Route path="/dashboard" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando dashboard..." />}>
                    <Dashboard />
                  </LazyWrapper>
                } />
                <Route path="/agenda" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando agenda..." />}>
                    <AgendaPageWithRecurrence />
                  </LazyWrapper>
                } />
                <Route path="/pacientes" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando pacientes..." />}>
                    <PatientsPage />
                  </LazyWrapper>
                } />
                <Route path="/pacientes/:id" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando detalhes do paciente..." />}>
                    <PatientDetailsPage />
                  </LazyWrapper>
                } />
                <Route path="/pacientes/:id/anamnese" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando anamnese..." />}>
                    <PatientDetailsPage />
                  </LazyWrapper>
                } />
                <Route path="/pacientes/:id/evolucao" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando evolução..." />}>
                    <PatientDetailsPage />
                  </LazyWrapper>
                } />
                <Route path="/prontuario/:patientId" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando prontuário..." />}>
                    <AnamnesisDetailsPage />
                  </LazyWrapper>
                } />
                <Route path="/prontuario/evolucao/:evoId" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando detalhes da evolução..." />}>
                    <EvolutionDetailsPage />
                  </LazyWrapper>
                } />
                <Route path="/financeiro" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando módulo financeiro..." />}>
                    <FinancialPage />
                  </LazyWrapper>
                } />
                <Route path="/pacotes" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando pacotes..." />}>
                    <PackagesPage />
                  </LazyWrapper>
                } />
                <Route path="/whatsapp" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando WhatsApp..." />}>
                    <WhatsAppPage />
                  </LazyWrapper>
                } />
                <Route path="/relatorios" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando relatórios..." />}>
                    <ReportsPage />
                  </LazyWrapper>
                } />
                <Route path="/relatorios/financeiro" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando relatórios financeiros..." />}>
                    <FinancialReports />
                  </LazyWrapper>
                } />
                <Route path="/relatorios/pacientes" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando relatório de pacientes..." />}>
                    <PatientFinancialReport />
                  </LazyWrapper>
                } />
                <Route path="/salas" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando gerenciador de salas..." />}>
                    <RoomsManager />
                  </LazyWrapper>
                } />
                <Route path="/fisioterapeutas" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando profissionais..." />}>
                    <ProfessionalsPage />
                  </LazyWrapper>
                } />
                <Route path="/profissionais/:id" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando detalhes do profissional..." />}>
                    <ProfessionalDetailsPage />
                  </LazyWrapper>
                } />
                <Route path="/configuracoes" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando configurações..." />}>
                    <ConfigurationsPage />
                  </LazyWrapper>
                } />
                <Route path="/portal-responsavel" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando portal do responsável..." />}>
                    <GuardianPortal />
                  </LazyWrapper>
                } />
                <Route path="*" element={
                  <LazyWrapper fallback={<LoadingSpinner message="Carregando dashboard..." />}>
                    <Dashboard />
                  </LazyWrapper>
                } />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;