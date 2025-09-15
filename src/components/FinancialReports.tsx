import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClinic } from "@/contexts/ClinicContext";
import { endOfMonth, format, isThisMonth, parseISO, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";

export function FinancialReports() {
  const { accountsPayable, accountsReceivable, patients } = useClinic();

  // Otimização: Todos os cálculos são feitos dentro de um único useMemo.
  // Isso evita re-cálculos desnecessários a cada renderização.
  const reportData = useMemo(() => {
    // Etapa 1: Garantir que os dados sejam arrays, mesmo que vazios.
    const receivables = accountsReceivable || [];
    const payables = accountsPayable || [];
    const safePatients = patients || [];

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthStart = startOfMonth(currentDate);
    const currentMonthEnd = endOfMonth(currentDate);

    // --- Estatísticas do Mês Atual ---
    // O que foi efetivamente recebido/pago este mês
    const receivedThisMonth = receivables.filter(r => 
      r.receivedDate && parseISO(r.receivedDate) >= currentMonthStart && parseISO(r.receivedDate) <= currentMonthEnd
    );
    const paidThisMonth = payables.filter(p => 
      p.paidDate && parseISO(p.paidDate) >= currentMonthStart && parseISO(p.paidDate) <= currentMonthEnd
    );
    // Previsão do que tem vencimento para este mês
    const dueThisMonthReceivables = receivables.filter(r => isThisMonth(parseISO(r.dueDate)));
    const dueThisMonthPayables = payables.filter(p => isThisMonth(parseISO(p.dueDate)));

    const totalReceivedMonth = receivedThisMonth.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalPaidMonth = paidThisMonth.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalDueReceivablesMonth = dueThisMonthReceivables.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalDuePayablesMonth = dueThisMonthPayables.reduce((sum, p) => sum + Number(p.amount), 0);
    
    // --- Estatísticas do Ano Atual (baseado no que foi pago/recebido) ---
    const receivedThisYear = receivables.filter(r => r.receivedDate && parseISO(r.receivedDate).getFullYear() === currentYear);
    const paidThisYear = payables.filter(p => p.paidDate && parseISO(p.paidDate).getFullYear() === currentYear);
    const totalReceivedYear = receivedThisYear.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalPaidYear = paidThisYear.reduce((sum, p) => sum + Number(p.amount), 0);

    // --- Contas Vencidas ---
    const overdueReceivables = receivables.filter(r => parseISO(r.dueDate) < currentDate && r.status === 'pendente');
    const overduePayables = payables.filter(p => parseISO(p.dueDate) < currentDate && p.status === 'pendente');
    const totalOverdueReceivables = overdueReceivables.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalOverduePayables = overduePayables.reduce((sum, p) => sum + Number(p.amount), 0);

    // --- Estatísticas por Categoria e Método ---
    const categoryStats = payables.reduce((acc, ap) => {
      const category = ap.category || 'Sem categoria';
      if (!acc[category]) acc[category] = { total: 0, paid: 0, pending: 0 };
      acc[category].total += Number(ap.amount);
      if (ap.status === 'pago') acc[category].paid += Number(ap.amount);
      else acc[category].pending += Number(ap.amount);
      return acc;
    }, {} as Record<string, { total: number; paid: number; pending: number }>);

    const methodStats = receivables.filter(r => r.status === 'recebido').reduce((acc, ar) => {
      const method = ar.method || 'Não especificado';
      if (!acc[method]) acc[method] = { total: 0, count: 0 };
      acc[method].total += Number(ar.amount);
      acc[method].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    // --- Fluxo de Caixa Mensal (Últimos 6 Meses) ---
    const monthlyCashFlow = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(currentDate, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const totalReceived = receivables
        .filter(r => r.receivedDate && parseISO(r.receivedDate) >= monthStart && parseISO(r.receivedDate) <= monthEnd)
        .reduce((sum, r) => sum + Number(r.amount), 0);
      
      const totalPaid = payables
        .filter(p => p.paidDate && parseISO(p.paidDate) >= monthStart && parseISO(p.paidDate) <= monthEnd)
        .reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        month: format(date, 'MMM/yy', { locale: ptBR }),
        received: totalReceived,
        paid: totalPaid,
        balance: totalReceived - totalPaid
      };
    }).reverse();

    return {
      currentDate,
      totalDueReceivablesMonth,
      totalDuePayablesMonth,
      totalReceivedMonth,
      totalPaidMonth,
      receivedThisMonth,
      totalReceivedYear,
      totalPaidYear,
      overdueReceivables,
      overduePayables,
      totalOverdueReceivables,
      totalOverduePayables,
      categoryStats,
      methodStats,
      monthlyCashFlow,
      safePatients
    };
  }, [accountsPayable, accountsReceivable, patients]);

  // --- Renderização do Componente ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Relatórios Financeiros</h2>
        <Badge variant="outline">
          {format(reportData.currentDate, 'MMMM yyyy', { locale: ptBR })}
        </Badge>
      </div>

      {/* Resumo Mensal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previsão de Receitas (Mês)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {reportData.totalDueReceivablesMonth.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Recebido até agora: R$ {reportData.totalReceivedMonth.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previsão de Despesas (Mês)</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {reportData.totalDuePayablesMonth.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pago até agora: R$ {reportData.totalPaidMonth.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balanço do Mês (Realizado)</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(reportData.totalReceivedMonth - reportData.totalPaidMonth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {(reportData.totalReceivedMonth - reportData.totalPaidMonth).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(reportData.totalReceivedMonth - reportData.totalPaidMonth) >= 0 ? 'Positivo' : 'Negativo'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebimentos no Mês</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {reportData.totalReceivedMonth.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData.receivedThisMonth.length} transações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Anual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Resumo Anual {reportData.currentDate.getFullYear()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Total Recebido:</span>
              <span className="font-semibold text-green-600">
                R$ {reportData.totalReceivedYear.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Pago:</span>
              <span className="font-semibold text-red-600">
                R$ {reportData.totalPaidYear.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="font-medium">Saldo (Realizado):</span>
              <span className={`font-bold ${(reportData.totalReceivedYear - reportData.totalPaidYear) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {(reportData.totalReceivedYear - reportData.totalPaidYear).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contas Vencidas (Pendentes)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>A Receber:</span>
              <span className="font-semibold text-red-600">
                R$ {reportData.totalOverdueReceivables.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>A Pagar:</span>
              <span className="font-semibold text-red-600">
                R$ {reportData.totalOverduePayables.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="font-medium">Total Vencido:</span>
              <span className="font-bold text-red-600">
                R$ {(reportData.totalOverdueReceivables + reportData.totalOverduePayables).toFixed(2)}
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
            {reportData.monthlyCashFlow.map((monthData, index) => (
              <div key={index} className="flex flex-wrap items-center justify-between p-3 border rounded-lg gap-2">
                <span className="font-medium min-w-[70px]">{monthData.month}</span>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                  <span className="text-sm text-green-600">Recebido: R$ {monthData.received.toFixed(2)}</span>
                  <span className="text-sm text-red-600">Pago: R$ {monthData.paid.toFixed(2)}</span>
                </div>
                <div className={`font-bold ${monthData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {monthData.balance.toFixed(2)}
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
            {Object.entries(reportData.categoryStats).map(([category, stats]) => (
              <div key={category} className="flex flex-wrap items-center justify-between p-3 border rounded-lg gap-2">
                <span className="font-medium">{category}</span>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                  <span className="text-sm text-green-600">Pago: R$ {stats.paid.toFixed(2)}</span>
                  <span className="text-sm text-yellow-600">Pendente: R$ {stats.pending.toFixed(2)}</span>
                  <span className="text-sm font-medium">Total: R$ {stats.total.toFixed(2)}</span>
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
            {Object.entries(reportData.methodStats).map(([method, stats]) => (
              <div key={method} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{method}</span>
                <div className="flex items-center space-x-6">
                  <span className="text-sm">Quantidade: {stats.count}</span>
                  <span className="text-sm font-medium text-green-600">Total: R$ {stats.total.toFixed(2)}</span>
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
            {reportData.overdueReceivables.length > 0 ? (
              <div className="space-y-2">
                {reportData.overdueReceivables.slice(0, 5).map((account) => {
                  const patient = reportData.safePatients.find(p => p.id === account.patientId);
                  return (
                    <div key={account.id} className="flex justify-between items-center p-2 border rounded text-sm">
                      <div>
                        <div className="font-medium">{account.description}</div>
                        <div className="text-muted-foreground">{patient ? patient.fullName : 'Paciente'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">R$ {account.amount.toFixed(2)}</div>
                        <div className="text-red-600">
                          Vencido há {Math.ceil((reportData.currentDate.getTime() - parseISO(account.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                        </div>
                      </div>
                    </div>
                  );
                })}
                {reportData.overdueReceivables.length > 5 && (
                  <div className="text-center text-sm text-muted-foreground pt-2">
                    +{reportData.overdueReceivables.length - 5} outras contas vencidas
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">Nenhuma conta a receber vencida.</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Contas a Pagar Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.overduePayables.length > 0 ? (
              <div className="space-y-2">
                {reportData.overduePayables.slice(0, 5).map((account) => (
                  <div key={account.id} className="flex justify-between items-center p-2 border rounded text-sm">
                    <div>
                      <div className="font-medium">{account.description}</div>
                      <div className="text-muted-foreground">{account.category || 'Sem categoria'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">R$ {account.amount.toFixed(2)}</div>
                      <div className="text-red-600">
                        Vencido há {Math.ceil((reportData.currentDate.getTime() - parseISO(account.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                      </div>
                    </div>
                  </div>
                ))}
                {reportData.overduePayables.length > 5 && (
                  <div className="text-center text-sm text-muted-foreground pt-2">
                    +{reportData.overduePayables.length - 5} outras contas vencidas
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">Nenhuma conta a pagar vencida.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}