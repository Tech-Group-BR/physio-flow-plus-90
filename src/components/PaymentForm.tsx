
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClinic } from "@/contexts/ClinicContext";
import { format } from "date-fns";

interface PaymentFormProps {
  onSave: () => void;
  onCancel: () => void;
}

export function PaymentForm({ onSave, onCancel }: PaymentFormProps) {
  const { addPayment, patients } = useClinic();
  
  const [formData, setFormData] = useState({
    patientId: '',
    amount: '',
    method: '',
    status: 'pendente',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  });

  const paymentMethods = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'pix', label: 'pix' },
    { value: 'cartao', label: 'Cartão' },
    { value: 'transferencia', label: 'Transferência' }
  ];

  const paymentStatuses = [
    { value: 'pago', label: 'Pago' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.amount || !formData.method || !formData.description) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    const paymentData = {
      patientId: formData.patientId,
      amount: parseFloat(formData.amount),
      method: formData.method as 'dinheiro' | 'pix' | 'cartao' | 'transferencia',
      status: formData.status as 'pago' | 'pendente' | 'cancelado',
      type: 'recebimento' as const,
      dueDate: formData.dueDate,
      description: formData.description,
      paidDate: formData.status === 'pago' ? new Date().toISOString() : undefined
    };

    addPayment(paymentData);
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados do Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patientId">Paciente *</Label>
              <Select value={formData.patientId} onValueChange={(value) => setFormData({ ...formData, patientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0,00"
                required
              />
            </div>

            <div>
              <Label htmlFor="method">Método de Pagamento *</Label>
              <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {paymentStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="dueDate">Data de Vencimento *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do pagamento (ex: Sessão de fisioterapia, pacote 10 sessões, etc.)"
              rows={3}
              required
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar Pagamento
        </Button>
      </div>
    </form>
  );
}
