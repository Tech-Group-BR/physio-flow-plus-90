
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ClinicProvider } from "@/contexts/ClinicContext";
import Index from "@/pages/Index";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import { useState, useEffect } from "react";
import "./App.css";

const queryClient = new QueryClient();

// Componente para proteção de rotas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  console.log(' ProtectedRoute:', { user: user?.email, loading });

  if (loading) {
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
    console.log('❌ Usuário não autenticado, redirecionando para /auth');
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// Componente para redirecionamento quando já logado
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  console.log('🌐 PublicRoute:', { user: user?.email, loading });

  if (loading) {
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
    console.log('✅ Usuário já logado, redirecionando para /');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ClinicProvider>
          <Router>
            <Routes>
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
        </ClinicProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
