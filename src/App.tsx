
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ClinicProvider } from "@/contexts/ClinicContext";
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
import { useState, useEffect } from "react";
import "./App.css";

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

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

// Componente para redirecionamento quando já logado
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  console.log('🌐 PublicRoute:', { user: user?.email, loading });

  // ✅ OTIMIZAÇÃO: Só mostrar loading se não tem decisão clara
  // Se já tem user, redirecionar imediatamente
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    console.log('✅ Usuário já logado, redirecionando para /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ClinicProvider>
          <ProductsCacheProvider>
            <Router>
              <Routes>
              {/* <Route path="/" element={<RootRoute />} /> */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/pagamento" element={<PaymentPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/cadastro" element={<SignUpPage />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/auth" 
                element={
                  <PublicRoute>
                    <AuthPage />
                  </PublicRoute>
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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
