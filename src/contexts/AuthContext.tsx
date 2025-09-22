import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types'; // Importando tipos do Supabase

// --- 1. DEFINIÇÃO DE TIPOS ---

// Tipo para os dados que vêm da sua tabela 'profiles'
type Profile = Database['public']['Tables']['profiles']['Row'];

// Nosso novo tipo de usuário "enriquecido"
export type AppUser = User & {
  profile: Profile | null;
};

// Contexto atualizado para usar o novo tipo de usuário
interface AuthContextType {
  session: Session | null;
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // <-- 2. NOVO ESTADO PARA O PERFIL
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- 3. USEEFFECT ATUALIZADO E UNIFICADO ---
    const fetchSessionAndProfile = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Erro ao buscar sessão:", error);
        setLoading(false);
        return;
      }

      setSession(session);

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
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

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
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 4. OBJETO 'user' COMBINADO NO VALUE ---
  // Montamos o objeto de usuário enriquecido em tempo real
  const user = session?.user ? {
    ...session.user,
    profile: profile // Anexamos o perfil que buscamos
  } : null;

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading 
    }}>
      {children}
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