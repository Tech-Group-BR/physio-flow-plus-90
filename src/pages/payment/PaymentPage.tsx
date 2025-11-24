import { useState, useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SSLBadge } from "@/components/common/SSLBadge"
import { useAuth } from "@/contexts/AuthContext"
import { useProductsCache } from "@/contexts/ProductsCacheContext"
import { useSubscriptionPeriods } from "@/hooks/useSubscriptionPeriods"
import { PaymentSystem } from "@/components/admin/PaymentSystem"
import { PixPayment } from "@/components/admin/PixPayment"
import { BoletoPayment } from "@/components/forms/BoletoPayment"
import { SubscriptionPeriodSelector } from "@/components/SubscriptionPeriodSelector"
import { LogIn, ArrowLeft, CheckCircle } from "lucide-react"
import { toast } from "sonner"

// Cache do plano selecionado no localStorage
const SELECTED_PLAN_KEY = 'physioflow_selected_plan'

export function PaymentPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { products, loading: productsLoading, getProductById, getProductByName } = useProductsCache()
  const { getAllPeriodsWithPrices, loading: periodsLoading } = useSubscriptionPeriods()

  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  
  // Carregar período selecionado do localStorage
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const saved = localStorage.getItem('physioflow_selected_period')
    return saved || 'monthly'
  })
  
  // Debug: verificar user.profile
  console.log('👤 PaymentPage - User completo:', user)
  console.log('🏥 PaymentPage - User clinic_id:', user?.profile?.clinic_id)
  console.log('🔄 PaymentPage - Loading states:', { authLoading, productsLoading, periodsLoading })
  console.log('📦 PaymentPage - Products count:', products.length)
  console.log('💳 PaymentPage - Payment states:', { paymentCompleted, hasPaymentData: !!paymentData })
  
  const planId = searchParams.get('plan') || ''
  console.log('🎯 PaymentPage - Plan ID from URL:', planId)
  
  // Buscar plano selecionado usando cache
  const selectedPlan = useMemo(() => {
    if (!planId) {
      // Tentar carregar do localStorage
      const savedPlanId = localStorage.getItem(SELECTED_PLAN_KEY)
      if (savedPlanId) {
        const plan = getProductById(savedPlanId)
        if (plan) {
          console.log('📦 Plano restaurado do localStorage:', plan.name)
          // Atualizar URL sem recarregar
          searchParams.set('plan', savedPlanId)
          setSearchParams(searchParams, { replace: true })
          return plan
        }
      }
      return null
    }
    
    // Buscar por ID ou nome
    const plan = getProductById(planId) || getProductByName(planId)
    
    // Salvar no localStorage para próxima vez
    if (plan) {
      localStorage.setItem(SELECTED_PLAN_KEY, plan.id)
      console.log('💾 Plano salvo no localStorage:', plan.name)
    }
    
    return plan
  }, [planId, products, getProductById, getProductByName])

  // Limpar redirectTo quando a página montar (usuário chegou aqui com sucesso)
  useEffect(() => {
    const redirectTo = localStorage.getItem('auth_redirect_to');
    if (redirectTo) {
      console.log('🧹 PaymentPage: Limpando redirectTo após montagem:', redirectTo);
      localStorage.removeItem('auth_redirect_to');
    }
  }, []); // Executar apenas uma vez na montagem

  // Persistir período selecionado
  useEffect(() => {
    localStorage.setItem('physioflow_selected_period', selectedPeriod)
  }, [selectedPeriod])
  

  // Auto-selecionar primeiro plano se não especificado
  useEffect(() => {
    if (products.length > 0 && !planId && !selectedPlan) {
      const defaultPlan = products.find(p => p.name.toLowerCase().includes('starter')) || products[0]
      if (defaultPlan) {
        console.log('🎯 Auto-selecionando plano:', defaultPlan.name)
        localStorage.setItem(SELECTED_PLAN_KEY, defaultPlan.id)
        searchParams.set('plan', defaultPlan.id)
        setSearchParams(searchParams, { replace: true })
      }
    }
  }, [products, planId, selectedPlan])

  const handlePaymentSuccess = (paymentDataReceived: any) => {
    console.log('Pagamento realizado com sucesso:', paymentDataReceived)
    setPaymentData(paymentDataReceived)
    // Para cartão de crédito, ir direto para tela de sucesso
    if (paymentDataReceived?.payment?.billingType === 'CREDIT_CARD') {
      setPaymentCompleted(true)
      toast.success('Pagamento realizado com sucesso!')
    } else {
      // Para PIX e Boleto, apenas mostrar as instruções de pagamento
      toast.success(paymentDataReceived?.payment?.billingType === 'PIX' ? 'PIX gerado com sucesso!' : 'Boleto gerado com sucesso!')
    }
  }

  const handlePaymentError = (error: string) => {
    console.error('Erro no pagamento:', error)
    toast.error(`Erro no pagamento: ${error}`)
  }



  // Loading inicial
  if (authLoading || productsLoading) {
    console.log('🔄 EARLY RETURN: Loading state - authLoading:', authLoading, 'productsLoading:', productsLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Usuário não logado
  if (!user) {
    console.log('🚫 EARLY RETURN: No user')
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 to-white">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-sky-600">
              <LogIn className="w-5 h-5" />
              Login Necessário
            </CardTitle>
            <CardDescription>
              Você precisa estar logado para acessar o pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-sky-600" />
              </div>
              <p className="text-gray-600 mb-6">
                Faça login para continuar com sua assinatura
              </p>
            </div>
            
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

            {selectedPlan && (
              <div className="bg-sky-50 p-4 rounded-lg mt-4">
                <h4 className="font-semibold text-sky-800 mb-2">Plano Selecionado</h4>
                <div className="flex justify-between items-center">
                  <span className="text-sky-700">{selectedPlan.name}</span>
                  <span className="font-bold text-sky-800">
                    R$ {selectedPlan.price.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}/mês
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Plano não encontrado
  if (!selectedPlan && planId) {
    console.log('❌ EARLY RETURN: Plan not found - planId:', planId, 'selectedPlan:', selectedPlan)
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 to-white">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Plano não encontrado</CardTitle>
            <CardDescription>
              O plano selecionado não foi encontrado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Aguardar seleção de plano
  if (!selectedPlan) {
    console.log('⚠️ EARLY RETURN: No plan selected - planId:', planId, 'selectedPlan:', selectedPlan, 'products:', products.length)
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 to-white">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>
              {products.length === 0 ? 'Nenhum Plano Disponível' : 'Selecione um Plano'}
            </CardTitle>
            <CardDescription>
              {products.length === 0 
                ? 'Não há planos cadastrados no sistema'
                : planId 
                  ? `Plano "${planId}" não foi encontrado`
                  : 'Nenhum plano foi selecionado'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {products.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Planos Disponíveis:</h4>
                <div className="space-y-2">
                  {products.map(product => (
                    <div key={product.id} className="flex justify-between items-center">
                      <span className="text-sm">{product.name}</span>
                      <Button
                        size="sm"
                        onClick={() => {
                          const newUrl = new URL(window.location.href)
                          newUrl.searchParams.set('plan', product.id)
                          window.location.href = newUrl.toString()
                        }}
                      >
                        Selecionar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Exibir PIX ou Boleto gerado (aguardando pagamento)
  if (paymentData && !paymentCompleted) {
    console.log('💳 EARLY RETURN: Payment data waiting - paymentData:', paymentData)
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 to-white">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">
              {paymentData.payment?.billingType === 'PIX' ? 'PIX Gerado!' : 'Boleto Gerado!'}
            </h1>
            <p className="text-muted-foreground mb-4">
              {paymentData.payment?.billingType === 'PIX' 
                ? 'Escaneie o QR Code ou copie o código PIX para efetuar o pagamento'
                : 'Clique no link abaixo para visualizar e pagar o boleto'
              }
            </p>
          </div>

          {paymentData.payment?.billingType === 'PIX' && (
            <PixPayment 
              paymentData={{
                id: paymentData.payment.id,
                invoiceUrl: paymentData.payment.invoiceUrl || '',
                status: paymentData.payment.status || 'pending',
                pixQrCode: paymentData.pixQrCode
              }}
            />
          )}
          
          {paymentData.payment?.billingType === 'BOLETO' && (
            <BoletoPayment 
              paymentData={{
                id: paymentData.payment.id,
                value: paymentData.payment.value,
                dueDate: paymentData.payment.dueDate,
                bankSlipUrl: paymentData.payment.bankSlipUrl,
                invoiceUrl: paymentData.payment.invoiceUrl,
                status: paymentData.payment.status
              }}
            />
          )}

          <div className="text-center space-y-2">
       
            <Button 
              onClick={() => navigate('/')}
              variant="ghost"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Pagamento completado com sucesso (apenas cartão de crédito)
  if (paymentCompleted) {
    console.log('✅ EARLY RETURN: Payment completed')
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 to-white">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Pagamento Realizado!</CardTitle>
            <CardDescription>
              Sua assinatura foi ativada com sucesso. Bem-vindo ao GoPhysioTech!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-2">
                ✓ Assinatura ativa
              </p>
              <p className="text-2xl font-bold mb-1">
                {selectedPlan.name}
              </p>
              <p className="text-lg text-green-800">
                R$ {selectedPlan.price.toLocaleString('pt-BR', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}/mês
              </p>
            </div>
            
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Acessar Dashboard
            </Button>
            
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Formulário de pagamento
  // Calcular valores baseado no período selecionado
  console.log('✨ MAIN RENDER: Showing payment form for plan:', selectedPlan?.name)
  const periodsWithPrices = getAllPeriodsWithPrices(selectedPlan.price)
  const currentPeriod = periodsWithPrices.find(p => p.period === selectedPeriod)
  const finalValue = currentPeriod?.totalPrice || selectedPlan.price
  const monthlyValue = currentPeriod?.monthlyPrice || selectedPlan.price

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-6 bg-gradient-to-br from-sky-50 to-white">
      <div className="text-center max-w-6xl w-full">
        <h1 className="text-3xl font-bold mb-2">Finalizar Assinatura</h1>
        <p className="text-xl text-muted-foreground mb-4">
          {selectedPlan.name}
        </p>
        
        {/* SSL Badge no topo */}
        <div className="flex justify-center mb-4">
          <SSLBadge variant="compact" />
        </div>
      </div>

      {/* Seletor de Período */}
      <div className="max-w-6xl w-full">
        <SubscriptionPeriodSelector
          basePrice={selectedPlan.price}
          periods={periodsWithPrices}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      </div>

      {/* Formulário de Pagamento */}
      <div className="max-w-2xl w-full">
        <PaymentSystem
          productId={selectedPlan.id}
          clinicId={user.profile?.clinic_id || undefined}
          value={finalValue}
          billingPeriod={selectedPeriod}
          description={`GoPhysioTech - ${selectedPlan.name} - ${currentPeriod?.displayName}`}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      </div>

      <div className="text-center space-y-2">
        <Button 
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Início
        </Button>
      </div>
    </div>
  )
}