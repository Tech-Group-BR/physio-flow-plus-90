import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Edit } from "lucide-react";
import { Professional } from "@/types";

interface ProfessionalHeaderProps {
  professional: Professional;
  onBack: () => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  editFormData: {
    name: string;
    email: string;
    phone: string;
    crefito: string;
    specialties: string[];
    bio: string;
    isActive: boolean;
    profile_picture_url: string;
  };
  setEditFormData: (data: any) => void;
  onSave: (e: React.FormEvent) => void;
}

export function ProfessionalHeader({ 
  professional, 
  onBack, 
  isEditDialogOpen,
  setIsEditDialogOpen,
  editFormData,
  setEditFormData,
  onSave
}: ProfessionalHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack} className="hidden sm:inline-flex">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-center space-x-4">
          {professional.profile_picture_url && (
            <img
              src={professional.profile_picture_url}
              alt={professional.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{professional.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={professional.isActive ? "default" : "secondary"}>
                {professional.isActive ? "Ativo" : "Inativo"}
              </Badge>
              {professional.crefito && (
                <Badge variant="outline">CREFITO: {professional.crefito}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Profissional</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSave} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(66) 99999-9999"
              />
            </div>
            <div>
              <Label htmlFor="crefito">CREFITO</Label>
              <Input
                id="crefito"
                value={editFormData.crefito}
                onChange={(e) => setEditFormData(prev => ({ ...prev, crefito: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bio">Biografia</Label>
              <Input
                id="bio"
                value={editFormData.bio}
                onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Descrição do profissional..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}