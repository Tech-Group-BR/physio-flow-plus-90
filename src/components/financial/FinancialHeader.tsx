import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface FinancialData {
  totalReceivablesReceived: number;
  totalReceivablesPending: number;
  totalPayablesPaid: number;
  totalPayablesPending: number;
}

interface FinancialHeaderProps {
  financialData: FinancialData;
  showPayableForm: boolean;
  setShowPayableForm: (show: boolean) => void;
  showReceivableForm: boolean;
  setShowReceivableForm: (show: boolean) => void;
}

export function FinancialHeader({
  financialData,
  showPayableForm,
  setShowPayableForm,
  showReceivableForm,
  setShowReceivableForm
}: FinancialHeaderProps) {
  const balance = financialData.totalReceivablesReceived - financialData.totalPayablesPaid;
  const pendingBalance = financialData.totalReceivablesPending - financialData.totalPayablesPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600">Gestão de contas a pagar e receber</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Button onClick={() => setShowPayableForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
          <Button onClick={() => setShowReceivableForm(true)} variant="outline" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Receita
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recebido</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {financialData.totalReceivablesReceived.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">A Receber</p>
                <p className="text-2xl font-bold text-orange-600">
                  R$ {financialData.totalReceivablesPending.toFixed(2)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pago</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {financialData.totalPayablesPaid.toFixed(2)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">A Pagar</p>
                <p className="text-2xl font-bold text-purple-600">
                  R$ {financialData.totalPayablesPending.toFixed(2)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {balance.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Pendente: R$ {pendingBalance.toFixed(2)}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}