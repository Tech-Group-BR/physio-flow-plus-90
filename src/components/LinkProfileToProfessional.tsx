import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserCog, Link2, Users, Stethoscope, RefreshCw } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone: string | null;
}

interface Professional {
  id: string;
  full_name: string;
  email: string;
  profile_id: string | null;
  crefito: string | null;
  phone: string | null;
}

export default function LinkProfileToProfessional() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user?.clinicId]);

  const fetchData = async () => {
    if (!user?.clinicId) return;

    try {
      setLoading(true);

      // Buscar profiles da clínica com role 'professional' OU 'admin' que ainda não estão associados
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, phone')
        .eq('clinic_id', user.clinicId)
        .in('role', ['professional', 'admin'])
        .order('full_name');

      if (profilesError) throw profilesError;

      // Buscar professionals da clínica
      const { data: professionalsData, error: professionalsError } = await supabase
        .from('professionals')
        .select('id, full_name, email, profile_id, crefito, phone')
        .eq('clinic_id', user.clinicId)
        .order('full_name');

      if (professionalsError) throw professionalsError;

      setProfiles(profilesData || []);
      setProfessionals(professionalsData || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!selectedProfile || !selectedProfessional) {
      toast.error('Selecione um usuário e um fisioterapeuta');
      return;
    }

    try {
      setSaving(true);

      // Atualizar o professional com o profile_id
      const { error } = await supabase
        .from('professionals')
        .update({ profile_id: selectedProfile })
        .eq('id', selectedProfessional);

      if (error) throw error;

      toast.success('Associação realizada com sucesso!');
      
      // Limpar seleções e recarregar dados
      setSelectedProfile('');
      setSelectedProfessional('');
      await fetchData();
    } catch (error) {
      console.error('Erro ao associar:', error);
      toast.error('Erro ao realizar associação');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async (professionalId: string) => {
    if (!confirm('Deseja realmente desvincular este fisioterapeuta do perfil de usuário?')) {
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('professionals')
        .update({ profile_id: null })
        .eq('id', professionalId);

      if (error) throw error;

      toast.success('Desvinculação realizada com sucesso!');
      await fetchData();
    } catch (error) {
      console.error('Erro ao desvincular:', error);
      toast.error('Erro ao desvincular');
    } finally {
      setSaving(false);
    }
  };

  // Filtrar profiles que já estão associados
  const linkedProfileIds = professionals
    .filter(p => p.profile_id)
    .map(p => p.profile_id);
  
  const availableProfiles = profiles.filter(p => !linkedProfileIds.includes(p.id));

  // Filtrar professionals que já têm profile associado
  const professionalsWithProfile = professionals.filter(p => p.profile_id);
  const professionalsWithoutProfile = professionals.filter(p => !p.profile_id);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Associar Usuários a Fisioterapeutas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulário de Associação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Associar Usuário a Fisioterapeuta
          </CardTitle>
          <CardDescription>
            Vincule um perfil de usuário (login) a um cadastro de fisioterapeuta existente.
            Isso permite que o fisioterapeuta faça login no sistema. Administradores também podem ser associados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Seletor de Profile */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuário (Login)
              </label>
              <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {availableProfiles.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      Nenhum usuário disponível
                    </div>
                  ) : (
                    availableProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{profile.full_name}</span>
                            {profile.role === 'admin' && (
                              <Badge variant="secondary" className="text-xs">Admin</Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{profile.email}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {availableProfiles.length === 0 && (
                <p className="text-xs text-amber-600">
                  Todos os usuários já estão associados ou não há usuários disponíveis para associação
                </p>
              )}
            </div>

            {/* Seletor de Professional */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Fisioterapeuta (Cadastro)
              </label>
              <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fisioterapeuta" />
                </SelectTrigger>
                <SelectContent>
                  {professionalsWithoutProfile.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      Nenhum fisioterapeuta disponível
                    </div>
                  ) : (
                    professionalsWithoutProfile.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{prof.full_name}</span>
                          <span className="text-xs text-gray-500">
                            {prof.crefito ? `CREFITO: ${prof.crefito}` : prof.email}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {professionalsWithoutProfile.length === 0 && (
                <p className="text-xs text-amber-600">
                  Todos os fisioterapeutas já estão associados
                </p>
              )}
            </div>
          </div>

          <Button 
            onClick={handleLink} 
            disabled={!selectedProfile || !selectedProfessional || saving}
            className="w-full"
          >
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Associando...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Associar
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Associações Existentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Associações Existentes
          </CardTitle>
          <CardDescription>
            Fisioterapeutas que já possuem perfil de usuário vinculado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {professionalsWithProfile.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhuma associação encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {professionalsWithProfile.map((prof) => {
                const linkedProfile = profiles.find(p => p.id === prof.profile_id);
                return (
                  <div 
                    key={prof.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{prof.full_name}</span>
                        {prof.crefito && (
                          <Badge variant="outline" className="text-xs">
                            {prof.crefito}
                          </Badge>
                        )}
                      </div>
                      {linkedProfile && (
                        <div className="flex items-center gap-2 mt-1 ml-6 text-sm text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>{linkedProfile.email}</span>
                          <Badge variant="secondary" className="text-xs">
                            Vinculado
                          </Badge>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlink(prof.id)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Desvincular
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
