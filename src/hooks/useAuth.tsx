import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  clinicId: string | null;
  clinicCode: string | null;
  signIn: (email: string, password: string, clinicCode: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  forceReauth: () => void;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicCode, setClinicCode] = useState<string | null>(null);

  // Função para buscar dados da clínica pelo código
  const fetchClinicDataByCode = async (code: string) => {
    try {
      console.log('🏥 Buscando dados da clínica pelo código:', code);
      
      // CORRIGIDO: usar 'name' em vez de 'clinic_name'
      const { data: clinicData, error } = await supabase
        .from('clinic_settings')
        .select('id, name, clinic_code')
        .eq('clinic_code', code)
        .single();
      
      if (error || !clinicData) {
        console.error('❌ Erro ao buscar clínica pelo código:', error);
        return null;
      }
      
      console.log('✅ Clínica encontrada:', clinicData);
      return clinicData;
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar clínica:', error);
      return null;
    }
  };

  // Função para carregar dados da clínica do usuário
  const loadUserClinicData = async (userId: string) => {
    try {
      console.log('👤 Carregando dados da clínica para usuário:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('clinic_id, clinic_code')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        // NÃO forçar reauth aqui - pode ser usuário novo
        setClinicCode(null);
        setClinicId(null);
        return;
      }
      
      if (!profile?.clinic_code) {
        console.warn('⚠️ Usuário sem clinic_code definido');
        setClinicCode(null);
        setClinicId(null);
        return;
      }
      
      console.log('📋 Dados do perfil:', profile);
      setClinicCode(profile.clinic_code);
      
      // Se já tem clinic_id salvo, usar
      if (profile.clinic_id) {
        console.log('✅ Usando clinic_id do perfil:', profile.clinic_id);
        setClinicId(profile.clinic_id);
      } else {
        // Senão, buscar pelo código e atualizar o perfil
        console.log('🔍 Buscando clinic_id pelo código...');
        const clinicData = await fetchClinicDataByCode(profile.clinic_code);
        
        if (clinicData) {
          setClinicId(clinicData.id);
          
          // Atualizar o perfil com o clinic_id encontrado
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              clinic_id: clinicData.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
          
          if (updateError) {
            console.warn('⚠️ Erro ao atualizar clinic_id no perfil:', updateError);
          } else {
            console.log('✅ Clinic_id atualizado no perfil');
          }
        } else {
          console.warn('⚠️ Clínica não encontrada pelo código');
          setClinicId(null);
        }
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar dados da clínica:', error);
      setClinicCode(null);
      setClinicId(null);
    }
  };

  // Função para forçar nova autenticação
  const forceReauth = () => {
    console.log('🔄 Forçando nova autenticação...');
    cleanupAuthState();
    setUser(null);
    setSession(null);
    setClinicId(null);
    setClinicCode(null);
    setLoading(false); // IMPORTANTE: parar o loading
    toast.warning('Sessão expirada. Faça login novamente.');
  };

  // Monitorar mudanças de autenticação
  useEffect(() => {
    console.log('🔄 Inicializando monitoramento de autenticação...');
    
    let mounted = true;

    // Verificar sessão inicial
    const checkInitialSession = async () => {
      try {
        console.log('🔍 Verificando sessão inicial...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao verificar sessão inicial:', error);
          if (mounted) {
            setUser(null);
            setSession(null);
            setClinicId(null);
            setClinicCode(null);
            setLoading(false);
          }
          return;
        }
        
        if (session?.user && mounted) {
          console.log('📱 Sessão inicial encontrada:', session.user.email);
          setSession(session);
          setUser(session.user);
          
          // Carregar dados da clínica em background
          loadUserClinicData(session.user.id).catch(err => {
            console.warn('⚠️ Erro ao carregar dados da clínica:', err);
          });
        } else {
          console.log('📱 Nenhuma sessão inicial');
          if (mounted) {
            setUser(null);
            setSession(null);
            setClinicId(null);
            setClinicCode(null);
          }
        }
      } catch (error) {
        console.error('❌ Erro inesperado na verificação inicial:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setClinicId(null);
          setClinicCode(null);
        }
      } finally {
        // SEMPRE finalizar loading
        if (mounted) {
          console.log('✅ Loading inicial finalizado');
          setLoading(false);
        }
      }
    };

    checkInitialSession();

    // Listener de mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state change:', event, session?.user?.email || 'no user');
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ Usuário logado');
          setSession(session);
          setUser(session.user);
          
          // Carregar dados da clínica em background
          loadUserClinicData(session.user.id).catch(err => {
            console.warn('⚠️ Erro ao carregar dados da clínica:', err);
          });
          
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Usuário deslogado');
          setUser(null);
          setSession(null);
          setClinicId(null);
          setClinicCode(null);
          
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token renovado');
          setSession(session);
          setUser(session.user);
          
        } else if (event === 'USER_UPDATED' && session?.user) {
          console.log('👤 Usuário atualizado');
          setSession(session);
          setUser(session.user);
        } else {
          // Outros eventos
          setUser(session?.user || null);
          setSession(session || null);
          if (!session) {
            setClinicId(null);
            setClinicCode(null);
          }
        }
        
        // SEMPRE finalizar loading nos eventos de auth
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Array vazio para executar apenas uma vez

  const signIn = async (email: string, password: string, clinicCode: string) => {
    console.log('🔐 Iniciando login para:', email, 'com código:', clinicCode);
    
    try {
      setLoading(true);
      
      // 1. Verificar se o código da clínica é válido ANTES do login
      const clinicData = await fetchClinicDataByCode(clinicCode);
      if (!clinicData) {
        setLoading(false);
        return { error: { message: 'Código da clínica inválido ou clínica não encontrada' } };
      }
      
      // 2. Fazer login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error('❌ Erro no login:', error);
        setLoading(false);
        return { error };
      }
      
      if (!data.user) {
        setLoading(false);
        return { error: { message: 'Falha na autenticação' } };
      }
      
      // 3. Verificar se o usuário pertence à clínica informada
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('clinic_code')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Erro ao verificar perfil do usuário:', profileError);
        setLoading(false);
        return { error: { message: 'Usuário não encontrado no sistema' } };
      }
      
      if (profile.clinic_code !== clinicCode) {
        console.error('❌ Usuário não pertence à clínica informada');
        // Fazer logout para limpar a sessão
        await supabase.auth.signOut();
        setLoading(false);
        return { error: { message: 'Usuário não autorizado para esta clínica' } };
      }
      
      console.log('✅ Login realizado com sucesso - usuário autorizado para a clínica');
      
      // Os estados serão atualizados pelo listener onAuthStateChange
      // setLoading(false) será chamado lá
      return { error: null };
      
    } catch (error: any) {
      console.error('❌ Erro inesperado no login:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('📝 Iniciando cadastro para:', email);
    console.log('📋 Dados recebidos:', userData);
    
    try {
      setLoading(true);
      
      const { clinic_code } = userData;
      
      if (!clinic_code) {
        setLoading(false);
        return { error: { message: 'Código da clínica é obrigatório' } };
      }
      
      if (!userData.full_name?.trim()) {
        setLoading(false);
        return { error: { message: 'Nome completo é obrigatório' } };
      }
      
      // 1. Verificar se o código da clínica é válido
      console.log('🔍 Verificando código da clínica:', clinic_code);
      const clinicData = await fetchClinicDataByCode(clinic_code);
      if (!clinicData) {
        setLoading(false);
        return { error: { message: 'Código da clínica inválido' } };
      }
      
      console.log('✅ Clínica validada:', clinicData);
      
      // 2. Criar usuário no Auth COM metadados para o trigger funcionar
      console.log('🔐 Criando usuário no auth com metadados para trigger...');
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: userData.full_name?.trim() || '',
            role: userData.role || 'guardian',
            phone: userData.phone?.trim() || '',
            clinic_code: clinic_code,
            clinic_id: clinicData.id,
            is_active: true
          }
        }
      });
      
      if (error) {
        console.error('❌ Erro no signup:', error);
        setLoading(false);
        return { error };
      }
      
      const userId = data.user?.id;
      if (!userId) {
        console.warn('⚠️ Usuário não foi criado no auth');
        setLoading(false);
        return { error: { message: 'Falha ao criar usuário' } };
      }
      
      console.log('✅ Usuário criado no auth:', userId);
      console.log('📧 Email do usuário:', data.user?.email);
      
      // 3. Aguardar um pouco para o trigger processar
      console.log('⏳ Aguardando trigger processar criação do perfil...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 4. Verificar se o perfil foi criado pelo trigger
      console.log('🔍 Verificando se perfil foi criado pelo trigger...');
      const { data: profile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (checkError) {
        console.error('❌ Perfil não foi criado pelo trigger:', checkError);
        
        // Criar perfil manualmente se o trigger falhou
        console.log('📝 Trigger falhou, criando perfil manualmente...');
        
        const profileData = {
          id: userId,
          full_name: userData.full_name?.trim() || '',
          email: email.trim(),
          phone: userData.phone?.trim() || '',
          role: userData.role || 'guardian',
          is_active: true,
          clinic_code: clinic_code,
          clinic_id: clinicData.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('📋 Dados do perfil manual:', profileData);
        
        const { data: insertedProfile, error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();
        
        if (profileError) {
          console.error('❌ Erro ao criar perfil manualmente:', profileError);
          
          // Limpar usuário criado
          try {
            console.log('🧹 Limpando usuário devido a erro no perfil...');
            await supabase.auth.signOut();
          } catch (cleanupError) {
            console.warn('⚠️ Erro na limpeza:', cleanupError);
          }
          
          setLoading(false);
          
          // Mensagens de erro específicas
          if (profileError.code === '23502') {
            const column = profileError.message?.match(/column "([^"]+)"/)?.[1] || 'desconhecida';
            return { 
              error: { 
                message: `Campo obrigatório "${column}" não foi preenchido.`
              } 
            };
          }
          
          if (profileError.code === '23505') {
            return { 
              error: { 
                message: 'Este usuário já existe. Tente fazer login.'
              } 
            };
          }
          
          return { 
            error: { 
              message: `Erro ao criar perfil: ${profileError.message || 'Erro desconhecido'}`
            } 
          };
        }
        
        console.log('✅ Perfil criado manualmente:', insertedProfile);
        
      } else {
        console.log('✅ Perfil criado pelo trigger com sucesso:', profile);
        
        // Verificar se o trigger preencheu todos os campos necessários
        if (!profile.clinic_code || !profile.clinic_id) {
          console.log('🔧 Completando dados do perfil criado pelo trigger...');
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              clinic_code: clinic_code,
              clinic_id: clinicData.id,
              phone: userData.phone?.trim() || profile.phone || '',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
          
          if (updateError) {
            console.warn('⚠️ Erro ao completar perfil:', updateError);
          } else {
            console.log('✅ Perfil completado com dados da clínica');
          }
        } else {
          console.log('✅ Perfil do trigger está completo');
        }
      }
      
      console.log('✅ Cadastro realizado com sucesso');
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
      await forceSignOutSupabase();
      
      // Estados serão limpos pelo listener
      console.log('✅ Logout realizado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      // Forçar limpeza mesmo com erro
      setUser(null);
      setSession(null);
      setClinicId(null);
      setClinicCode(null);
    } finally {
      setLoading(false);
    }
  };

  // Debug em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 Auth Debug:', {
        user: user?.email || null,
        clinicCode,
        clinicId,
        loading
      });
    }
  }, [user, clinicCode, clinicId, loading]);

  const value = {
    user,
    session,
    loading,
    clinicId,
    clinicCode,
    signIn,
    signUp,
    signOut,
    forceReauth
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