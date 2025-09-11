
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Bell, DollarSign, Key, Mail, Phone, Settings, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SaasSettings {
  subscriptionManagement: {
    trialDays: number;
    allowUpgrades: boolean;
    allowDowngrades: boolean;
    prorationEnabled: boolean;
  };
  billing: {
    currency: string;
    taxRate: number;
    invoicePrefix: string;
    paymentMethods: string[];
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    webhookUrl: string;
    notificationEvents: string[];
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
      requireNumbers: boolean;
    };
  };
  features: {
    whatsappIntegration: boolean;
    advancedReports: boolean;
    apiAccess: boolean;
    customBranding: boolean;
    multiTenant: boolean;
  };
  limits: {
    maxPatients: number;
    maxUsers: number;
    maxStorageGB: number;
    apiCallsPerMonth: number;
  };
}

export function ConfigurationsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);

  const [saasSettings, setSaasSettings] = useState<SaasSettings>({
    subscriptionManagement: {
      trialDays: 14,
      allowUpgrades: true,
      allowDowngrades: true,
      prorationEnabled: true
    },
    billing: {
      currency: 'BRL',
      taxRate: 0,
      invoicePrefix: 'FT',
      paymentMethods: ['credit_card', 'pix', 'boleto']
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      webhookUrl: '',
      notificationEvents: ['subscription_created', 'payment_succeeded', 'payment_failed']
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 480,
      passwordPolicy: {
        minLength: 8,
        requireSpecialChars: true,
        requireNumbers: true
      }
    },
    features: {
      whatsappIntegration: true,
      advancedReports: true,
      apiAccess: false,
      customBranding: false,
      multiTenant: true
    },
    limits: {
      maxPatients: 1000,
      maxUsers: 10,
      maxStorageGB: 50,
      apiCallsPerMonth: 10000
    }
  });

  const [generalSettings, setGeneralSettings] = useState({
    clinicName: 'FisioTech Sistema',
    clinicAddress: 'Rua das Flores, 123, São Paulo - SP',
    clinicPhone: '(11) 99999-9999',
    clinicEmail: 'contato@fisiotech.com.br',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    dateFormat: 'DD/MM/YYYY',
    workingHours: {
      start: '08:00',
      end: '18:00',
      lunchStart: '12:00',
      lunchEnd: '14:00'
    }
  });

  const [integrations, setIntegrations] = useState({
    stripe: {
      enabled: false,
      publicKey: '',
      secretKey: ''
    },
    whatsapp: {
      enabled: true,
      apiUrl: 'https://zap.zapflow.click',
      token: '7b5aaa32577d86a7778957722b932265'
    },
    email: {
      provider: 'smtp',
      host: '',
      port: 587,
      username: '',
      password: ''
    }
  });

  const updateSaasSettings = (section: keyof SaasSettings, key: string, value: any) => {
    setSaasSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const toggleFeature = (feature: keyof typeof saasSettings.features) => {
    setSaasSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }));
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // Salvar configurações do WhatsApp no banco de dados
      if (integrations.whatsapp.enabled) {
        const { error } = await supabase
          .from('whatsapp_settings')
          .upsert({
            instance_name: 'livia',
            api_key: integrations.whatsapp.token,
            api_url: integrations.whatsapp.apiUrl,
            api_token: integrations.whatsapp.token,
            base_url: integrations.whatsapp.apiUrl,
            integration_enabled: integrations.whatsapp.enabled,
            is_active: integrations.whatsapp.enabled,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      console.log('Configurações salvas:', { saasSettings, generalSettings, integrations });
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
        <Button onClick={saveSettings} disabled={isLoading}>
          <Settings className="h-4 w-4 mr-2" />
          {isLoading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="billing">Cobrança</TabsTrigger>
          <TabsTrigger value="features">Recursos</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configurações Gerais</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clinicName">Nome da Clínica</Label>
                  <Input
                    id="clinicName"
                    value={generalSettings.clinicName}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, clinicName: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="clinicEmail">Email Principal</Label>
                  <Input
                    id="clinicEmail"
                    type="email"
                    value={generalSettings.clinicEmail}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, clinicEmail: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="clinicPhone">Telefone</Label>
                  <Input
                    id="clinicPhone"
                    value={generalSettings.clinicPhone}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, clinicPhone: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (UTC-4)</SelectItem>
                      <SelectItem value="America/Rio_Branco">Rio Branco (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horário de Funcionamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workStart">Início</Label>
                    <Input
                      id="workStart"
                      type="time"
                      value={generalSettings.workingHours.start}
                      onChange={(e) => setGeneralSettings(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, start: e.target.value }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="workEnd">Fim</Label>
                    <Input
                      id="workEnd"
                      type="time"
                      value={generalSettings.workingHours.end}
                      onChange={(e) => setGeneralSettings(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, end: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lunchStart">Início Almoço</Label>
                    <Input
                      id="lunchStart"
                      type="time"
                      value={generalSettings.workingHours.lunchStart}
                      onChange={(e) => setGeneralSettings(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, lunchStart: e.target.value }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="lunchEnd">Fim Almoço</Label>
                    <Input
                      id="lunchEnd"
                      type="time"
                      value={generalSettings.workingHours.lunchEnd}
                      onChange={(e) => setGeneralSettings(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, lunchEnd: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Configurações de Cobrança</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="trialDays">Dias de Teste Grátis</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    value={saasSettings.subscriptionManagement.trialDays}
                    onChange={(e) => updateSaasSettings('subscriptionManagement', 'trialDays', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Moeda</Label>
                  <Select value={saasSettings.billing.currency} onValueChange={(value) => updateSaasSettings('billing', 'currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (BRL)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="taxRate">Taxa de Imposto (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={saasSettings.billing.taxRate}
                    onChange={(e) => updateSaasSettings('billing', 'taxRate', parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="invoicePrefix">Prefixo da Fatura</Label>
                  <Input
                    id="invoicePrefix"
                    value={saasSettings.billing.invoicePrefix}
                    onChange={(e) => updateSaasSettings('billing', 'invoicePrefix', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Opções de Assinatura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Upgrades</Label>
                    <p className="text-sm text-muted-foreground">Clientes podem upgradar seus planos</p>
                  </div>
                  <Switch
                    checked={saasSettings.subscriptionManagement.allowUpgrades}
                    onCheckedChange={(checked) => updateSaasSettings('subscriptionManagement', 'allowUpgrades', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Downgrades</Label>
                    <p className="text-sm text-muted-foreground">Clientes podem fazer downgrade dos planos</p>
                  </div>
                  <Switch
                    checked={saasSettings.subscriptionManagement.allowDowngrades}
                    onCheckedChange={(checked) => updateSaasSettings('subscriptionManagement', 'allowDowngrades', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Prorratear Mudanças</Label>
                    <p className="text-sm text-muted-foreground">Calcular valores proporcionais</p>
                  </div>
                  <Switch
                    checked={saasSettings.subscriptionManagement.prorationEnabled}
                    onCheckedChange={(checked) => updateSaasSettings('subscriptionManagement', 'prorationEnabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recursos do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h3 className="font-medium">Integração WhatsApp</h3>
                      <p className="text-sm text-muted-foreground">Envio automático de mensagens</p>
                    </div>
                    <Switch
                      checked={saasSettings.features.whatsappIntegration}
                      onCheckedChange={() => toggleFeature('whatsappIntegration')}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h3 className="font-medium">Relatórios Avançados</h3>
                      <p className="text-sm text-muted-foreground">Dashboards e análises detalhadas</p>
                    </div>
                    <Switch
                      checked={saasSettings.features.advancedReports}
                      onCheckedChange={() => toggleFeature('advancedReports')}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h3 className="font-medium">Acesso à API</h3>
                      <p className="text-sm text-muted-foreground">Integrações com sistemas externos</p>
                    </div>
                    <Switch
                      checked={saasSettings.features.apiAccess}
                      onCheckedChange={() => toggleFeature('apiAccess')}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h3 className="font-medium">Marca Personalizada</h3>
                      <p className="text-sm text-muted-foreground">Logo e cores personalizadas</p>
                    </div>
                    <Switch
                      checked={saasSettings.features.customBranding}
                      onCheckedChange={() => toggleFeature('customBranding')}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h3 className="font-medium">Multi-inquilino</h3>
                      <p className="text-sm text-muted-foreground">Suporte para múltiplas clínicas</p>
                    </div>
                    <Switch
                      checked={saasSettings.features.multiTenant}
                      onCheckedChange={() => toggleFeature('multiTenant')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limites do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxPatients">Máximo de Pacientes</Label>
                  <Input
                    id="maxPatients"
                    type="number"
                    value={saasSettings.limits.maxPatients}
                    onChange={(e) => updateSaasSettings('limits', 'maxPatients', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxUsers">Máximo de Usuários</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={saasSettings.limits.maxUsers}
                    onChange={(e) => updateSaasSettings('limits', 'maxUsers', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxStorage">Armazenamento (GB)</Label>
                  <Input
                    id="maxStorage"
                    type="number"
                    value={saasSettings.limits.maxStorageGB}
                    onChange={(e) => updateSaasSettings('limits', 'maxStorageGB', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="apiCalls">Chamadas API/Mês</Label>
                  <Input
                    id="apiCalls"
                    type="number"
                    value={saasSettings.limits.apiCallsPerMonth}
                    onChange={(e) => updateSaasSettings('limits', 'apiCallsPerMonth', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Configurações de Segurança</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                </div>
                <Switch
                  checked={saasSettings.security.twoFactorAuth}
                  onCheckedChange={(checked) => updateSaasSettings('security', 'twoFactorAuth', checked)}
                />
              </div>

              <div>
                <Label htmlFor="sessionTimeout">Timeout da Sessão (minutos)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={saasSettings.security.sessionTimeout}
                  onChange={(e) => updateSaasSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Política de Senhas</h3>

                <div>
                  <Label htmlFor="minLength">Comprimento Mínimo</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={saasSettings.security.passwordPolicy.minLength}
                    onChange={(e) => setSaasSettings(prev => ({
                      ...prev,
                      security: {
                        ...prev.security,
                        passwordPolicy: {
                          ...prev.security.passwordPolicy,
                          minLength: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Exigir Caracteres Especiais</Label>
                  <Switch
                    checked={saasSettings.security.passwordPolicy.requireSpecialChars}
                    onCheckedChange={(checked) => setSaasSettings(prev => ({
                      ...prev,
                      security: {
                        ...prev.security,
                        passwordPolicy: {
                          ...prev.security.passwordPolicy,
                          requireSpecialChars: checked
                        }
                      }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Exigir Números</Label>
                  <Switch
                    checked={saasSettings.security.passwordPolicy.requireNumbers}
                    onCheckedChange={(checked) => setSaasSettings(prev => ({
                      ...prev,
                      security: {
                        ...prev.security,
                        passwordPolicy: {
                          ...prev.security.passwordPolicy,
                          requireNumbers: checked
                        }
                      }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Stripe (Pagamentos)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Habilitar Stripe</Label>
                  <Switch
                    checked={integrations.stripe.enabled}
                    onCheckedChange={(checked) => setIntegrations(prev => ({
                      ...prev,
                      stripe: { ...prev.stripe, enabled: checked }
                    }))}
                  />
                </div>

                {integrations.stripe.enabled && (
                  <>
                    <div>
                      <Label htmlFor="stripePublic">Chave Pública</Label>
                      <Input
                        id="stripePublic"
                        value={integrations.stripe.publicKey}
                        onChange={(e) => setIntegrations(prev => ({
                          ...prev,
                          stripe: { ...prev.stripe, publicKey: e.target.value }
                        }))}
                        placeholder="pk_test_..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="stripeSecret">Chave Secreta</Label>
                      <Input
                        id="stripeSecret"
                        type="password"
                        value={integrations.stripe.secretKey}
                        onChange={(e) => setIntegrations(prev => ({
                          ...prev,
                          stripe: { ...prev.stripe, secretKey: e.target.value }
                        }))}
                        placeholder="sk_test_..."
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>WhatsApp API</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Habilitar WhatsApp</Label>
                  <Switch
                    checked={integrations.whatsapp.enabled}
                    onCheckedChange={(checked) => setIntegrations(prev => ({
                      ...prev,
                      whatsapp: { ...prev.whatsapp, enabled: checked }
                    }))}
                  />
                </div>

                {integrations.whatsapp.enabled && (
                  <>
                    <div>
                      <Label htmlFor="whatsappUrl">URL da API</Label>
                      <Input
                        id="whatsappUrl"
                        value={integrations.whatsapp.apiUrl}
                        onChange={(e) => setIntegrations(prev => ({
                          ...prev,
                          whatsapp: { ...prev.whatsapp, apiUrl: e.target.value }
                        }))}
                        placeholder="https://api.whatsapp.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="whatsappToken">Token de Acesso</Label>
                      <Input
                        id="whatsappToken"
                        type="password"
                        value={integrations.whatsapp.token}
                        onChange={(e) => setIntegrations(prev => ({
                          ...prev,
                          whatsapp: { ...prev.whatsapp, token: e.target.value }
                        }))}
                        placeholder="Seu token de acesso"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Configurações de Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="emailHost">Servidor SMTP</Label>
                  <Input
                    id="emailHost"
                    value={integrations.email.host}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      email: { ...prev.email, host: e.target.value }
                    }))}
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emailPort">Porta</Label>
                    <Input
                      id="emailPort"
                      type="number"
                      value={integrations.email.port}
                      onChange={(e) => setIntegrations(prev => ({
                        ...prev,
                        email: { ...prev.email, port: parseInt(e.target.value) }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emailUsername">Usuário</Label>
                    <Input
                      id="emailUsername"
                      value={integrations.email.username}
                      onChange={(e) => setIntegrations(prev => ({
                        ...prev,
                        email: { ...prev.email, username: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="emailPassword">Senha</Label>
                  <Input
                    id="emailPassword"
                    type="password"
                    value={integrations.email.password}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      email: { ...prev.email, password: e.target.value }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Configurações de Notificações</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">Enviar alertas importantes por email</p>
                </div>
                <Switch
                  checked={saasSettings.notifications.emailNotifications}
                  onCheckedChange={(checked) => updateSaasSettings('notifications', 'emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificações por SMS</Label>
                  <p className="text-sm text-muted-foreground">Enviar alertas críticos por SMS</p>
                </div>
                <Switch
                  checked={saasSettings.notifications.smsNotifications}
                  onCheckedChange={(checked) => updateSaasSettings('notifications', 'smsNotifications', checked)}
                />
              </div>

              <div>
                <Label htmlFor="webhookUrl">URL do Webhook</Label>
                <Input
                  id="webhookUrl"
                  value={saasSettings.notifications.webhookUrl}
                  onChange={(e) => updateSaasSettings('notifications', 'webhookUrl', e.target.value)}
                  placeholder="https://your-app.com/webhook"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  URL para receber notificações de eventos do sistema
                </p>
              </div>

              <div>
                <Label>Eventos de Notificação</Label>
                <div className="space-y-2 mt-2">
                  {[
                    { id: 'subscription_created', label: 'Nova assinatura criada' },
                    { id: 'payment_succeeded', label: 'Pagamento realizado com sucesso' },
                    { id: 'payment_failed', label: 'Falha no pagamento' },
                    { id: 'trial_ending', label: 'Teste grátis expirando' },
                    { id: 'subscription_cancelled', label: 'Assinatura cancelada' }
                  ].map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={event.id}
                        checked={saasSettings.notifications.notificationEvents.includes(event.id)}
                        onChange={(e) => {
                          const events = e.target.checked
                            ? [...saasSettings.notifications.notificationEvents, event.id]
                            : saasSettings.notifications.notificationEvents.filter(ev => ev !== event.id);
                          updateSaasSettings('notifications', 'notificationEvents', events);
                        }}
                        className="rounded"
                      />
                      <label htmlFor={event.id} className="text-sm">
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
