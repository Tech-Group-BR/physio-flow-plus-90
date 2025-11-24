import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useClinic } from "@/contexts/ClinicContext";
import { Plus, Package, DollarSign, Calendar, Users, Edit, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Interfaces para tipagem dos dados (padrão snake_case do banco)
interface SessionPackage {
  id: string;
  name: string;
  description: string;
  sessions: number;
  price: number;
  validity_days: number;
  treatment_type: string;
  is_active: boolean;
}

interface PatientPackage {
  id: string;
  patient_id: string;
  package_id: string;
  sessions_used: number;
  purchase_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'completed';
}

export function PackagesPage() {
  const navigate = useNavigate();
  const { patients} = useClinic();
  const { clinicId} = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("packages");

  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [patientPackages, setPatientPackages] = useState<PatientPackage[]>([]);

  // CORREÇÃO: Estado dedicado para o formulário de criação/edição de pacotes
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SessionPackage | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', sessions: '', price: '', validity_days: '', treatment_type: '' });
  
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedPackageToSell, setSelectedPackageToSell] = useState<SessionPackage | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para buscar todos os dados necessários
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: packagesData, error: packagesError } = await supabase.from('session_packages').select('*').order('created_at', { ascending: false });
      if (packagesError) throw packagesError;
      setPackages(packagesData || []);

      const { data: patientPackagesData, error: patientPackagesError } = await supabase.from('patient_packages').select('*').order('purchase_date', { ascending: false });
      if (patientPackagesError) throw patientPackagesError;
      setPatientPackages(patientPackagesData || []);
    } catch (error) {
      console.error("Erro ao buscar dados do Supabase:", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // IMPLEMENTADO: Função para criar ou editar um MODELO de pacote
  const handleSubmitPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validação básica
    if (!formData.name || !formData.sessions || !formData.price || !formData.validity_days || !formData.treatment_type) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      setIsSubmitting(false);
      return;
    }

    const packageData = {
      name: formData.name,
      description: formData.description,
      sessions: parseInt(formData.sessions),
      price: parseFloat(formData.price),
      validity_days: parseInt(formData.validity_days),
      treatment_type: formData.treatment_type,
      clinic_id: clinicId // <-- Adicione esta linha para criação e atualização
    };

    const { error } = editingPackage
      ? await supabase.from('session_packages').update(packageData).eq('id', editingPackage.id)
      : await supabase.from('session_packages').insert([packageData]);

    setIsSubmitting(false);
    if (error) {
      toast.error("Erro ao salvar pacote: " + error.message);
      console.error("Erro ao salvar pacote:", error);
    } else {
      handleCancelPackage();
      fetchData();
      toast.success(`Pacote ${editingPackage ? 'atualizado' : 'criado'} com sucesso!`);
    }
  };

  // Função para apagar um MODELO de pacote
  const deletePackage = async (packageId: string) => {
    if (window.confirm("Tem certeza que deseja apagar este modelo de pacote?")) {
      const { error } = await supabase.from('session_packages').delete().eq('id', packageId);
      if (error) {
        console.error("Erro ao deletar pacote:", error);
        toast.error("Erro ao deletar pacote.");
      }
      else {
        fetchData();
        toast.success("Pacote deletado com sucesso!");
      }
    }
  };

  // Função para ativar/desativar um MODELO de pacote
  const togglePackageStatus = async (pkg: SessionPackage) => {
    const newStatus = !pkg.is_active;
    const { error } = await supabase.from('session_packages').update({ is_active: newStatus }).eq('id', pkg.id);
    if (error) {
      console.error(`Erro ao ${newStatus ? 'ativar' : 'desativar'} pacote:`, error);
      toast.error(`Erro ao ${newStatus ? 'ativar' : 'desativar'} pacote.`);
    }
    else {
      fetchData();
      toast.success(`Pacote ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
    }
  };

  // Função para vender um pacote a um paciente
  const handleConfirmSale = async () => {
    if (!selectedPackageToSell || !selectedPatientId || !paymentMethod) {
      toast.error("Por favor, selecione o paciente e o método de pagamento.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('sell_package', {
        p_clinic_id: clinicId,
        p_package_id: selectedPackageToSell.id,
        p_patient_id: selectedPatientId,
        p_payment_method: paymentMethod as Database['public']['Enums']['payment_method_enum']
      } as any);
      if (error) throw error;
      toast.success("Venda registrada com sucesso!");
      setShowSellModal(false);
      setSelectedPatientId('');
      setPaymentMethod('');
      fetchData();
    } catch (error) {
      console.error("Erro ao vender pacote:", error);
      toast.error("Ocorreu um erro ao registrar a venda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funções para controlar a abertura/fechamento do formulário de pacote
  const handleEditPackage = (pkg: SessionPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      sessions: pkg.sessions.toString(),
      price: pkg.price.toString(),
      validity_days: pkg.validity_days.toString(),
      treatment_type: pkg.treatment_type
    });
    setShowPackageForm(true);
  };

  const handleCancelPackage = () => {
    setShowPackageForm(false);
    setEditingPackage(null);
    setFormData({ name: '', description: '', sessions: '', price: '', validity_days: '', treatment_type: '' });
  };

  // Função para NAVEGAR para a página de agendamento de uma sessão de pacote
  const handleSchedule = (patientId: string, patientPackageId: string) => {
    navigate(`/agenda`);
  };

  // Cálculos para os cards de resumo
  const totalRevenueFromSoldPackages = patientPackages.reduce((sum, p_pkg) => {
    const originalPackage = packages.find(pkg => pkg.id === p_pkg.package_id);
    return sum + (originalPackage?.price || 0);
  }, 0);

  const treatmentTypes = ['Fisioterapia Ortopédica', 'RPG', 'Pilates Clínico'];

  if (isLoading) {
    return <div className="p-4 text-center">Carregando pacotes...</div>;
  }
  
  // Renderiza o formulário de criação/edição de pacote quando showPackageForm é true
  if (showPackageForm) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">{editingPackage ? 'Editar Modelo de Pacote' : 'Novo Modelo de Pacote'}</h1>
          <Button onClick={handleCancelPackage} variant="outline" className="w-full sm:w-auto">
            Cancelar
          </Button>
        </div>
        <form onSubmit={handleSubmitPackage} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Dados do Pacote</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="name">Nome do Pacote *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div><Label htmlFor="treatmentType">Tipo de Tratamento *</Label><Select value={formData.treatment_type} onValueChange={(value) => setFormData({ ...formData, treatment_type: value })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{treatmentTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select></div>
                <div><Label htmlFor="sessions">Número de Sessões *</Label><Input id="sessions" type="number" value={formData.sessions} onChange={(e) => setFormData({ ...formData, sessions: e.target.value })} required /></div>
                <div><Label htmlFor="price">Preço Total (R$) *</Label><Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required /></div>
                <div><Label htmlFor="validityDays">Validade (dias) *</Label><Input id="validityDays" type="number" value={formData.validity_days} onChange={(e) => setFormData({ ...formData, validity_days: e.target.value })} required /></div>
              </div>
              <div><Label htmlFor="description">Descrição</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            </CardContent>
          </Card>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">{isSubmitting ? 'Salvando...' : editingPackage ? 'Atualizar Pacote' : 'Criar Pacote'}</Button>
          </div>
        </form>
      </div>
    );
  }

  // Renderiza a página principal com as duas visualizações
  return (
    <>
      <Dialog open={showSellModal} onOpenChange={setShowSellModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vender Pacote: {selectedPackageToSell?.name}</DialogTitle><DialogDescription>Selecione o paciente e confirme os detalhes da venda.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="patient">Paciente *</Label><Select onValueChange={setSelectedPatientId} value={selectedPatientId}><SelectTrigger><SelectValue placeholder="Selecione um paciente" /></SelectTrigger><SelectContent>{patients.map(p => (<SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="payment-method">Método de Pagamento *</Label>
              <Select onValueChange={setPaymentMethod} value={paymentMethod}><SelectTrigger>
                <SelectValue placeholder="Selecione o método" /></SelectTrigger><SelectContent>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem><SelectItem value="debit_card">Cartão de Débito</SelectItem><SelectItem value="cash">Dinheiro</SelectItem></SelectContent></Select></div>
            <div className="text-lg font-bold">Valor: R$ {selectedPackageToSell?.price.toFixed(2)}</div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowSellModal(false)}>Cancelar</Button><Button onClick={handleConfirmSale} disabled={!selectedPatientId || !paymentMethod || isSubmitting}>{isSubmitting ? 'Confirmando...' : 'Confirmar Venda'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold sm:text-3xl">Pacotes e Serviços</h1>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:space-x-2">
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="packages">Gerenciar Modelos</SelectItem>
                <SelectItem value="patient-packages">Pacotes dos Pacientes</SelectItem>
              </SelectContent>
            </Select>
            {viewMode === "packages" && (<Button onClick={() => setShowPackageForm(true)} className="flex items-center space-x-2 w-full sm:w-auto"><Plus className="h-4 w-4" /> <span>Novo Modelo</span></Button>)}
          </div>
        </div>

        {viewMode === "packages" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><CardContent className="p-6"><div className="flex items-center space-x-2"><Package className="h-5 w-5 text-blue-600" /><div><p className="text-sm text-muted-foreground">Modelos de Pacote</p><p className="text-2xl font-bold">{packages.length}</p></div></div></CardContent></Card>
              <Card><CardContent className="p-6"><div className="flex items-center space-x-2"><Users className="h-5 w-5 text-green-600" /><div><p className="text-sm text-muted-foreground">Modelos Ativos</p><p className="text-2xl font-bold">{packages.filter(p => p.is_active).length}</p></div></div></CardContent></Card>
              <Card><CardContent className="p-6"><div className="flex items-center space-x-2"><DollarSign className="h-5 w-5 text-yellow-600" /><div><p className="text-sm text-muted-foreground">Receita Total (Vendido)</p><p className="text-2xl font-bold">R$ {totalRevenueFromSoldPackages.toFixed(2)}</p></div></div></CardContent></Card>
            </div>
            <div className="grid gap-4">
              {packages.map((pkg) => (
                <Card key={pkg.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:space-x-3 mb-2">
                          <div className="flex items-center space-x-3"><Package className="h-5 w-5" /><h3 className="text-lg font-semibold">{pkg.name}</h3></div>
                          <Badge variant={pkg.is_active ? "default" : "secondary"}>{pkg.is_active ? "Ativo" : "Inativo"}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div><strong>Sessões:</strong> {pkg.sessions}</div>
                          <div><strong>Preço:</strong> R$ {pkg.price.toFixed(2)}</div>
                          <div><strong>Validade:</strong> {pkg.validity_days} dias</div>
                          <div><strong>Tratamento:</strong> {pkg.treatment_type}</div>
                        </div>
                        {pkg.description && (<div className="mt-2 text-sm text-muted-foreground">{pkg.description}</div>)}
                      </div>
                      <div className="flex flex-col w-full items-stretch space-y-2 sm:w-auto sm:flex-row sm:items-center sm:space-x-2">
                        <Button variant="default" size="sm" onClick={() => { setSelectedPackageToSell(pkg); setShowSellModal(true); }} className="flex-1 sm:flex-initial"><DollarSign className="h-4 w-4 mr-1" /> Vender</Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditPackage(pkg)} className="flex-1 sm:flex-initial"><Edit className="h-4 w-4" /></Button>
                        <Button variant={pkg.is_active ? "secondary" : "default"} size="sm" onClick={() => togglePackageStatus(pkg)} className="flex-1 sm:flex-initial">{pkg.is_active ? "Desativar" : "Ativar"}</Button>
                        <Button variant="destructive" size="icon" onClick={() => deletePackage(pkg.id)} className="w-auto sm:w-10"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Pacotes dos Pacientes</CardTitle></CardHeader>
              <CardContent>
                {patientPackages.length === 0 ? (<p className="text-center text-muted-foreground py-8">Nenhum pacote vendido</p>) : (
                  <div className="space-y-4">
                    {patientPackages.map((p_pkg) => {
                      const patient = patients.find(p => p.id === p_pkg.patient_id);
                      const pkg = packages.find(p => p.id === p_pkg.package_id);
                      const remainingSessions = pkg ? pkg.sessions - p_pkg.sessions_used : 0;
                      return (
                        <div key={p_pkg.id} className="border rounded p-4">
                          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1">
                              <div className="flex flex-col items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-3 mb-2">
                                <div className="flex items-center space-x-3"><Users className="h-5 w-5" /><h3 className="font-semibold">{patient?.fullName || 'Paciente não encontrado'}</h3></div>
                                <Badge variant={p_pkg.status === 'active' ? 'default' : p_pkg.status === 'completed' ? 'secondary' : 'destructive'}>{p_pkg.status === 'active' ? 'Ativo' : p_pkg.status === 'completed' ? 'Completo' : 'Expirado'}</Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div><strong>Pacote:</strong> {pkg?.name || 'Modelo não encontrado'}</div>
                                <div><strong>Sessões:</strong> {p_pkg.sessions_used} / {pkg?.sessions || '?'}</div>
                                <div><strong>Restantes:</strong> {remainingSessions}</div>
                                <div><strong>Expira em:</strong> {new Date(p_pkg.expiry_date).toLocaleDateString('pt-BR')}</div>
                              </div>
                            </div>
                            <div className="flex flex-col w-full sm:w-auto items-stretch sm:flex-row sm:items-center">
                              {/* Botão "Agendar" agora chama a função de navegação correta */}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full" 
                                onClick={() => handleSchedule(p_pkg.patient_id, p_pkg.id)} 
                                disabled={remainingSessions <= 0 || p_pkg.status !== 'active'}
                              >
                                <Calendar className="h-4 w-4 mr-1" /> Agendar
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}