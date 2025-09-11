
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClinic } from "@/contexts/ClinicContext";

interface LeadFormProps {
  onSave: () => void;
  onCancel: () => void;
}

export function LeadForm({ onSave, onCancel }: LeadFormProps) {
  const { addLead } = useClinic();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    status: 'novo',
    treatmentInterest: '',
    notes: '',
    nextFollowUp: ''
  });

  const sources = [
    { value: 'google_ads', label: 'Google Ads' },
    { value: 'facebook_ads', label: 'Facebook Ads' },
    { value: 'instagram_ads', label: 'Instagram Ads' },
    { value: 'indicacao', label: 'Indicação' },
    { value: 'site', label: 'Site' },
    { value: 'outros', label: 'Outros' }
  ];

  const treatmentTypes = [
    'Fisioterapia Ortopédica',
    'Fisioterapia Neurológica',
    'Fisioterapia Cardiorrespiratória',
    'Fisioterapia Geriátrica',
    'Fisioterapia Desportiva',
    'RPG',
    'Pilates',
    'Outros'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.source) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    const leadData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      source: formData.source as 'google_ads' | 'facebook_ads' | 'instagram_ads' | 'indicacao' | 'site' | 'outros',
      status: formData.status as 'novo' | 'contato_inicial' | 'agendamento' | 'avaliacao' | 'proposta' | 'cliente' | 'perdido',
      treatmentInterest: formData.treatmentInterest,
      notes: formData.notes,
      nextFollowUp: formData.nextFollowUp || undefined,
      lastContact: new Date().toISOString()
    };

    addLead(leadData);
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados do Lead</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            <div>
              <Label htmlFor="source">Origem *</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="treatmentInterest">Interesse em Tratamento</Label>
              <Select value={formData.treatmentInterest} onValueChange={(value) => setFormData({ ...formData, treatmentInterest: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tratamento" />
                </SelectTrigger>
                <SelectContent>
                  {treatmentTypes.map((treatment) => (
                    <SelectItem key={treatment} value={treatment}>
                      {treatment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="nextFollowUp">Próximo Follow-up</Label>
              <Input
                id="nextFollowUp"
                type="datetime-local"
                value={formData.nextFollowUp}
                onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o lead..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar Lead
        </Button>
      </div>
    </form>
  );
}
