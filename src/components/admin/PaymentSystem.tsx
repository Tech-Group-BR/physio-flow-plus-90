import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePayments } from '@/hooks/usePayments'
import { useAuth } from '@/contexts/AuthContext'
import { usePaymentPersistence } from '@/hooks/usePaymentPersistence'
import { PixPayment } from '@/components/admin/PixPayment'
import { BoletoPayment } from '@/components/forms/BoletoPayment'
import { CreditCardPayment } from '@/components/financial/CreditCardPayment'
import { QrCode, FileText, CreditCard, User } from 'lucide-react'
import { toast } from 'sonner'

const customerSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ é obrigatório'),
  phone: z.string().min(10, 'Telefone é obrigatório').optional()
})

type CustomerFormData = z.infer<typeof customerSchema>

interface PaymentSystemProps {
  productId?: string
  clinicId?: string
  value: number
  billingPeriod?: string // Período de cobrança: monthly, quarterly, semiannual, annual
  description?: string
  dueDate?: string
  onPaymentSuccess?: (paymentData: any) => void
  onPaymentError?: (error: string) => void
}

export function PaymentSystem({
  productId,
  clinicId,
  value,
  billingPeriod = 'monthly',
  description = 'Pagamento GoPhysioTech',
  dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
  onPaymentSuccess,
  onPaymentError
}: PaymentSystemProps) {
  const { createPayment, formatCpfCnpj, formatPhone, loading } = usePayments()
  const { user } = useAuth()
  const { persistedData, persistData } = usePaymentPersistence()
  
  console.log('🏥 PaymentSystem recebeu clinicId:', clinicId)
  console.log('📅 PaymentSystem recebeu billingPeriod:', billingPeriod)
  console.log('👤 User profile:', user?.profile)
  
  // Restaurar método de pagamento do storage ou persistedData
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>(() => {
    // Tentar carregar do persistedData primeiro
    if (persistedData.activeTab) {
      return persistedData.activeTab as any;
    }
    // Fallback para sessionStorage
    const saved = sessionStorage.getItem('payment_method');
    return (saved as any) || 'PIX';
  });
  
  const [step, setStep] = useState<'customer' | 'payment' | 'processing' | 'result'>('customer')
  const [paymentData, setPaymentData] = useState<any>(null)
  const [customerData, setCustomerData] = useState<CustomerFormData | null>(null)

  // Persistir método de pagamento selecionado
  useEffect(() => {
    sessionStorage.setItem('payment_method', paymentMethod);
    persistData({ activeTab: paymentMethod });
    console.log('💾 Tab ativa salva:', paymentMethod);
  }, [paymentMethod, persistData]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema)
  })

  const watchedFields = watch()

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpfCnpj(e.target.value)
    setValue('cpfCnpj', formatted)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setValue('phone', formatted)
  }

  const onCustomerSubmit = async (data: CustomerFormData) => {
    setCustomerData(data)
    
    // Para cartão de crédito, ir direto para o formulário de cartão
    if (paymentMethod === 'CREDIT_CARD') {
      setStep('payment')
      return
    }

    // Para PIX e Boleto, processar pagamento imediatamente
    try {
      setStep('processing')

      const paymentRequest = {
        customer: {
          name: data.name,
          email: data.email,
          cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
          phone: data.phone?.replace(/\D/g, ''),
          profileId: user?.id,
          clinicId: clinicId // Adicionar clinicId ao customer
        },
        billingType: paymentMethod,
        value,
        dueDate,
        description,
        clinicId,
        productId,
        billingPeriod, // Período de cobrança
      }
      
      console.log('💳 Payment request sendo enviado:', paymentRequest)
      console.log('👤 Customer data:', JSON.stringify(paymentRequest.customer, null, 2))

      const result = await createPayment(paymentRequest)
      

      
      if (result.success) {
        setPaymentData(result)
        setStep('result')
        onPaymentSuccess?.(result)
      } else {
        throw new Error('Erro no processamento do pagamento')
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error)
      const errorMessage = error.message || 'Erro ao processar pagamento'
      onPaymentError?.(errorMessage)
      toast.error(errorMessage)
      setStep('customer')
    }
  }

  const handleCreditCardSuccess = (creditCardPaymentData: any) => {
    setPaymentData(creditCardPaymentData)
    setStep('result')
    onPaymentSuccess?.(creditCardPaymentData)
  }

  const handleCreditCardError = (error: string) => {
    onPaymentError?.(error)
    setStep('customer')
  }

  const resetPayment = () => {
    setStep('customer')
    setPaymentData(null)
    setCustomerData(null)
  }

  // Renderizar resultado do pagamento
  if (step === 'result' && paymentData) {
    return (
      <div className="space-y-4">
        {paymentMethod === 'PIX' && (
          <PixPayment 
            paymentData={{
              id: paymentData.payment.id,
              invoiceUrl: paymentData.payment.invoiceUrl || '',
              status: paymentData.payment.status || 'pending',
              pixQrCode: paymentData.pixQrCode
            }}
          />
        )}
        
        {paymentMethod === 'BOLETO' && (
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

        <div className="text-center">
          <Button onClick={resetPayment} variant="outline">
            Fazer Novo Pagamento
          </Button>
        </div>
      </div>
    )
  }

  // Renderizar formulário de cartão de crédito
  if (step === 'payment' && paymentMethod === 'CREDIT_CARD' && customerData) {
    return (
      <div className="space-y-4">
        <CreditCardPayment
          paymentValue={value}
          dueDate={dueDate}
          description={description}
          clinicId={clinicId}
          productId={productId}
          billingPeriod={billingPeriod}
          onSuccess={handleCreditCardSuccess}
          onPaymentError={handleCreditCardError}
        />
        
        <div className="text-center">
          <Button onClick={() => setStep('customer')} variant="outline">
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  // Renderizar loading
  if (step === 'processing') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-medium">Processando pagamento...</p>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Aguarde enquanto criamos seu {paymentMethod === 'PIX' ? 'PIX' : 'boleto'}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Renderizar formulário de cliente e seleção de método
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Finalizar Pagamento
        </CardTitle>
        <CardDescription>
          Valor: R$ {value.toLocaleString('pt-BR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="PIX" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              PIX
            </TabsTrigger>
            <TabsTrigger value="BOLETO" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Boleto
            </TabsTrigger>
            <TabsTrigger value="CREDIT_CARD" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Cartão
            </TabsTrigger>
          </TabsList>

          {/* Tab PIX */}
          <TabsContent value="PIX" className="space-y-4">
            <form onSubmit={handleSubmit(onCustomerSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name-pix">Nome Completo</Label>
                <Input
                  id="name-pix"
                  {...register('name')}
                  placeholder="Digite seu nome completo"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email-pix">Email</Label>
                  <Input
                    id="email-pix"
                    type="email"
                    {...register('email')}
                    placeholder="email@exemplo.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cpfCnpj-pix">CPF/CNPJ</Label>
                  <Input
                    id="cpfCnpj-pix"
                    {...register('cpfCnpj')}
                    placeholder="000.000.000-00"
                    onChange={handleCpfChange}
                    className={errors.cpfCnpj ? 'border-red-500' : ''}
                  />
                  {errors.cpfCnpj && (
                    <p className="text-red-500 text-xs mt-1">{errors.cpfCnpj.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="phone-pix">Telefone (opcional)</Label>
                <Input
                  id="phone-pix"
                  {...register('phone')}
                  placeholder="(00) 00000-0000"
                  onChange={handlePhoneChange}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </div>
                ) : (
                  'Gerar PIX'
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Tab BOLETO */}
          <TabsContent value="BOLETO" className="space-y-4">
            <form onSubmit={handleSubmit(onCustomerSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name-boleto">Nome Completo</Label>
                <Input
                  id="name-boleto"
                  {...register('name')}
                  placeholder="Digite seu nome completo"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email-boleto">Email</Label>
                  <Input
                    id="email-boleto"
                    type="email"
                    {...register('email')}
                    placeholder="email@exemplo.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cpfCnpj-boleto">CPF/CNPJ</Label>
                  <Input
                    id="cpfCnpj-boleto"
                    {...register('cpfCnpj')}
                    placeholder="000.000.000-00"
                    onChange={handleCpfChange}
                    className={errors.cpfCnpj ? 'border-red-500' : ''}
                  />
                  {errors.cpfCnpj && (
                    <p className="text-red-500 text-xs mt-1">{errors.cpfCnpj.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="phone-boleto">Telefone (opcional)</Label>
                <Input
                  id="phone-boleto"
                  {...register('phone')}
                  placeholder="(00) 00000-0000"
                  onChange={handlePhoneChange}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </div>
                ) : (
                  'Gerar Boleto'
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Tab CARTÃO */}
          <TabsContent value="CREDIT_CARD" className="space-y-4">
            <CreditCardPayment
              paymentValue={value}
              dueDate={dueDate}
              description={description}
              clinicId={clinicId}
              productId={productId}
              billingPeriod={billingPeriod}
              onSuccess={handleCreditCardSuccess}
              onPaymentError={handleCreditCardError}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}