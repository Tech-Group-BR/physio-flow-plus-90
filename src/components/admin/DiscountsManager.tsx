import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Percent } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionDiscount {
  id: string;
  period: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  months: number;
  discount_percent: number;
  display_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DiscountFormData {
  period: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  months: string;
  discount_percent: string;
  display_name: string;
  description: string;
  is_active: boolean;
}

const PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Mensal', defaultMonths: 1 },
  { value: 'quarterly', label: 'Trimestral', defaultMonths: 3 },
  { value: 'semiannual', label: 'Semestral', defaultMonths: 6 },
  { value: 'annual', label: 'Anual', defaultMonths: 12 },
];

export function DiscountsManager() {
  const [discounts, setDiscounts] = useState<SubscriptionDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<SubscriptionDiscount | null>(null);
  const [formData, setFormData] = useState<DiscountFormData>({
    period: 'monthly',
    months: '1',
    discount_percent: '0',
    display_name: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('subscription_discounts')
        .select('*')
        .order('months', { ascending: true });

      if (error) throw error;
      setDiscounts((data || []) as SubscriptionDiscount[]);
    } catch (error) {
      console.error('Error loading discounts:', error);
      toast.error('Erro ao carregar descontos');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      period: 'monthly',
      months: '1',
      discount_percent: '0',
      display_name: '',
      description: '',
      is_active: true,
    });
    setEditingDiscount(null);
  };

  const handleOpenDialog = (discount?: SubscriptionDiscount) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        period: discount.period,
        months: discount.months.toString(),
        discount_percent: discount.discount_percent.toString(),
        display_name: discount.display_name,
        description: discount.description,
        is_active: discount.is_active,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handlePeriodChange = (period: string) => {
    const option = PERIOD_OPTIONS.find(opt => opt.value === period);
    setFormData({
      ...formData,
      period: period as DiscountFormData['period'],
      months: option?.defaultMonths.toString() || '1',
      display_name: option?.label || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const discountData = {
        period: formData.period,
        months: parseInt(formData.months),
        discount_percent: parseFloat(formData.discount_percent),
        display_name: formData.display_name,
        description: formData.description,
        is_active: formData.is_active,
      };

      if (editingDiscount) {
        // Update existing discount
        const { error } = await (supabase as any)
          .from('subscription_discounts')
          .update(discountData)
          .eq('id', editingDiscount.id);

        if (error) throw error;
        toast.success('Desconto atualizado com sucesso!');
      } else {
        // Create new discount
        const { error } = await (supabase as any)
          .from('subscription_discounts')
          .insert([discountData]);

        if (error) throw error;
        toast.success('Desconto criado com sucesso!');
      }

      handleCloseDialog();
      loadDiscounts();
    } catch (error) {
      console.error('Error saving discount:', error);
      toast.error('Erro ao salvar desconto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este desconto? Isso também removerá todos os preços calculados relacionados.')) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('subscription_discounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Desconto excluído com sucesso!');
      loadDiscounts();
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast.error('Erro ao excluir desconto');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Carregando descontos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Descontos</h2>
          <p className="text-muted-foreground text-sm">
            Configure os descontos por período. Os preços serão calculados automaticamente.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Desconto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingDiscount ? 'Editar Desconto' : 'Novo Desconto'}
                </DialogTitle>
                <DialogDescription>
                  Configure o desconto por período de pagamento.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="period">Período *</Label>
                  <Select
                    value={formData.period}
                    onValueChange={handlePeriodChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label} ({option.defaultMonths} {option.defaultMonths === 1 ? 'mês' : 'meses'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="months">Número de Meses *</Label>
                    <Input
                      id="months"
                      type="number"
                      min="1"
                      max="36"
                      value={formData.months}
                      onChange={(e) => setFormData({ ...formData, months: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="discount_percent">Desconto (%) *</Label>
                    <Input
                      id="discount_percent"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="display_name">Nome de Exibição *</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Ex: Mensal, Trimestral, Anual"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Economize 30% pagando 12 meses"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Desconto Ativo
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDiscount ? 'Salvar Alterações' : 'Criar Desconto'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Período</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-center">Meses</TableHead>
              <TableHead className="text-right">Desconto</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum desconto cadastrado
                </TableCell>
              </TableRow>
            ) : (
              discounts.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell className="font-medium">
                    <Badge variant="outline">
                      {discount.period}
                    </Badge>
                  </TableCell>
                  <TableCell>{discount.display_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {discount.description}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {discount.months} {discount.months === 1 ? 'mês' : 'meses'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <div className="flex items-center justify-end gap-1">
                      <Percent className="h-3 w-3" />
                      {discount.discount_percent.toFixed(0)}%
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {discount.is_active ? (
                      <Badge variant="default" className="bg-green-500">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(discount)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(discount.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
