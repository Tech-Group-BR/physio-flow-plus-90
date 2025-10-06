import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  period: number;
  features: string[] | null;
  is_active: boolean;
  popular: boolean;
  created_at: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string;
  is_active: boolean;
  popular: boolean;
}

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    period: '30',
    features: '',
    is_active: true,
    popular: false,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('products')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      period: '30',
      features: '',
      is_active: true,
      popular: false,
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        period: product.period.toString(),
        features: product.features ? product.features.join('\n') : '',
        is_active: product.is_active,
        popular: product.popular,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Parse features from textarea (one per line)
      const featuresArray = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        period: parseInt(formData.period),
        features: featuresArray,
        is_active: formData.is_active,
        popular: formData.popular,
      };

      if (editingProduct) {
        // Update existing product
        const { error } = await (supabase as any)
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Produto atualizado com sucesso!');
      } else {
        // Create new product
        const { error } = await (supabase as any)
          .from('products')
          .insert([productData]);

        if (error) throw error;
        toast.success('Produto criado com sucesso!');
      }

      handleCloseDialog();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto? Isso também removerá todos os preços calculados relacionados.')) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Produto excluído com sucesso!');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Carregando produtos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Produtos</h2>
          <p className="text-muted-foreground text-sm">
            Configure os planos base. Os preços com descontos serão calculados automaticamente.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </DialogTitle>
                <DialogDescription>
                  Configure o plano base. O sistema calculará automaticamente os preços com desconto.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Plano *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Starter, Professional, Enterprise"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Ideal para clínicas pequenas"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Preço Base (R$) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="21.90"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Preço mensal sem desconto
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="period">Período (dias)</Label>
                    <Input
                      id="period"
                      type="number"
                      min="1"
                      value={formData.period}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      placeholder="30"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Geralmente 30 dias
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="features">Recursos (um por linha)</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="Até 200 pacientes&#10;Agenda básica&#10;WhatsApp integrado&#10;Relatórios simples"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                      Plano Ativo
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="popular"
                      checked={formData.popular}
                      onCheckedChange={(checked) => setFormData({ ...formData, popular: checked })}
                    />
                    <Label htmlFor="popular" className="cursor-pointer">
                      Marcar como Popular
                    </Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
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
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Preço Base</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Recursos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum produto cadastrado
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {product.name}
                      {product.popular && (
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {product.description || '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="h-3 w-3" />
                      {product.price.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {product.is_active ? (
                      <Badge variant="default" className="bg-green-500">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {product.features?.length || 0} recursos
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
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
