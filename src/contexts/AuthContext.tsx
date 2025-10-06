import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { globalCache } from '@/lib/globalCache';

// --- TIPAGEM ---
type Profile = Database['public']['Tables']['profiles']['Row'];

export type AppUser = User & {
  profile: Profile | null;
  clinicId: string | null;
};

interface AuthContextType {
  session: Session | null;
  user: AppUser | null;
  loading: boolean;
  clinicId: string | null;
  clinicCode: string | null;
  redirectTo: string | null;
  setRedirectTo: (path: string | null) => void;
  clearRedirectTo: () => void;
  signIn: (email: string, password: string, clinicCode: string) => Promise<{ error: any; isSuperAdmin?: boolean }>;
  register: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any; data?: any }>;
  signOut: () => Promise<void>;
  forceReauth: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ Funções utilitárias
const cleanupAuthState = () => {
  console.log('🧹 Limpando estado de autenticação...');
  localStorage.removeItem('supabase.auth.token');
  sessionStorage.clear();
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [redirectTo, setRedirectToState] = useState<string | null>(null);
  
  const isInitialized = useRef(false);

  const setRedirectTo = useCallback((path: string | null) => {
    setRedirectToState(path);
    if (path) {
      localStorage.setItem('auth_redirect_to', path);
    } else {
      localStorage.removeItem('auth_redirect_to');
    }
  }, []);

  const clearRedirectTo = useCallback(() => {
    setRedirectToState(null);
    localStorage.removeItem('auth_redirect_to');
  }, []);

  // Função auxiliar para buscar o perfil e anexar ao usuário
  const getProfileAndClinicId = useCallback(async (supabaseUser: User | null): Promise<AppUser | null> => {
    if (!supabaseUser) {
      return null;
    }

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("❌ Erro ao buscar perfil:", error);
    }

    const appUser: AppUser = {
      ...supabaseUser,
      profile: profileData || null,
      clinicId: profileData?.clinic_id || null,
    };
    
    // Atualizar profile state
    setProfile(profileData || null);
    
    return appUser;
  }, []);

  // ✅ Função para buscar clínica pelo código
  const fetchClinicDataByCode = useCallback(async (code: string) => {
    try {
      console.log('🏥 Buscando dados da clínica pelo código:', code);
      const { data: clinicData, error } = await supabase
        .from('clinic_settings')
        .select('id, name, clinic_code')
        .eq('clinic_code', code)
        .single();
      
      if (error || !clinicData) {
        console.error('❌ Erro ao buscar clínica pelo código:', error);
        return null;
      }
      return clinicData;
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar clínica:', error);
      return null;
    }
  }, []);

  // ✅ SIGN IN
  const signIn = useCallback(async (email: string, password: string, clinicCode: string) => {
    console.log('🔐 Iniciando login para:', email, 'com código:', clinicCode);
    try {
      setLoading(true);

      // 1. Verificar se usuário existe
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, clinic_code')
        .eq('email', email.trim())
        .single();

      if (profileError) {
        console.error('❌ Usuário não encontrado:', profileError);
        setLoading(false);
        return { error: { message: 'Usuário não encontrado. Verifique o email.' } };
      }

      // 2. Super admin com código especial
      if (profileCheck.role === 'super' && clinicCode === '000000') {
        console.log('👑 Login de super admin detectado');
        
        if (profileCheck.clinic_code !== '000000') {
          setLoading(false);
          return { error: { message: 'Usuário não encontrado nesta clínica.' } };
        }

        const [name, domain] = email.trim().split('@');
        const syntheticEmail = `${name}+000000@${domain}`;

        const { data, error } = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password,
        });

        if (error) {
          console.error('❌ Erro no login de super admin:', error);
          setLoading(false);
          return { error: { message: 'Email ou senha incorretos' } };
        }

        console.log('✅ Login de super admin realizado');
        return { error: null, isSuperAdmin: true };
      }

      // 3. Usuários normais - verificar clínica
      const clinicData = await fetchClinicDataByCode(clinicCode);
      if (!clinicData) {
        setLoading(false);
        return { error: { message: 'Código da clínica inválido' } };
      }

      // 4. Verificar acesso à clínica
      if (profileCheck.clinic_code !== clinicCode) {
        console.error('❌ Usuário não tem acesso a esta clínica');
        setLoading(false);
        return { error: { message: 'Usuário não encontrado nesta clínica.' } };
      }

      // 5. Criar email sintético e fazer login
      const [name, domain] = email.trim().split('@');
      const syntheticEmail = `${name}+${clinicCode}@${domain}`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        setLoading(false);
        
        if (error.message?.includes('Invalid login credentials')) {
          return { error: { message: 'Email ou senha incorretos' } };
        }
        
        return { error };
      }

      console.log('✅ Login realizado com sucesso');
      return { error: null, isSuperAdmin: false };
      
    } catch (error: any) {
      console.error('❌ Erro inesperado no login:', error);
      setLoading(false);
      return { error: { message: `Erro inesperado: ${error.message || 'Tente novamente'}` } };
    }
  }, [fetchClinicDataByCode]);

  // ✅ REGISTER
  const register = useCallback(async (email: string, password: string, userData: any) => {
    console.log('📝 Iniciando cadastro para:', email);
    
    try {
      setLoading(true);
      
      const { clinic_code, full_name, phone, role } = userData;
      
      if (!clinic_code) {
        setLoading(false);
        return { error: { message: 'Código da clínica é obrigatório' } };
      }
      
      // 1. Verificar clínica
      const clinicData = await fetchClinicDataByCode(clinic_code);
      if (!clinicData) {
        setLoading(false);
        return { error: { message: 'Código da clínica inválido' } };
      }
      
      // 2. Verificar email disponível
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .eq('clinic_code', clinic_code)
        .single();
      
      if (existingUser) {
        setLoading(false);
        return { error: { message: 'Este email já está cadastrado nesta clínica.' } };
      }
      
      // 3. Criar usuário
      const [name, domain] = email.trim().split('@');
      const syntheticEmail = `${name}+${clinic_code}@${domain}`;
      
      const { data, error } = await supabase.auth.signUp({
        email: syntheticEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: full_name.trim(),
            role: role || 'guardian',
            phone: phone?.trim() || '',
            clinic_code: clinic_code,
            is_active: true
          }
        }
      });
      
      if (error) {
        console.error('❌ Erro no register:', error);
        setLoading(false);
        return { error };
      }
      
      console.log('✅ Usuário criado. Verifique seu email.');
      setLoading(false);
      return { error: null };
      
    } catch (error: any) {
      console.error('❌ Erro inesperado no register:', error);
      setLoading(false);
      return { error: { message: `Erro: ${error.message}` } };
    }
  }, [fetchClinicDataByCode]);

  // ✅ SIGN UP (criar clínica + admin)
  const signUp = useCallback(async (email: string, password: string, userData: any) => {
    console.log('📝 Iniciando signup completo para:', email);

    const { fullName, phone, role, clinicName, clinicAddress, clinicPhone } = userData;

    // Validações
    if (!clinicName?.trim()) {
      return { error: { message: 'Nome da clínica é obrigatório' } };
    }
    if (!fullName?.trim()) {
      return { error: { message: 'Nome completo é obrigatório' } };
    }
    if (role !== 'admin') {
      return { error: { message: 'Apenas admins podem criar clínicas' } };
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('complete-signup', {
        body: {
          email,
          password,
          fullName,
          phone,
          role,
          clinicName,
          clinicAddress,
          clinicPhone
        }
      });

      if (error) {
        console.error('❌ Erro na edge function:', error);
        setLoading(false);
        return { error: { message: `Erro no cadastro: ${error.message}` } };
      }

      if (!data.success) {
        setLoading(false);
        return { error: { message: data.error || 'Erro no cadastro' } };
      }

      console.log('✅ Signup completo realizado!');
      setLoading(false);
      return { error: null, data };

    } catch (error: any) {
      console.error('❌ Erro inesperado no signUp:', error);
      setLoading(false);
      return { error: { message: `Erro: ${error.message}` } };
    }
  }, []);

  // ✅ SIGN OUT
  const signOut = useCallback(async () => {
    console.log('🚪 Iniciando logout...');
    try {
      setLoading(true);
      cleanupAuthState();
      
      // Limpar cache global
      globalCache.clear();
      
      await supabase.auth.signOut({ scope: 'global' });
      
      setUser(null);
      setSession(null);
      setProfile(null);
      
      console.log('✅ Logout realizado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      setUser(null);
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FORCE REAUTH
  const forceReauth = useCallback(() => {
    console.log('🔄 Forçando nova autenticação...');
    cleanupAuthState();
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    toast.warning('Sessão expirada. Faça login novamente.');
  }, []);

  // ✅ REFRESH AUTH
  const refreshAuth = useCallback(async () => {
    console.log('🔄 Refresh auth - validando sessão...');
    try {
      setLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession?.user) {
        console.log('✅ Sessão válida, mantendo usuário logado');
        setLoading(false);
      } else {
        console.log('❌ Sessão inválida, executando logout');
        forceReauth();
      }
    } catch (error) {
      console.error('❌ Erro ao validar sessão:', error);
      setLoading(false);
    }
  }, [forceReauth]);

  useEffect(() => {
    // Carregar redirectTo do localStorage
    const savedRedirectTo = localStorage.getItem('auth_redirect_to');
    if (savedRedirectTo) {
      setRedirectToState(savedRedirectTo);
    }

    let subscription: any = null;

    // Função para buscar a sessão inicial e o perfil
    const fetchInitialSession = async () => {
      try {
        console.log('🔄 AuthContext: Iniciando carregamento de sessão...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Erro ao buscar sessão inicial:", error);
        }

        setSession(initialSession);
        
        let initialAppUser: AppUser | null = null;
        if (initialSession?.user) {
          console.log('👤 Buscando perfil do usuário:', initialSession.user.id);
          initialAppUser = await getProfileAndClinicId(initialSession.user);
        }
        
        setUser(initialAppUser);
        setProfile(initialAppUser?.profile || null);
        isInitialized.current = true;
        setLoading(false);
        
        console.log('✅ AuthContext: Sessão inicial carregada', { 
          hasUser: !!initialAppUser,
          email: initialAppUser?.email,
          clinicId: initialAppUser?.clinicId 
        });
      } catch (error) {
        console.error("❌ Erro ao inicializar auth:", error);
        isInitialized.current = true;
        setLoading(false);
      }
    };

    // 1️⃣ PRIMEIRO: Carregar sessão inicial
    fetchInitialSession().then(() => {
      // 2️⃣ DEPOIS: Registrar listener (só após inicialização)
      const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        console.log('🔄 AuthContext: onAuthStateChange', _event, {
          isInitialized: isInitialized.current,
          hasSession: !!newSession
        });
        
        // Se não inicializou ainda, ignora (fetchInitialSession vai lidar)
        if (!isInitialized.current) {
          console.log('⏭️ Ignorando onAuthStateChange - ainda não inicializado');
          return;
        }
        
        setSession(newSession);
        
        let appUser: AppUser | null = null;
        if (newSession?.user) {
          appUser = await getProfileAndClinicId(newSession.user);
        }
        
        setUser(appUser);
        setProfile(appUser?.profile || null);
        
        console.log('✅ AuthContext: Estado atualizado por onAuthStateChange', {
          hasUser: !!appUser,
          clinicId: appUser?.clinicId
        });
      });
      
      subscription = data.subscription;
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [getProfileAndClinicId]);

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      clinicId: profile?.clinic_id || user?.profile?.clinic_id || null,
      clinicCode: profile?.clinic_code || user?.profile?.clinic_code || null,
      redirectTo,
      setRedirectTo,
      clearRedirectTo,
      signIn,
      register,
      signUp,
      signOut,
      forceReauth,
      refreshAuth,
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