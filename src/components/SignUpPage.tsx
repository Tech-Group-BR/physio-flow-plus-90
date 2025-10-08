import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus, ArrowLeft, Building2, Mail, Lock, User, Phone, MapPin, Briefcase } from 'lucide-react';
import { normalizePhone, isValidPhone } from '@/utils/formatters';

export function SignUpPage() {
  const { signUp, user, loading: authLoading, redirectTo, clearRedirectTo } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(() => {
    return localStorage.getItem('signup_success') === 'true';
  });
  const [clinicData, setClinicData] = useState<any>(() => {
    const saved = localStorage.getItem('signup_success_data');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Flag para forçar renderização da tela de sucesso
  const [forceSuccessScreen, setForceSuccessScreen] = useState(false);

  // Log de re-renders para debug
  console.log('🔄 SignUpPage render:', { 
    signupSuccess, 
    hasClinicData: !!clinicData, 
    authLoading, 
    loading,
    hasUser: !!user,
    forceSuccessScreen,
    localStorageSuccess: localStorage.getItem('signup_success'),
    localStorageData: !!localStorage.getItem('signup_success_data')
  });

  // Redirect if already logged in (mas não durante o processo de signup)
  useEffect(() => {
    if (user && !authLoading && !signupSuccess && !loading) {
      console.log('✅ Usuário já logado, redirecionando...', {
        email: user.email,
        redirectTo,
        signupSuccess,
        loading
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
  }, [user, authLoading, navigate, redirectTo, clearRedirectTo, signupSuccess, loading]);

  // Monitor mudanças em clinicData para debug
  useEffect(() => {
    if (clinicData) {
      console.log('🔄 clinicData atualizado:', clinicData);
      console.log('🔄 clinic_code disponível:', clinicData?.clinic?.clinic_code);
    }
  }, [clinicData]);

  // Verificar localStorage a cada render para sincronizar estados
  useEffect(() => {
    const localSuccess = localStorage.getItem('signup_success') === 'true';
    const localData = localStorage.getItem('signup_success_data');
    
    if (localSuccess && localData && (!signupSuccess || !clinicData)) {
      console.log('🔄 Sincronizando estados com localStorage');
      setSignupSuccess(true);
      setClinicData(JSON.parse(localData));
    }
  }, [signupSuccess, clinicData]);

  // Verificação inicial na montagem do componente
  useEffect(() => {
    const localSuccess = localStorage.getItem('signup_success') === 'true';
    const localData = localStorage.getItem('signup_success_data');
    
    if (localSuccess && localData) {
      console.log('🚀 Carregamento inicial: dados encontrados no localStorage');
      setSignupSuccess(true);
      setClinicData(JSON.parse(localData));
    }
  }, []); // Executa apenas uma vez na montagem

  const [signUpForm, setSignUpForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: '',
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
    clinicCode: '' // Adicionar campo para código da clínica
  });

  // Estado para controlar se é um cadastro via convite
  const [isInvitedSignup, setIsInvitedSignup] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);

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
        setSignUpForm(prev => ({
          ...prev,
          email: inviteData.email || '',
          clinicCode: inviteData.clinicCode || '',
          role: inviteData.role || '',
        }));

        // Mostrar toast informativo
        toast.success(
          `Bem-vindo! Você foi convidado para ${inviteData.clinicName}`,
          { duration: 5000 }
        );
      } catch (error) {
        console.error('Erro ao processar convite:', error);
      }
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast.error('Por favor, aceite os termos e condições');
      return;
    }

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (signUpForm.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Normalize and validate phone numbers
    const normalizedPhone = normalizePhone(signUpForm.phone);
    const normalizedClinicPhone = normalizePhone(signUpForm.clinicPhone);

    if (signUpForm.phone && !isValidPhone(normalizedPhone)) {
      toast.error('Telefone pessoal inválido. Use o formato: (66) 99999-9999');
      setLoading(false);
      return;
    }

    if (signUpForm.clinicPhone && !isValidPhone(normalizedClinicPhone)) {
      toast.error('Telefone da clínica inválido. Use o formato: (66) 99999-9999');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📝 Tentando fazer cadastro...', { 
        email: signUpForm.email, 
        fullName: signUpForm.fullName 
      });

      const { error, data } = await signUp(
        signUpForm.email, 
        signUpForm.password, 
        {
          fullName: signUpForm.fullName,
          phone: normalizedPhone,
          role: signUpForm.role || 'admin',
          clinicName: signUpForm.clinicName,
          clinicAddress: signUpForm.clinicAddress,
          clinicPhone: normalizedClinicPhone
        }
      );

      if (error) {
        throw error;
      }
      
      // Debug: Verificar estrutura dos dados retornados
      console.log('🔍 Dados completos retornados pelo signUp:', data);
      console.log('🔍 Estrutura da clínica:', data?.clinic);
      console.log('🔍 Código da clínica recebido:', data?.clinic?.clinic_code);
      
      // Armazenar dados da clínica e mostrar tela de sucesso
      console.log('📝 ANTES - Estados:', { signupSuccess, clinicData: !!clinicData });
      console.log('📝 Definindo clinicData:', data);
      
      // Persistir no localStorage para sobreviver a re-renders
      localStorage.setItem('signup_success_data', JSON.stringify(data));
      localStorage.setItem('signup_success', 'true');
      
      console.log('📝 DEPOIS - localStorage definido');
      console.log('✅ Clínica criada com sucesso, código:', data?.clinic?.clinic_code);
      
      // Estratégia: redirecionar imediatamente evitando re-renders do AuthContext
      setClinicData(data);
      setSignupSuccess(true);
      setForceSuccessScreen(true);
      
      // Forçar reload da página para garantir que os dados sejam carregados
      setTimeout(() => {
        console.log('🔄 Recarregando página para exibir dados...');
        window.location.reload();
      }, 100);
    } catch (error: any) {
      console.error('❌ Erro no cadastro:', error);
      const errorMessage = error?.message || 'Erro ao criar conta';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Debug: Verificar estados antes da renderização
  console.log('🔍 Estados atuais:', {
    signupSuccess,
    clinicData: !!clinicData,
    authLoading,
    loading
  });

  // Tela de sucesso após cadastro
  if ((signupSuccess && clinicData) || forceSuccessScreen) {
    // Se forceSuccessScreen está ativo mas clinicData não existe, tentar recuperar do localStorage
    const currentClinicData = clinicData || (() => {
      const saved = localStorage.getItem('signup_success_data');
      return saved ? JSON.parse(saved) : null;
    })();
    console.log('🎯 Renderizando tela de sucesso - currentClinicData:', currentClinicData);
    console.log('🎯 Código na renderização:', currentClinicData?.clinic?.clinic_code);
    console.log('🎯 ForceSuccessScreen ativo:', forceSuccessScreen);
    
    // Garantir que o clinic_code seja extraído corretamente
    const clinicCode = currentClinicData?.clinic?.clinic_code;
    const displayCode = clinicCode || 'Erro: Código não encontrado';
    
    console.log('🎯 Código extraído para exibição:', clinicCode);
    console.log('🎯 Display code final:', displayCode);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
        <Card className="w-full max-w-lg bg-white border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Clínica Criada com Sucesso! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Código da Clínica
                </h3>
                <div className="text-3xl font-bold text-green-600 tracking-wider">
                  {displayCode}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Guarde este código para adicionar outros usuários à sua clínica
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">
                  {currentClinicData?.clinic?.name}
                </h4>
                <p className="text-sm text-gray-600">
                  Administrador: {currentClinicData?.user?.full_name}
                </p>
                <p className="text-sm text-gray-600">
                  Email: {currentClinicData?.user?.email}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Importante:</strong> Anote o código da clínica em local seguro. 
                  Você precisará dele para adicionar profissionais e recepcionistas.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => {
                  // Limpar dados de sucesso do localStorage
                  localStorage.removeItem('signup_success');
                  localStorage.removeItem('signup_success_data');
                  setForceSuccessScreen(false);
                  
                  if (redirectTo) {
                    navigate(redirectTo, { replace: true });
                    clearRedirectTo();
                  } else {
                    navigate('/dashboard', { replace: true });
                  }
                }}
                className="w-full h-12 bg-green-600 hover:bg-green-700"
              >
                Acessar Plataforma
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  if (clinicCode) {
                    navigator.clipboard.writeText(clinicCode);
                    toast.success('Código copiado para área de transferência!');
                  } else {
                    toast.error('Código não disponível para copiar');
                  }
                }}
                className="w-full"
                disabled={!clinicCode}
              >
                Copiar Código da Clínica
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de sucesso alternativa se clinicData não estiver definido
  if (signupSuccess && !clinicData) {
    console.log('⚠️ signupSuccess é true mas clinicData está undefined');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4">
        <Card className="w-full max-w-lg bg-white border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-10 h-10 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Clínica Criada! ⚠️
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Dados em Carregamento
                </h3>
                <p className="text-sm text-gray-600">
                  A clínica foi criada com sucesso, mas os dados estão sendo processados.
                  Verifique o console para mais detalhes.
                </p>
              </div>
              <Button 
                onClick={() => {
                  // Limpar dados de sucesso do localStorage
                  localStorage.removeItem('signup_success');
                  localStorage.removeItem('signup_success_data');
                  setForceSuccessScreen(false);
                  navigate('/dashboard', { replace: true });
                }}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              >
                Ir para Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 py-12 relative">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>
      
      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8 relative pt-4">
          <Button
            variant="ghost"
            onClick={handleBackToLanding}
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
          <p className="text-gray-600 text-lg">Crie sua conta gratuitamente</p>
        </div>

        {/* SignUp Card */}
        <Card className="bg-white border-0 shadow-xl shadow-blue-500/10 hover:shadow-2xl transition-shadow duration-300">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center">
              <UserPlus className="w-6 h-6 mr-2 text-blue-600" />
              Criar Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Informações Pessoais
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                      Nome Completo
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      value={signUpForm.fullName}
                      onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value })}
                      required
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center">
                      <Phone className="w-4 h-4 mr-1 text-blue-600" />
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={signUpForm.phone}
                      onChange={(e) => setSignUpForm({ ...signUpForm, phone: e.target.value })}
                      required
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                      <Mail className="w-4 h-4 mr-1 text-blue-600" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                      required
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700 flex items-center">
                      <Briefcase className="w-4 h-4 mr-1 text-blue-600" />
                      Função
                    </Label>
                    <Select value={signUpForm.role} onValueChange={(value) => setSignUpForm({ ...signUpForm, role: value })}>
                      <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="Selecione sua função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="fisioterapeuta">Fisioterapeuta</SelectItem>
                        <SelectItem value="recepcionista">Recepcionista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Clinic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                  Informações da Clínica
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinicName" className="text-sm font-medium text-gray-700">
                      Nome da Clínica
                    </Label>
                    <Input
                      id="clinicName"
                      type="text"
                      placeholder="Clínica GoPhysioTech"
                      value={signUpForm.clinicName}
                      onChange={(e) => setSignUpForm({ ...signUpForm, clinicName: e.target.value })}
                      required
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinicPhone" className="text-sm font-medium text-gray-700">
                      Telefone da Clínica
                    </Label>
                    <Input
                      id="clinicPhone"
                      type="tel"
                      placeholder="(11) 3333-3333"
                      value={signUpForm.clinicPhone}
                      onChange={(e) => setSignUpForm({ ...signUpForm, clinicPhone: e.target.value })}
                      required
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicAddress" className="text-sm font-medium text-gray-700 flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-blue-600" />
                    Endereço da Clínica
                  </Label>
                  <Input
                    id="clinicAddress"
                    type="text"
                    placeholder="Rua das Flores, 123 - São Paulo, SP"
                    value={signUpForm.clinicAddress}
                    onChange={(e) => setSignUpForm({ ...signUpForm, clinicAddress: e.target.value })}
                    required
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-blue-600" />
                  Senha de Acesso
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={signUpForm.password}
                        onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                        required
                        className="h-12 pr-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirmar Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repita sua senha"
                        value={signUpForm.confirmPassword}
                        onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                        required
                        className="h-12 pr-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox 
                  id="terms" 
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
                  Eu aceito os{' '}
                  <Link to="#" className="text-blue-600 hover:text-blue-700 hover:underline">
                    Termos de Uso
                  </Link>
                  {' '}e a{' '}
                  <Link to="#" className="text-blue-600 hover:text-blue-700 hover:underline">
                    Política de Privacidade
                  </Link>
                </Label>
              </div>

              {/* SignUp Button */}
              <Button
                type="submit"
                disabled={loading || !acceptedTerms}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-lg hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Criando conta...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Criar Conta Gratuitamente
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600">
              Já tem uma conta?{' '}
              <Link 
                to="/login" 
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
              >
                Faça login
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              Quer se cadastrar em uma clínica existente?{' '}
              <Link 
                to="/register" 
                className="text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors"
              >
                Cadastrar na clínica
              </Link>
            </p>
          </div>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
            <Link to="#" className="hover:text-gray-700 transition-colors">Termos de Uso</Link>
            <span>•</span>
            <Link to="#" className="hover:text-gray-700 transition-colors">Privacidade</Link>
            <span>•</span>
            <Link to="#" className="hover:text-gray-700 transition-colors">Suporte</Link>
          </div>
        </div>
      </div>
    </div>
  );
}