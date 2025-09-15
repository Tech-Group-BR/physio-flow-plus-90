
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
import { Professional } from '@/types';
import { BadgeCheck } from 'lucide-react';
import { Mail } from 'lucide-react';
import { Phone } from 'lucide-react';


export function ProfessionalsPage() {
  const { 
    professionals, 
    addProfessional, 
    fetchProfessionals,
    updateProfessional, 
    deleteProfessional 
  } = useClinic();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    crefito: '',
    specialties: [] as string[],
    bio: '',
    isActive: true,
    profile_picture_url: ''
  });

  const filteredProfessionals = professionals.filter(physio =>
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
      isActive: true,
      profile_picture_url: ''
    });
    setEditingProfessional(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProfessional) {
        await updateProfessional(editingProfessional.id, formData);
        toast.success('Fisioterapeuta atualizado com sucesso!');
      } else {
        await addProfessional(formData);
        toast.success('Fisioterapeuta adicionado com sucesso!');
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar fisioterapeuta'  );
      console.error('Erro:', error);
    }
  };

  const handleEdit = (Professional: Professional) => {
    setEditingProfessional(Professional);
    setFormData({
      name: Professional.name,
      email: Professional.email,
      phone: Professional.phone,
      crefito: Professional.crefito,
      specialties: Professional.specialties,
      bio: Professional.bio,
      isActive: Professional.isActive,
      profile_picture_url: Professional.profile_picture_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este fisioterapeuta?')) {
      try {
        await deleteProfessional(id);
        toast.success('Fisioterapeuta excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir fisioterapeuta');
        console.error('Erro:', error);
      }
    }
  };

  const handleStatusToggle = async (Professional: Professional) => {
    try {
      await updateProfessional(Professional.id, {
        ...Professional,
        isActive: !Professional.isActive
      });
      toast.success(`Fisioterapeuta ${Professional.isActive ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (error) {
      toast.error('Erro ao alterar status do fisioterapeuta');
      console.error('Erro:', error);
    }
  };

  return (
  <div className="space-y-6">
<div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            {editingProfessional ? 'Editar Fisioterapeuta' : 'Novo Fisioterapeuta'}
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

          {/* NOVOS CAMPOS ADICIONADOS */}

          <div>
            <Label htmlFor="specialties">Especialidades (separadas por vírgula)</Label>
            <Input
              id="specialties"
              value={formData.specialties?.join(', ') || ''}
              onChange={(e) => setFormData({ ...formData, specialties: e.target.value.split(',').map(s => s.trim()) })}
            />
          </div>

          <div>
            <Label htmlFor="bio">Biografia</Label>
            <Input
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="profile_picture_url">URL da Foto de Perfil</Label>
            <Input
              id="profile_picture_url"
              value={formData.profile_picture_url || ''}
              onChange={(e) => setFormData({ ...formData, profile_picture_url: e.target.value })}
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
              {editingProfessional ? 'Atualizar' : 'Adicionar'}
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
    
    {filteredProfessionals.map((Professional) => (
  <Card key={Professional.id} className={!Professional.isActive ? 'opacity-60 transition-opacity' : ''}>
  <CardHeader className="p-4 pb-0">
    <div className="flex justify-between items-center">
      {/* Badge de Status no Canto Superior Esquerdo */}
      <Badge
        className={`w-fit font-medium text-xs ${
          Professional.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}
      >
        {Professional.isActive ? 'Ativo' : 'Inativo'}
      </Badge>
      
      {/* Botões de Ação no Canto Superior Direito */}
      <div className="flex space-x-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleStatusToggle(Professional)}
          title={Professional.isActive ? 'Desativar' : 'Ativar'}
          className="text-gray-500 hover:bg-gray-100"
        >
          {Professional.isActive ? (
            <UserCheck className="h-4 w-4 text-green-600" />
          ) : (
            <UserX className="h-4 w-4 text-red-600" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleEdit(Professional)}
          title="Editar"
          className="text-gray-500 hover:bg-gray-100"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDelete(Professional.id)}
          title="Excluir"
          className="text-red-500 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
    
    {/* Título e Conteúdo Abaixo da Barra Superior */}
    <CardTitle className="text-xl font-bold mt-2">{Professional.name}</CardTitle>
  </CardHeader>
  
  <CardContent className="p-4 pt-2 space-y-2 text-sm text-gray-700">
    {Professional.email && (
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-gray-400" />
        <span>{Professional.email}</span>
      </div>
    )}
    {Professional.phone && (
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-gray-400" />
        <span>{Professional.phone}</span>
      </div>
    )}
    {Professional.crefito && (
      <div className="flex items-center gap-2 font-medium text-gray-800">
        <BadgeCheck className="h-4 w-4 text-blue-500" />
        <span>CREFITO: {Professional.crefito}</span>
      </div>
    )}
    {Professional.specialties && Professional.specialties.length > 0 && (
      <div className="flex flex-wrap gap-2 pt-2">
        {Professional.specialties.map((specialty, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {specialty}
          </Badge>
        ))}
      </div>
    )}
  </CardContent>
</Card>
    ))}
  </div>

  {filteredProfessionals.length === 0 && (
    <div className="text-center py-8 text-gray-500">
      {searchTerm ? 'Nenhum fisioterapeuta encontrado.' : 'Nenhum fisioterapeuta cadastrado.'}
    </div>
  )}
</div>
  );
}
