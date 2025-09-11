
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Search, UserCheck, UserX } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { toast } from 'sonner';
import { Physiotherapist } from '@/types';

export function PhysiotherapistsPage() {
  const { 
    physiotherapists, 
    addPhysiotherapist, 
    updatePhysiotherapist, 
    deletePhysiotherapist 
  } = useClinic();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPhysiotherapist, setEditingPhysiotherapist] = useState<Physiotherapist | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    crefito: '',
    specialties: [] as string[],
    bio: '',
    isActive: true
  });

  const filteredPhysiotherapists = physiotherapists.filter(physio =>
    physio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    physio.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (physio.crefito && physio.crefito.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      crefito: '',
      specialties: [],
      bio: '',
      isActive: true
    });
    setEditingPhysiotherapist(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPhysiotherapist) {
        await updatePhysiotherapist(editingPhysiotherapist.id, formData);
        toast.success('Fisioterapeuta atualizado com sucesso!');
      } else {
        await addPhysiotherapist(formData);
        toast.success('Fisioterapeuta adicionado com sucesso!');
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar fisioterapeuta');
      console.error('Erro:', error);
    }
  };

  const handleEdit = (physiotherapist: Physiotherapist) => {
    setEditingPhysiotherapist(physiotherapist);
    setFormData({
      name: physiotherapist.name,
      email: physiotherapist.email,
      phone: physiotherapist.phone,
      crefito: physiotherapist.crefito,
      specialties: physiotherapist.specialties,
      bio: physiotherapist.bio,
      isActive: physiotherapist.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este fisioterapeuta?')) {
      try {
        await deletePhysiotherapist(id);
        toast.success('Fisioterapeuta excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir fisioterapeuta');
        console.error('Erro:', error);
      }
    }
  };

  const handleStatusToggle = async (physiotherapist: Physiotherapist) => {
    try {
      await updatePhysiotherapist(physiotherapist.id, {
        ...physiotherapist,
        isActive: !physiotherapist.isActive
      });
      toast.success(`Fisioterapeuta ${physiotherapist.isActive ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (error) {
      toast.error('Erro ao alterar status do fisioterapeuta');
      console.error('Erro:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fisioterapeutas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Fisioterapeuta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPhysiotherapist ? 'Editar Fisioterapeuta' : 'Novo Fisioterapeuta'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="crefito">CREFITO</Label>
                <Input
                  id="crefito"
                  value={formData.crefito}
                  onChange={(e) => setFormData({ ...formData, crefito: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPhysiotherapist ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar fisioterapeutas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPhysiotherapists.map((physiotherapist) => (
          <Card key={physiotherapist.id} className={!physiotherapist.isActive ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{physiotherapist.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusToggle(physiotherapist)}
                    title={physiotherapist.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {physiotherapist.isActive ? (
                      <UserCheck className="h-4 w-4 text-green-600" />
                    ) : (
                      <UserX className="h-4 w-4 text-red-600" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(physiotherapist)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(physiotherapist.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {physiotherapist.email && (
                <p className="text-sm text-gray-600">{physiotherapist.email}</p>
              )}
              {physiotherapist.phone && (
                <p className="text-sm text-gray-600">{physiotherapist.phone}</p>
              )}
              {physiotherapist.crefito && (
                <p className="text-sm font-medium">CREFITO: {physiotherapist.crefito}</p>
              )}
              {physiotherapist.specialties && physiotherapist.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {physiotherapist.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}
              <Badge variant={physiotherapist.isActive ? 'default' : 'secondary'}>
                {physiotherapist.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPhysiotherapists.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'Nenhum fisioterapeuta encontrado.' : 'Nenhum fisioterapeuta cadastrado.'}
        </div>
      )}
    </div>
  );
}
