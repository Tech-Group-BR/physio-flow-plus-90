import { useState } from 'react'
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
import { PixPayment } from '@/components/PixPayment'
import { BoletoPayment } from '@/components/BoletoPayment'
import { CreditCardPayment } from '@/components/CreditCardPayment'
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
  description?: string
  dueDate?: string
  onPaymentSuccess?: (paymentData: any) => void
  onPaymentError?: (error: string) => void
}

export function PaymentSystem({
  productId,
  clinicId,
  value,
  description = 'Pagamento PhysioFlow Plus',
  dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
  onPaymentSuccess,
  onPaymentError
}: PaymentSystemProps) {
  const { createPayment, formatCpfCnpj, formatPhone, loading } = usePayments()
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX')
  const [step, setStep] = useState<'customer' | 'payment' | 'processing' | 'result'>('customer')
  const [paymentData, setPaymentData] = useState<any>(null)
  const [customerData, setCustomerData] = useState<CustomerFormData | null>(null)

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
          phone: data.phone?.replace(/\D/g, '')
        },
        billingType: paymentMethod,
        value,
        dueDate,
        description,
        clinicId,
        productId
      }

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
              value: paymentData.payment.value,
              dueDate: paymentData.payment.dueDate,
              pixCopyAndPaste: paymentData.pixQrCode?.payload || paymentData.payment.pixCopyAndPaste,
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
          onSuccess={handleCreditCardSuccess}
          onError={handleCreditCardError}
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
    <Card className="w-full max-w-lg mx-auto">
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
        <div className="space-y-6">
          {/* Seleção do método de pagamento */}
          <div>
            <Label className="text-base font-medium mb-3 block">Escolha a forma de pagamento</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PIX" id="pix" />
                  <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer">
                    <QrCode className="w-4 h-4" />
                    PIX
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BOLETO" id="boleto" />
                  <Label htmlFor="boleto" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="w-4 h-4" />
                    Boleto
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CREDIT_CARD" id="credit-card" />
                  <Label htmlFor="credit-card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="w-4 h-4" />
                    Cartão
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Formulário de dados do cliente */}
          <form onSubmit={handleSubmit(onCustomerSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
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
                <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                <Input
                  id="cpfCnpj"
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
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="(00) 00000-0000"
                onChange={handlePhoneChange}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </div>
              ) : paymentMethod === 'CREDIT_CARD' ? (
                'Continuar para Cartão'
              ) : (
                `Gerar ${paymentMethod === 'PIX' ? 'PIX' : 'Boleto'}`
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}