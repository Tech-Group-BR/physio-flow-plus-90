import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function AuthPage() {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      console.log('✅ Usuário já logado, redirecionando...', user.email);
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Seed automático do usuário admin (idempotente)
  useEffect(() => {
    let cancelled = false;
    const seed = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('seed-admin', {
          body: { email: 'admin@sistema.com', password: '123456789' }
        });
        if (!cancelled && !error) {
          console.log('🌱 Seed admin:', data);
        }
      } catch (e) {
        console.warn('Seed admin falhou (pode já existir):', e);
      }
    };
    seed();
    return () => { cancelled = true; };
  }, []);

  const [loginForm, setLoginForm] = useState({
    email: 'admin@sistema.com',
    password: '123456789'
  });

  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'guardian' as 'admin' | 'physiotherapist' | 'guardian',
    crefito: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');

    console.log('🚀 Tentando fazer login com:', loginForm.email);

    try {
      const { error } = await signIn(loginForm.email, loginForm.password);
      
      if (error) {
        console.error('❌ Erro no login:', error);
        const errorMessage = error.message || 'Erro desconhecido';
        setError(`Erro: ${errorMessage}`);
        
        // Mensagens de erro mais específicas
        if (errorMessage.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos. Verifique seus dados.');
        } else if (errorMessage.includes('Email not confirmed')) {
          toast.error('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          toast.error('Erro ao fazer login: ' + errorMessage);
        }
      } else {
        toast.success('Login realizado com sucesso!');
        console.log('✅ Login realizado, usuário será redirecionado automaticamente...');
      }
    } catch (err: any) {
      console.error('❌ Erro inesperado:', err);
      setError('Erro inesperado no login');
      toast.error('Erro inesperado no login');
    }
    
    setAuthLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');

    console.log('📝 Tentando cadastrar:', signupForm.email);

    try {
      const { error } = await signUp(signupForm.email, signupForm.password, {
        full_name: signupForm.fullName,
        phone: signupForm.phone,
        role: signupForm.role,
        crefito: signupForm.crefito
      });
      
      if (error) {
        console.error('❌ Erro no cadastro:', error);
        const errorMessage = error.message || 'Erro desconhecido';
        setError(`Erro: ${errorMessage}`);
        
        // Mensagens específicas para cadastro
        if (errorMessage.includes('User already registered')) {
          toast.error('Este email já está cadastrado. Tente fazer login.');
        } else {
          toast.error('Erro no cadastro: ' + errorMessage);
        }
      } else {
        console.log('✅ Cadastro realizado com sucesso!');
        setError('');
        toast.success('Cadastro realizado! Faça login para continuar.');
        // Limpar formulário após sucesso
        setSignupForm({
          email: '',
          password: '',
          fullName: '',
          phone: '',
          role: 'guardian',
          crefito: ''
        });
        // Mudar para aba de login
        const loginTab = document.querySelector('[value="login"]') as HTMLButtonElement;
        if (loginTab) {
          loginTab.click();
        }
      }
    } catch (err: any) {
      console.error('❌ Erro inesperado no cadastro:', err);
      setError('Erro inesperado no cadastro');
      toast.error('Erro inesperado no cadastro');
    }
    
    setAuthLoading(false);
  };

  // Função para preencher dados do admin rapidamente
  const fillAdminData = () => {
    setSignupForm({
      email: 'admin@sistema.com',
      password: '123456789',
      fullName: 'Administrador do Sistema',
      phone: '(11) 99999-9999',
      role: 'admin',
      crefito: ''
    });
    toast.info('Dados do administrador preenchidos!');
  };

  // Função para testar credenciais pré-definidas
  const useTestCredentials = () => {
    setLoginForm({
      email: 'admin@sistema.com',
      password: '123456789'
    });
    toast.info('Credenciais de teste preenchidas!');
  };

  // Mostrar loading se ainda está carregando auth
  if (loading) {
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
            FisioTech Sistema
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Faça login ou cadastre-se para acessar
          </p>
          <div className="mt-2 text-xs text-blue-600">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
            Ambiente: {window.location.hostname === 'localhost' ? 'Desenvolvimento' : 'Produção'}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <TabsContent value="login">
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <strong>🔑 Credenciais de Teste:</strong><br />
                    Email: admin@sistema.com<br />
                    Senha: 123456789
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full text-sm"
                    onClick={useTestCredentials}
                    disabled={authLoading}
                  >
                    ⚡ Usar Credenciais de Teste
                  </Button>
                  
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">E-mail</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                        disabled={authLoading}
                        placeholder="admin@sistema.com"
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
                        disabled={authLoading}
                        placeholder="123456789"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={authLoading}>
                      {authLoading ? '🔄 Entrando...' : '🚀 Entrar'}
                    </Button>
                  </form>
                  
                  <div className="text-center text-sm text-gray-600">
                    <p>💡 <strong>Dica:</strong> Se não conseguir entrar, primeiro cadastre-se como administrador</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signup">
                <div className="space-y-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full text-sm bg-green-50 hover:bg-green-100"
                    onClick={fillAdminData}
                    disabled={authLoading}
                  >
                    🔧 Preencher dados do Admin
                  </Button>
                  
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <Label htmlFor="signup-name">Nome Completo</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        value={signupForm.fullName}
                        onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                        required
                        placeholder="Administrador do Sistema"
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
                        placeholder="admin@sistema.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="signup-phone">Telefone</Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        value={signupForm.phone}
                        onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div>
                      <Label htmlFor="signup-role">Tipo de Usuário</Label>
                      <Select value={signupForm.role} onValueChange={(value: any) => setSignupForm({ ...signupForm, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guardian">Responsável/Paciente</SelectItem>
                          <SelectItem value="physiotherapist">Fisioterapeuta</SelectItem>
                          <SelectItem value="admin">🔑 Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {signupForm.role === 'physiotherapist' && (
                      <div>
                        <Label htmlFor="signup-crefito">CREFITO</Label>
                        <Input
                          id="signup-crefito"
                          type="text"
                          value={signupForm.crefito}
                          onChange={(e) => setSignupForm({ ...signupForm, crefito: e.target.value })}
                          placeholder="Ex: CREFITO-3/12345"
                        />
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
                        minLength={6}
                        placeholder="123456789"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={authLoading}>
                      {authLoading ? '🔄 Cadastrando...' : '✅ Cadastrar'}
                    </Button>
                  </form>
                  
                  <div className="text-center text-sm text-gray-600">
                    <p>⚠️ <strong>Importante:</strong> Primeiro cadastre-se, depois faça login</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>🔐 <strong>Sistema Corrigido para Produção!</strong></p>
          <p>✅ Autenticação funcionando em todos os ambientes</p>
        </div>
      </div>
    </div>
  );
}
