import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, TrendingDown, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BillingPeriod {
  period: 'monthly' | 'quarterly' | 'semiannual' | 'annual'
  displayName: string
  description: string
  months: number
  discountPercent: number
  monthlyPrice: number
  totalPrice: number
  savings: number
}

interface SubscriptionPeriodSelectorProps {
  basePrice: number
  periods: BillingPeriod[]
  selectedPeriod: string
  onPeriodChange: (period: string) => void
}

export function SubscriptionPeriodSelector({
  basePrice,
  periods,
  selectedPeriod,
  onPeriodChange
}: SubscriptionPeriodSelectorProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getMostPopular = () => {
    // Semestral é o mais popular (melhor custo-benefício)
    return periods.find(p => p.period === 'semiannual')?.period || periods[1]?.period
  }

  const getBestValue = () => {
    // Anual tem o maior desconto
    return periods.find(p => p.period === 'annual')?.period || periods[periods.length - 1]?.period
  }

  return (
    <div className="w-full space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Escolha o período da sua assinatura</h3>
        <p className="text-muted-foreground">
          Economize mais pagando antecipadamente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {periods.map((period) => {
          const isSelected = selectedPeriod === period.period
          const isMostPopular = period.period === getMostPopular()
          const isBestValue = period.period === getBestValue()

          return (
            <Card
              key={period.period}
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-lg border-2",
                isSelected
                  ? "border-blue-500 shadow-lg scale-105"
                  : "border-gray-200 hover:border-blue-300"
              )}
              onClick={() => onPeriodChange(period.period)}
            >
              {/* Badge de destaque */}
              {isMostPopular && !isBestValue && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1">
                    <Zap className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              {isBestValue && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-500 hover:bg-green-600 text-white px-3 py-1">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Melhor Oferta
                  </Badge>
                </div>
              )}

              <CardContent className="p-6 space-y-4">
                {/* Checkmark de seleção */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="text-xl font-bold">{period.displayName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {period.months} {period.months === 1 ? 'mês' : 'meses'}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="bg-blue-500 rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Desconto */}
                {period.discountPercent > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-500 text-white border-green-500">
                        -{period.discountPercent}%
                      </Badge>
                      <span className="text-sm font-medium text-green-700">
                        Economize {formatCurrency(period.savings)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Preços */}
                <div className="space-y-2">
                  {period.discountPercent > 0 ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(basePrice)}
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(period.monthlyPrice)}
                        </span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total: <span className="font-semibold text-gray-900">{formatCurrency(period.totalPrice)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                          {formatCurrency(period.monthlyPrice)}
                        </span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Descrição */}
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  {period.description}
                </p>

                {/* Indicador visual de seleção */}
                {isSelected && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Resumo do período selecionado */}
      {selectedPeriod && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          {(() => {
            const selected = periods.find(p => p.period === selectedPeriod)
            if (!selected) return null

            return (
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-blue-900">
                    Você selecionou: {selected.displayName}
                  </p>
                  {selected.discountPercent > 0 && (
                    <p className="text-sm text-blue-700">
                      🎉 Você vai economizar {formatCurrency(selected.savings)} com este plano!
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(selected.totalPrice)}
                  </p>
                  <p className="text-sm text-blue-700">
                    {selected.monthlyPrice < basePrice ? (
                      <>{formatCurrency(selected.monthlyPrice)}/mês</>
                    ) : (
                      <>pagamento único</>
                    )}
                  </p>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
