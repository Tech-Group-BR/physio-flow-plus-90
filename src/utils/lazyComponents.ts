import { lazy } from "react";

// Lazy loading das páginas principais
export const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard").then(module => ({ default: module.Dashboard })));
export const PatientsPage = lazy(() => import("@/pages/patients/PatientsPage").then(module => ({ default: module.PatientsPage })));
export const AgendaPageWithRecurrence = lazy(() => import("@/components/agenda/AgendaPageWithRecurrence").then(module => ({ default: module.AgendaPageWithRecurrence })));
export const FinancialPage = lazy(() => import("@/pages/financial/FinancialPage").then(module => ({ default: module.FinancialPage })));
export const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage").then(module => ({ default: module.ReportsPage })));
export const WhatsAppPage = lazy(() => import("@/pages/whatsapp/WhatsAppPage").then(module => ({ default: module.WhatsAppPage })));
export const PackagesPage = lazy(() => import("@/pages/packages/PackagesPage").then(module => ({ default: module.PackagesPage })));
export const ProfessionalsPage = lazy(() => import("@/pages/professionals/ProfessionalsPage").then(module => ({ default: module.ProfessionalsPage })));
export const ConfigurationsPage = lazy(() => import("@/pages/settings/ConfigurationsPage").then(module => ({ default: module.ConfigurationsPage })));
export const SalesPage = lazy(() => import("@/pages/sales/SalesPage").then(module => ({ default: module.SalesPage })));
export const GuardianPortal = lazy(() => import("@/components/GuardianPortal").then(module => ({ default: module.GuardianPortal })));
export const PatientFinancialReport = lazy(() => import("@/components/admin/PatientFinancialReport").then(module => ({ default: module.PatientFinancialReport })));
export const PatientDetailsPage = lazy(() => import("@/pages/patients/PatientDetailsPage").then(module => ({ default: module.PatientDetailsPage })));
export const ProfessionalDetailsPage = lazy(() => import("@/pages/professionals/ProfessionalDetailsPage").then(module => ({ default: module.ProfessionalDetailsPage })));
export const EvolutionDetailsPage = lazy(() => import("@/pages/medical/EvolutionDetailsPage").then(module => ({ default: module.EvolutionDetailsPage })));
export const AnamnesisDetailsPage = lazy(() => import("@/pages/medical/AnamnesisDetailsPage").then(module => ({ default: module.AnamnesisDetailsPage })));
export const FinancialReports = lazy(() => import("@/components/FinancialReports").then(module => ({ default: module.FinancialReports })));
export const RoomsManager = lazy(() => import("@/pages/settings/RoomsManager").then(module => ({ default: module.RoomsManager })));

// Lazy loading das páginas administrativas
export const AdminPage = lazy(() => import("@/pages/admin/AdminPage").then(module => ({ default: module.AdminPage })));
export const LandingPage = lazy(() => import("@/pages/landing/LandingPage").then(module => ({ default: module.LandingPage })));
export const LoginPage = lazy(() => import("@/pages/auth/LoginPage").then(module => ({ default: module.LoginPage })));
export const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage").then(module => ({ default: module.RegisterPage })));
export const SignUpPage = lazy(() => import("@/pages/auth/SignUpPage").then(module => ({ default: module.SignUpPage })));
export const PaymentPage = lazy(() => import("@/pages/payment/PaymentPage").then(module => ({ default: module.PaymentPage })));
export const RootRoute = lazy(() => import("@/components/RootRoute").then(module => ({ default: module.RootRoute })));