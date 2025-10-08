import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  clinic_id: string;
  status: string;
  expires_at: string;
  permissions: string | null;
  clinic: {
    name: string;
    clinic_code: string;
  };
  invited_by: {
    full_name: string;
  };
}

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se usuário já está logado, mostrar aviso
    if (user) {
      console.log('⚠️ Usuário já está logado:', user.email);
      toast.warning('Você já está logado. Faça logout para aceitar um novo convite.');
      // Ainda assim, validar o convite para mostrar informações
    }
    validateInvitation();
  }, [token, user]);

  const validateInvitation = async () => {
    if (!token) {
      setError('Token de convite inválido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Validando convite com token:', token);

      // Buscar convite pelo token
      const { data: inviteData, error: inviteError } = await supabase
        .from('user_invitations' as any)
        .select('*')
        .eq('token', token)
        .single();

      console.log('📥 Resultado da busca:', { inviteData, inviteError });

      if (inviteError) {
        console.error('❌ Erro ao buscar convite:', inviteError);
        setError(`Convite não encontrado: ${inviteError.message}`);
        setLoading(false);
        return;
      }

      if (!inviteData) {
        console.error('❌ Convite não retornou dados');
        setError('Convite não encontrado');
        setLoading(false);
        return;
      }

      const inviteDataAny = inviteData as any;

      // Verificar se convite já foi aceito
      if (inviteDataAny.status === 'accepted') {
        setError('Este convite já foi utilizado');
        setLoading(false);
        return;
      }

      // Verificar se convite expirou
      if (inviteDataAny.status === 'expired' || new Date(inviteDataAny.expires_at) < new Date()) {
        setError('Este convite expirou');
        setLoading(false);
        return;
      }

      // Buscar dados da clínica
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinic_settings')
        .select('name, clinic_code')
        .eq('id', inviteDataAny.clinic_id)
        .single();

      if (clinicError || !clinicData) {
        setError('Clínica não encontrada');
        setLoading(false);
        return;
      }

      // Buscar quem convidou
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', inviteDataAny.invited_by)
        .single();

      const invitationDataComplete: InvitationData = {
        ...inviteDataAny,
        clinic: clinicData,
        invited_by: profileData || { full_name: 'Administrador' }
      };

      setInvitation(invitationDataComplete);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao validar convite:', err);
      setError('Erro ao validar convite');
      setLoading(false);
    }
  };

  const handleAcceptInvite = () => {
    if (!invitation) return;

    // Verificar se usuário já está logado
    if (user) {
      toast.error('Você precisa fazer logout antes de aceitar um novo convite.');
      return;
    }

    // Armazenar dados do convite no localStorage para usar no cadastro
    const inviteData = {
      token: token,
      invitationId: invitation.id,
      email: invitation.email,
      clinicCode: invitation.clinic.clinic_code,
      clinicId: invitation.clinic_id,
      clinicName: invitation.clinic.name,
      role: invitation.role,
      invitedBy: invitation.invited_by.full_name,
      permissions: invitation.permissions,
    };

    console.log('💾 Salvando dados do convite no localStorage:', inviteData);
    localStorage.setItem('pendingInvitation', JSON.stringify(inviteData));

    // Redirecionar para página de registro (clínica já existe)
    toast.success(`Redirecionando para o cadastro na ${invitation.clinic.name}...`);
    navigate('/register');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Validando convite...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="w-6 h-6 text-destructive" />
              <CardTitle>Convite Inválido</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive mb-1">Possíveis motivos:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>O link pode ter expirado (validade de 7 dias)</li>
                      <li>O convite já foi utilizado</li>
                      <li>O convite foi cancelado pelo administrador</li>
                      <li>O link está incorreto ou incompleto</li>
                    </ul>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full"
              >
                Ir para Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md border-primary">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-primary" />
            <CardTitle>🎉 Você foi convidado!</CardTitle>
          </div>
          <CardDescription>
            Confirme os dados abaixo e crie sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Aviso se usuário já está logado */}
          {user && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800 mb-1">Você já está logado</p>
                  <p className="text-amber-700 mb-2">
                    Você está conectado como <strong>{user.email}</strong>.
                    Para aceitar este convite, você precisa fazer logout primeiro.
                  </p>
                  <Button
                    onClick={() => {
                      // Salvar convite antes de fazer logout
                      const inviteData = {
                        token: token,
                        invitationId: invitation.id,
                        email: invitation.email,
                        clinicCode: invitation.clinic.clinic_code,
                        clinicId: invitation.clinic_id,
                        clinicName: invitation.clinic.name,
                        role: invitation.role,
                        invitedBy: invitation.invited_by.full_name,
                        permissions: invitation.permissions,
                      };
                      localStorage.setItem('pendingInvitation', JSON.stringify(inviteData));
                      
                      // Redirecionar para logout com redirect de volta para register
                      navigate('/login?logout=true');
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    Fazer Logout e Continuar
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Clínica</p>
              <p className="text-lg font-semibold">{invitation.clinic.name}</p>
              <p className="text-sm text-muted-foreground">
                Código: {invitation.clinic.clinic_code}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Seu Email</p>
              <p className="font-medium">{invitation.email}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Cargo</p>
              <p className="font-medium capitalize">{invitation.role}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Convidado por</p>
              <p className="font-medium">{invitation.invited_by.full_name}</p>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                ⏰ Este convite expira em:{' '}
                <span className="font-medium">
                  {new Date(invitation.expires_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleAcceptInvite}
              className="w-full"
              size="lg"
              disabled={!!user}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Aceitar Convite e Criar Conta
            </Button>

            <Button
              onClick={() => navigate('/login')}
              variant="ghost"
              className="w-full"
            >
              Cancelar
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {user 
                ? 'Faça logout para poder aceitar este convite.'
                : 'Ao aceitar, você será redirecionado para criar sua conta com os dados acima já preenchidos.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
