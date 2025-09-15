import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClinic } from "@/contexts/ClinicContext";
import { format, isBefore, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle,
  DollarSign,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Database } from '@/integrations/supabase/types';
import { useMemo, useState } from "react";
import { AccountsPayableForm } from "./AccountsPayableForm";
import { AccountsReceivableForm } from "./AccountsReceivableForm";
import { FinancialReports } from "./FinancialReports";

// Helper para determinar o status dinamicamente
const getAccountStatus = (account: {
  dueDate: string;
  paidDate?: string | null;
  receivedDate?: string | null;
}) => {
  if (account.paidDate || account.receivedDate) {
    return account.paidDate ? "pago" : "recebido";
  }
  if (isBefore(parseISO(account.dueDate), startOfDay(new Date()))) {
    return "vencido";
  }
  return "pendente";
};

export function FinancialPage() {
  // Hook do contexto com as dependências removidas (suppliers, expenseCategories)
  const {
    patients,
    accountsPayable,
    accountsReceivable,
    markReceivableAsPaid,
    markPayableAsPaid,
    deleteAccountsPayable,
    deleteAccountsReceivable,
  } = useClinic();

  // Estado para formulários e filtros
  const [showPayableForm, setShowPayableForm] = useState(false);
  const [showReceivableForm, setShowReceivableForm] = useState(false);
  const [searchPayable, setSearchPayable] = useState("");
  const [searchReceivable, setSearchReceivable] = useState("");
  const [statusFilterPayable, setStatusFilterPayable] = useState("all");
  const [statusFilterReceivable, setStatusFilterReceivable] = useState("all");

  // Cálculos financeiros memoizados
  const financialData = useMemo(() => {
    const allPayables = accountsPayable || [];
    const allReceivables = accountsReceivable || [];
    const data = {
      totalReceivablesReceived: 0,
      totalReceivablesPending: 0,
      totalPayablesPaid: 0,
      totalPayablesPending: 0,
    };

    allReceivables.forEach((ar) => {
      const status = getAccountStatus(ar);
      if (status === "recebido") {
        data.totalReceivablesReceived += Number(ar.amount);
      } else if (status === "pendente" || status === "vencido") {
        data.totalReceivablesPending += Number(ar.amount);
      }
    });

    allPayables.forEach((ap) => {
      const status = getAccountStatus(ap);
      if (status === "pago") {
        data.totalPayablesPaid += Number(ap.amount);
      } else if (status === "pendente" || status === "vencido") {
        data.totalPayablesPending += Number(ap.amount);
      }
    });

    return data;
  }, [accountsPayable, accountsReceivable]);

  // Lista de contas a pagar filtrada (sem busca por fornecedor)
  const filteredPayables = useMemo(() => {
    return (accountsPayable || []).filter((account) => {
      const status = getAccountStatus(account);
      const matchesStatus =
        statusFilterPayable === "all" || status === statusFilterPayable;
      const matchesSearch =
        searchPayable.trim() === "" ||
        account.description
          .toLowerCase()
          .includes(searchPayable.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [accountsPayable, searchPayable, statusFilterPayable]);

  // Lista de contas a receber filtrada
  const filteredReceivables = useMemo(() => {
    return (accountsReceivable || []).filter((account) => {
      const status = getAccountStatus(account);
      const patient = patients?.find((p) => p.id === account.patientId);
      const matchesStatus =
        statusFilterReceivable === "all" || status === statusFilterReceivable;
      const matchesSearch =
        searchReceivable.trim() === "" ||
        account.description
          .toLowerCase()
          .includes(searchReceivable.toLowerCase()) ||
        patient?.fullName.toLowerCase().includes(searchReceivable.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [accountsReceivable, patients, searchReceivable, statusFilterReceivable]);

  // Handlers
  const handleSave = () => {
    setShowPayableForm(false);
    setShowReceivableForm(false);
  };

  const handleCancel = () => {
    setShowPayableForm(false);
    setShowReceivableForm(false);
  };
const handleMarkReceivableAsPaid = async (
  id: string,
  method: Database['public']['Enums']['payment_method_enum'],
) => {
  try {
    await markReceivableAsPaid(id, method);
  } catch (error) {
    console.error("Erro ao marcar como recebido:", error);
    alert("Erro ao marcar como recebido: " + (error as Error).message);
  }
};

  const handleMarkPayableAsPaid = async (id: string) => {
    try {
      await markPayableAsPaid(id);
    } catch (error) {
      console.error("Erro ao marcar como pago:", error);
      alert("Erro ao marcar como pago: " + (error as Error).message);
    }
  };

  const handleDeletePayable = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta conta a pagar?")) {
      try {
        await deleteAccountsPayable(id);
      } catch (error) {
        console.error("Erro ao excluir conta a pagar:", error);
        alert("Erro ao excluir conta a pagar: " + (error as Error).message);
      }
    }
  };

  const handleDeleteReceivable = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta conta a receber?")) {
      try {
        await deleteAccountsReceivable(id);
      } catch (error) {
        console.error("Erro ao excluir conta a receber:", error);
        alert("Erro ao excluir conta a receber: " + (error as Error).message);
      }
    }
  };

  // UI Helper Functions
  const getStatusBadgeVariant = (
    status: "pago" | "recebido" | "pendente" | "vencido",
  ) => {
    switch (status) {
      case "pago": case "recebido": return "default";
      case "pendente": return "secondary";
      case "vencido": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusLabel = (
    status: "pago" | "recebido" | "pendente" | "vencido",
  ) => {
    const labels = {
      pago: "Pago",
      recebido: "Recebido",
      pendente: "Pendente",
      vencido: "Vencido",
    };
    return labels[status] || status;
  };

  // Renderização condicional para os formulários
  if (showPayableForm) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Nova Conta a Pagar</h1>
        <AccountsPayableForm onSave={handleSave} onCancel={handleCancel} />
      </div>
    );
  }

  if (showReceivableForm) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Nova Conta a Receber</h1>
        <AccountsReceivableForm onSave={handleSave} onCancel={handleCancel} />
      </div>
    );
  }

return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Financeiro</h1>

      {/* --- Dashboard Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Recebido</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {financialData.totalReceivablesReceived.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">A Receber</p>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {financialData.totalReceivablesPending.toFixed(2)}
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
                  R$ {financialData.totalPayablesPending.toFixed(2)}
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
                  R${" "}
                  {(
                    financialData.totalReceivablesReceived -
                    financialData.totalPayablesPaid
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Tabs --- */}
      <Tabs defaultValue="receivables" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-center sm:grid sm:w-full sm:grid-cols-3">
          <TabsTrigger value="receivables">Contas a Receber</TabsTrigger>
          <TabsTrigger value="payables">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        {/* --- Aba Contas a Receber --- */}
        <TabsContent value="receivables" className="space-y-4">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Contas a Receber</h2>
            <Button onClick={() => setShowReceivableForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta a Receber
            </Button>
          </div>
          
          {/* 👇 CORREÇÃO FINAL 1: Filtros de 'Contas a Receber' agora são responsivos 👇 */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-4">
            <div className="relative w-full sm:flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por descrição ou paciente..."
                value={searchReceivable}
                onChange={(e) => setSearchReceivable(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilterReceivable}
              onValueChange={setStatusFilterReceivable}
            >
              <SelectTrigger className="w-full sm:w-48">
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
              const patient = patients?.find((p) => p.id === account.patientId);
              const status = getAccountStatus(account);
              return (
                <Card
                  key={account.id}
                  className={`flex flex-col transition-shadow hover:shadow-md ${status === "vencido" ? "border-red-200 bg-red-50" : ""}`}
                >
                  <CardContent className="p-6 pb-4 flex-1">
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{account.description}</h3>
                      <Badge variant={getStatusBadgeVariant(status)}>{getStatusLabel(status)}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><strong>Valor:</strong> R$ {Number(account.amount).toFixed(2)}</div>
                      <div><strong>Vencimento:</strong> {format(parseISO(account.dueDate), "dd/MM/yyyy", { locale: ptBR })}</div>
                      <div className="md:col-span-2"><strong>Paciente:</strong> {patient ? patient.fullName : "Não especificado"}</div>
                    </div>
                    {account.notes && (
                      <div className="mt-2 text-sm text-muted-foreground"><strong>Observações:</strong> {account.notes}</div>
                    )}
                    {account.receivedDate && (
                      <div className="mt-2 text-sm text-green-600">
                        <strong>Recebido em:</strong> {format(parseISO(account.receivedDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    )}
                  </CardContent>
                  {status !== "recebido" && (
                    <CardFooter className="p-6 pt-0 flex justify-start">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleMarkReceivableAsPaid(account.id, account.method || "dinheiro")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Receber
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteReceivable(account.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              );
            })}
            {filteredReceivables.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center"><p className="text-muted-foreground">Nenhuma conta a receber encontrada.</p></CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* --- Aba Contas a Pagar --- */}
        <TabsContent value="payables" className="space-y-4">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Contas a Pagar</h2>
            <Button onClick={() => setShowPayableForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta a Pagar
            </Button>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-4">
            <div className="relative w-full sm:flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por descrição..."
                value={searchPayable}
                onChange={(e) => setSearchPayable(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilterPayable} onValueChange={setStatusFilterPayable}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Todos os status" /></SelectTrigger>
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
              const status = getAccountStatus(account);
              return (
                <Card
                  key={account.id}
                  className={`flex flex-col transition-shadow hover:shadow-md ${status === "vencido" ? "border-red-200 bg-red-50" : ""}`}
                >
                  <CardContent className="p-6 pb-4 flex-1">
                    {/* 👇 CORREÇÃO FINAL 2: Cabeçalho do card de 'Contas a Pagar' agora é responsivo 👇 */}
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{account.description}</h3>
                      <Badge variant={getStatusBadgeVariant(status)}>{getStatusLabel(status)}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><strong>Valor:</strong> R$ {Number(account.amount).toFixed(2)}</div>
                      <div><strong>Vencimento:</strong> {format(parseISO(account.dueDate), "dd/MM/yyyy", { locale: ptBR })}</div>
                    </div>
                    {account.notes && (
                      <div className="mt-2 text-sm text-muted-foreground"><strong>Observações:</strong> {account.notes}</div>
                    )}
                    {account.paidDate && (
                      <div className="mt-2 text-sm text-green-600">
                        <strong>Pago em:</strong> {format(parseISO(account.paidDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    )}
                  </CardContent>
                  {status !== "pago" && (
                    <CardFooter className="p-6 pt-0 flex justify-start">
                      <div className="flex items-center space-x-2">
                        <Button variant="default" size="sm" onClick={() => handleMarkPayableAsPaid(account.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Pagar
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeletePayable(account.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              );
            })}
            {filteredPayables.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center"><p className="text-muted-foreground">Nenhuma conta a pagar encontrada.</p></CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* --- Aba Relatórios --- */}
        <TabsContent value="reports" className="space-y-4">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}