
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import { PatientsPage } from "@/components/PatientsPage";
import { AgendaPage } from "@/components/AgendaPage";
import { MedicalRecordsPage } from "@/components/MedicalRecordsPage";
import { FinancialPage } from "@/components/FinancialPage";
import { ReportsPage } from "@/components/ReportsPage";
import { WhatsAppPage } from "@/components/WhatsAppPage";
import { PackagesPage } from "@/components/PackagesPage";
import { PhysiotherapistsPage } from "@/components/PhysiotherapistsPage";
import { ConfigurationsPage } from "@/components/ConfigurationsPage";
import { SalesPage } from "@/components/SalesPage";
import { CRMPage } from "@/components/CRMPage";
import { GuardianPortal } from "@/components/GuardianPortal";
import { PatientFinancialReport } from "@/components/PatientFinancialReport";
import { useLocation } from "react-router-dom";

const Index = () => {
  const location = useLocation();

  console.log('🎯 Current route:', location.pathname);

  const getPageContent = () => {
    switch (location.pathname) {
      case '/':
        return <Dashboard />;
      case '/agenda':
        return <AgendaPage />;
      case '/pacientes':
        return <PatientsPage />;
      case '/prontuarios':
        return <MedicalRecordsPage />;
      case '/financeiro':
        return <FinancialPage />;
      case '/pacotes':
        return <PackagesPage />;
      case '/whatsapp':
        return <WhatsAppPage />;
      case '/relatorios':
        return <ReportsPage />;
      case '/fisioterapeutas':
        return <PhysiotherapistsPage />;
      case '/configuracoes':
        return <ConfigurationsPage />;
      case '/vendas':
        return <SalesPage />;
      case '/crm':
        return <CRMPage />;
      case '/portal-responsavel':
        return <GuardianPortal />;
      case '/relatorios/pacientes':
        return <PatientFinancialReport />;
      default:
        return <Dashboard />;
    }
  };

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
              {getPageContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
