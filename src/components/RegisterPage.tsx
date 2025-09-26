import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export function RegisterPage() {
  const { signUp, user, loading: authLoading } = useAuth();
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
      
      // SUCESSO: apenas aqui limpa formulário e redireciona para login  
      setError('');
      toast.success('Cadastro realizado com sucesso! Agora faça login para acessar o sistema.');
      
      console.log('✅ Limpando formulário e redirecionando para login');
      
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
      
      // Redirecionar para login após sucesso
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err: any) {
      console.error('❌ Erro inesperado no signup:', err);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/favicon.ico" alt="GoPhysioTech" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">GoPhysioTech</span>
            </div>
            <Link 
              to="/" 
              className="pt-4 mt-8 sm:mt-4 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Voltar
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-gray-900">Cadastrar na Clínica</CardTitle>
              <p className="text-gray-600 text-sm">
                Crie sua conta para acessar uma clínica existente
              </p>
            </CardHeader>
            
            <CardContent>
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

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                    Fazer Login
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="p-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <img src="/favicon.ico" alt="GoPhysioTech" className="w-4 h-4" />
            <span className="text-xs">© 2024 GoPhysioTech - Sistema seguro com isolamento por clínica</span>
          </div>
        </footer>
      </div>
    </div>
  );
}