import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Shield, 
  Settings, 
  Save, 
  RotateCcw, 
  Copy,
  Search,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { usePermissions, PermissionWithDetails } from '@/contexts/PermissionsContext';
import { usePermissionActions, ROLE_PRESETS } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useClinic } from '@/contexts/ClinicContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface UserPermissionsManagerProps {
  selectedUser: User | null;
  onUserChange: (user: User | null) => void;
}

function UserPermissionsManager({ selectedUser, onUserChange }: UserPermissionsManagerProps) {
  const { getUserPermissions, updateUserPermissions, applyRolePreset } = usePermissions();
  const { requirePermission } = usePermissionActions();
  const [userPermissions, setUserPermissions] = useState<PermissionWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar permissões do usuário selecionado
  useEffect(() => {
    if (selectedUser) {
      loadUserPermissions();
    }
  }, [selectedUser]);

  const loadUserPermissions = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const permissions = await getUserPermissions(selectedUser.id);
      setUserPermissions(permissions);
    } catch (error) {
      toast.error('Erro ao carregar permissões do usuário');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionName: string, granted: boolean) => {
    setUserPermissions(prev => 
      prev.map(p => 
        p.name === permissionName 
          ? { ...p, granted, isCustom: true }
          : p
      )
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    if (!requirePermission('settings.manage', 'Você não tem permissão para alterar permissões')) {
      return;
    }

    setLoading(true);
    try {
      const grantedPermissions = userPermissions
        .filter(p => p.granted)
        .map(p => p.name);

      await updateUserPermissions(selectedUser.id, grantedPermissions);
      toast.success('Permissões atualizadas com sucesso!');
      loadUserPermissions(); // Recarregar para atualizar flags
    } catch (error) {
      toast.error('Erro ao salvar permissões');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = async (role: string) => {
    if (!selectedUser) return;

    if (!requirePermission('settings.manage', 'Você não tem permissão para aplicar presets')) {
      return;
    }

    setLoading(true);
    try {
      await applyRolePreset(selectedUser.id, role);
      toast.success(`Preset "${ROLE_PRESETS[role as keyof typeof ROLE_PRESETS]?.label}" aplicado com sucesso!`);
      loadUserPermissions();
    } catch (error) {
      toast.error('Erro ao aplicar preset');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar permissões por busca
  const filteredPermissions = userPermissions
    .filter(permission => !permission.name.startsWith('superadmin.'))
    .filter(permission =>
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.resource.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Agrupar por recurso
  const permissionsByResource = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, PermissionWithDetails[]>);

  if (!selectedUser) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <UserCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Selecione um usuário</h3>
          <p className="text-muted-foreground">
            Escolha um usuário na lista ao lado para gerenciar suas permissões
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do usuário */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>
                {selectedUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {selectedUser.full_name}
                <Badge variant={selectedUser.is_active ? 'default' : 'secondary'}>
                  {selectedUser.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </CardTitle>
              <CardDescription>
                {selectedUser.email} • {ROLE_PRESETS[selectedUser.role as keyof typeof ROLE_PRESETS]?.label || selectedUser.role}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Presets rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Aplicar Preset
          </CardTitle>
          <CardDescription>
            Aplique rapidamente um conjunto de permissões padrão baseado no role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(ROLE_PRESETS).map(([roleKey, preset]) => (
              <Button
                key={roleKey}
                variant="outline"
                size="sm"
                onClick={() => handleApplyPreset(roleKey)}
                disabled={loading}
                className="justify-start"
              >
                <Shield className="mr-2 h-4 w-4" />
                {preset.label}
              </Button>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Atenção:</p>
                <p>Aplicar um preset irá sobrescrever todas as permissões customizadas atuais do usuário.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissões detalhadas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Permissões Detalhadas
              </CardTitle>
              <CardDescription>
                Configure permissões específicas para este usuário
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadUserPermissions} disabled={loading}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Recarregar
              </Button>
              <Button onClick={handleSavePermissions} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar permissões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de permissões por recurso */}
          <div className="space-y-6">
            {Object.entries(permissionsByResource).map(([resource, permissions]) => (
              <div key={resource}>
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">
                  {resource}
                </h4>
                <div className="space-y-3">
                  {permissions.map((permission) => (
                    <div
                      key={permission.name}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {permission.name}
                          </code>
                          {permission.isCustom && (
                            <Badge variant="secondary" className="text-xs">
                              Customizado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                      <Switch
                        checked={permission.granted || false}
                        onCheckedChange={(checked) => 
                          handlePermissionToggle(permission.name, checked)
                        }
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
                {resource !== Object.keys(permissionsByResource).slice(-1)[0] && (
                  <Separator className="mt-6" />
                )}
              </div>
            ))}
          </div>

          {Object.keys(permissionsByResource).length === 0 && (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma permissão encontrada</h3>
              <p className="text-muted-foreground">
                Tente ajustar os termos de busca
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function PermissionsManagementPage() {
  const { settings } = usePermissionActions();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Carregar usuários da clínica
  useEffect(() => {
    loadUsers();
  }, [user?.profile?.clinic_id]);

  const loadUsers = async () => {
    if (!user?.profile?.clinic_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('clinic_id', user.profile.clinic_id)
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se pode acessar a página
  if (!settings.canManage()) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
          <p className="text-muted-foreground">
            Você não tem permissão para gerenciar permissões de usuários
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filtrar usuários
  const filteredUsers = profiles?.filter(profile =>
    profile.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    profile.email?.toLowerCase().includes(userSearch.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Gerenciamento de Permissões</h2>
        <p className="text-muted-foreground">
          Configure permissões individuais para cada usuário ou aplique presets por role
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de usuários */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Busca de usuários */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista */}
            <div className="space-y-2">
              {filteredUsers.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => setSelectedUser(profile as User)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === profile.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-medium text-sm">{profile.full_name}</div>
                  <div className="text-xs opacity-80">{profile.email}</div>
                  <Badge 
                    variant="secondary" 
                    className={`mt-1 text-xs ${
                      selectedUser?.id === profile.id ? 'bg-primary-foreground/20' : ''
                    }`}
                  >
                    {ROLE_PRESETS[profile.role as keyof typeof ROLE_PRESETS]?.label || profile.role}
                  </Badge>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum usuário encontrado
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gerenciador de permissões */}
        <div className="lg:col-span-2">
          <UserPermissionsManager
            selectedUser={selectedUser}
            onUserChange={setSelectedUser}
          />
        </div>
      </div>
    </div>
  );
}