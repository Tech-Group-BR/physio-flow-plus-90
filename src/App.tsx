import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ClinicProvider } from "@/contexts/ClinicContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { ProductsCacheProvider } from "@/contexts/ProductsCacheContext";
import Index from "@/pages/Index";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import { LandingPage } from "@/components/LandingPage";
import { LoginPage } from "@/components/LoginPage";
import { RegisterPage } from "@/components/RegisterPage";
import { SignUpPage } from "@/components/SignUpPage";
import { PaymentPage } from "@/components/PaymentPage";
import { AdminPage } from "@/components/AdminPage";
import { RootRoute } from "@/components/RootRoute";
import SuperAdminPage from "@/pages/SuperAdminPage";
import AcceptInvitePage from "@/pages/AcceptInvitePage";
import { useState, useEffect } from "react";
import "./App.css";

// ✅ Importar comandos de debug para desenvolvimento
import "@/utils/debugCommands";

const queryClient = new QueryClient();

// Componente para proteção de rotas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  console.log('🔐 ProtectedRoute:', { 
    user: user?.email, 
    loading, 
    role: user?.profile?.role,
    pathname: window.location.pathname 
  });

  // ✅ OTIMIZAÇÃO: Só mostrar loading na primeira carga (quando não tem user E está loading)
  // Se já tem user, renderizar imediatamente mesmo que loading seja true
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // ✅ PROTEÇÃO: Se não tem user e não está loading, redirecionar
  if (!user) {
    console.log('❌ Usuário não autenticado, redirecionando para /login');
    return <Navigate to="/login" replace />;
  }

  // Verificar acesso específico para página admin
  if (window.location.pathname === '/admin') {
    if (user.profile?.role !== 'super') {
      console.log('❌ Usuário não é super admin, redirecionando para /dashboard');
      return <Navigate to="/dashboard" replace />;
    }
    console.log('✅ Super admin acessando página admin');
  }

  return <>{children}</>;
}

// Componente para rotas públicas (impedir acesso se já logado)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  // Se está loading, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  
  // Se já está logado, redirecionar para dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PermissionsProvider>
          <ClinicProvider>
            <ProductsCacheProvider>
              <Router>
                <Routes>
                  <Route 
                    path="/" 
                    element={
                      <PublicRoute>
                        <RootRoute />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/landing" 
                    element={
                      <PublicRoute>
                        <LandingPage />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/login" 
                    element={
                      <PublicRoute>
                        <LoginPage />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/register" 
                    element={
                      <PublicRoute>
                        <RegisterPage />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/signup" 
                    element={
                      <PublicRoute>
                        <SignUpPage />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/payment" 
                    element={
                      <PublicRoute>
                        <PaymentPage />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute>
                        <SuperAdminPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/accept-invite/:token" 
                    element={
                      <AcceptInvitePage />
                    } 
                  />
                  <Route 
                    path="/*" 
                    element={
                      <ProtectedRoute>
                        <SidebarProvider>
                          <Index />
                        </SidebarProvider>
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/404" element={<NotFound />} />
                </Routes>
                <Toaster />
              </Router>
            </ProductsCacheProvider>
          </ClinicProvider>
        </PermissionsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;