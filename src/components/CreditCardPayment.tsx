import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { usePayments } from '@/hooks/usePayments'
import { usePaymentPersistence } from '@/hooks/usePaymentPersistence'
import { CreditCard, Lock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const creditCardSchema = z.object({
  // Dados do cartão
  holderName: z.string().min(2, 'Nome do titular é obrigatório'),
  number: z.string().min(16, 'Número do cartão deve ter 16 dígitos').max(19, 'Número inválido'),
  expiryMonth: z.string().min(2, 'Mês obrigatório').max(2, 'Mês inválido'),
  expiryYear: z.string().min(2, 'Ano obrigatório').max(2, 'Ano inválido'),
  ccv: z.string().min(3, 'CVV deve ter 3 dígitos').max(4, 'CVV inválido'),
  
  // Dados do portador
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ é obrigatório'),
  postalCode: z.string().min(8, 'CEP é obrigatório'),
  addressNumber: z.string().min(1, 'Número do endereço é obrigatório'),
  phone: z.string().min(10, 'Telefone é obrigatório')
})

type CreditCardFormData = z.infer<typeof creditCardSchema>

interface CreditCardPaymentProps {
  paymentValue: number
  dueDate: string
  description?: string
  clinicId?: string
  productId?: string
  billingPeriod?: string
  onSuccess?: (paymentData: any) => void
  onPaymentError?: (error: string) => void
}

export function CreditCardPayment({ 
  paymentValue, 
  dueDate, 
  description,
  clinicId,
  productId,
  billingPeriod,
  onSuccess, 
  onPaymentError 
}: CreditCardPaymentProps) {
  const { createPayment, formatCpfCnpj, formatPhone, formatCreditCard, loading } = usePayments()
  const { persistedData, persistData, clearCardData } = usePaymentPersistence()
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<CreditCardFormData>({
    resolver: zodResolver(creditCardSchema)
  })

  const watchedFields = watch()

  // Carregar dados persistidos quando o componente montar ou dados mudarem
  useEffect(() => {
    if (persistedData && Object.keys(persistedData).length > 0) {
      console.log('🔄 Carregando dados persistidos:', persistedData);
      
      // Resetar formulário com dados persistidos
      reset({
        holderName: persistedData.cardHolderName || '',
        number: persistedData.cardNumber || '',
        expiryMonth: persistedData.cardExpiryMonth || '',
        expiryYear: persistedData.cardExpiryYear || '',
        ccv: persistedData.cardCcv || '',
        name: persistedData.holderName || '',
        email: persistedData.holderEmail || '',
        cpfCnpj: persistedData.holderCpfCnpj || '',
        postalCode: persistedData.holderPostalCode || '',
        addressNumber: persistedData.holderAddressNumber || '',
        phone: persistedData.holderPhone || '',
      }, { keepDefaultValues: false });
    }
  }, [persistedData, reset]);

  // Persistir dados conforme o usuário digita
  useEffect(() => {
    const subscription = watch((values) => {
      if (values && Object.values(values).some(v => v)) { // Só persiste se houver dados
        console.log('💾 Persistindo dados do cartão...');
        persistData({
          cardHolderName: values.holderName,
          cardNumber: values.number,
          cardExpiryMonth: values.expiryMonth,
          cardExpiryYear: values.expiryYear,
          cardCcv: values.ccv,
          holderName: values.name,
          holderEmail: values.email,
          holderCpfCnpj: values.cpfCnpj,
          holderPostalCode: values.postalCode,
          holderAddressNumber: values.addressNumber,
          holderPhone: values.phone,
        });
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, persistData])

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCreditCard(e.target.value)
    setValue('number', formatted)
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpfCnpj(e.target.value)
    setValue('cpfCnpj', formatted)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setValue('phone', formatted)
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 5) {
      value = value.replace(/(\d{5})(\d)/, '$1-$2')
    }
    setValue('postalCode', value)
  }

  const onSubmit = async (data: CreditCardFormData) => {
    try {
      setProcessing(true)

      const paymentData = {
        customer: {
          name: data.name,
          email: data.email,
          cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
          phone: data.phone.replace(/\D/g, '')
        },
        billingType: 'CREDIT_CARD' as const,
        value: paymentValue,
        dueDate,
        description,
        clinicId,
        productId,
        billingPeriod, // Período de cobrança
        creditCard: {
          holderName: data.holderName,
          number: data.number.replace(/\s/g, ''),
          expiryMonth: data.expiryMonth,
          expiryYear: data.expiryYear,
          ccv: data.ccv
        },
        creditCardHolderInfo: {
          name: data.name,
          email: data.email,
          cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
          postalCode: data.postalCode.replace(/\D/g, ''),
          addressNumber: data.addressNumber,
          phone: data.phone.replace(/\D/g, '')
        }
      }

      const result = await createPayment(paymentData)
      
      if (result.success) {
        setSuccess(true)
        clearCardData() // Limpar dados do cartão após sucesso
        onSuccess?.(result)
        toast.success('Pagamento processado com sucesso!')
      } else {
        throw new Error('Erro no processamento do pagamento')
      }

    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error)
      const errorMessage = error.message || 'Erro ao processar pagamento'
      onPaymentError?.(errorMessage)
      toast.error(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Pagamento Realizado!</CardTitle>
          <CardDescription>
            Seu cartão de crédito foi processado com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-2xl font-bold mb-2">
            R$ {paymentValue.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            Processado em {new Date().toLocaleString('pt-BR')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Pagamento com Cartão
        </CardTitle>
        <CardDescription>
          Valor: R$ {paymentValue.toLocaleString('pt-BR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Dados do Cartão */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Dados do Cartão
            </h3>
            
            <div>
              <Label htmlFor="holderName">Nome no Cartão</Label>
              <Input
                id="holderName"
                {...register('holderName')}
                placeholder="Nome como está no cartão"
                className={errors.holderName ? 'border-red-500' : ''}
              />
              {errors.holderName && (
                <p className="text-red-500 text-xs mt-1">{errors.holderName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="number">Número do Cartão</Label>
              <Input
                id="number"
                {...register('number')}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                onChange={handleCardNumberChange}
                className={errors.number ? 'border-red-500' : ''}
              />
              {errors.number && (
                <p className="text-red-500 text-xs mt-1">{errors.number.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="expiryMonth">Mês</Label>
                <Input
                  id="expiryMonth"
                  {...register('expiryMonth')}
                  placeholder="MM"
                  maxLength={2}
                  className={errors.expiryMonth ? 'border-red-500' : ''}
                />
                {errors.expiryMonth && (
                  <p className="text-red-500 text-xs mt-1">{errors.expiryMonth.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="expiryYear">Ano</Label>
                <Input
                  id="expiryYear"
                  {...register('expiryYear')}
                  placeholder="AA"
                  maxLength={2}
                  className={errors.expiryYear ? 'border-red-500' : ''}
                />
                {errors.expiryYear && (
                  <p className="text-red-500 text-xs mt-1">{errors.expiryYear.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="ccv">CVV</Label>
                <Input
                  id="ccv"
                  {...register('ccv')}
                  placeholder="000"
                  maxLength={4}
                  type="password"
                  className={errors.ccv ? 'border-red-500' : ''}
                />
                {errors.ccv && (
                  <p className="text-red-500 text-xs mt-1">{errors.ccv.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Dados do Portador */}
          <div className="space-y-4">
            <h3 className="font-medium">Dados do Portador</h3>
            
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Nome completo"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
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
              <div>
                <Label htmlFor="postalCode">CEP</Label>
                <Input
                  id="postalCode"
                  {...register('postalCode')}
                  placeholder="00000-000"
                  maxLength={9}
                  onChange={handleCepChange}
                  className={errors.postalCode ? 'border-red-500' : ''}
                />
                {errors.postalCode && (
                  <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="addressNumber">Número</Label>
              <Input
                id="addressNumber"
                {...register('addressNumber')}
                placeholder="Número do endereço"
                className={errors.addressNumber ? 'border-red-500' : ''}
              />
              {errors.addressNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.addressNumber.message}</p>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={processing || loading}
          >
            {processing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processando...
              </div>
            ) : (
              `Pagar R$ ${paymentValue.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`
            )}
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <Lock className="w-3 h-3" />
            <span>Seus dados estão protegidos e são processados de forma segura</span>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}