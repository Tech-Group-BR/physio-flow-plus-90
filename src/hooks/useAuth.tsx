import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PersistentCache from '../lib/persistentCache';
import type { CachedUserData } from '../lib/persistentCache';

// Importa os tipos da sua database para o 'Profile'
import { Database } from '@/integrations/supabase/types';
import { Route } from 'lucide-react';

// --- TIPAGEM ATUALIZADA ---
// Tipo para o perfil (como ele é salvo na sua tabela 'profiles')
type Profile = Database['public']['Tables']['profiles']['Row'];

// Nosso tipo de usuário "enriquecido" para o frontend
// O 'user' do Supabase Auth tem o email sintético. O 'profile' tem o email REAL.
export type AppUser = User & {
  profile: Profile | null;
};

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  clinicId: string | null;
  clinicCode: string | null;
  signIn: (email: string, password: string, clinicCode: string) => Promise<{ error: any; isSuperAdmin?: boolean }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  forceReauth: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Funções utilitárias
const cleanupAuthState = () => {
  console.log('🧹 Limpando estado de autenticação...');
  localStorage.removeItem('supabase.auth.token');
  sessionStorage.clear();
};

const forceSignOutSupabase = async () => {
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch (error) {
    console.warn('⚠️ Erro no signOut forçado:', error);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Função para buscar dados da clínica pelo código
  const fetchClinicDataByCode = async (code: string) => {
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
  };

  // Função para carregar dados do PERFIL do usuário
  const loadUserProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('👤 Carregando perfil do usuário:', userId);
      
      // ✅ TIMEOUT: Adicionar timeout de 10 segundos na query
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao carregar perfil')), 10000);
      });
      
      const result = await Promise.race([profilePromise, timeoutPromise]) as any;
      
      const { data: profileData, error } = result;
      
      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        console.error('❌ Detalhes do erro:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return null;
      }

      console.log('✅ Perfil encontrado:', {
        id: profileData.id,
        email: profileData.email,
        clinic_id: profileData.clinic_id,
        clinic_code: profileData.clinic_code,
        role: profileData.role
      });

      // ✅ VALIDAÇÃO SUAVIZADA: Apenas alertar sobre dados faltantes, mas não bloquear
      if (!profileData.clinic_id || !profileData.clinic_code) {
        console.warn('⚠️ Perfil com dados incompletos:', {
          clinic_id: profileData.clinic_id,
          clinic_code: profileData.clinic_code
        });
        // Não bloquear o login, apenas alertar
        toast.warning('Perfil com dados incompletos. Alguns recursos podem não funcionar.');
      }
      
      // ✅ CACHE: Salvar dados críticos no cache local
      if (profileData.clinic_id && profileData.clinic_code) {
        const cacheData: CachedUserData = {
          userId: profileData.id,
          email: profileData.email,
          clinic_id: profileData.clinic_id,
          clinic_code: profileData.clinic_code,
          role: profileData.role,
          name: profileData.full_name,
          cachedAt: Date.now()
        };
        PersistentCache.cacheUserData(cacheData);
      }
      
      return profileData;
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar perfil:', error);
      if (error instanceof Error && error.message.includes('Timeout')) {
        console.error('❌ TIMEOUT na consulta do perfil - pode ser problema de conexão');
        toast.error('Timeout ao carregar dados do usuário. Tente novamente.');
      }
      return null;
    }
  };

  // Função para forçar nova autenticação
  const forceReauth = () => {
    console.log('🔄 Forçando nova autenticação...');
    cleanupAuthState();
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    toast.warning('Sessão expirada. Faça login novamente.');
  };

  // Função para refresh sem limpar o estado (para mudança de aba)
  const refreshAuth = async () => {
    console.log('🔄 Refresh auth - validando sessão atual...');
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('✅ Sessão válida encontrada, mantendo usuário logado');
        // Não limpa o estado, apenas revalida
        setLoading(false);
      } else {
        console.log('❌ Nenhuma sessão válida, executando logout');
        forceReauth();
      }
    } catch (error) {
      console.error('❌ Erro ao validar sessão:', error);
      setLoading(false);
    }
  };

  // Monitorar mudanças de autenticação
  useEffect(() => {
    console.log('🔄 Inicializando monitoramento de autenticação...');
    let mounted = true;
    let initialSessionProcessed = false; // ✅ Flag para evitar reprocessamento

    // ✅ PROTEÇÃO DE EMERGÊNCIA: Timeout absoluto para evitar loading infinito
    const emergencyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.error('🚨 TIMEOUT DE EMERGÊNCIA - Forçando parada do loading após 15 segundos');
        setLoading(false);
      }
    }, 15000); // 15 segundos timeout absoluto

    // Verificar sessão inicial
    const checkInitialSession = async () => {
      try {
        console.log('🔍 Verificando sessão inicial...');
        
        // ✅ PRIMEIRO: Tentar carregar do cache
        const cachedUserData = PersistentCache.getCachedUserData();
        if (cachedUserData && PersistentCache.hasValidUserCache()) {
          console.log('⚡ Carregando dados do usuário do cache...');
          
          // Validar se a sessão ainda é válida no Supabase
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (session?.user && session.user.id === cachedUserData.userId) {
            console.log('✅ Sessão válida - usando dados do cache');
            
            setUser({
              ...session.user,
              profile: {
                id: cachedUserData.userId,
                email: cachedUserData.email,
                clinic_id: cachedUserData.clinic_id,
                clinic_code: cachedUserData.clinic_code,
                role: cachedUserData.role as 'admin' | 'professional' | 'receptionist' | 'guardian',
                full_name: cachedUserData.name || '',
                phone: '',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            });
            setSession(session);
            setProfile({
              id: cachedUserData.userId,
              email: cachedUserData.email,
              clinic_id: cachedUserData.clinic_id,
              clinic_code: cachedUserData.clinic_code,
              role: cachedUserData.role as 'admin' | 'professional' | 'receptionist' | 'guardian',
              full_name: cachedUserData.name || '',
              phone: '',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
            if (mounted) {
              setLoading(false);
              initialSessionProcessed = true;
            }
            return; // Retorna cedo - dados do cache são válidos
          } else {
            console.log('⚠️ Sessão no cache inválida, limpando cache...');
            PersistentCache.clearUserCache();
          }
        }
        
        // ✅ SEGUNDO: Buscar do servidor
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao verificar sessão inicial:', error);
          if (mounted) {
            setUser(null);
            setSession(null);
            setProfile(null);
            setLoading(false);
            initialSessionProcessed = true; // ✅ Marcar como processado
          }
          return;
        }
        
        if (session?.user && mounted) {
          console.log('📱 Sessão inicial encontrada:', {
            userId: session.user.id,
            email: session.user.email,
            metadata: session.user.user_metadata
          });
          
          // ✅ CORRIGIDO: Carregar perfil e aguardar
          const userProfile = await loadUserProfile(session.user.id);
          console.log('👤 Perfil carregado:', userProfile);
          
          if (userProfile && mounted) {
            console.log('✅ Definindo usuário autenticado com perfil válido');
            setSession(session);
            setProfile(userProfile);
            setUser({ ...session.user, profile: userProfile });
          } else if (mounted) {
            console.warn('⚠️ Perfil não encontrado ou inválido, mas mantendo sessão');
            // MUDANÇA: Não limpar a sessão automaticamente, apenas alertar
            setSession(session);
            setProfile(null);
            setUser({ ...session.user, profile: null });
          }
        } else {
          console.log('📱 Nenhuma sessão inicial');
          if (mounted) {
            setUser(null);
            setSession(null);
            setProfile(null);
          }
        }
        
        if (mounted) {
          initialSessionProcessed = true; // ✅ Marcar como processado
        }
      } catch (error) {
        console.error('❌ Erro inesperado na verificação inicial:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setProfile(null);
          initialSessionProcessed = true; // ✅ Marcar como processado mesmo com erro
        }
      } finally {
        if (mounted) {
          console.log('✅ Loading inicial finalizado');
          setLoading(false);
        }
      }
    };

    checkInitialSession();

    // Listener de mudanças de estado - SIMPLIFICADO COM PROTEÇÃO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state change:', event, {
          hasSession: !!currentSession,
          userEmail: currentSession?.user?.email || 'no user',
          userId: currentSession?.user?.id || 'no id',
          initialSessionProcessed
        });
        
        // ✅ PROTEÇÃO: Ignorar eventos até que a sessão inicial seja processada
        if (!initialSessionProcessed) {
          console.log('⏭️ Ignorando evento, sessão inicial ainda processando');
          return;
        }

        // ✅ PROTEÇÃO: Não processar INITIAL_SESSION pois já foi processado acima
        if (event === 'INITIAL_SESSION') {
          console.log('⏭️ Ignorando INITIAL_SESSION, já processado');
          return;
        }

        // ✅ PROTEÇÃO: Só processar eventos importantes
        const importantEvents = ['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'];
        if (!importantEvents.includes(event)) {
          console.log('⏭️ Ignorando evento não crítico:', event);
          return;
        }

        setLoading(true);

        let currentUser: AppUser | null = null;
        let currentProfile: Profile | null = null;

        if (currentSession?.user) {
          console.log('👤 Carregando perfil para usuário no event:', event);
          currentProfile = await loadUserProfile(currentSession.user.id);
          
          if (currentProfile) {
            currentUser = { ...currentSession.user, profile: currentProfile };
          } else {
            console.warn('⚠️ Perfil não encontrado para o usuário:', currentSession.user.id);
            currentUser = { ...currentSession.user, profile: null };
          }
        }

        // ✅ CORRIGIDO: Aguardar todas as operações antes de finalizar loading
        if (mounted) {
          setSession(currentSession);
          setUser(currentUser);
          setProfile(currentProfile);
          setLoading(false);
        }
        
        console.log('✅ Auth state change processado:', {
          event,
          hasUser: !!currentUser,
          hasProfile: !!currentProfile,
          clinicId: currentProfile?.clinic_id || null,
          clinicCode: currentProfile?.clinic_code || null
        });
      }
    );

    return () => {
      mounted = false;
      clearTimeout(emergencyTimeout); // ✅ Limpar timeout de emergência
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, clinicCode: string) => {
    console.log('🔐 Iniciando login para:', email, 'com código:', clinicCode);
    try {
      setLoading(true);

      // 1. Primeiro fazer autenticação para verificar se usuário existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, clinic_code')
        .eq('email', email.trim())
        .single();

      if (profileError) {
        console.error('❌ Usuário não encontrado:', profileError);
        setLoading(false);
        return { error: { message: 'Usuário não encontrado. Verifique o email.' } };
      }

      // 2. Verificar se é super admin com código especial
      if (profile.role === 'super' && clinicCode === '000000') {
        console.log('👑 Login de super admin detectado - tratando como clínica 000000');
        
        // Verificar se usuário tem acesso a "clínica" 000000
        if (profile.clinic_code !== '000000') {
          console.error('❌ Super admin não tem acesso ao código 000000');
          setLoading(false);
          return { error: { message: 'Usuário não encontrado nesta clínica. Verifique o email e código da clínica.' } };
        }

        // Para super admin, também usar email sintético como clínica normal
        const [name, domain] = email.trim().split('@');
        const syntheticEmail = `${name}+000000@${domain}`;
        console.log('📧 Email sintético para super admin:', syntheticEmail);

        const { data, error } = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password,
        });

        if (error) {
          console.error('❌ Erro no login de super admin:', error);
          setLoading(false);
          return { error: { message: 'Email ou senha incorretos' } };
        }

        if (!data.user) {
          setLoading(false);
          return { error: { message: 'Falha na autenticação' } };
        }

        console.log('✅ Login de super admin realizado com sucesso - retornando isSuperAdmin: true');
        return { error: null, isSuperAdmin: true };
      }

      // 3. Para usuários normais, verificar se a clínica é válida
      const clinicData = await fetchClinicDataByCode(clinicCode);
      if (!clinicData) {
        setLoading(false);
        return { error: { message: 'Código da clínica inválido ou clínica não encontrada' } };
      }

      // 4. Verificar se usuário tem acesso a esta clínica específica
      if (profile.clinic_code !== clinicCode) {
        console.error('❌ Usuário não tem acesso a esta clínica');
        setLoading(false);
        return { error: { message: 'Usuário não encontrado nesta clínica. Verifique o email e código da clínica.' } };
      }

      // 5. Criar email sintético para login
      const [name, domain] = email.trim().split('@');
      const syntheticEmail = `${name}+${clinicCode}@${domain}`;
      console.log('📧 Email sintético para login:', syntheticEmail);

      // 6. Fazer login com email sintético
      const { data, error } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        setLoading(false);
        
        // Mensagens específicas
        if (error.message?.includes('Invalid login credentials')) {
          return { error: { message: 'Email ou senha incorretos' } };
        }
        
        if (error.message?.includes('Email not confirmed')) {
          return { error: { message: 'Email não confirmado. Verifique sua caixa de entrada.' } };
        }
        
        return { error };
      }

      if (!data.user) {
        setLoading(false);
        return { error: { message: 'Falha na autenticação' } };
      }

      console.log('✅ Login realizado com sucesso');
      // O listener onAuthStateChange vai processar o resto
      return { error: null, isSuperAdmin: false };
      
    } catch (error: any) {
      console.error('❌ Erro inesperado no login:', error);
      setLoading(false);
      return { error: { message: `Erro inesperado: ${error.message || 'Tente novamente'}` } };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('📝 Iniciando cadastro para:', email);
    console.log('📋 Dados recebidos:', userData);
    
    try {
      setLoading(true);
      
      const { clinic_code, full_name, phone, role } = userData;
      
      if (!clinic_code) {
        setLoading(false);
        return { error: { message: 'Código da clínica é obrigatório' } };
      }
      
      if (!full_name?.trim()) {
        setLoading(false);
        return { error: { message: 'Nome completo é obrigatório' } };
      }
      
      // 1. Verificar se o código da clínica é válido
      console.log('🔍 Verificando código da clínica:', clinic_code);
      const clinicData = await fetchClinicDataByCode(clinic_code);
      if (!clinicData) {
        setLoading(false);
        return { error: { message: 'Código da clínica inválido ou não encontrada' } };
      }
      console.log('✅ Clínica validada:', clinicData);
      
      // 2. Verificar se email já existe nesta clínica
      console.log('🔍 Verificando se email já existe nesta clínica...');
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id, email, clinic_code')
        .eq('email', email.trim())
        .eq('clinic_code', clinic_code)
        .single();
      
      if (existingUser && !checkError) {
        console.log('❌ Email já existe nesta clínica');
        setLoading(false);
        return { 
          error: { 
            message: 'Este email já está cadastrado nesta clínica. Tente fazer login.' 
          } 
        };
      }
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar email:', checkError);
        setLoading(false);
        return { 
          error: { 
            message: 'Erro ao verificar dados. Tente novamente.' 
          } 
        };
      }
      
      console.log('✅ Email disponível nesta clínica');
      
      // 3. Criar email sintético para o Auth
      const [name, domain] = email.trim().split('@');
      const syntheticEmail = `${name}+${clinic_code}@${domain}`;
      console.log('📧 Email sintético para auth:', syntheticEmail);
      
      // 4. Criar usuário no Auth com email sintético
      console.log('🔐 Criando usuário no auth...');
      const { data, error } = await supabase.auth.signUp({
        email: syntheticEmail, // Email sintético para o auth
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            // O trigger vai extrair o email real e buscar clinic_id automaticamente
            full_name: full_name.trim(),
            role: role || 'guardian',
            phone: phone?.trim() || '',
            clinic_code: clinic_code,
            is_active: true
          }
        }
      });
      
      if (error) {
        console.error('❌ Erro no signup:', error);
        setLoading(false);
        
        if (error.message?.includes('User already registered')) {
          return { 
            error: { 
              message: 'Este email já está cadastrado nesta clínica. Tente fazer login.' 
            } 
          };
        }
        
        return { error };
      }
      
      if (!data.user) {
        console.warn('⚠️ Usuário não foi criado no auth');
        setLoading(false);
        return { error: { message: 'Falha ao criar usuário' } };
      }
      
      console.log('✅ Usuário criado no auth. Verifique seu email para confirmar a conta.');
      // O trigger deve ter criado o perfil automaticamente
      setLoading(false);
      return { error: null };
      
    } catch (error: any) {
      console.error('❌ Erro inesperado no signup:', error);
      setLoading(false);
      return { 
        error: { 
          message: `Erro inesperado: ${error.message || 'Tente novamente'}`
        }
      };
    }
  };

  const signOut = async () => {
    console.log('🚪 Iniciando logout...');
    try {
      setLoading(true);
      cleanupAuthState();
      
      // ✅ CACHE: Limpar todos os caches
      PersistentCache.clearAllCache();
      
      await forceSignOutSupabase();
      
      console.log('✅ Logout realizado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      setUser(null);
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Debug em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 Auth Debug Detalhado:', {
        loading,
        hasSession: !!session,
        hasUser: !!user,
        hasProfile: !!profile,
        authUserEmail: session?.user?.email || null, // Email sintético do Auth
        authUserId: session?.user?.id || null,
        profileEmail: profile?.email || null, // Email REAL do perfil
        profileId: profile?.id || null,
        clinicCode: profile?.clinic_code || null,
        clinicId: profile?.clinic_id || null,
        // ✅ ADICIONAR: Dados que o ClinicContext precisa
        contextValues: {
          session: !!session,
          clinicId: user?.profile?.clinic_id || null,
          clinicCode: user?.profile?.clinic_code || null
        }
      });
    }
  }, [session, profile, loading, user]);

  const value = {
    user,
    session,
    loading,
    // ✅ CORRIGIDO: Garantir que clinicId e clinicCode estejam sempre atualizados
    clinicId: profile?.clinic_id || user?.profile?.clinic_id || null,
    clinicCode: profile?.clinic_code || user?.profile?.clinic_code || null,
    signIn,
    signUp,
    signOut,
    forceReauth,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
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