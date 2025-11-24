import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { globalCache } from '@/lib/globalCache';
import { clearAllCaches } from '@/utils/dev/cacheCleanup';

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
  localStorage.removeItem('auth_user_data'); // ✅ Remover dados persistidos
  sessionStorage.clear();
};

// ✅ Salvar dados críticos no localStorage
const persistUserData = (user: AppUser | null) => {
  if (user && user.profile) {
    const criticalData = {
      userId: user.id,
      email: user.email,
      profileId: user.profile.id,
      clinicId: user.profile.clinic_id,
      clinicCode: user.profile.clinic_code,
      role: user.profile.role,
      fullName: user.profile.full_name,
      timestamp: Date.now()
    };
    localStorage.setItem('auth_user_data', JSON.stringify(criticalData));
    console.log('💾 Dados críticos salvos no localStorage:', criticalData);
  }
};

// ✅ Recuperar dados críticos do localStorage
const loadPersistedUserData = () => {
  try {
    const stored = localStorage.getItem('auth_user_data');
    if (stored) {
      const data = JSON.parse(stored);
      // Verificar se não expirou (24 horas)
      const age = Date.now() - data.timestamp;
      if (age < 24 * 60 * 60 * 1000) {
        console.log('✅ Dados críticos recuperados do localStorage:', data);
        return data;
      } else {
        console.log('⏰ Dados persistidos expiraram');
        localStorage.removeItem('auth_user_data');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao recuperar dados persistidos:', error);
  }
  return null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [redirectTo, setRedirectToState] = useState<string | null>(null);
  
  const isInitialized = useRef(false);
  const isLoggingOut = useRef(false); // ✅ PROTEÇÃO: Flag para evitar logout duplicado
  const lastProcessedSessionId = useRef<string | null>(null); // ✅ Rastrear último userId processado

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
      
      // ✅ FALLBACK: Tentar usar dados persistidos
      const persistedData = loadPersistedUserData();
      if (persistedData && persistedData.userId === supabaseUser.id) {
        console.log('🔄 Usando dados persistidos como fallback');
        const appUser: AppUser = {
          ...supabaseUser,
          profile: {
            id: persistedData.profileId,
            clinic_id: persistedData.clinicId,
            clinic_code: persistedData.clinicCode,
            role: persistedData.role,
            full_name: persistedData.fullName,
            email: persistedData.email,
          } as Profile,
          clinicId: persistedData.clinicId,
        };
        return appUser;
      }
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
        
        // ✅ CORREÇÃO: Aguardar atualização do estado
        console.log('⏳ Aguardando atualização do estado user (super admin)...');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // ✅ CRÍTICO: Resetar loading após sucesso
        setLoading(false);
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
      
      // ✅ CORREÇÃO CRÍTICA: Aguardar o onAuthStateChange processar e atualizar o estado user
      // Isso garante que o useEffect no LoginPage detectará o usuário logado
      console.log('⏳ Aguardando atualização do estado user...');
      await new Promise(resolve => setTimeout(resolve, 100)); // Pequeno delay para garantir processamento
      
      // ✅ CRÍTICO: Resetar loading após sucesso
      setLoading(false);
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
      
      const { clinic_code, full_name, phone, role, crefito } = userData;
      
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
      
      // 1.1 VALIDAÇÃO DE CONVITE OBRIGATÓRIO
      // Verificar se existe um convite pendente válido para este email e clínica
      const { data: invitation, error: inviteError } = await supabase
        .from('user_invitations' as any)
        .select('*')
        .eq('email', email.trim())
        .eq('clinic_id', clinicData.id)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitation) {
        setLoading(false);
        return { error: { message: 'Você precisa de um convite válido para se cadastrar nesta clínica' } };
      }

      // Verificar se o convite não expirou
      const inviteRecord = invitation as any;
      if (inviteRecord.expires_at && new Date(inviteRecord.expires_at) < new Date()) {
        setLoading(false);
        return { error: { message: 'Este convite expirou. Solicite um novo convite' } };
      }

      // Validar que o role corresponde ao convite
      if (inviteRecord.role !== role) {
        setLoading(false);
        return { error: { message: 'O cargo não corresponde ao convite recebido' } };
      }

      console.log('✅ Convite válido encontrado:', inviteRecord.id);
      
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
      
      // 3. Criar usuário (sem confirmação de email)
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
            is_active: true,
            email_confirmed: true // Marcar email como confirmado
          }
        }
      });
      
      if (error) {
        console.error('❌ Erro no register:', error);
        setLoading(false);
        return { error };
      }

      if (!data.user) {
        console.error('❌ Usuário não foi criado');
        setLoading(false);
        return { error: { message: 'Erro ao criar usuário' } };
      }

      console.log('✅ Usuário criado no auth:', data.user.id);

      // 4. Criar perfil na tabela profiles com o email REAL
      console.log('📝 Criando perfil...');
      const profileData: any = {
        id: data.user.id,
        email: email.trim(), // Email REAL do usuário
        full_name: full_name.trim(),
        phone: phone?.trim() || '',
        role: role || 'guardian',
        clinic_id: clinicData.id,
        clinic_code: clinic_code,
        is_active: true,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError);
        setLoading(false);
        return { error: { message: `Erro ao criar perfil: ${profileError.message}` } };
      }

      // 4.1 Atualizar crefito se for profissional (via UPDATE para evitar erro de schema cache)
      if (role === 'professional' && crefito) {
        console.log('📝 Adicionando CREFITO ao perfil...');
        const { error: crefitoError } = await supabase
          .from('profiles')
          .update({ crefito: crefito.trim() } as any)
          .eq('id', data.user.id);

        if (crefitoError) {
          console.warn('⚠️ Erro ao atualizar CREFITO:', crefitoError);
          // Não bloqueia o cadastro, mas loga o erro
        } else {
          console.log('✅ CREFITO adicionado com sucesso');
        }
      }

      console.log('✅ Perfil criado com sucesso');

      // 5. Aplicar permissões do convite (se houver)
      if (inviteRecord.permissions && inviteRecord.permissions.length > 0) {
        console.log('🔐 Aplicando permissões do convite...');
        const permissionsToInsert = inviteRecord.permissions.map((permId: string) => ({
          user_id: data.user.id,
          permission_id: permId,
          granted_by: inviteRecord.invited_by,
          granted_at: new Date().toISOString(),
        }));

        const { error: permError } = await supabase
          .from('user_permissions' as any)
          .insert(permissionsToInsert);

        if (permError) {
          console.warn('⚠️ Erro ao aplicar permissões customizadas:', permError);
        } else {
          console.log('✅ Permissões customizadas aplicadas');
        }
      }

      // 6. Marcar convite como aceito
      console.log('✉️ Marcando convite como aceito...');
      const { error: updateInviteError } = await supabase
        .from('user_invitations' as any)
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', inviteRecord.id);

      if (updateInviteError) {
        console.warn('⚠️ Erro ao atualizar convite:', updateInviteError);
      } else {
        console.log('✅ Convite marcado como aceito');
      }

      // 7. Fazer login automático para confirmar email
      if (data.user && !data.user.email_confirmed_at) {
        console.log('🔄 Confirmando email automaticamente...');
        
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password
        });

        if (loginError) {
          console.warn('⚠️ Não foi possível fazer login automático:', loginError);
        } else {
          console.log('✅ Email confirmado automaticamente via login');
        }
      }
      
      console.log('🎉 Registro completo! Usuário criado, perfil configurado e convite aceito.');
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

      // Debug: Verificar dados retornados
      console.log('🔍 Dados retornados da Edge Function:', data);
      console.log('🔍 Success:', data?.success);
      console.log('🔍 Clinic Code:', data?.clinic?.clinic_code);

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
    // ✅ PROTEÇÃO: Evitar múltiplas chamadas simultâneas
    if (isLoggingOut.current) {
      console.log('⏳ Logout já em andamento, ignorando chamada duplicada');
      return;
    }

    console.log('🚪 Iniciando logout...');
    isLoggingOut.current = true; // ✅ Seta flag ANTES de qualquer operação
    
    try {
      // ✅ NÃO setar loading aqui - deixar o onAuthStateChange lidar se necessário
      // setLoading(true); 
      
      // ✅ Limpar estados locais PRIMEIRO
      setUser(null);
      setSession(null);
      setProfile(null);
      lastProcessedSessionId.current = null; // ✅ Resetar ref
      
      // ✅ CRÍTICO: Limpar TODOS os caches usando função centralizada
      console.log('🗑️ Limpando todos os caches...');
      clearAllCaches();
      
      // Por último, fazer logout no Supabase (vai disparar onAuthStateChange)
      await supabase.auth.signOut({ scope: 'global' });
      
      console.log('✅ Logout realizado com limpeza completa');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      // Garantir que estados são limpos mesmo com erro
      setUser(null);
      setSession(null);
      setProfile(null);
    } finally {
      // ✅ Garantir loading false e resetar flag imediatamente
      setLoading(false);
      isLoggingOut.current = false;
    }
  }, []);

  // ✅ FORCE REAUTH
  const forceReauth = useCallback(() => {
    console.log('🔄 Forçando nova autenticação...');
    clearAllCaches();
    setUser(null);
    setSession(null);
    setProfile(null);
    lastProcessedSessionId.current = null; // ✅ Resetar ref
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

  // ✅ PROTEÇÃO: Garantir que loading = false quando user = null (após inicialização)
  useEffect(() => {
    if (isInitialized.current && !user && loading) {
      console.log('⚠️ Detectado estado inconsistente: user=null mas loading=true. Corrigindo...');
      setLoading(false);
    }
  }, [user, loading]);

  // ✅ PERSISTÊNCIA: Salvar dados críticos sempre que user mudar
  useEffect(() => {
    if (user && user.profile) {
      persistUserData(user);
    }
  }, [user]);

  useEffect(() => {
    console.log('🚀 AuthContext useEffect executando - Provider (re)montado');
    
    // Carregar redirectTo do localStorage PRIMEIRO
    const savedRedirectTo = localStorage.getItem('auth_redirect_to');
    console.log('🔍 Verificando redirectTo salvo no localStorage:', savedRedirectTo);
    if (savedRedirectTo) {
      console.log('✅ Carregando redirectTo do localStorage:', savedRedirectTo);
      setRedirectToState(savedRedirectTo);
    } else {
      console.log('ℹ️ Nenhum redirectTo encontrado no localStorage');
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
          
          // ✅ CRÍTICO: Atualizar ref para prevenir reprocessamento
          if (initialAppUser?.id) {
            lastProcessedSessionId.current = initialAppUser.id;
            console.log('🔒 Sessão inicial marcada como processada:', initialAppUser.id);
          }
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
          hasSession: !!newSession,
          isLoggingOut: isLoggingOut.current,
          currentLoading: loading
        });
        
        // ✅ PROTEÇÃO: Ignorar eventos durante logout
        if (isLoggingOut.current) {
          console.log('⏭️ Ignorando onAuthStateChange - logout em andamento');
          return;
        }
        
        // Se não inicializou ainda, ignora (fetchInitialSession vai lidar)
        if (!isInitialized.current) {
          console.log('⏭️ Ignorando onAuthStateChange - ainda não inicializado');
          return;
        }
        
        // ✅ PROTEÇÃO CRÍTICA: Se já processamos este userId, não processar novamente
        // Evita queries duplicadas e loading desnecessário quando SIGNED_IN dispara após INITIAL_SESSION
        const newUserId = newSession?.user?.id;
        if (newUserId && newUserId === lastProcessedSessionId.current) {
          // Mesma sessão já processada - não precisa processar novamente
          if (_event !== 'SIGNED_OUT') {
            console.log(`⏭️ Ignorando ${_event} - sessão já processada (ID: ${newUserId})`);
            return;
          }
        }
        
        // ✅ OTIMIZAÇÃO CRÍTICA: Apenas mostrar loading em eventos críticos (login/logout)
        // TOKEN_REFRESHED, USER_UPDATED não devem bloquear a UI
        const criticalEvents = ['SIGNED_IN', 'SIGNED_OUT'];
        const shouldShowLoading = criticalEvents.includes(_event);
        
        try {
          if (shouldShowLoading) {
            console.log('⏳ Evento crítico detectado, setando loading...');
            setLoading(true);
          } else {
            console.log('🔄 Evento não-crítico, processando silenciosamente...');
          }
          
          console.log('1️⃣ Atualizando session...');
          setSession(newSession);
          
          console.log('2️⃣ Buscando perfil do usuário...');
          let appUser: AppUser | null = null;
          if (newSession?.user) {
            appUser = await getProfileAndClinicId(newSession.user);
            console.log('3️⃣ Perfil recuperado:', appUser ? 'SIM' : 'NÃO');
            
            // ✅ CRÍTICO: Atualizar ref IMEDIATAMENTE após processar
            // Isso previne eventos duplicados (como SIGNED_IN após INITIAL_SESSION)
            if (appUser?.id) {
              lastProcessedSessionId.current = appUser.id;
              console.log('🔒 Sessão marcada como processada:', appUser.id);
            }
          }
          
          console.log('4️⃣ Verificando proteção TOKEN_REFRESHED...');
          // ✅ PROTEÇÃO: Se já temos user E o novo appUser tem os mesmos dados,
          // não sobrescrever para evitar perder estado em TOKEN_REFRESHED
          if (_event === 'TOKEN_REFRESHED' && user && appUser) {
            // Se é o mesmo usuário, manter dados existentes (mais completos)
            if (user.id === appUser.id) {
              console.log('🔄 TOKEN_REFRESHED: Mantendo dados existentes do usuário');
              // ✅ IMPORTANTE: NÃO usar return aqui, pois pula o finally
              // Apenas não sobrescrever user/profile
            } else {
              console.log('5️⃣ Atualizando user/profile (diferente)...');
              setUser(appUser);
              setProfile(appUser?.profile || null);
            }
          } else {
            // Para todos os outros eventos (SIGNED_IN, SIGNED_OUT, etc)
            console.log('5️⃣ Atualizando user/profile (evento ' + _event + ')...');
            setUser(appUser);
            setProfile(appUser?.profile || null);
          }
          
          console.log('6️⃣ Finalizando processamento...');
          console.log('✅ AuthContext: Estado atualizado por onAuthStateChange', {
            hasUser: !!appUser,
            clinicId: appUser?.clinicId,
            event: _event
          });
          console.log('7️⃣ Try block completo, indo para finally...');
        } catch (error) {
          console.error('❌ Erro em onAuthStateChange:', error);
          // ✅ PROTEÇÃO: Manter sessão/user atuais em caso de erro
          console.log('⚠️ Mantendo estado anterior devido a erro');
        } finally {
          // ✅ CRÍTICO: Resetar loading apenas se foi setado
          if (shouldShowLoading) {
            console.log('✅ Resetando loading para false');
            setLoading(false);
          }
        }
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