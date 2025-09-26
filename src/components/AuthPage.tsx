import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function AuthPage() {
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      console.log('✅ Usuário já logado, redirecionando...', user.email);
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    clinicCode: ''
  });

  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: 'guardian',
    crefito: '',
    clinicCode: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🚀 Tentando fazer login com:', loginForm.email);

    try {
      // Validação básica
      if (!loginForm.email || !loginForm.password || !loginForm.clinicCode) {
        toast.error('Preencha todos os campos obrigatórios');
        setLoading(false);
        return;
      }

      // Validar formato do código da clínica
      if (!/^\d{6}$/.test(loginForm.clinicCode)) {
        toast.error('O código da clínica deve ter exatamente 6 dígitos');
        setLoading(false);
        return;
      }

      const { error } = await signIn(loginForm.email, loginForm.password, loginForm.clinicCode);
      
      if (error) {
        console.error('❌ Erro no login:', error);
        const errorMessage = typeof error === 'string' ? error : error.message || 'Erro desconhecido';
        setError(`${errorMessage}`);
        
        // Mensagens de erro mais específicas
        if (errorMessage.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos. Verifique seus dados.');
        } else if (errorMessage.includes('Email not confirmed')) {
          toast.error('Email não confirmado. Verifique sua caixa de entrada.');
        } else if (errorMessage.includes('Código da clínica inválido')) {
          toast.error('Código da clínica inválido. Entre em contato com a clínica.');
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.success('Login realizado com sucesso!');
        console.log('✅ Login realizado, redirecionando...');
      }
    } catch (err: any) {
      console.error('❌ Erro inesperado:', err);
      setError('Erro inesperado no login');
      toast.error('Erro inesperado. Tente novamente.');
    }
    
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('📝 Tentando cadastrar:', signupForm.email);

    try {
      // Validação básica
      if (!signupForm.email || !signupForm.password || !signupForm.confirmPassword || 
          !signupForm.fullName || !signupForm.clinicCode) {
        toast.error('Preencha todos os campos obrigatórios');
        setLoading(false);
        return;
      }

      // Validar senhas
      if (signupForm.password !== signupForm.confirmPassword) {
        toast.error('As senhas não conferem');
        setLoading(false);
        return;
      }

      // Validar formato do código da clínica
      if (!/^\d{6}$/.test(signupForm.clinicCode)) {
        toast.error('O código da clínica deve ter exatamente 6 dígitos');
        setLoading(false);
        return;
      }

      // Validar CREFITO para profissionais
      if (signupForm.role === 'professional' && !signupForm.crefito?.trim()) {
        toast.error('CREFITO é obrigatório para profissionais');
        setLoading(false);
        return;
      }

      // Preparar metadata
      const userData = {
        full_name: signupForm.fullName.trim(),
        phone: signupForm.phone?.trim() || '',
        role: signupForm.role,
        clinic_code: signupForm.clinicCode,
        crefito: signupForm.crefito?.trim() || ''
      };

      const { error } = await signUp(signupForm.email, signupForm.password, userData);

      // VERIFICAÇÃO EXPLÍCITA: só proceder se NÃO houver erro
      if (error) {
        // ERRO NO SIGNUP: mantém na página de cadastro com dados preenchidos
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
      
      // SUCESSO: apenas aqui limpa formulário e muda para login  
      setError('');
      toast.success('Cadastro realizado com sucesso! Agora faça login para acessar o sistema.');
      
      console.log('✅ Limpando formulário e mudando para login');
      
      // Limpar formulário APENAS quando der tudo certo
      setSignupForm({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        role: 'guardian',
        crefito: '',
        clinicCode: ''
      });
      
      // Mudar para aba de login APENAS quando cadastro for 100% bem-sucedido
      setTimeout(() => {
        const loginTab = document.querySelector('[value="login"]') as HTMLButtonElement;
        if (loginTab) {
          loginTab.click();
          console.log('✅ Mudou para aba de login');
        } else {
          console.warn('⚠️ Não encontrou aba de login');
        }
      }, 800);
      
    } catch (err: any) {
      // ERRO INESPERADO: também mantém na página de cadastro
      console.error('❌ Erro inesperado no cadastro:', err);
      setError('Erro inesperado no cadastro');
      toast.error('Erro inesperado. Tente novamente.');
      
      console.log('❌ Erro inesperado, mantendo dados preenchidos e permanecendo na página de cadastro');
      // NÃO limpar formulário e NÃO mudar de página
      
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading se ainda está carregando auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            PhisioTech
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de gestão para clínicas de fisioterapia
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>

              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-clinic-code">Código da Clínica</Label>
                    <Input
                      id="login-clinic-code"
                      type="text"
                      value={loginForm.clinicCode}
                      onChange={(e) => setLoginForm({ ...loginForm, clinicCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      required
                      disabled={loading}
                      placeholder="000000"
                      maxLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">Código de 6 dígitos fornecido pela clínica</p>
                  </div>

                  <div>
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                      disabled={loading}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                      disabled={loading}
                      placeholder="Sua senha"
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-clinic-code">Código da Clínica</Label>
                    <Input
                      id="signup-clinic-code"
                      type="text"
                      value={signupForm.clinicCode}
                      onChange={(e) => setSignupForm({ ...signupForm, clinicCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      required
                      disabled={loading}
                      placeholder="000000"
                      maxLength={6}
                    />
                    <p className="text-xs text-gray-500">Entre em contato com a clínica para obter o código</p>
                  </div>

                  <div>
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupForm.fullName}
                      onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                      required
                      disabled={loading}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      required
                      disabled={loading}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-phone">Telefone</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                      disabled={loading}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-role">Tipo de Usuário</Label>
                    <Select 
                      value={signupForm.role} 
                      onValueChange={(value: string) => setSignupForm({ ...signupForm, role: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
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

                  {signupForm.role === 'professional' && (
                    <div>
                      <Label htmlFor="signup-crefito">CREFITO</Label>
                      <Input
                        id="signup-crefito"
                        type="text"
                        value={signupForm.crefito}
                        onChange={(e) => setSignupForm({ ...signupForm, crefito: e.target.value })}
                        disabled={loading}
                        placeholder="CREFITO-3/12345"
                        required={signupForm.role === 'professional'}
                      />
                      <p className="text-xs text-gray-500">Obrigatório para fisioterapeutas</p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      required
                      disabled={loading}
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      required
                      disabled={loading}
                      minLength={6}
                      placeholder="Digite a senha novamente"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Criando conta...' : 'Criar Conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 GoPhysioTech - Sistema seguro com isolamento por clínica
          </p>
        </div>
      </div>
    </div>
  );
}
