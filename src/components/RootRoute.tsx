import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export function RootRoute() {
  const { user, loading } = useAuth();

  console.log('🏠 RootRoute - user:', user?.email, 'loading:', loading);

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
    console.log('✅ Usuário logado, redirecionando para dashboard');
    return <Navigate to="/dashboard" replace />;
  } else {
    console.log('👤 Usuário não logado, redirecionando para landing');
    return <Navigate to="/landing" replace />;
  }
}