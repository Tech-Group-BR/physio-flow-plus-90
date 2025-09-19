import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useClinic } from "@/contexts/ClinicContext";
import { MedicalRecord } from "@/types";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

interface EvolutionFormProps {
  record: MedicalRecord;
  onSave: () => void;
  onCancel: () => void;
}

export function EvolutionForm({ record, onSave, onCancel }: EvolutionFormProps) {
  const { addEvolution, professionals, currentUser } = useClinic();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    professionalId: currentUser?.id || '',
    observations: '',
    // Omitido: painScale: '',
    // Omitido: mobilityScale: '',
    treatmentPerformed: '',
    // Omitido: nextSession: '',
    visibleToGuardian: true
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  /* // Omitido: A lista de níveis de dor não é mais necessária
  const painLevels = [
    { value: '0', label: '0 - Sem dor' },
    // ...
  ];
  */

  /* // Omitido: A lista de níveis de mobilidade não é mais necessária
  const mobilityLevels = [
    { value: '0', label: '0 - Imóvel' },
    // ...
  ];
  */

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Apenas arquivos de imagem (JPG, PNG, WEBP) são permitidos.",
        variant: "destructive",
      });
      return;
    }

    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Arquivo muito grande",
        description: "Cada foto deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setPhotos(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const fileExt = photo.name.split('.').pop();
      const fileName = `${record.id}_${Date.now()}_${i}.${fileExt}`;
      const filePath = `evolutions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('evolution-photos')
        .upload(filePath, photo);

      if (uploadError) {
        console.error('Erro ao fazer upload da foto:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('evolution-photos')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.observations || !formData.treatmentPerformed) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha pelo menos as observações e o tratamento realizado.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.professionalId) {
      toast({
        title: "Profissional não selecionado",
        description: "Por favor, selecione um profissional.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const photoUrls = await uploadPhotos();
      
      const evolutionData = {
        recordId: record.id,
        date: formData.date,
        professional_id: formData.professionalId, 
        observations: formData.observations,
        // Omitido: painScale: formData.painScale ? parseInt(formData.painScale) : 0,
        // Omitido: mobilityScale: formData.mobilityScale ? parseInt(formData.mobilityScale) : 0,
        treatmentPerformed: formData.treatmentPerformed,
        // Omitido: nextSession: formData.nextSession,
        files: [],
        media: photoUrls.map(url => ({
          id: `${Date.now()}_${Math.random()}`,
          type: 'photo' as const,
          url,
          description: '',
          uploadedAt: new Date().toISOString()
        })),
        visibleToGuardian: formData.visibleToGuardian
      };

      await addEvolution(evolutionData as any); // Usando 'as any' para ignorar os campos comentados
      onSave();
    } catch (error: any) {
      console.error('Erro ao salvar evolução:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar evolução: " + error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova Evolução</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="professionalId">Fisioterapeuta *</Label>
              <Select value={formData.professionalId} onValueChange={(value) => setFormData({ ...formData, professionalId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fisioterapeuta" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((physio) => (
                    <SelectItem key={physio.id} value={physio.id}>
                      {physio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Omitido: O campo Escala de Dor foi comentado */}
            {/*
            <div>
              <Label htmlFor="painScale">Escala de Dor (0-10)</Label>
              <Select value={formData.painScale} onValueChange={(value) => setFormData({ ...formData, painScale: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a dor" />
                </SelectTrigger>
                <SelectContent>
                  {painLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            */}

            {/* Omitido: O campo Escala de Mobilidade foi comentado */}
            {/*
            <div>
              <Label htmlFor="mobilityScale">Escala de Mobilidade (0-10)</Label>
              <Select value={formData.mobilityScale} onValueChange={(value) => setFormData({ ...formData, mobilityScale: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a mobilidade" />
                </SelectTrigger>
                <SelectContent>
                  {mobilityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            */}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="visibleToGuardian"
              checked={formData.visibleToGuardian}
              onCheckedChange={(checked) => setFormData({ ...formData, visibleToGuardian: checked as boolean })}
            />
            <Label htmlFor="visibleToGuardian" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Visível para responsável/paciente
            </Label>
          </div>

          <div>
            <Label htmlFor="observations">Observações *</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Observações sobre o estado do paciente, progresso, etc..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="treatmentPerformed">Tratamento Realizado *</Label>
            <Textarea
              id="treatmentPerformed"
              value={formData.treatmentPerformed}
              onChange={(e) => setFormData({ ...formData, treatmentPerformed: e.target.value })}
              placeholder="Descreva os exercícios, técnicas e procedimentos realizados..."
              rows={4}
              required
            />
          </div>

          {/* Omitido: O campo Próxima Sessão foi comentado */}
          {/*
          <div>
            <Label htmlFor="nextSession">Próxima Sessão</Label>
            <Textarea
              id="nextSession"
              value={formData.nextSession}
              onChange={(e) => setFormData({ ...formData, nextSession: e.target.value })}
              placeholder="Planejamento para a próxima sessão..."
              rows={3}
            />
          </div>
          */}

          <div>
            <Label htmlFor="photos">Fotos da Evolução</Label>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label 
                  htmlFor="photo-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Clique para adicionar fotos</span> ou arraste e solte
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (máx. 5MB cada)</p>
                  </div>
                  <input 
                    id="photo-upload" 
                    type="file" 
                    className="hidden" 
                    multiple 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>

              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={uploading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={uploading}>
          {uploading ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Evolução'
          )}
        </Button>
      </div>
    </form>
  );
}