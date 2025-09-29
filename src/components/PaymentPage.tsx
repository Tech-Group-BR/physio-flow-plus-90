import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { CreditCard, QrCode, FileText, Loader2, Copy, Check, LogIn } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useProducts } from "@/hooks/useProducts"
import type { BillingType, PaymentResult } from "@/types/asaas"

interface PaymentFormData {
  name: string
  email: string
  cpfCnpj: string
  billingType: BillingType
  planId: string
}

export function PaymentPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const { products, loading: productsLoading } = useProducts()

  const [formData, setFormData] = useState<PaymentFormData>({
    name: '',
    email: '',
    cpfCnpj: '',
    billingType: 'PIX',
    planId: searchParams.get('plan') || ''
  })

  const [loading, setLoading] = useState(false)
  const [paymentResult, setPaymentResult] = useState<PaymentResult['payment'] | null>(null)
  const [copiedPix, setCopiedPix] = useState(false)

  const selectedPlan = products.find(p => p.id === formData.planId)

  // Definir plano padrão quando produtos são carregados
  useEffect(() => {
    if (products.length > 0 && !formData.planId) {
      const defaultPlan = products.find(p => p.name.toLowerCase().includes('starter')) || products[0]
      if (defaultPlan) {
        setFormData(prev => ({ ...prev, planId: defaultPlan.id }))
      }
    }
  }, [products, formData.planId])

  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Login necessário",
        description: "Você precisa fazer login para continuar com o pagamento.",
        variant: "destructive"
      })
      navigate('/login')
      return
    }

    // Preencher dados do usuário logado
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || '',
        email: user.email || '',
      }))
    }
  }, [user, authLoading, navigate, toast])

  // Mostrar loading enquanto verifica autenticação ou carrega produtos
  if (authLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-sky-600" />
          <p className="text-gray-600">
            {authLoading ? 'Verificando autenticação...' : 'Carregando planos...'}
          </p>
        </div>
      </div>
    )
  }

  // Se não está logado, mostrar tela de login
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white p-4">
        <div className="container mx-auto max-w-md">
          <Card className="mt-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-sky-600">
                Login Necessário
              </CardTitle>
              <CardDescription>
                Você precisa fazer login para continuar com o pagamento do plano {selectedPlan.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-sky-600" />
                </div>
                <p className="text-gray-600 mb-6">
                  Faça login para acessar sua conta e continuar com a assinatura.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full"
                  size="lg"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Fazer Login
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full"
                >
                  Voltar ao Início
                </Button>
              </div>

              <div className="bg-sky-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sky-800 mb-2">Plano Selecionado</h4>
                <div className="flex justify-between items-center">
                  <span className="text-sky-700">{selectedPlan?.name || 'Carregando...'}</span>
                  <span className="font-bold text-sky-800">R$ {selectedPlan?.price || 0}/mês</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Calcular data de vencimento (7 dias a partir de hoje)
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7)
      const dueDateString = dueDate.toISOString().split('T')[0]

      const { data, error } = await supabase.functions.invoke('create-asaas-payment', {
        body: {
          profileId: user.id, // Adicionar profile_id do usuário logado
          customer: {
            name: formData.name,
            email: formData.email,
            cpfCnpj: formData.cpfCnpj.replace(/\D/g, '') // Remove formatação
          },
          billingType: formData.billingType,
          value: selectedPlan?.price || 0,
          dueDate: dueDateString,
          description: `GoPhysioTech - Plano ${selectedPlan?.name || 'Selecionado'}`,
        }
      })

      if (error) {
        throw error
      }

      if (data?.success) {
        setPaymentResult(data.payment)
        toast({
          title: "Cobrança criada com sucesso!",
          description: `Sua cobrança de R$ ${selectedPlan?.price || 0} foi gerada.`,
        })
      } else {
        throw new Error('Erro ao criar cobrança')
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Tente novamente em alguns minutos.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyPixCode = async () => {
    if (paymentResult?.pixCopyAndPaste) {
      await navigator.clipboard.writeText(paymentResult.pixCopyAndPaste)
      setCopiedPix(true)
      toast({
        title: "Código PIX copiado!",
        description: "Cole no seu app de pagamentos para finalizar."
      })
      setTimeout(() => setCopiedPix(false), 2000)
    }
  }

  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '')

    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
  }

  if (paymentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white p-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="mt-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-green-600">
                Cobrança Criada com Sucesso!
              </CardTitle>
              <CardDescription>
                Plano {selectedPlan?.name || 'Selecionado'} - R$ {selectedPlan?.price || 0}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.billingType === 'PIX' && paymentResult.pixCopyAndPaste && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">Pague com PIX</h3>
                    <p className="text-sm text-gray-600">
                      Use o código abaixo no seu app de pagamentos
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <code className="flex-1 text-xs break-all mr-2">
                        {paymentResult.pixCopyAndPaste}
                      </code>
                      <Button
                        size="sm"
                        onClick={copyPixCode}
                        className="flex-shrink-0"
                      >
                        {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {formData.billingType === 'BOLETO' && paymentResult.bankSlipUrl && (
                <div className="text-center">
                  <h3 className="font-semibold mb-2">Boleto Bancário</h3>
                  <Button asChild>
                    <a href={paymentResult.bankSlipUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      Visualizar Boleto
                    </a>
                  </Button>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Informações do Pagamento</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>ID:</strong> {paymentResult.id}</p>
                  <p><strong>Valor:</strong> R$ {paymentResult.value}</p>
                  <p><strong>Vencimento:</strong> {new Date(paymentResult.dueDate).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Status:</strong> {paymentResult.status}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar ao Início
                </Button>
                <Button
                  onClick={() => navigate('/login')}
                  className="flex-1"
                >
                  Acessar Sistema
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Finalize sua Assinatura
          </h1>
          <p className="text-gray-600">
            Complete os dados abaixo para ativar seu plano GoPhysioTech
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Plano Selecionado: {selectedPlan?.name || 'Carregando...'}</CardTitle>
            <CardDescription>{selectedPlan?.description || 'Carregando descrição...'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sky-600">
              R$ {selectedPlan?.price || 0}
              <span className="text-sm font-normal text-gray-500">/mês</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados de Pagamento</CardTitle>
            <CardDescription>
              Preencha seus dados para gerar a cobrança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  type="text"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    cpfCnpj: formatCpfCnpj(e.target.value)
                  }))}
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Forma de Pagamento</Label>
                <RadioGroup
                  value={formData.billingType}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    billingType: value as 'PIX' | 'BOLETO' | 'CREDIT_CARD'
                  }))}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="PIX" id="pix" />
                    <QrCode className="w-5 h-5 text-green-600" />
                    <Label htmlFor="pix" className="flex-1 cursor-pointer">
                      PIX - Pagamento Instantâneo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="BOLETO" id="boleto" />
                    <FileText className="w-5 h-5 text-blue-600" />
                    <Label htmlFor="boleto" className="flex-1 cursor-pointer">
                      Boleto Bancário
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 opacity-50">
                    <RadioGroupItem value="CREDIT_CARD" id="card" disabled />
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer text-gray-500">
                      Cartão de Crédito (Em breve)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  `Gerar Cobrança - R$ ${selectedPlan?.price || 0}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}