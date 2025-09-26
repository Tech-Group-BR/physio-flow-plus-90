import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useClinic } from "@/contexts/ClinicContext";
import { Plus, Edit, Trash2, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  is_active: boolean;
}

export function RoomsManager() {
  const { rooms, addRoom, updateRoom, deleteRoom } = useClinic();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 1,
    equipment: '',
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const roomData = {
        name: formData.name,
        capacity: formData.capacity,
        equipment: formData.equipment.split(',').map(item => item.trim()).filter(item => item),
        is_active: true
      };

      if (editingRoom) {
        await updateRoom({ ...editingRoom, ...roomData });
        toast.success('Sala atualizada com sucesso!');
      } else {
        await addRoom(roomData);
        toast.success('Sala criada com sucesso!');
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar sala');
      console.error('Erro:', error);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity,
      equipment: room.equipment.join(', '),
      is_active: room.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (roomId: string) => {
    if (confirm('Tem certeza que deseja excluir esta sala?')) {
      try {
        await deleteRoom(roomId);
        toast.success('Sala excluída com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir sala');
        console.error('Erro:', error);
      }
    }
  };

  const handleToggleActive = async (room: Room) => {
    try {
      await updateRoom({ ...room, is_active: !room.is_active });
      toast.success(`Sala ${!room.is_active ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (error) {
      toast.error('Erro ao alterar status da sala');
      console.error('Erro:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      capacity: 1,
      equipment: '',
      is_active: true
    });
    setEditingRoom(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Salas</h2>
          <p className="text-muted-foreground">Configure as salas disponíveis para atendimento</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Sala
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRoom ? 'Editar Sala' : 'Nova Sala'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Sala</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Sala 1, Sala de Exercícios"
                  required
                />
              </div>

              <div>
                <Label htmlFor="capacity">Capacidade</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="equipment">Equipamentos (separados por vírgula)</Label>
                <Input
                  id="equipment"
                  value={formData.equipment}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
                  placeholder="Ex: Maca, Aparelho TENS, Bolas Suíças"
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
                  {editingRoom ? 'Atualizar' : 'Criar'} Sala
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <Card key={room.id} className="min-h-[380px] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{room.name}</span>
                </div>
                <div className="flex space-x-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(room)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(room.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 space-y-2 text-sm">
                <p><strong>Capacidade:</strong> {room.capacity} pessoa(s)</p>
                
                {room.equipment && room.equipment.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Equipamentos:</p>
                    <div className="max-h-[100px] overflow-y-auto">
                      <div className="flex flex-wrap gap-1">
                        {room.equipment.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-4 mt-auto border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={room.is_active}
                    onCheckedChange={() => handleToggleActive(room)}
                  />
                  <span className="text-sm">
                    {room.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <Badge variant={room.is_active ? "default" : "secondary"}>
                  {room.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

        {rooms.length === 0 && (
          <div className="col-span-full text-center py-12">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma sala cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando sua primeira sala de atendimento
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Sala
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}