
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClinic } from "@/contexts/ClinicContext";
import { Plus, Package, DollarSign, Calendar, Users, Edit, Trash2 } from "lucide-react";

interface SessionPackage {
  id: string;
  name: string;
  description: string;
  sessions: number;
  price: number;
  validityDays: number;
  treatmentType: string;
  isActive: boolean;
  createdAt: string;
}

interface PatientPackage {
  id: string;
  patientId: string;
  packageId: string;
  sessionsUsed: number;
  purchaseDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'completed';
}

export function PackagesPage() {
  const { patients } = useClinic();
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SessionPackage | undefined>();
  const [viewMode, setViewMode] = useState("packages");

  // Mock data para pacotes
  const [packages, setPackages] = useState<SessionPackage[]>([
    {
      id: '1',
      name: 'Pacote Básico - 5 Sessões',
      description: 'Ideal para tratamentos de curta duração',
      sessions: 5,
      price: 450.00,
      validityDays: 30,
      treatmentType: 'Fisioterapia Ortopédica',
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Pacote Premium - 10 Sessões',
      description: 'Melhor custo-benefício para tratamentos completos',
      sessions: 10,
      price: 800.00,
      validityDays: 60,
      treatmentType: 'Fisioterapia Ortopédica',
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '3',
      name: 'RPG - 8 Sessões',
      description: 'Pacote especializado em RPG',
      sessions: 8,
      price: 720.00,
      validityDays: 45,
      treatmentType: 'RPG',
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z'
    }
  ]);

  const [patientPackages, setPatientPackages] = useState<PatientPackage[]>([
    {
      id: '1',
      patientId: '1',
      packageId: '1',
      sessionsUsed: 2,
      purchaseDate: '2024-01-20T10:00:00Z',
      expiryDate: '2024-02-20T10:00:00Z',
      status: 'active'
    },
    {
      id: '2',
      patientId: '2',
      packageId: '2',
      sessionsUsed: 7,
      purchaseDate: '2024-01-10T10:00:00Z',
      expiryDate: '2024-03-10T10:00:00Z',
      status: 'active'
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sessions: '',
    price: '',
    validityDays: '',
    treatmentType: ''
  });

  const treatmentTypes = [
    'Fisioterapia Ortopédica',
    'Fisioterapia Neurológica',
    'Fisioterapia Respiratória',
    'RPG',
    'Pilates Clínico',
    'Hidroterapia'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const packageData: SessionPackage = {
      id: editingPackage?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      sessions: parseInt(formData.sessions),
      price: parseFloat(formData.price),
      validityDays: parseInt(formData.validityDays),
      treatmentType: formData.treatmentType,
      isActive: true,
      createdAt: editingPackage?.createdAt || new Date().toISOString()
    };

    if (editingPackage) {
      setPackages(prev => prev.map(pkg => pkg.id === editingPackage.id ? packageData : pkg));
    } else {
      setPackages(prev => [...prev, packageData]);
    }

    handleCancel();
  };

  const handleEdit = (pkg: SessionPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      sessions: pkg.sessions.toString(),
      price: pkg.price.toString(),
      validityDays: pkg.validityDays.toString(),
      treatmentType: pkg.treatmentType
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPackage(undefined);
    setFormData({
      name: '',
      description: '',
      sessions: '',
      price: '',
      validityDays: '',
      treatmentType: ''
    });
  };

  const togglePackageStatus = (packageId: string) => {
    setPackages(prev => 
      prev.map(pkg => 
        pkg.id === packageId ? { ...pkg, isActive: !pkg.isActive } : pkg
      )
    );
  };

  const deletePackage = (packageId: string) => {
    setPackages(prev => prev.filter(pkg => pkg.id !== packageId));
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {editingPackage ? 'Editar Pacote' : 'Novo Pacote'}
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Pacote</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Pacote *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Pacote Básico - 5 Sessões"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="treatmentType">Tipo de Tratamento *</Label>
                  <Select value={formData.treatmentType} onValueChange={(value) => setFormData({ ...formData, treatmentType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tratamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {treatmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sessions">Número de Sessões *</Label>
                  <Input
                    id="sessions"
                    type="number"
                    value={formData.sessions}
                    onChange={(e) => setFormData({ ...formData, sessions: e.target.value })}
                    placeholder="5"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price">Preço Total *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="450.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="validityDays">Validade (dias) *</Label>
                  <Input
                    id="validityDays"
                    type="number"
                    value={formData.validityDays}
                    onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
                    placeholder="30"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do pacote..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingPackage ? 'Atualizar' : 'Criar'} Pacote
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 👇 CORREÇÃO 1: Cabeçalho da página agora é responsivo 👇 */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Pacotes de Sessões</h1>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:space-x-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="packages">Gerenciar Pacotes</SelectItem>
              <SelectItem value="patient-packages">Pacotes dos Pacientes</SelectItem>
            </SelectContent>
          </Select>
          
          {viewMode === "packages" && (
            <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Novo Pacote</span>
            </Button>
          )}
        </div>
      </div>

      {viewMode === "packages" ? (
        <>
          {/* Os cards do topo já estavam responsivos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Pacotes</p>
                    <p className="text-2xl font-bold">{packages.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pacotes Ativos</p>
                    <p className="text-2xl font-bold">{packages.filter(p => p.isActive).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Receita Potencial</p>
                    <p className="text-2xl font-bold">
                      R$ {packages.reduce((sum, pkg) => sum + pkg.price, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* 👇 CORREÇÃO 2: Layout interno dos cards de pacote agora é responsivo 👇 */}
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:space-x-3 mb-2">
                        <div className="flex items-center space-x-3">
                           <Package className="h-5 w-5" />
                           <h3 className="text-lg font-semibold">{pkg.name}</h3>
                        </div>
                        <Badge variant={pkg.isActive ? "default" : "secondary"}>
                          {pkg.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div><strong>Sessões:</strong> {pkg.sessions}</div>
                        <div><strong>Preço:</strong> R$ {pkg.price.toFixed(2)}</div>
                        <div><strong>Validade:</strong> {pkg.validityDays} dias</div>
                        <div><strong>Tratamento:</strong> {pkg.treatmentType}</div>
                      </div>

                      {pkg.description && (
                        <div className="mt-2 text-sm text-muted-foreground">{pkg.description}</div>
                      )}
                      <div className="mt-2 text-sm">
                        <strong>Preço por sessão:</strong> R$ {(pkg.price / pkg.sessions).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex w-full items-center space-x-2 sm:w-auto">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(pkg)} className="flex-1 sm:flex-initial">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant={pkg.isActive ? "destructive" : "default"} size="sm" onClick={() => togglePackageStatus(pkg.id)} className="flex-1 sm:flex-initial">
                        {pkg.isActive ? "Desativar" : "Ativar"}
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => deletePackage(pkg.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
              {patientPackages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum paciente possui pacotes ativos</p>
              ) : (
                <div className="space-y-4">
                  {patientPackages.map((patientPkg) => {
                    const patient = patients.find(p => p.id === patientPkg.patientId);
                    const pkg = packages.find(p => p.id === patientPkg.packageId);
                    const remainingSessions = pkg ? pkg.sessions - patientPkg.sessionsUsed : 0;
                    
                    return (
                      <div key={patientPkg.id} className="border rounded p-4">
                        {/* 👇 CORREÇÃO 3: Layout interno dos cards de paciente agora é responsivo 👇 */}
                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <div className="flex flex-col items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-3 mb-2">
                              <div className="flex items-center space-x-3">
                                <Users className="h-5 w-5" />
                                <h3 className="font-semibold">{patient?.fullName}</h3>
                              </div>
                              <Badge variant={
                                patientPkg.status === 'active' ? 'default' :
                                patientPkg.status === 'completed' ? 'secondary' : 'destructive'
                              }>
                                {patientPkg.status === 'active' ? 'Ativo' :
                                 patientPkg.status === 'completed' ? 'Completo' : 'Expirado'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div><strong>Pacote:</strong> {pkg?.name}</div>
                              <div><strong>Sessões utilizadas:</strong> {patientPkg.sessionsUsed}/{pkg?.sessions}</div>
                              <div><strong>Sessões restantes:</strong> {remainingSessions}</div>
                              <div><strong>Expira em:</strong> {new Date(patientPkg.expiryDate).toLocaleDateString('pt-BR')}</div>
                            </div>
                          </div>
                          
                          <div className="flex w-full sm:w-auto">
                            <Button size="sm" variant="outline" className="w-full">
                              <Calendar className="h-4 w-4 mr-1" />
                              Agendar
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
  );
}
