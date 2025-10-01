import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useProducts } from "@/hooks/useProducts"
import { PaymentSystem } from "@/components/PaymentSystem"
import { PixPayment } from "@/components/PixPayment"
import { BoletoPayment } from "@/components/BoletoPayment"
import { LogIn, ArrowLeft, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export function PaymentPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { products, loading: productsLoading } = useProducts()

  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const planId = searchParams.get('plan') || ''
  
  // Buscar por ID primeiro, depois por nome se não encontrar
  let selectedPlan = products.find(p => p.id === planId) || 
                     products.find(p => p.name.toLowerCase() === planId.toLowerCase())
  




  // Auto-selecionar primeiro plano se não especificado
  useEffect(() => {
    if (products.length > 0 && !planId && !searchParams.get('plan')) {
      const defaultPlan = products.find(p => p.name.toLowerCase().includes('starter')) || products[0]
      if (defaultPlan) {
        console.log('Auto-selecionando plano:', defaultPlan)
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('plan', defaultPlan.id)
        window.history.replaceState({}, '', newUrl.toString())
      }
    }
  }, [products, planId, searchParams])

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
              onClick={() => {
                setPaymentData(null)
                setPaymentCompleted(false)
              }}
              variant="outline"
              className="mr-4"
            >
              Fazer Novo Pagamento
            </Button>
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
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 to-white">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Pagamento Realizado!</CardTitle>
            <CardDescription>
              Seu pagamento foi processado com sucesso. Bem-vindo ao PhysioFlow Plus!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold mb-2">
                {selectedPlan.name}
              </p>
              <p className="text-lg">
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
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-6 bg-gradient-to-br from-sky-50 to-white">
      <div className="text-center max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Finalizar Assinatura</h1>
        <p className="text-xl text-muted-foreground mb-4">
          {selectedPlan.name}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-3xl font-bold text-blue-900 mb-2">
            R$ {selectedPlan.price.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
            <span className="text-lg font-normal text-blue-700">/mês</span>
          </p>
          <p className="text-sm text-blue-700">
            {selectedPlan.description}
          </p>
        </div>
      </div>

      <PaymentSystem
        productId={selectedPlan.id}
        clinicId={user.profile?.clinic_id || undefined}
        value={selectedPlan.price}
        description={`PhysioFlow Plus - ${selectedPlan.name}`}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />

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