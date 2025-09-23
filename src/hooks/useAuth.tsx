import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState, forceSignOut } from '@/utils/authCleanup';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  clinicId: string | null;
  signIn: (email: string, password: string, clinicCode?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);

  // Busca o clinicId da tabela profiles sempre que o usuário muda
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (data && data.clinic_id) {
            setClinicId(data.clinic_id);
          } else {
            setClinicId(null);
          }
        });
    } else {
      setClinicId(null);
    }
  }, [user]);

  useEffect(() => {
    console.log('🔄 Inicializando autenticação...');
    // Listener de mudança de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📱 Sessão inicial:', session?.user?.email || 'Nenhuma sessão');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, clinicCode?: string) => {
    console.log('🔐 Iniciando processo de login para:', email);
    try {
      cleanupAuthState();
      await forceSignOut(supabase);
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
      if (data.user && clinicCode) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ clinic_code: clinicCode })
          .eq('id', data.user.id);
        if (updateError) {
          console.error('❌ Erro ao atualizar código da clínica:', updateError);
        } else {
          console.log('✅ Código da clínica atualizado no perfil');
        }
      }
      if (data.user) {
        console.log('✅ Login bem-sucedido:', data.user.email);
      }
      return { error: null };
    } catch (err: any) {
      console.error('❌ Erro inesperado no login:', err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      cleanupAuthState();
      await forceSignOut(supabase);

      // 1. Cria usuário no Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData
        }
      });
      if (error) {
        return { error };
      }

      // 2. Busca o id da clínica pelo código
      const { clinic_code } = userData;
      let clinicId = null;
      if (clinic_code) {
        const { data: clinicData, error: clinicError } = await supabase
          .from("clinic_settings")
          .select("id")
          .eq("clinic_code", clinic_code)
          .single();
        if (clinicError || !clinicData) {
          return { error: clinicError || "Código da clínica inválido" };
        }
        clinicId = clinicData.id;
      }

      // 3. Cria perfil na tabela profiles
      const userId = data.user?.id;
      if (userId) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            full_name: userData.full_name,
            email,
            phone: userData.phone,
            role: userData.role,
            is_active: true,
            clinic_code: userData.clinic_code,
            clinic_id: clinicId,
          });
        if (profileError) {
          return { error: profileError };
        }
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };


  const signOut = async () => {
    console.log('🚪 Iniciando logout...');
    try {
      cleanupAuthState();
      await forceSignOut(supabase);
      console.log('✅ Logout realizado com sucesso');
    } catch (err) {
      console.error('❌ Erro no logout:', err);
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      clinicId,
      signIn,
      signUp,
      signOut
    }}>
      {loading ? <div>Carregando autenticação...</div> : children}
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