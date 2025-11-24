import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";
import { Professional } from "@/types";
import { formatLocalDate } from '@/shared/utils';

interface Stats {
  monthlyRevenue: number;
  monthlyPending: number;
  revenueGrowth: number;
}

interface ProfessionalFinancialTabProps {
  professional: Professional;
  revenue: any[];
  stats: Stats;
}

export function ProfessionalFinancialTab({ 
  professional, 
  revenue, 
  stats 
}: ProfessionalFinancialTabProps) {
  const sortedRevenue = revenue
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 20); // Mostrar apenas os 20 mais recentes

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                R$ {stats.monthlyRevenue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Receita do Mês</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                R$ {stats.monthlyPending.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">A Receber (Mês)</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Crescimento Mensal</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <DollarSign className="mr-2 h-5 w-5" />
            Histórico Financeiro ({revenue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedRevenue.length > 0 ? (
            <div className="space-y-4">
              {sortedRevenue.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-sm text-gray-600">
                      Vencimento: {formatLocalDate(item.dueDate)}
                    </div>
                    {item.paidDate && (
                      <div className="text-sm text-green-600">
                        Pago em: {formatLocalDate(item.paidDate)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-lg">
                      R$ {Number(item.amount).toFixed(2)}
                    </div>
                    <Badge variant={
                      item.status === 'pago' ? 'default' :
                      item.status === 'vencido' ? 'destructive' :
                      'secondary'
                    }>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {revenue.length > 20 && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Mostrando 20 registros mais recentes de {revenue.length} total
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum registro financeiro</p>
              <p className="text-sm text-gray-400 mt-1">
                Registros financeiros aparecerão aqui conforme as consultas forem realizadas
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}