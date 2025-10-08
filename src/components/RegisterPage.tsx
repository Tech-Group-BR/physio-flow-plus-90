import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus, ArrowLeft, Building2, Mail, Lock, Hash, User, Phone, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { normalizePhone, isValidPhone } from '@/utils/formatters';

export function RegisterPage() {
  const { register, user, loading: authLoading, redirectTo, clearRedirectTo } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      console.log('✅ Usuário já logado, redirecionando...', {
        email: user.email,
        redirectTo
      });
      
      // Prioridade: redirectTo > Dashboard padrão
      if (redirectTo) {
        console.log('🎯 Redirecionando para destino armazenado:', redirectTo);
        navigate(redirectTo, { replace: true });
        clearRedirectTo();
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate, redirectTo, clearRedirectTo]);

  // Estado para controlar se é um cadastro via convite
  const [isInvitedSignup, setIsInvitedSignup] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);

  const [registerForm, setregisterForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: 'professional',
    crefito: '',
    clinicCode: ''
  });

  // Carregar dados do convite pendente, se houver
  useEffect(() => {
    const pendingInvite = localStorage.getItem('pendingInvitation');
    
    if (pendingInvite) {
      try {
        const inviteData = JSON.parse(pendingInvite);
        console.log('📧 Convite pendente detectado:', inviteData);
        
        setIsInvitedSignup(true);
        setInvitationData(inviteData);
        
        // Preencher automaticamente os campos do formulário
        setregisterForm(prev => ({
          ...prev,
          email: inviteData.email || '',
          clinicCode: inviteData.clinicCode || '',
          role: inviteData.role || 'professional',
        }));

        // Mostrar toast informativo
        toast.success(
          `Bem-vindo! Complete seu cadastro na ${inviteData.clinicName}`,
          { duration: 5000 }
        );
      } catch (error) {
        console.error('Erro ao processar convite:', error);
      }
    } else {
      // SEM CONVITE: Bloquear acesso à página
      console.warn('⚠️ Tentativa de acesso sem convite válido');
      toast.error('Você precisa de um convite válido para se cadastrar. Entre em contato com o administrador da clínica.');
      
      // Redirecionar para página de login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [navigate]);

  const handleregister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ===== VALIDAÇÃO OBRIGATÓRIA: APENAS COM CONVITE =====
    if (!isInvitedSignup || !invitationData) {
      toast.error('Você precisa de um convite válido para se cadastrar');
      setLoading(false);
      navigate('/login');
      return;
    }

    console.log('📝 Tentando cadastrar:', registerForm.email);

    try {
      // ===== VALIDAÇÃO DE INTEGRIDADE DO CONVITE =====
      // Verificar se email, clinicCode e role não foram alterados
      if (registerForm.email !== invitationData.email) {
        toast.error('O email não pode ser diferente do convite recebido');
        setLoading(false);
        return;
      }

      if (registerForm.clinicCode !== invitationData.clinicCode) {
        toast.error('O código da clínica não pode ser alterado');
        setLoading(false);
        return;
      }

      if (registerForm.role !== invitationData.role) {
        toast.error('O cargo não pode ser diferente do definido no convite');
        setLoading(false);
        return;
      }

      // Validação básica
      if (!registerForm.email || !registerForm.password || !registerForm.confirmPassword || 
          !registerForm.fullName || !registerForm.clinicCode) {
        toast.error('Preencha todos os campos obrigatórios');
        setLoading(false);
        return;
      }

      // Validar senhas
      if (registerForm.password !== registerForm.confirmPassword) {
        toast.error('As senhas não conferem');
        setLoading(false);
        return;
      }

      // Validar formato do código da clínica
      if (!/^\d{6}$/.test(registerForm.clinicCode)) {
        toast.error('O código da clínica deve ter exatamente 6 dígitos');
        setLoading(false);
        return;
      }

      // Validar CREFITO para profissionais
      if (registerForm.role === 'professional' && !registerForm.crefito?.trim()) {
        toast.error('CREFITO é obrigatório para profissionais');
        setLoading(false);
        return;
      }

      // ===== VALIDAÇÃO DO CONVITE =====
      if (isInvitedSignup && invitationData) {
        console.log('🎫 Validando convite antes do registro...');
        
        // Verificar se o convite ainda é válido
        const { data: invite, error: inviteError } = await supabase
          .from('user_invitations' as any)
          .select('*')
          .eq('token', invitationData.token)
          .eq('email', registerForm.email)
          .eq('status', 'pending')
          .single();

        if (inviteError || !invite) {
          console.error('❌ Convite inválido:', inviteError);
          toast.error('Este convite não é mais válido. Solicite um novo convite.');
          setLoading(false);
          
          // Limpar dados do convite
          localStorage.removeItem('pendingInvitation');
          setIsInvitedSignup(false);
          setInvitationData(null);
          return;
        }

        // Verificar se o convite expirou
        if ((invite as any).expires_at && new Date((invite as any).expires_at) < new Date()) {
          console.error('❌ Convite expirado');
          toast.error('Este convite expirou. Solicite um novo convite.');
          setLoading(false);
          
          // Limpar dados do convite
          localStorage.removeItem('pendingInvitation');
          setIsInvitedSignup(false);
          setInvitationData(null);
          return;
        }

        console.log('✅ Convite válido, prosseguindo com registro');
      }

      // Normalizar telefone antes de salvar
      const normalizedPhone = registerForm.phone ? normalizePhone(registerForm.phone) : '';

      // Validar telefone se preenchido
      if (normalizedPhone && !isValidPhone(normalizedPhone)) {
        toast.error('Telefone inválido. Por favor, verifique o número digitado.');
        setLoading(false);
        return;
      }

      // Preparar metadata
      const userData = {
        full_name: registerForm.fullName.trim(),
        phone: normalizedPhone, // Usar telefone normalizado
        role: registerForm.role,
        clinic_code: registerForm.clinicCode,
        crefito: registerForm.crefito?.trim() || ''
      };

      const { error } = await register(registerForm.email, registerForm.password, userData);

      // VERIFICAÇÃO EXPLÍCITA: só proceder se NÃO houver erro
      if (error) {
        // ERRO NO register: mantém na página de cadastro com dados preenchidos
        const errorMessage = typeof error === 'string' ? error : error.message || 'Erro desconhecido';
        setError(`${errorMessage}`);
        
        // Mensagens específicas para cadastro
        if (errorMessage.includes('User already registered')) {
          toast.error('Este email já está cadastrado. Tente fazer login.');
        } else if (errorMessage.includes('Código da clínica inválido')) {
          toast.error('Código da clínica inválido. Entre em contato com a clínica.');
        } else if (errorMessage.includes('Password')) {
          toast.error('A senha deve ter pelo menos 6 caracteres.');
        } else if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
          toast.error('Erro interno do sistema. Entre em contato com o suporte.');
        } else {
          toast.error(errorMessage);
        }
        
        console.log('❌ Cadastro falhou com erro:', errorMessage);
        console.log('❌ Mantendo dados preenchidos e permanecendo na página de cadastro');
        
        // IMPORTANTE: NÃO fazer nada além de mostrar o erro
        // Não limpar formulário, não mudar de página
        setLoading(false);
        return; // SAIR da função aqui para garantir que não continue
        
      }
      
      // Se chegou aqui, significa que error é null/undefined (sucesso)
      console.log('✅ Cadastro bem-sucedido - error é null/undefined');
      
      // ===== APLICAR PERMISSÕES DO CONVITE =====
      if (isInvitedSignup && invitationData) {
        console.log('🎫 Aplicando permissões do convite...');
        
        try {
          // Buscar o usuário recém-criado pelo email
          const { data: newProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', registerForm.email)
            .eq('clinic_code', registerForm.clinicCode)
            .single();

          if (profileError || !newProfile) {
            console.error('⚠️ Erro ao buscar perfil criado:', profileError);
            toast.warning('Cadastro realizado, mas houve um problema ao aplicar permissões. Entre em contato com o administrador.');
          } else {
            console.log('✅ Perfil encontrado:', newProfile.id);
            
            // Chamar função RPC para aplicar permissões e marcar convite como aceito
            const { error: rpcError } = await supabase.rpc('apply_invitation_permissions', {
              user_id: newProfile.id,
              invitation_id: invitationData.invitationId
            });

            if (rpcError) {
              console.error('⚠️ Erro ao aplicar permissões do convite:', rpcError);
              toast.warning('Cadastro realizado, mas houve um problema ao aplicar permissões. Entre em contato com o administrador.');
            } else {
              console.log('✅ Permissões do convite aplicadas com sucesso');
            }
          }
        } catch (err) {
          console.error('⚠️ Erro inesperado ao aplicar permissões:', err);
          toast.warning('Cadastro realizado, mas houve um problema ao aplicar permissões. Entre em contato com o administrador.');
        }

        // Limpar dados do convite do localStorage
        localStorage.removeItem('pendingInvitation');
      }
      
      // SUCESSO: apenas aqui limpa formulário e redireciona para login  
      setError('');
      toast.success('Cadastro realizado com sucesso! Faça login para acessar o sistema.');
      
      console.log('✅ Limpando formulário e redirecionando para login');
      
      // Limpar formulário APENAS quando der tudo certo
      setregisterForm({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        role: 'guardian',
        crefito: '',
        clinicCode: ''
      });
      
      // Redirecionar para login após sucesso
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err: any) {
      console.error('❌ Erro inesperado no register:', err);
      const errorMessage = err?.message || 'Erro inesperado. Tente novamente.';
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 relative">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 relative pt-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="absolute top-0 left-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 z-10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
          
          <div className="flex items-center justify-center space-x-3 mb-6 mt-8 sm:mt-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg p-1">
              <img src="/favicon.ico" alt="GoPhysioTech Logo" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              GoPhysioTech
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Cadastrar na clínica</p>
        </div>

        {/* Register Card */}
        <Card className="bg-white border-0 shadow-xl shadow-blue-500/10 hover:shadow-2xl transition-shadow duration-300">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center">
              <UserPlus className="w-6 h-6 mr-2 text-blue-600" />
              Criar Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleregister} className="space-y-6">
              {/* Clinic Code Field */}
              <div className="space-y-2">
                <Label htmlFor="register-clinic-code" className="text-sm font-medium text-gray-700 flex items-center">
                  <Hash className="w-4 h-4 mr-2 text-blue-600" />
                  Código da Clínica
                </Label>
                <Input
                  id="register-clinic-code"
                  type="text"
                  value={registerForm.clinicCode}
                  onChange={(e) => setregisterForm({ ...registerForm, clinicCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  required
                  disabled={loading || isInvitedSignup}
                  placeholder="000000"
                  maxLength={6}
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
                {isInvitedSignup ? (
                  <p className="text-xs text-blue-600 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Código definido pelo convite
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Entre em contato com a clínica para obter o código</p>
                )}
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="register-name" className="text-sm font-medium text-gray-700 flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-600" />
                  Nome Completo
                </Label>
                <Input
                  id="register-name"
                  type="text"
                  value={registerForm.fullName}
                  onChange={(e) => setregisterForm({ ...registerForm, fullName: e.target.value })}
                  required
                  disabled={loading}
                  placeholder="Seu nome completo"
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-sm font-medium text-gray-700 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                  E-mail
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setregisterForm({ ...registerForm, email: e.target.value })}
                  required
                  disabled={loading || isInvitedSignup}
                  placeholder="seu@email.com"
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
                {isInvitedSignup && (
                  <p className="text-xs text-blue-600 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Email definido pelo convite
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="register-phone" className="text-sm font-medium text-gray-700 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-blue-600" />
                  Telefone
                </Label>
                <Input
                  id="register-phone"
                  type="tel"
                  value={registerForm.phone}
                  onChange={(e) => setregisterForm({ ...registerForm, phone: e.target.value })}
                  disabled={loading}
                  placeholder="(11) 99999-9999"
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>

              {/* User Type Field */}
              <div className="space-y-2">
                <Label htmlFor="register-role" className="text-sm font-medium text-gray-700 flex items-center">
                  <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                  Tipo de Usuário
                </Label>
                <Select 
                  value={registerForm.role} 
                  onValueChange={(value: string) => setregisterForm({ ...registerForm, role: value })}
                  disabled={loading || isInvitedSignup}
                >
                  <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guardian">Responsável/Paciente</SelectItem>
                    <SelectItem value="professional">Fisioterapeuta</SelectItem>
                    <SelectItem value="receptionist">Recepcionista</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {registerForm.role === 'professional' && (
                <div className="space-y-2">
                  <Label htmlFor="register-crefito" className="text-sm font-medium text-gray-700 flex items-center">
                    <Hash className="w-4 h-4 mr-2 text-blue-600" />
                    CREFITO
                  </Label>
                  <Input
                    id="register-crefito"
                    type="text"
                    value={registerForm.crefito}
                    onChange={(e) => setregisterForm({ ...registerForm, crefito: e.target.value })}
                    disabled={loading}
                    placeholder="CREFITO-3/12345"
                    required={registerForm.role === 'professional'}
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500">Obrigatório para fisioterapeutas</p>
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-sm font-medium text-gray-700 flex items-center">
                  <Lock className="w-4 h-4 mr-2 text-blue-600" />
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={(e) => setregisterForm({ ...registerForm, password: e.target.value })}
                    required
                    disabled={loading}
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="h-12 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="register-confirm-password" className="text-sm font-medium text-gray-700 flex items-center">
                  <Lock className="w-4 h-4 mr-2 text-blue-600" />
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerForm.confirmPassword}
                    onChange={(e) => setregisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    required
                    disabled={loading}
                    minLength={6}
                    placeholder="Digite a senha novamente"
                    className="h-12 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando conta...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Criar Conta
                    </div>
                  )}
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Já tem conta?{' '}
                    <Link 
                      to="/login" 
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                    >
                      Entrar
                    </Link>
                  </p>
                </div>
              </form>

            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Quer criar uma nova clínica?{' '}
                <Link 
                  to="/signup" 
                  className="text-green-600 hover:text-green-700 font-medium hover:underline transition-colors"
                >
                  Começar grátis
                </Link>
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <Link to="#" className="hover:text-gray-700 transition-colors">Termos de Uso</Link>
              <span>•</span>
              <Link to="#" className="hover:text-gray-700 transition-colors">Política de Privacidade</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }