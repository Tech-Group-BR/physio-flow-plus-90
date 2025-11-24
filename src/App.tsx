import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { LazyWrapper, LoadingSpinner } from "@/components/common/LazyWrapper";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ClinicProvider } from "@/contexts/ClinicContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { ProductsCacheProvider } from "@/contexts/ProductsCacheContext";
import Index from "@/pages/Index";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import SuperAdminPage from "@/pages/SuperAdminPage";
import AcceptInvitePage from "@/pages/AcceptInvitePage";
import { 
  LandingPage,
  LoginPage,
  RegisterPage,
  SignUpPage,
  PaymentPage,
  AdminPage,
  RootRoute
} from "@/utils/lazyComponents";
import { useState, useEffect } from "react";
import "./App.css";

// ✅ Importar comandos de debug para desenvolvimento
import "@/utils/dev/debugCommands";

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
                        <LazyWrapper fallback={<LoadingSpinner message="Carregando..." />}>
                          <RootRoute />
                        </LazyWrapper>
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/landing" 
                    element={
                      <PublicRoute>
                        <LazyWrapper fallback={<LoadingSpinner message="Carregando página inicial..." />}>
                          <LandingPage />
                        </LazyWrapper>
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/login" 
                    element={
                      <PublicRoute>
                        <LazyWrapper fallback={<LoadingSpinner message="Carregando página de login..." />}>
                          <LoginPage />
                        </LazyWrapper>
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/register" 
                    element={
                      <PublicRoute>
                        <LazyWrapper fallback={<LoadingSpinner message="Carregando página de registro..." />}>
                          <RegisterPage />
                        </LazyWrapper>
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/signup" 
                    element={
                      <PublicRoute>
                        <LazyWrapper fallback={<LoadingSpinner message="Carregando cadastro..." />}>
                          <SignUpPage />
                        </LazyWrapper>
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/payment" 
                    element={
                      <PublicRoute>
                        <LazyWrapper fallback={<LoadingSpinner message="Carregando página de pagamento..." />}>
                          <PaymentPage />
                        </LazyWrapper>
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