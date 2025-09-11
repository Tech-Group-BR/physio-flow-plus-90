
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClinic } from "@/contexts/ClinicContext";
import { endOfMonth, format, isThisMonth, isThisYear, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, DollarSign, TrendingDown, TrendingUp } from "lucide-react";

export function FinancialReports() {
  const {
    accountsPayable,
    accountsReceivable,
    payments,
    patients,
    appointments
  } = useClinic();

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Estatísticas do mês atual
  const monthReceivables = (accountsReceivable || []).filter(ar => {
    const date = parseISO(ar.dueDate);
    return isThisMonth(date);
  });

  const monthPayables = (accountsPayable || []).filter(ap => {
    const date = parseISO(ap.dueDate);
    return isThisMonth(date);
  });

  const monthPayments = payments.filter(p => {
    const date = parseISO(p.createdAt);
    return isThisMonth(date);
  });

  const totalMonthReceivables = monthReceivables.reduce((sum, ar) => sum + ar.amount, 0);
  const totalMonthPayables = monthPayables.reduce((sum, ap) => sum + ap.amount, 0);
  const totalMonthPayments = monthPayments.reduce((sum, p) => sum + p.amount, 0);

  const receivedMonthReceivables = monthReceivables
    .filter(ar => ar.status === 'recebido')
    .reduce((sum, ar) => sum + ar.amount, 0);

  const paidMonthPayables = monthPayables
    .filter(ap => ap.status === 'pago')
    .reduce((sum, ap) => sum + ap.amount, 0);

  // Estatísticas do ano atual
  const yearReceivables = (accountsReceivable || []).filter(ar => {
    const date = parseISO(ar.dueDate);
    return isThisYear(date);
  });

  const yearPayables = (accountsPayable || []).filter(ap => {
    const date = parseISO(ap.dueDate);
    return isThisYear(date);
  });

  const totalYearReceivables = yearReceivables.reduce((sum, ar) => sum + ar.amount, 0);
  const totalYearPayables = yearPayables.reduce((sum, ap) => sum + ap.amount, 0);

  // Contas vencidas
  const overdueReceivables = (accountsReceivable || []).filter(ar => {
    const dueDate = parseISO(ar.dueDate);
    return dueDate < currentDate && ar.status === 'pendente';
  });

  const overduePayables = (accountsPayable || []).filter(ap => {
    const dueDate = parseISO(ap.dueDate);
    return dueDate < currentDate && ap.status === 'pendente';
  });

  const totalOverdueReceivables = overdueReceivables.reduce((sum, ar) => sum + ar.amount, 0);
  const totalOverduePayables = overduePayables.reduce((sum, ap) => sum + ap.amount, 0);

  // Estatísticas por categoria
  const categoryStats = (accountsPayable || []).reduce((acc, ap) => {
    const category = ap.category || 'Sem categoria';
    if (!acc[category]) {
      acc[category] = { total: 0, paid: 0, pending: 0 };
    }
    acc[category].total += ap.amount;
    if (ap.status === 'pago') {
      acc[category].paid += ap.amount;
    } else {
      acc[category].pending += ap.amount;
    }
    return acc;
  }, {} as Record<string, { total: number; paid: number; pending: number }>);

  // Estatísticas por método de pagamento
  const methodStats = (accountsReceivable || []).reduce((acc, ar) => {
    const method = ar.method || 'Não especificado';
    if (!acc[method]) {
      acc[method] = { total: 0, count: 0 };
    }
    acc[method].total += ar.amount;
    acc[method].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Fluxo de caixa mensal (últimos 6 meses)
  const getMonthlyCashFlow = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthReceivables = (accountsReceivable || []).filter(ar => {
        const dueDate = parseISO(ar.dueDate);
        return dueDate >= monthStart && dueDate <= monthEnd && ar.status === 'recebido';
      });

      const monthPayables = (accountsPayable || []).filter(ap => {
        const dueDate = parseISO(ap.dueDate);
        return dueDate >= monthStart && dueDate <= monthEnd && ap.status === 'pago';
      });

      const totalReceived = monthReceivables.reduce((sum, ar) => sum + ar.amount, 0);
      const totalPaid = monthPayables.reduce((sum, ap) => sum + ap.amount, 0);

      months.push({
        month: format(date, 'MMM/yy', { locale: ptBR }),
        received: totalReceived,
        paid: totalPaid,
        balance: totalReceived - totalPaid
      });
    }
    return months;
  };

  const monthlyCashFlow = getMonthlyCashFlow();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Relatórios Financeiros</h2>
        <Badge variant="outline">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </Badge>
      </div>

      {/* Resumo Mensal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalMonthReceivables.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {receivedMonthReceivables > 0 ? `Recebido: R$ ${receivedMonthReceivables.toFixed(2)}` : 'Nenhuma receita recebida'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalMonthPayables.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paidMonthPayables > 0 ? `Pago: R$ ${paidMonthPayables.toFixed(2)}` : 'Nenhuma despesa paga'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(totalMonthReceivables - totalMonthPayables) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {(totalMonthReceivables - totalMonthPayables).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(totalMonthReceivables - totalMonthPayables) >= 0 ? 'Positivo' : 'Negativo'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {totalMonthPayments.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthPayments.length} transações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Anual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Resumo Anual {currentYear}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Total a Receber:</span>
              <span className="font-semibold text-green-600">
                R$ {totalYearReceivables.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total a Pagar:</span>
              <span className="font-semibold text-red-600">
                R$ {totalYearPayables.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="font-medium">Saldo:</span>
              <span className={`font-bold ${(totalYearReceivables - totalYearPayables) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {(totalYearReceivables - totalYearPayables).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contas Vencidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Receber:</span>
              <span className="font-semibold text-red-600">
                R$ {totalOverdueReceivables.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Pagar:</span>
              <span className="font-semibold text-red-600">
                R$ {totalOverduePayables.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="font-medium">Total Vencido:</span>
              <span className="font-bold text-red-600">
                R$ {(totalOverdueReceivables + totalOverduePayables).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fluxo de Caixa Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa - Últimos 6 Meses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyCashFlow.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="font-medium min-w-[80px]">{month.month}</span>
                  <div className="flex items-center space-x-6">
                    <div className="text-sm">
                      <span className="text-green-600">Recebido: R$ {month.received.toFixed(2)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-red-600">Pago: R$ {month.paid.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className={`font-bold ${month.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {month.balance.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{category}</span>
                <div className="flex items-center space-x-6">
                  <div className="text-sm">
                    <span className="text-green-600">Pago: R$ {stats.paid.toFixed(2)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-yellow-600">Pendente: R$ {stats.pending.toFixed(2)}</span>
                  </div>
                  <div className="text-sm font-medium">
                    <span>Total: R$ {stats.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas por Método de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Receitas por Método de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(methodStats).map(([method, stats]) => (
              <div key={method} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{method}</span>
                <div className="flex items-center space-x-6">
                  <div className="text-sm">
                    <span>Quantidade: {stats.count}</span>
                  </div>
                  <div className="text-sm font-medium">
                    <span className="text-green-600">Total: R$ {stats.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contas Vencidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Contas a Receber Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            {overdueReceivables.length > 0 ? (
              <div className="space-y-2">
                {overdueReceivables.slice(0, 5).map((account) => {
                  const patient = patients.find(p => p.id === account.patientId);
                  return (
                    <div key={account.id} className="flex justify-between items-center p-2 border rounded text-sm">
                      <div>
                        <div className="font-medium">{account.description}</div>
                        <div className="text-muted-foreground">
                          {patient ? patient.fullName : 'Paciente não especificado'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">R$ {account.amount.toFixed(2)}</div>
                        <div className="text-red-600">
                          Vencido há {Math.ceil((currentDate.getTime() - parseISO(account.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                        </div>
                      </div>
                    </div>
                  );
                })}
                {overdueReceivables.length > 5 && (
                  <div className="text-center text-sm text-muted-foreground pt-2">
                    +{overdueReceivables.length - 5} contas vencidas
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Nenhuma conta a receber vencida
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Contas a Pagar Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            {overduePayables.length > 0 ? (
              <div className="space-y-2">
                {overduePayables.slice(0, 5).map((account) => (
                  <div key={account.id} className="flex justify-between items-center p-2 border rounded text-sm">
                    <div>
                      <div className="font-medium">{account.description}</div>
                      <div className="text-muted-foreground">{account.supplier}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">R$ {account.amount.toFixed(2)}</div>
                      <div className="text-red-600">
                        Vencido há {Math.ceil((currentDate.getTime() - parseISO(account.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                      </div>
                    </div>
                  </div>
                ))}
                {overduePayables.length > 5 && (
                  <div className="text-center text-sm text-muted-foreground pt-2">
                    +{overduePayables.length - 5} contas vencidas
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Nenhuma conta a pagar vencida
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
