import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function AuthPage() {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('login');

  useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    clinicCode: ''
  });

  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'guardian',
    crefito: '',
    clinicCode: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');

    try {
      const { data: validClinic, error: clinicError } = await supabase
        .rpc('validate_clinic_code', { code: loginForm.clinicCode });

      if (clinicError || !validClinic) {
        toast.error('Código da clínica inválido');
        setError('Código da clínica inválido');
        setAuthLoading(false);
        return;
      }

      const { error } = await signIn(loginForm.email, loginForm.password, loginForm.clinicCode);

      if (error) {
        const errorMessage = error.message || 'Erro desconhecido';
        setError(`Erro: ${errorMessage}`);
        if (errorMessage.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos. Verifique seus dados.');
        } else if (errorMessage.includes('Email not confirmed')) {
          toast.error('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          toast.error('Erro ao fazer login: ' + errorMessage);
        }
      } else {
        toast.success('Login realizado com sucesso!');
      }
    } catch (err: any) {
      setError('Erro inesperado no login');
      toast.error('Erro inesperado no login');
    }

    setAuthLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');

    try {
      const { data: validClinic, error: clinicError } = await supabase
        .rpc('validate_clinic_code', { code: signupForm.clinicCode });

      if (clinicError || !validClinic) {
        toast.error('Código da clínica inválido');
        setError('Código da clínica inválido');
        setAuthLoading(false);
        return;
      }

      const { error } = await signUp(signupForm.email, signupForm.password, {
        full_name: signupForm.fullName,
        phone: signupForm.phone,
        role: signupForm.role,
        clinic_code: signupForm.clinicCode,
        crefito: signupForm.crefito
      });

      if (error) {
        const errorMessage = error.message || 'Erro desconhecido';
        setError(`Erro: ${errorMessage}`);
        if (errorMessage.includes('User already registered')) {
          toast.error('Este email já está cadastrado. Tente fazer login.');
        } else {
          toast.error('Erro no cadastro: ' + errorMessage);
        }
      } else {
        setError('');
        toast.success('Cadastro realizado! Faça login para continuar.');
        setSignupForm({
          email: '',
          password: '',
          fullName: '',
          phone: '',
          role: 'guardian',
          crefito: '',
          clinicCode: ''
        });
        setActiveTab('login');
      }
    } catch (err: any) {
      setError('Erro inesperado no cadastro');
      toast.error('Erro inesperado no cadastro');
    }

    setAuthLoading(false);
  };

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
        </div>

        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-clinic-code">Código da Clínica</Label>
                    <Input
                      id="login-clinic-code"
                      type="text"
                      value={loginForm.clinicCode}
                      onChange={(e) => setLoginForm({ ...loginForm, clinicCode: e.target.value })}
                      required
                      disabled={authLoading}
                      placeholder="Digite o código da clínica"
                      maxLength={6}
                      pattern="[0-9]{6}"
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                      disabled={authLoading}
                      placeholder="Digite seu e-mail"
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
                      placeholder="Digite sua senha"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={authLoading}>
                    {authLoading ? '🔄 Entrando...' : '🚀 Entrar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-clinic-code">Código da Clínica</Label>
                    <Input
                      id="signup-clinic-code"
                      type="text"
                      value={signupForm.clinicCode}
                      onChange={(e) => setSignupForm({ ...signupForm, clinicCode: e.target.value })}
                      required
                      placeholder="Digite o código da clínica"
                      maxLength={6}
                      pattern="[0-9]{6}"
                    />
                    <p className="text-xs text-gray-500">Solicite o código à clínica</p>
                  </div>

                  <div>
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupForm.fullName}
                      onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                      required
                      placeholder="Digite seu nome completo"
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
                      placeholder="Digite seu e-mail"
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-phone">Telefone</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                      placeholder="(99) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-role">Tipo de Usuário</Label>
                    <Select value={signupForm.role} onValueChange={(value: string) => setSignupForm({ ...signupForm, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="professional">Profissional</SelectItem>
                        <SelectItem value="receptionist">Recepcionista</SelectItem>
                        <SelectItem value="guardian">Responsável/Paciente</SelectItem>
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
                      placeholder="Digite sua senha"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={authLoading}>
                    {authLoading ? '🔄 Cadastrando...' : '✅ Cadastrar'}
                  </Button>
                </form>
                <div className="text-center text-xs text-gray-500 mt-2">
                  <p>⚠️ Após cadastrar, confirme seu e-mail para acessar o sistema.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
