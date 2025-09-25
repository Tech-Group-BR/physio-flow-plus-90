import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types'; // Assumindo que você tem isso para tipar o perfil

// --- TIPAGEM ---
// Tipo para o perfil da tabela 'profiles'
type Profile = Database['public']['Tables']['profiles']['Row'];

// Extendemos o tipo User do Supabase para incluir o profile e clinic_id
export type AppUser = User & {
  profile: Profile | null; // O perfil completo anexado
  clinicId: string | null; // clinicId derivado do perfil para fácil acesso
};

interface AuthContextType {
  session: Session | null;
  user: AppUser | null; // Usamos nosso AppUser estendido
  loading: boolean;
  // clinicId não precisa ser exposto separadamente aqui se já está no user
  // Se quiser, pode deixar, mas é redundante se estiver no user
  // clinicId: string | null; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Função auxiliar para buscar o perfil e anexar ao usuário
  const getProfileAndClinicId = useCallback(async (supabaseUser: User | null): Promise<AppUser | null> => {
    if (!supabaseUser) {
      return null;
    }

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*') // Seleciona todas as colunas do perfil
      .eq('id', supabaseUser.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 é "no rows found"
      console.error("Erro ao buscar perfil:", error);
      // Aqui você pode querer lidar com o erro de forma mais robusta,
      // talvez até deslogar o usuário se o perfil for essencial e não puder ser carregado.
    }

    return {
      ...supabaseUser,
      profile: profileData || null,
      clinicId: profileData?.clinic_id || null, // Anexa clinicId para fácil acesso
    };
  }, []);

  useEffect(() => {
    // Escuta por mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      
      let appUser: AppUser | null = null;
      if (newSession?.user) {
        // Se há um usuário, busca o perfil e clinicId
        appUser = await getProfileAndClinicId(newSession.user);
      }
      
      setUser(appUser);
      setLoading(false); // Agora setLoading(false) só é chamado DEPOIS que o perfil é buscado
    });

    // Função para buscar a sessão inicial e o perfil
    const fetchInitialSessionAndProfile = async () => {
      const { data: { session: initialSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Erro ao buscar sessão inicial:", error);
      }

      setSession(initialSession);
      
      let initialAppUser: AppUser | null = null;
      if (initialSession?.user) {
        initialAppUser = await getProfileAndClinicId(initialSession.user);
      }
      
      setUser(initialAppUser);
      setLoading(false); // E aqui também, depois de tudo
    };

    fetchInitialSessionAndProfile();


    return () => subscription.unsubscribe();
  }, [getProfileAndClinicId]); // Adiciona getProfileAndClinicId como dependência para useCallback

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      // clinicId: user?.clinicId, // clinicId já está dentro do objeto user
    }}>
      {loading ? <div>Carregando autenticação...</div> : children}
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