
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Star, Users, Zap, Shield, Headphones, Edit, Save, Eye } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  maxPatients: number;
  maxUsers: number;
  isPopular: boolean;
  description: string;
}

interface SalesConfig {
  companyName: string;
  companyLogo: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  testimonials: Array<{
    name: string;
    company: string;
    text: string;
    rating: number;
  }>;
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  contactEmail: string;
  supportPhone: string;
}

export function SalesPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: '1',
      name: 'Básico',
      price: 97,
      interval: 'monthly',
      features: [
        'Até 100 pacientes',
        'Agenda online',
        'Prontuários digitais',
        'Relatórios básicos',
        'Suporte por email'
      ],
      maxPatients: 100,
      maxUsers: 1,
      isPopular: false,
      description: 'Ideal para fisioterapeutas autônomos'
    },
    {
      id: '2',
      name: 'Profissional',
      price: 197,
      interval: 'monthly',
      features: [
        'Até 500 pacientes',
        'Múltiplos usuários (até 3)',
        'WhatsApp automático',
        'Gestão financeira completa',
        'Relatórios avançados',
        'Suporte prioritário'
      ],
      maxPatients: 500,
      maxUsers: 3,
      isPopular: true,
      description: 'Perfeito para clínicas pequenas e médias'
    },
    {
      id: '3',
      name: 'Enterprise',
      price: 397,
      interval: 'monthly',
      features: [
        'Pacientes ilimitados',
        'Usuários ilimitados',
        'API personalizada',
        'Integrações avançadas',
        'Relatórios personalizados',
        'Suporte 24/7',
        'Treinamento personalizado'
      ],
      maxPatients: -1,
      maxUsers: -1,
      isPopular: false,
      description: 'Para clínicas grandes e redes'
    }
  ]);

  const [salesConfig, setSalesConfig] = useState<SalesConfig>({
    companyName: 'FisioTech',
    companyLogo: '/logo.png',
    heroTitle: 'Sistema Completo para Gestão de Clínicas de Fisioterapia',
    heroSubtitle: 'Gerencie pacientes, agenda, prontuários e financeiro em uma única plataforma. Aumente sua produtividade e qualidade do atendimento.',
    ctaText: 'Comece seu Teste Grátis',
    contactEmail: 'vendas@fisiotech.com.br',
    supportPhone: '(11) 99999-9999',
    testimonials: [
      {
        name: 'Dr. Carlos Silva',
        company: 'Clínica FisioSaúde',
        text: 'O FisioTech revolucionou nossa clínica. Economizamos 5 horas por semana só na gestão administrativa.',
        rating: 5
      },
      {
        name: 'Dra. Maria Santos',
        company: 'Fisioterapia Integral',
        text: 'Excelente sistema! Os pacientes adoram receber as confirmações automáticas pelo WhatsApp.',
        rating: 5
      },
      {
        name: 'Dr. João Costa',
        company: 'Centro de Reabilitação',
        text: 'Relatórios muito detalhados que nos ajudam a tomar decisões estratégicas para o crescimento.',
        rating: 5
      }
    ],
    features: [
      {
        icon: 'Users',
        title: 'Gestão de Pacientes',
        description: 'Cadastro completo, histórico médico e controle de evolução em um só lugar.'
      },
      {
        icon: 'Calendar',
        title: 'Agenda Inteligente',
        description: 'Agendamentos online, confirmações automáticas e controle de disponibilidade.'
      },
      {
        icon: 'DollarSign',
        title: 'Controle Financeiro',
        description: 'Gestão de pagamentos, relatórios de faturamento e controle de inadimplência.'
      },
      {
        icon: 'BarChart',
        title: 'Relatórios Avançados',
        description: 'Análises detalhadas de performance, crescimento e indicadores da clínica.'
      },
      {
        icon: 'MessageSquare',
        title: 'WhatsApp Automático',
        description: 'Confirmações, lembretes e comunicação automatizada com pacientes.'
      },
      {
        icon: 'Shield',
        title: 'Segurança Total',
        description: 'Dados protegidos com criptografia e backup automático na nuvem.'
      }
    ]
  });

  const [newPlan, setNewPlan] = useState<Partial<Plan>>({
    name: '',
    price: 0,
    interval: 'monthly',
    features: [],
    maxPatients: 0,
    maxUsers: 0,
    isPopular: false,
    description: ''
  });

  const [newFeature, setNewFeature] = useState('');

  const handleSavePlan = () => {
    if (newPlan.name && newPlan.price) {
      const plan: Plan = {
        id: Date.now().toString(),
        name: newPlan.name,
        price: newPlan.price,
        interval: newPlan.interval || 'monthly',
        features: newPlan.features || [],
        maxPatients: newPlan.maxPatients || 0,
        maxUsers: newPlan.maxUsers || 0,
        isPopular: newPlan.isPopular || false,
        description: newPlan.description || ''
      };

      setPlans(prev => [...prev, plan]);
      setNewPlan({
        name: '',
        price: 0,
        interval: 'monthly',
        features: [],
        maxPatients: 0,
        maxUsers: 0,
        isPopular: false,
        description: ''
      });
    }
  };

  const addFeatureToPlan = () => {
    if (newFeature.trim()) {
      setNewPlan(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeatureFromPlan = (index: number) => {
    setNewPlan(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || []
    }));
  };

  const deletePlan = (planId: string) => {
    setPlans(prev => prev.filter(plan => plan.id !== planId));
  };

  if (previewMode) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold">F</span>
              </div>
              <span className="text-xl font-bold">{salesConfig.companyName}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setPreviewMode(false)}>
                <Edit className="h-4 w-4 mr-2" />
                Voltar à Edição
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {salesConfig.heroTitle}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {salesConfig.heroSubtitle}
            </p>
            <Button size="lg" className="text-lg px-8 py-3">
              {salesConfig.ctaText}
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Funcionalidades Completas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {salesConfig.features.map((feature, index) => (
                <div key={index} className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Planos e Preços</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div key={plan.id} className={`rounded-lg border-2 p-6 relative ${
                  plan.isPopular ? 'border-primary bg-white shadow-lg scale-105' : 'border-gray-200 bg-white'
                }`}>
                  {plan.isPopular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <Badge className="bg-primary text-primary-foreground">Mais Popular</Badge>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="text-4xl font-bold text-primary mb-2">
                      R$ {plan.price}
                      <span className="text-lg text-gray-600">/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button className={`w-full ${plan.isPopular ? '' : 'variant-outline'}`}>
                    Começar Agora
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">O que nossos clientes dizem</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {salesConfig.testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow border">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Pronto para revolucionar sua clínica?</h2>
            <p className="text-xl mb-8">Comece seu teste gratuito de 14 dias hoje mesmo!</p>
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              {salesConfig.ctaText}
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">{salesConfig.companyName}</h3>
                <p className="text-gray-400">Sistema completo para gestão de clínicas de fisioterapia.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Contato</h3>
                <p className="text-gray-400">Email: {salesConfig.contactEmail}</p>
                <p className="text-gray-400">Telefone: {salesConfig.supportPhone}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Suporte</h3>
                <p className="text-gray-400">Atendimento personalizado</p>
                <p className="text-gray-400">Treinamento incluído</p>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center">
              <p className="text-gray-400">© 2024 {salesConfig.companyName}. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Página de Vendas SAAS</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setPreviewMode(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Visualizar Página
          </Button>
          <Button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            {isEditing ? 'Salvar' : 'Editar'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="testimonials">Depoimentos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Planos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {plans.map((plan) => (
                    <div key={plan.id} className={`border rounded-lg p-4 ${plan.isPopular ? 'border-primary' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{plan.name}</h3>
                        {plan.isPopular && <Badge>Popular</Badge>}
                      </div>
                      <p className="text-2xl font-bold text-primary mb-2">R$ {plan.price}/mês</p>
                      <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                      <ul className="text-sm space-y-1 mb-4">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <Check className="h-3 w-3 text-green-500 mr-1" />
                            {feature}
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-muted-foreground">+{plan.features.length - 3} recursos</li>
                        )}
                      </ul>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => deletePlan(plan.id)}
                        className="w-full"
                      >
                        Remover Plano
                      </Button>
                    </div>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Adicionar Novo Plano</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="planName">Nome do Plano</Label>
                        <Input
                          id="planName"
                          value={newPlan.name || ''}
                          onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Profissional"
                        />
                      </div>

                      <div>
                        <Label htmlFor="planPrice">Preço Mensal (R$)</Label>
                        <Input
                          id="planPrice"
                          type="number"
                          value={newPlan.price || ''}
                          onChange={(e) => setNewPlan(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                          placeholder="197"
                        />
                      </div>

                      <div>
                        <Label htmlFor="maxPatients">Máximo de Pacientes</Label>
                        <Input
                          id="maxPatients"
                          type="number"
                          value={newPlan.maxPatients || ''}
                          onChange={(e) => setNewPlan(prev => ({ ...prev, maxPatients: parseInt(e.target.value) }))}
                          placeholder="500 (ou -1 para ilimitado)"
                        />
                      </div>

                      <div>
                        <Label htmlFor="maxUsers">Máximo de Usuários</Label>
                        <Input
                          id="maxUsers"
                          type="number"
                          value={newPlan.maxUsers || ''}
                          onChange={(e) => setNewPlan(prev => ({ ...prev, maxUsers: parseInt(e.target.value) }))}
                          placeholder="3 (ou -1 para ilimitado)"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="planDescription">Descrição</Label>
                      <Input
                        id="planDescription"
                        value={newPlan.description || ''}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Ideal para clínicas pequenas e médias"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newPlan.isPopular || false}
                        onCheckedChange={(checked) => setNewPlan(prev => ({ ...prev, isPopular: checked }))}
                      />
                      <Label>Marcar como plano popular</Label>
                    </div>

                    <div>
                      <Label>Recursos do Plano</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Input
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="Digite um recurso"
                          onKeyPress={(e) => e.key === 'Enter' && addFeatureToPlan()}
                        />
                        <Button onClick={addFeatureToPlan}>Adicionar</Button>
                      </div>
                      
                      {newPlan.features && newPlan.features.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {newPlan.features.map((feature, index) => (
                            <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                              <span className="text-sm">{feature}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeFeatureFromPlan(index)}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button onClick={handleSavePlan} className="w-full">
                      Adicionar Plano
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo da Página</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input
                  id="companyName"
                  value={salesConfig.companyName}
                  onChange={(e) => setSalesConfig(prev => ({ ...prev, companyName: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="heroTitle">Título Principal</Label>
                <Textarea
                  id="heroTitle"
                  value={salesConfig.heroTitle}
                  onChange={(e) => setSalesConfig(prev => ({ ...prev, heroTitle: e.target.value }))}
                  disabled={!isEditing}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="heroSubtitle">Subtítulo</Label>
                <Textarea
                  id="heroSubtitle"
                  value={salesConfig.heroSubtitle}
                  onChange={(e) => setSalesConfig(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="ctaText">Texto do Botão Principal</Label>
                <Input
                  id="ctaText"
                  value={salesConfig.ctaText}
                  onChange={(e) => setSalesConfig(prev => ({ ...prev, ctaText: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Depoimentos de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesConfig.testimonials.map((testimonial, index) => (
                  <div key={index} className="border rounded p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nome</Label>
                        <Input
                          value={testimonial.name}
                          onChange={(e) => {
                            const newTestimonials = [...salesConfig.testimonials];
                            newTestimonials[index].name = e.target.value;
                            setSalesConfig(prev => ({ ...prev, testimonials: newTestimonials }));
                          }}
                          disabled={!isEditing}
                        />
                      </div>
                      
                      <div>
                        <Label>Empresa</Label>
                        <Input
                          value={testimonial.company}
                          onChange={(e) => {
                            const newTestimonials = [...salesConfig.testimonials];
                            newTestimonials[index].company = e.target.value;
                            setSalesConfig(prev => ({ ...prev, testimonials: newTestimonials }));
                          }}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Label>Depoimento</Label>
                      <Textarea
                        value={testimonial.text}
                        onChange={(e) => {
                          const newTestimonials = [...salesConfig.testimonials];
                          newTestimonials[index].text = e.target.value;
                          setSalesConfig(prev => ({ ...prev, testimonials: newTestimonials }));
                        }}
                        disabled={!isEditing}
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contactEmail">Email de Vendas</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={salesConfig.contactEmail}
                  onChange={(e) => setSalesConfig(prev => ({ ...prev, contactEmail: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="supportPhone">Telefone de Suporte</Label>
                <Input
                  id="supportPhone"
                  value={salesConfig.supportPhone}
                  onChange={(e) => setSalesConfig(prev => ({ ...prev, supportPhone: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
