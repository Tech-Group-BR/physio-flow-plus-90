import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, ArrowLeft, Building2, Mail, Lock, Hash } from 'lucide-react';

export function LoginPage() {
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    // ✅ CORREÇÃO: Não verificar loading local, apenas authLoading
    if (user && !authLoading) {
      console.log('✅ Usuário já logado, redirecionando...', {
        email: user.email,
        role: user.profile?.role
      });
      
      // Redirecionar baseado no role
      if (user.profile?.role === 'super' && user.profile?.clinic_code === '000000') {
        console.log('👑 Super admin detectado, redirecionando para /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('👤 Usuário normal, redirecionando para /dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    clinicCode: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Tentando fazer login...', { 
        email: loginForm.email, 
        clinicCode: loginForm.clinicCode 
      });

      const result = await signIn(loginForm.email, loginForm.password, loginForm.clinicCode);
      
      console.log('📋 Resultado do signIn recebido:', result);
      
      if (result.error) {
        throw result.error;
      }
      
      toast.success('Login realizado com sucesso!');
      
      // ✅ CORREÇÃO: Não redirecionar manualmente aqui
      // O useEffect irá detectar user e redirecionar automaticamente
      console.log('🎯 Login bem-sucedido, aguardando useEffect redirecionar...', { 
        isSuperAdmin: result.isSuperAdmin,
        hasProperty: 'isSuperAdmin' in result
      });
      
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      const errorMessage = error?.message || 'Erro ao fazer login';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 relative">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>
      
      <div className="w-full max-w-md relative z-10">
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
          <p className="text-gray-600 text-lg">Entre em sua conta</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white border-0 shadow-xl shadow-blue-500/10 hover:shadow-2xl transition-shadow duration-300">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center">
              <LogIn className="w-6 h-6 mr-2 text-blue-600" />
              Fazer Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {loginForm.clinicCode === '000000' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
                  <div className="flex items-center">
                    <div className="mr-2">👑</div>
                    <div>
                      <p className="font-medium">Acesso de Super Admin</p>
                     
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center">
                  <Lock className="w-4 h-4 mr-2 text-blue-600" />
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
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

              {/* Clinic Code Field */}
              <div className="space-y-2">
                <Label htmlFor="clinicCode" className="text-sm font-medium text-gray-700 flex items-center">
                  <Hash className="w-4 h-4 mr-2 text-blue-600" />
                  Código da Clínica
                </Label>
                <Input
                  id="clinicCode"
                  type="text"
                  placeholder="123456"
                  value={loginForm.clinicCode}
                  onChange={(e) => setLoginForm({ ...loginForm, clinicCode: e.target.value })}
                  required
                  maxLength={6}
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
                <p className="text-xs text-gray-500">
                  Código de 6 dígitos fornecido pela sua clínica
                  {loginForm.clinicCode === '000000' && (
                    <span className="text-amber-600 font-medium"> • Acesso Admin detectado</span>
                  )}
                </p>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-lg hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="w-5 h-5 mr-2" />
                    Entrar
                  </div>
                )}
              </Button>

              {/* Forgot Password */}
              <div className="text-center">
                <Link 
                  to="#" 
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600">
              Não tem uma conta em uma clínica existente?{' '}
              <Link 
                to="/register" 
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
              >
                Cadastre-se na clínica
              </Link>
            </p>
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
            <Link to="#" className="hover:text-gray-700 transition-colors">Privacidade</Link>
            <span>•</span>
            <Link to="#" className="hover:text-gray-700 transition-colors">Suporte</Link>
          </div>
        </div>
      </div>
    </div>
  );
}