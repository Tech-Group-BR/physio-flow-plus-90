/**
 * Subscription Plans Page
 * 
 * Displays available subscription plans with pricing
 * Allows users to select a plan and proceed to checkout
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getAllActivePlans, calculatePlanPrice, type SubscriptionPlan } from '@/services/subscriptionPlans';

type BillingPeriod = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export function SubscriptionPlansPage() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>('monthly');

  // Fetch active plans
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getAllActivePlans
  });

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    toast.error('Erro ao carregar planos');
    return (
      <div className="container max-w-6xl py-8">
        <div className="text-center text-destructive">
          Erro ao carregar planos. Tente novamente mais tarde.
        </div>
      </div>
    );
  }

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    // Navigate to checkout with selected plan and period
    navigate('/checkout', {
      state: {
        planId: plan.id,
        planName: plan.name,
        billingPeriod: selectedPeriod,
        price: calculatePlanPrice(plan.price, getPeriodMonths(selectedPeriod)).totalPrice
      }
    });
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Escolha seu Plano</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Comece a gerenciar sua clínica de fisioterapia de forma profissional
        </p>
      </div>

      {/* Billing Period Selector */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border p-1 bg-muted">
          {([
            { value: 'monthly', label: 'Mensal' },
            { value: 'quarterly', label: 'Trimestral', badge: '5% OFF' },
            { value: 'semiannual', label: 'Semestral', badge: '10% OFF' },
            { value: 'annual', label: 'Anual', badge: '15% OFF' }
          ] as const).map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`
                relative px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${selectedPeriod === period.value
                  ? 'bg-background shadow-sm'
                  : 'hover:bg-background/50'
                }
              `}
            >
              {period.label}
              {period.badge && (
                <Badge className="ml-2 text-xs" variant="secondary">
                  {period.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans?.map((plan) => {
          const pricing = calculatePlanPrice(plan.price, getPeriodMonths(selectedPeriod));
          const features = Array.isArray(plan.features) ? plan.features : [];

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular ? 'border-primary shadow-lg scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="gap-1 px-3 py-1">
                    <Crown className="h-3 w-3" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                {plan.description && (
                  <CardDescription>{plan.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold">
                      {formatCurrency(pricing.totalPrice)}
                    </span>
                    <span className="text-muted-foreground">
                      /{getPeriodLabel(selectedPeriod)}
                    </span>
                  </div>
                  {selectedPeriod !== 'monthly' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {formatCurrency(pricing.monthlyAmount)}/mês
                      {pricing.discount > 0 && (
                        <span className="text-green-600 ml-1">
                          (economize {formatCurrency(pricing.discount)})
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Limits */}
                {(plan.maxProfessionals || plan.maxPatients) && (
                  <div className="space-y-2 text-sm border-t pt-4">
                    {plan.maxProfessionals && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profissionais</span>
                        <span className="font-medium">
                          {plan.maxProfessionals === -1 ? 'Ilimitado' : plan.maxProfessionals}
                        </span>
                      </div>
                    )}
                    {plan.maxPatients && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pacientes</span>
                        <span className="font-medium">
                          {plan.maxPatients === -1 ? 'Ilimitado' : plan.maxPatients}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Features */}
                <div className="space-y-3">
                  {features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {plan.popular && <Zap className="h-4 w-4 mr-2" />}
                  Escolher Plano
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="text-center text-sm text-muted-foreground max-w-2xl mx-auto space-y-2">
        <p>
          Todos os planos incluem suporte técnico via WhatsApp e atualizações gratuitas.
        </p>
        <p>
          Você pode cancelar ou trocar de plano a qualquer momento.
        </p>
      </div>
    </div>
  );
}

// Helper functions
function getPeriodMonths(period: BillingPeriod): number {
  const map: Record<BillingPeriod, number> = {
    monthly: 1,
    quarterly: 3,
    semiannual: 6,
    annual: 12
  };
  return map[period];
}

function getPeriodLabel(period: BillingPeriod): string {
  const map: Record<BillingPeriod, string> = {
    monthly: 'mês',
    quarterly: 'trimestre',
    semiannual: 'semestre',
    annual: 'ano'
  };
  return map[period];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}
