import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClinic } from "@/contexts/ClinicContext";
import { format, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Calendar, CheckCircle, DollarSign, Plus, Search, Trash2, TrendingDown, TrendingUp, User } from "lucide-react";
import { useState } from "react";
import { AccountsPayableForm } from "./AccountsPayableForm";
import { AccountsReceivableForm } from "./AccountsReceivableForm";
import { FinancialReports } from "./FinancialReports";
import { PaymentForm } from "./PaymentForm";

export function FinancialPage() {
  const {
    payments,
    patients,
    updatePayment,
    accountsPayable,
    accountsReceivable,
    markReceivableAsPaid,
    markPayableAsPaid,
    deleteAccountsPayable,
    deleteAccountsReceivable
  } = useClinic();

  const [showForm, setShowForm] = useState(false);
  const [showPayableForm, setShowPayableForm] = useState(false);
  const [showReceivableForm, setShowReceivableForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchPayable, setSearchPayable] = useState("");
  const [searchReceivable, setSearchReceivable] = useState("");
  const [statusFilterPayable, setStatusFilterPayable] = useState("all");
  const [statusFilterReceivable, setStatusFilterReceivable] = useState("all");

  const filteredPayments = payments.filter(payment => {
    const patient = patients.find(p => p.id === payment.patientId);
    const matchesSearch = patient?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPayables = (accountsPayable || []).filter(account => {
    const matchesSearch = account.description.toLowerCase().includes(searchPayable.toLowerCase()) ||
      account.supplier.toLowerCase().includes(searchPayable.toLowerCase());
    const matchesStatus = statusFilterPayable === "all" || account.status === statusFilterPayable;
    return matchesSearch && matchesStatus;
  });

  const filteredReceivables = (accountsReceivable || []).filter(account => {
    const patient = patients.find(p => p.id === account.patientId);
    const matchesSearch = account.description.toLowerCase().includes(searchReceivable.toLowerCase()) ||
      (patient?.fullName.toLowerCase().includes(searchReceivable.toLowerCase()) || false);
    const matchesStatus = statusFilterReceivable === "all" || account.status === statusFilterReceivable;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = payments.filter(p => p.status === 'pago').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pendente').reduce((sum, p) => sum + p.amount, 0);

  const totalReceivablesReceived = (accountsReceivable || []).filter(ar => ar.receivedDate).reduce((sum, ar) => sum + ar.amount, 0);
  const totalReceivablesPending = (accountsReceivable || []).filter(ar => ar.status === 'pendente' && !ar.receivedDate).reduce((sum, ar) => sum + ar.amount, 0);
  const totalReceivablesOverdue = (accountsReceivable || []).filter(ar => ar.status === 'vencido').reduce((sum, ar) => sum + ar.amount, 0);

  const totalPayablesPaid = (accountsPayable || []).filter(ap => ap.status === 'pago').reduce((sum, ap) => sum + ap.amount, 0);
  const totalPayablesPending = (accountsPayable || []).filter(ap => ap.status === 'pendente').reduce((sum, ap) => sum + ap.amount, 0);
  const totalPayablesOverdue = (accountsPayable || []).filter(ap => ap.status === 'vencido').reduce((sum, ap) => sum + ap.amount, 0);

  const handleSave = () => {
    setShowForm(false);
    setShowPayableForm(false);
    setShowReceivableForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setShowPayableForm(false);
    setShowReceivableForm(false);
  };

  const handleMarkAsPaid = (paymentId: string) => {
    updatePayment(paymentId, {
      status: 'pago',
      paidDate: new Date().toISOString()
    });
  };

  const handleMarkReceivableAsPaid = async (id: string, method: 'dinheiro' | 'cartao' | 'pix' | 'transferencia') => {
    try {
      await markReceivableAsPaid(id, method);
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      alert('Erro ao marcar como pago: ' + (error as Error).message);
    }
  };

  const handleMarkPayableAsPaid = async (id: string) => {
    try {
      await markPayableAsPaid(id);
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      alert('Erro ao marcar como pago: ' + (error as Error).message);
    }
  };

  const handleDeletePayable = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta a pagar?')) {
      try {
        await deleteAccountsPayable(id);
      } catch (error) {
        console.error('Erro ao excluir conta a pagar:', error);
        alert('Erro ao excluir conta a pagar: ' + (error as Error).message);
      }
    }
  };

  const handleDeleteReceivable = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta a receber?')) {
      try {
        await deleteAccountsReceivable(id);
      } catch (error) {
        console.error('Erro ao excluir conta a receber:', error);
        alert('Erro ao excluir conta a receber: ' + (error as Error).message);
      }
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pago':
      case 'recebido':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'vencido':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pago':
        return 'Pago';
      case 'pendente':
        return 'Pendente';
      case 'vencido':
        return 'Vencido';
      case 'recebido':
        return 'Recebido';
      default:
        return status;
    }
  };

  const isOverdue = (dueDate: string) => {
    return isBefore(parseISO(dueDate), new Date());
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Novo Pagamento</h1>
        </div>
        <PaymentForm onSave={handleSave} onCancel={handleCancel} />
      </div>
    );
  }

  if (showPayableForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Nova Conta a Pagar</h1>
        </div>
        <AccountsPayableForm onSave={handleSave} onCancel={handleCancel} />
      </div>
    );
  }

  if (showReceivableForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Nova Conta a Receber</h1>
        </div>
        <AccountsReceivableForm onSave={handleSave} onCancel={handleCancel} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Financeiro</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Recebido</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {(totalPaid + totalReceivablesReceived).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">A Receber</p>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {totalReceivablesPending.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">A Pagar</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalPayablesPending.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {(totalPaid + totalReceivablesReceived - totalPayablesPending).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="receivables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="receivables">Contas a Receber</TabsTrigger>
          <TabsTrigger value="payables">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="receivables" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Contas a Receber</h2>
            <Button onClick={() => setShowReceivableForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta a Receber
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por descrição ou paciente..."
                value={searchReceivable}
                onChange={(e) => setSearchReceivable(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilterReceivable} onValueChange={setStatusFilterReceivable}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="recebido">Recebido</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredReceivables.map((account) => {
              const patient = patients.find(p => p.id === account.patientId);
              const overdue = isOverdue(account.dueDate);
              const isReceived = account.receivedDate;

              return (
                <Card key={account.id} className={`hover:shadow-md transition-shadow ${overdue && !isReceived ? 'border-red-200 bg-red-50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{account.description}</h3>
                          <Badge variant={isReceived ? 'default' : getStatusBadgeVariant(account.status)}>
                            {isReceived ? 'Recebido' : getStatusLabel(account.status)}
                          </Badge>
                          {overdue && !isReceived && (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Vencido
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong>Valor:</strong> R$ {account.amount.toFixed(2)}
                          </div>
                          <div>
                            <strong>Vencimento:</strong> {format(parseISO(account.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          <div>
                            <strong>Paciente:</strong> {patient ? patient.fullName : 'Não especificado'}
                          </div>
                        </div>

                        {account.notes && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <strong>Observações:</strong> {account.notes}
                          </div>
                        )}

                        {account.receivedDate && (
                          <div className="mt-2 text-sm text-green-600">
                            <strong>Recebido em:</strong> {format(parseISO(account.receivedDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        )}
                      </div>

                      {!isReceived && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarkReceivableAsPaid(account.id, account.method || 'dinheiro')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Marcar como Pago
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteReceivable(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredReceivables.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {searchReceivable || statusFilterReceivable !== "all" ?
                      "Nenhuma conta a receber encontrada com os critérios de busca." :
                      "Nenhuma conta a receber cadastrada."
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Contas a Pagar</h2>
            <Button onClick={() => setShowPayableForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta a Pagar
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por descrição ou fornecedor..."
                value={searchPayable}
                onChange={(e) => setSearchPayable(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilterPayable} onValueChange={setStatusFilterPayable}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredPayables.map((account) => {
              const overdue = isOverdue(account.dueDate);

              return (
                <Card key={account.id} className={`hover:shadow-md transition-shadow ${overdue && account.status !== 'pago' ? 'border-red-200 bg-red-50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{account.description}</h3>
                          <Badge variant={getStatusBadgeVariant(account.status)}>
                            {getStatusLabel(account.status)}
                          </Badge>
                          {overdue && account.status !== 'pago' && (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Vencido
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong>Valor:</strong> R$ {account.amount.toFixed(2)}
                          </div>
                          <div>
                            <strong>Vencimento:</strong> {format(parseISO(account.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          <div>
                            <strong>Fornecedor:</strong> {account.supplier}
                          </div>
                        </div>

                        <div className="mt-2 text-sm">
                          <strong>Categoria:</strong> {account.category}
                        </div>

                        {account.notes && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <strong>Observações:</strong> {account.notes}
                          </div>
                        )}

                        {account.paidDate && (
                          <div className="mt-2 text-sm text-green-600">
                            <strong>Pago em:</strong> {format(parseISO(account.paidDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        )}
                      </div>

                      {account.status !== 'pago' && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarkPayableAsPaid(account.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Marcar como Pago
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePayable(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredPayables.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {searchPayable || statusFilterPayable !== "all" ?
                      "Nenhuma conta a pagar encontrada com os critérios de busca." :
                      "Nenhuma conta a pagar cadastrada."
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pagamentos</h2>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pagamento
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredPayments.map((payment) => {
              const patient = patients.find(p => p.id === payment.patientId);
              if (!patient) return null;

              return (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <User className="h-5 w-5" />
                          <h3 className="text-lg font-semibold">{patient.fullName}</h3>
                          <Badge variant={
                            payment.status === 'pago' ? 'default' :
                              payment.status === 'pendente' ? 'secondary' : 'destructive'
                          }>
                            {payment.status === 'pago' ? 'Pago' :
                              payment.status === 'pendente' ? 'Pendente' : 'Cancelado'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong>Valor:</strong> R$ {payment.amount.toFixed(2)}
                          </div>
                          <div>
                            <strong>Vencimento:</strong> {format(parseISO(payment.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          <div>
                            <strong>Método:</strong> {
                              payment.method === 'dinheiro' ? 'Dinheiro' :
                                payment.method === 'pix' ? 'PIX' :
                                  payment.method === 'cartao' ? 'Cartão' : 'Transferência'
                            }
                          </div>
                        </div>

                        <div className="mt-2 text-sm">
                          <strong>Descrição:</strong> {payment.description}
                        </div>

                        {payment.paidDate && (
                          <div className="mt-2 text-sm text-green-600">
                            <strong>Pago em:</strong> {format(parseISO(payment.paidDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        )}
                      </div>

                      {payment.status !== 'pago' && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarkAsPaid(payment.id)}
                          >
                            Marcar como Pago
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredPayments.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all" ?
                      "Nenhum pagamento encontrado com os critérios de busca." :
                      "Nenhum pagamento cadastrado."
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
