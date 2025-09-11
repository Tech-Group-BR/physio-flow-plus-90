
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState, forceSignOut } from '@/utils/authCleanup';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 Inicializando autenticação...');
    
    // Configurar listener de mudança de estado PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email);
        
        // Atualizar estado sincronamente
        setSession(session);
        setUser(session?.user ?? null);
        
        // Sempre definir loading como false após mudança de estado
        setLoading(false);
      }
    );

    // DEPOIS verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📱 Sessão inicial:', session?.user?.email || 'Nenhuma sessão');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Iniciando processo de login para:', email);
    
    try {
      // Limpar estado existente primeiro
      cleanupAuthState();
      
      // Tentar logout global para garantir estado limpo
      await forceSignOut(supabase);
      
      // Pequena pausa para garantir que a limpeza foi processada
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🔐 Tentando login após limpeza...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Erro no login:', error.message);
        return { error };
      }
      
      if (data.user) {
        console.log('✅ Login bem-sucedido:', data.user.email);
        // Não redirecionar aqui - deixar o roteamento handle isso
      }
      
      return { error: null };
    } catch (err: any) {
      console.error('❌ Erro inesperado no login:', err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('📝 Iniciando processo de cadastro para:', email);
    
    try {
      // Limpar estado existente primeiro
      cleanupAuthState();
      await forceSignOut(supabase);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData
        }
      });
      
      if (error) {
        console.error('❌ Erro no cadastro:', error.message);
        return { error };
      }
      
      console.log('✅ Cadastro realizado:', data.user?.email);
      return { error: null };
    } catch (err: any) {
      console.error('❌ Erro inesperado no cadastro:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    console.log('🚪 Iniciando logout...');
    
    try {
      // Limpar estado primeiro
      cleanupAuthState();
      
      // Tentar logout global
      await forceSignOut(supabase);
      
      // O roteamento irá lidar com o redirecionamento
      console.log('✅ Logout realizado com sucesso');
    } catch (err) {
      console.error('❌ Erro no logout:', err);
      // Mesmo com erro, limpar estado local
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
