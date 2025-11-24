/**
 * Checkout Page
 * 
 * Payment checkout flow for subscription
 * Handles customer information, payment method selection, and payment processing
 */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreditCard, QrCode, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createAsaasCustomer, type AsaasCustomerData } from '@/services/asaas/customers';
import { createPayment, type BillingType, calculateDueDate } from '@/services/asaas/payments';
import { createSubscription } from '@/services/subscriptions';
import { getPlanById } from '@/services/subscriptionPlans';

const checkoutSchema = z.object({
  name: z.string().min(3, 'Nome completo é obrigatório'),
  email: z.string().email('Email inválido'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  paymentMethod: z.enum(['PIX', 'BOLETO', 'CREDIT_CARD']),
  // Credit card fields (conditional)
  cardNumber: z.string().optional(),
  cardName: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  // Address for credit card
  postalCode: z.string().optional(),
  addressNumber: z.string().optional()
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface LocationState {
  planId: string;
  planName: string;
  billingPeriod: string;
  price: number;
}

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = location.state as LocationState;

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      email: user?.email || '',
      cpfCnpj: '',
      phone: '',
      paymentMethod: 'PIX'
    }
  });

  const selectedPaymentMethod = form.watch('paymentMethod');

  // Redirect if no plan selected
  useEffect(() => {
    if (!state?.planId) {
      toast.error('Nenhum plano selecionado');
      navigate('/subscription/plans');
    }
  }, [state, navigate]);

  if (!state?.planId) {
    return null;
  }

  const handleSubmit = async (data: CheckoutFormData) => {
    if (!user?.clinicId) {
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create/get Asaas customer
      const customerData: AsaasCustomerData = {
        name: data.name,
        email: data.email,
        cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
        phone: data.phone.replace(/\D/g, ''),
        mobilePhone: data.phone.replace(/\D/g, ''),
        postalCode: data.postalCode?.replace(/\D/g, ''),
        addressNumber: data.addressNumber,
        clinicId: user.clinicId,
        profileId: user.id
      };

      toast.loading('Criando cadastro...');
      const { asaasCustomer, localCustomer } = await createAsaasCustomer(customerData);
      toast.dismiss();

      // Step 2: Create payment
      toast.loading('Processando pagamento...');
      const paymentData = {
        customerId: asaasCustomer.id,
        billingType: data.paymentMethod as BillingType,
        value: state.price,
        dueDate: calculateDueDate(7), // 7 days from now
        description: `Assinatura ${state.planName} - ${state.billingPeriod}`,
        billingPeriod: state.billingPeriod as any,
        clinicId: user.clinicId,
        productId: state.planId,
        externalReference: `sub_${user.clinicId}_${Date.now()}`,
        // Credit card data (if applicable)
        ...(data.paymentMethod === 'CREDIT_CARD' && {
          creditCard: {
            holderName: data.cardName!,
            number: data.cardNumber!.replace(/\D/g, ''),
            expiryMonth: data.cardExpiry!.split('/')[0],
            expiryYear: data.cardExpiry!.split('/')[1],
            ccv: data.cardCvv!
          },
          creditCardHolderInfo: {
            name: data.name,
            email: data.email,
            cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
            postalCode: data.postalCode!.replace(/\D/g, ''),
            addressNumber: data.addressNumber!,
            phone: data.phone.replace(/\D/g, '')
          }
        })
      };

      const paymentResponse = await createPayment(paymentData);
      toast.dismiss();

      // Step 3: Create subscription in database
      const plan = await getPlanById(state.planId);
      await createSubscription({
        clinicId: user.clinicId,
        planId: state.planId,
        customerId: localCustomer.id,
        startDate: new Date(),
        billingPeriod: state.billingPeriod as any,
        price: state.price
      });

      // Show payment result
      setPaymentResult(paymentResponse);
      toast.success('Pagamento criado com sucesso!');

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show payment result screen
  if (paymentResult) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Pagamento Criado!</CardTitle>
            <CardDescription>
              Seu pagamento foi registrado. Complete o pagamento para ativar sua assinatura.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* PIX QR Code */}
            {selectedPaymentMethod === 'PIX' && paymentResult.pixQrCode && (
              <div className="text-center space-y-4">
                <img
                  src={paymentResult.pixQrCode.encodedImage}
                  alt="QR Code PIX"
                  className="mx-auto max-w-xs"
                />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Ou copie o código PIX:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={paymentResult.pixQrCode.payload}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(paymentResult.pixQrCode.payload);
                        toast.success('Código copiado!');
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Boleto */}
            {selectedPaymentMethod === 'BOLETO' && paymentResult.payment.bankSlipUrl && (
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 mx-auto text-primary" />
                <Button
                  onClick={() => window.open(paymentResult.payment.bankSlipUrl, '_blank')}
                  size="lg"
                  className="w-full"
                >
                  Abrir Boleto
                </Button>
              </div>
            )}

            {/* Credit Card */}
            {selectedPaymentMethod === 'CREDIT_CARD' && (
              <div className="text-center space-y-4">
                <CreditCard className="h-16 w-16 mx-auto text-primary" />
                <p className="text-lg">
                  Pagamento em processamento
                </p>
                <p className="text-sm text-muted-foreground">
                  Você receberá uma confirmação por email assim que o pagamento for aprovado.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full"
                size="lg"
              >
                Ir para Dashboard
              </Button>
              <Button
                onClick={() => navigate('/subscription/plans')}
                variant="outline"
                className="w-full"
              >
                Voltar para Planos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/subscription/plans')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Finalizar Assinatura</h1>
        <p className="text-muted-foreground mt-2">
          Plano: {state.planName} • {formatCurrency(state.price)}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Responsável</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="João da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cpfCnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid md:grid-cols-3 gap-4"
                      >
                        {[
                          { value: 'PIX', label: 'PIX', icon: QrCode, subtitle: 'Aprovação instantânea' },
                          { value: 'BOLETO', label: 'Boleto', icon: FileText, subtitle: 'Até 3 dias úteis' },
                          { value: 'CREDIT_CARD', label: 'Cartão de Crédito', icon: CreditCard, subtitle: 'Aprovação imediata' }
                        ].map((method) => (
                          <label
                            key={method.value}
                            className={`
                              flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer
                              transition-colors hover:border-primary
                              ${field.value === method.value ? 'border-primary bg-primary/5' : ''}
                            `}
                          >
                            <RadioGroupItem value={method.value} className="sr-only" />
                            <method.icon className="h-8 w-8" />
                            <div className="text-center">
                              <p className="font-medium">{method.label}</p>
                              <p className="text-xs text-muted-foreground">{method.subtitle}</p>
                            </div>
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Credit Card Fields */}
              {selectedPaymentMethod === 'CREDIT_CARD' && (
                <div className="space-y-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Cartão</FormLabel>
                        <FormControl>
                          <Input placeholder="0000 0000 0000 0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cardName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome no Cartão</FormLabel>
                        <FormControl>
                          <Input placeholder="NOME COMO ESTÁ NO CARTÃO" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cardExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Validade</FormLabel>
                          <FormControl>
                            <Input placeholder="MM/AA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cardCvv"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CVV</FormLabel>
                          <FormControl>
                            <Input placeholder="123" maxLength={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input placeholder="00000-000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addressNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              `Confirmar Pagamento • ${formatCurrency(state.price)}`
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}
