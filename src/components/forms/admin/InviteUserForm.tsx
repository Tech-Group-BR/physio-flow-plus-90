import { useState, useEffect } from 'react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, UserPlus, Clock, CheckCircle, XCircle, Copy, ExternalLink, Trash2 } from 'lucide-react';

const inviteFormSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['professional', 'receptionist', 'admin']),
});

type InviteFormData = z.infer<typeof inviteFormSchema>;

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  token: string;
  created_at: string;
  expires_at: string;
  invited_by: {
    full_name: string;
  };
}

export default function InviteUserForm() {
  const { user } = useAuth();
  const { allPermissions } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('professional');

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      role: 'professional',
    }
  });

  // Carregar permissões padrão do role quando o role mudar
  useEffect(() => {
    loadRolePermissions(selectedRole);
  }, [selectedRole]);

  const loadRolePermissions = async (role: string) => {
    try {
      const { data, error } = await supabase
        .from('permission_presets' as any)
        .select('permission_id')
        .eq('role', role);

      if (error) throw error;

      const rolePermissionIds = data?.map((p: any) => p.permission_id) || [];
      setSelectedPermissions(rolePermissionIds);
    } catch (error) {
      console.error('Erro ao carregar permissões do role:', error);
    }
  };

  // Carregar convites pendentes
  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_invitations' as any)
        .select(`
          id,
          email,
          role,
          status,
          token,
          created_at,
          expires_at,
          invited_by:profiles!user_invitations_invited_by_fkey(full_name)
        `)
        .eq('clinic_id', user?.clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data as any || []);
    } catch (error) {
      console.error('Erro ao buscar convites:', error);
    }
  };

  const onSubmit = async (data: InviteFormData) => {
    if (!user?.clinicId) {
      toast.error('Usuário não associado a uma clínica');
      return;
    }

    setLoading(true);
    try {
      // Verificar se já existe convite pendente para este email
      const { data: existingInvites, error: checkError } = await supabase
        .from('user_invitations' as any)
        .select('id, status')
        .eq('clinic_id', user.clinicId)
        .eq('email', data.email);

      if (checkError) {
        console.error('Erro ao verificar convites:', checkError);
      }

      // Se existir convite pendente, cancelar antes de criar novo
      if (existingInvites && existingInvites.length > 0) {
        const pendingInvite = (existingInvites as any[]).find((inv: any) => inv.status === 'pending');
        
        if (pendingInvite) {
          const { error: cancelError } = await supabase
            .from('user_invitations' as any)
            .update({ status: 'expired' })
            .eq('id', (pendingInvite as any).id);

          if (cancelError) {
            console.error('Erro ao cancelar convite anterior:', cancelError);
          } else {
            console.log('Convite anterior cancelado');
          }
        }
      }

      // Criar o convite
      const { data: invitation, error } = await supabase
        .from('user_invitations' as any)
        .insert({
          clinic_id: user.clinicId,
          email: data.email,
          role: data.role, // Já está como receptionist
          invited_by: user.id,
          permissions: selectedPermissions.length > 0 ? JSON.stringify(selectedPermissions) : null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Este email já foi convidado para esta clínica');
          return;
        }
        throw error;
      }

      // Gerar link do convite
      const inviteLink = `${window.location.origin}/accept-invite/${(invitation as any)?.token}`;
      
      console.log('✅ Convite criado com sucesso');
      console.log('🔗 Link do convite:', inviteLink);

      // Copiar link para clipboard
      try {
        await navigator.clipboard.writeText(inviteLink);
        toast.success(
          <>
            Convite criado! Link copiado para área de transferência.
            <br />
            <a href={inviteLink} target="_blank" rel="noopener noreferrer" className="underline">
              Visualizar link
            </a>
          </>,
          { duration: 10000 }
        );
      } catch (clipboardError) {
        toast.success(`Convite criado para ${data.email}`, { duration: 5000 });
      }

      form.reset();
      setSelectedPermissions([]);
      fetchInvitations();
      
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast.error('Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('user_invitations' as any)
        .update({ status: 'expired' })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Convite cancelado');
      fetchInvitations();
    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      toast.error('Erro ao cancelar convite');
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    if (!confirm('Tem certeza que deseja apagar este convite? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_invitations' as any)
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Convite apagado com sucesso');
      fetchInvitations();
    } catch (error) {
      console.error('Erro ao apagar convite:', error);
      toast.error('Erro ao apagar convite');
    }
  };

  const copyInviteLink = async (token: string) => {
    const inviteLink = `${window.location.origin}/accept-invite/${token}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Link copiado para área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast.error('Erro ao copiar link');
    }
  };

  const openInviteLink = (token: string) => {
    const inviteLink = `${window.location.origin}/accept-invite/${token}`;
    window.open(inviteLink, '_blank');
  };

  // Função para traduzir os nomes dos recursos
  const getResourceDisplayName = (resource: string): string => {
    const resourceNames: Record<string, string> = {
      'patients': '👥 Pacientes',
      'professionals': '👨‍⚕️ Profissionais',
      'appointments': '📅 Agenda',
      'financial': '💰 Financeiro',
      'settings': '⚙️ Configurações',
      'reports': '📊 Relatórios',
      'whatsapp': '💬 WhatsApp',
      'dashboard': '📈 Dashboard',
    };
    return resourceNames[resource] || resource;
  };

  // Carregar dados ao montar
  React.useEffect(() => {
    fetchInvitations();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Convidar Usuário
          </CardTitle>
          <CardDescription>
            Envie um convite por email para adicionar um novo usuário à sua clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email do usuário</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Cargo/Função</Label>
                <Select 
                  value={selectedRole}
                  onValueChange={(value) => {
                    setSelectedRole(value);
                    form.setValue('role', value as any);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="receptionist">Recepcionista</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissões específicas */}
            <div className="space-y-4">
              <Label>Permissões específicas (opcional)</Label>
              <p className="text-sm text-muted-foreground">
                Selecione permissões específicas ou deixe vazio para usar as permissões padrão do cargo
              </p>
              <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                {/* Agrupar permissões por recurso */}
                {Object.entries(
                  allPermissions
                    // Filtrar permissões de super admin
                    .filter(permission => !permission.name.startsWith('superadmin.'))
                    .reduce<Record<string, Permission[]>>((acc, permission) => {
                      const resourceName = getResourceDisplayName(permission.resource);
                      if (!acc[resourceName]) {
                        acc[resourceName] = [];
                      }
                      acc[resourceName].push(permission);
                      return acc;
                    }, {})
                ).map(([resourceName, permissions]) => (
                  <div key={resourceName} className="space-y-2">
                    <h4 className="font-semibold text-sm text-primary border-b pb-1">
                      {resourceName}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                            className="mt-1"
                          />
                          <Label 
                            htmlFor={permission.id} 
                            className="text-sm cursor-pointer leading-tight"
                          >
                            {permission.description}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Gerando convite...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Gerar Convite
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de convites */}
      <Card>
        <CardHeader>
          <CardTitle>Convites Enviados</CardTitle>
          <CardDescription>
            Acompanhe o status dos convites enviados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invitations.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum convite enviado ainda
              </p>
            ) : (
              invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{invitation.email}</span>
                      <Badge variant={
                        invitation.status === 'accepted' ? 'default' :
                        invitation.status === 'expired' ? 'destructive' :
                        'secondary'
                      }>
                        {invitation.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {invitation.status === 'expired' && <XCircle className="w-3 h-3 mr-1" />}
                        {invitation.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {invitation.status === 'accepted' ? 'Aceito' :
                         invitation.status === 'expired' ? 'Expirado' :
                         'Pendente'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>Cargo: {invitation.role}</span>
                      <span className="mx-2">•</span>
                      <span>Enviado por: {invitation.invited_by?.full_name}</span>
                      <span className="mx-2">•</span>
                      <span>Expira: {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {invitation.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteLink(invitation.token)}
                          title="Copiar link do convite"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openInviteLink(invitation.token)}
                          title="Abrir link em nova aba"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => cancelInvitation(invitation.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      </>
                    )}
                    {(invitation.status === 'expired' || invitation.status === 'accepted') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Apagar
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}