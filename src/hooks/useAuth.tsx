import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

// --- TIPAGEM (sem alterações) ---
type Profile = Database['public']['Tables']['profiles']['Row'];
export type AppUser = User & {
  profile: Profile | null;
};
interface AuthContextType {
  session: Session | null;
  user: AppUser | null;
  loading: boolean; // Continuará a representar o estado de carregamento geral
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- NOVO ESTADO PARA CONTROLAR A CARGA INICIAL ---
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    // 1. VERIFICAR A SESSÃO ATIVA UMA VEZ PARA A CARGA INICIAL
    const fetchInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Erro na busca da sessão inicial:", error);
      }
      
      // Se tiver sessão, busca o perfil
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
      }
      
      setSession(session);
      setLoading(false); // Termina o carregamento inicial
      setInitialLoadComplete(true); // Marca que a carga inicial foi concluída
    };

    fetchInitialSession();

    // 2. OUVINTE PARA MUDANÇAS FUTURAS (LOGIN/LOGOUT)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Ignora a primeira chamada do ouvinte se a carga inicial ainda não terminou
        if (!initialLoadComplete) return;

        setLoading(true);
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(profileData);
        } else {
          setProfile(null);
        }
        
        setSession(session);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialLoadComplete]); // Depende do initialLoadComplete para reavaliar

  const user = session?.user ? { ...session.user, profile: profile } : null;

  // Renderiza o conteúdo apenas se o carregamento inicial estiver completo
  return (
    <AuthContext.Provider value={{ session, user, loading: !initialLoadComplete || loading }}>
      {!initialLoadComplete ? <div>Carregando aplicação...</div> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}