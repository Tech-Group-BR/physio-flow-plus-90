import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Users, 
  Shield, 
  Settings, 
  Search, 
  UserCog, 
  Mail,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { translatePermission } from './PermissionsSetupPage';

interface ClinicUser {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'professional' | 'receptionist' | 'guardian' | 'super';
  is_active: boolean;
  created_at: string;
  custom_permissions: Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
    granted: boolean;
  }>;
  role_permissions: Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
  }>;
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export default function UserPermissionsManager() {
  const { user } = useAuth();
  const { allPermissions } = usePermissions();
  const [users, setUsers] = useState<ClinicUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ClinicUser | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [userPermissions, setUserPermissions] = useState<{[key: string]: boolean}>({});
  const [userRole, setUserRole] = useState<'admin' | 'professional' | 'receptionist' | 'guardian' | 'super'>('professional');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!user?.clinicId) return;

    try {
      setLoading(true);
      
      // Buscar usuários da clínica usando RPC ou view personalizada
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          is_active,
          created_at
        `)
        .eq('clinic_id', user.clinicId)
        .order('full_name');

      if (error) throw error;

      // Para cada usuário, buscar suas permissões customizadas
      const usersWithPermissions = await Promise.all(
        data.map(async (profile) => {
          // Permissões customizadas
          const { data: customPerms } = await supabase
            .from('user_permissions' as any)
            .select(`
              permission_id,
              granted,
              permissions (id, name, resource, action)
            `)
            .eq('user_id', profile.id);

          // Permissões padrão do role
          const { data: rolePerms } = await supabase
            .from('permission_presets' as any)
            .select(`
              permission_id,
              permissions (id, name, resource, action)
            `)
            .eq('role', profile.role);

          const rolePermissionIds = new Set(rolePerms?.map(rp => (rp as any).permissions?.id) || []);

          return {
            ...profile,
            custom_permissions: customPerms?.map(cp => ({
              id: (cp as any).permissions.id,
              name: (cp as any).permissions.name,
              resource: (cp as any).permissions.resource,
              action: (cp as any).permissions.action,
              granted: (cp as any).granted
            })).filter(cp => !rolePermissionIds.has(cp.id)) || [], // Filtrar permissões que já são padrão do role
            role_permissions: rolePerms?.map(rp => ({
              id: (rp as any).permissions.id,
              name: (rp as any).permissions.name,
              resource: (rp as any).permissions.resource,
              action: (rp as any).permissions.action,
            })) || []
          };
        })
      );

      setUsers(usersWithPermissions);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const startEditingUser = (user: ClinicUser) => {
    setEditingUser(user.id);
    setSelectedUser(user);
    setUserRole(user.role);
    
    // Mapear permissões atuais
    const currentPermissions: {[key: string]: boolean} = {};
    
    // Adicionar permissões customizadas
    user.custom_permissions.forEach(perm => {
      currentPermissions[perm.id] = perm.granted;
    });
    
    setUserPermissions(currentPermissions);
  };

  const saveUserPermissions = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      // Atualizar role se mudou
      if (userRole !== selectedUser.role) {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: userRole })
          .eq('id', selectedUser.id);

        if (roleError) throw roleError;
      }

      // Salvar permissões customizadas
      const permissionsToSave = Object.entries(userPermissions).map(([permId, granted]) => ({
        user_id: selectedUser.id,
        permission_id: permId,
        granted
      }));

      if (permissionsToSave.length > 0) {
        // Deletar permissões antigas
        await supabase
          .from('user_permissions' as any)
          .delete()
          .eq('user_id', selectedUser.id);

        // Inserir novas permissões
        const { error: permsError } = await supabase
          .from('user_permissions' as any)
          .insert(permissionsToSave);

        if (permsError) throw permsError;
      }

      toast.success('Permissões atualizadas com sucesso');
      setEditingUser(null);
      setSelectedUser(null);
      fetchUsers(); // Recarregar lista

    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setUserPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'receptionist': return 'bg-green-100 text-green-800';
      case 'guardian': return 'bg-purple-100 text-purple-800';
      case 'super': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'professional': return 'Profissional';
      case 'receptionist': return 'Recepcionista';
      case 'guardian': return 'Responsável';
      case 'super': return 'Super Admin';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Busca */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Lista de usuários */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum usuário encontrado
          </div>
        ) : (
          filteredUsers.map((clinicUser) => (
            <Card key={clinicUser.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{clinicUser.full_name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{clinicUser.email}</span>
                        <Badge className={getRoleColor(clinicUser.role)}>
                          {getRoleName(clinicUser.role)}
                        </Badge>
                        {!clinicUser.is_active && (
                          <Badge variant="destructive">Inativo</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditingUser(clinicUser)}
                    >
                      <UserCog className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>

                {/* Mostrar permissões padrão do role */}
                {clinicUser.role_permissions && clinicUser.role_permissions.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      Permissões Padrão ({getRoleName(clinicUser.role)})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {clinicUser.role_permissions
                        .filter(perm => !perm.name.startsWith('superadmin.'))
                        .map((perm) => {
                          const translated = translatePermission(perm.name);
                          const Icon = translated.icon;
                          return (
                            <Badge
                              key={perm.id}
                              variant="secondary"
                              className="flex items-center gap-1 px-3 py-1"
                            >
                              <Icon className="w-3 h-3" />
                              {translated.label}
                            </Badge>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Mostrar permissões customizadas se existirem */}
                {clinicUser.custom_permissions.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Permissões Adicionais
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {clinicUser.custom_permissions
                        .filter(perm => !perm.name.startsWith('superadmin.'))
                        .map((perm) => {
                          const translated = translatePermission(perm.name);
                          const Icon = translated.icon;
                          return (
                            <Badge
                              key={perm.id}
                              variant={perm.granted ? "default" : "secondary"}
                              className="flex items-center gap-1 px-3 py-1"
                            >
                              <Icon className="w-3 h-3" />
                              {translated.label}
                            </Badge>
                          );
                        })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de edição de usuário */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Permissões</DialogTitle>
            <DialogDescription>
              Configure o cargo e permissões específicas para {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              {/* Cargo */}
              <div>
                <label className="text-sm font-medium">Cargo</label>
                <Select value={userRole} onValueChange={(value: any) => setUserRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="receptionist">Recepcionista</SelectItem>
                    <SelectItem value="guardian">Responsável</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Permissões customizadas */}
              <div>
                <label className="text-sm font-medium">Permissões específicas</label>
                <p className="text-xs text-muted-foreground mb-3">
                  Marque para conceder permissões adicionais ou desmarque para remover
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-3">
                  {allPermissions
                    .filter(permission => !permission.name.startsWith('superadmin.'))
                    .map((permission) => {
                      const translated = translatePermission(permission.name);
                      const Icon = translated.icon;
                      return (
                        <div key={permission.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                          <Checkbox
                            checked={userPermissions[permission.id] || false}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{translated.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{translated.description}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
                <Button onClick={saveUserPermissions} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}