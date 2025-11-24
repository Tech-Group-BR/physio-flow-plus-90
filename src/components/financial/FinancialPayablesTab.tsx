import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  Filter,
  Plus,
  CheckSquare,
  Square,
  CheckCircle,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AccountsPayable } from "@/types";

interface FinancialPayablesTabProps {
  accounts: AccountsPayable[];
  filteredAccounts: AccountsPayable[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onMarkAsPaid: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkMarkAsPaid: () => void;
  onBulkDelete: () => void;
  onOpenForm: () => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  customStartDate: string;
  onCustomStartDateChange: (value: string) => void;
  customEndDate: string;
  onCustomEndDateChange: (value: string) => void;
  minAmount: string;
  onMinAmountChange: (value: string) => void;
  maxAmount: string;
  onMaxAmountChange: (value: string) => void;
}

export function FinancialPayablesTab({
  filteredAccounts,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onMarkAsPaid,
  onDelete,
  onBulkMarkAsPaid,
  onBulkDelete,
  onOpenForm,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  dateFilter,
  onDateFilterChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  minAmount,
  onMinAmountChange,
  maxAmount,
  onMaxAmountChange,
}: FinancialPayablesTabProps) {
  const getAccountStatus = (account: AccountsPayable): string => {
    if (account.paidDate) return "pago";
    const today = new Date();
    const dueDate = parseISO(account.dueDate);
    return dueDate < today ? "vencido" : "pendente";
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pago": return "default";
      case "vencido": return "destructive";
      case "pendente": return "secondary";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "pago": return "Pago";
      case "vencido": return "Vencido";
      case "pendente": return "Pendente";
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Contas a Pagar</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onToggleAdvancedFilters}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros Avançados
          </Button>
          <Button onClick={onOpenForm}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta a Pagar
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={dateFilter} onValueChange={onDateFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                    <SelectItem value="thisMonth">Este mês</SelectItem>
                    <SelectItem value="lastMonth">Mês passado</SelectItem>
                    <SelectItem value="custom">Período personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateFilter === "custom" && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data inicial</label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => onCustomStartDateChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data final</label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => onCustomEndDateChange(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Valor mínimo</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="R$ 0,00"
                  value={minAmount}
                  onChange={(e) => onMinAmountChange(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Valor máximo</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="R$ 0,00"
                  value={maxAmount}
                  onChange={(e) => onMaxAmountChange(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  onDateFilterChange("all");
                  onCustomStartDateChange("");
                  onCustomEndDateChange("");
                  onMinAmountChange("");
                  onMaxAmountChange("");
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">
                  {selectedIds.size} itens selecionados
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkMarkAsPaid}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como Pago
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSelection}
                >
                  Limpar Seleção
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-4">
        <div className="relative w-full sm:flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-48">
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

      {/* Selection Controls */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={selectedIds.size === filteredAccounts.length ? onClearSelection : onSelectAll}
        >
          {selectedIds.size === filteredAccounts.length ? (
            <CheckSquare className="h-4 w-4 mr-2" />
          ) : (
            <Square className="h-4 w-4 mr-2" />
          )}
          {selectedIds.size === filteredAccounts.length ? "Desmarcar Todos" : "Selecionar Todos"}
        </Button>
        {selectedIds.size > 0 && (
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} de {filteredAccounts.length} selecionados
          </span>
        )}
      </div>

      {/* Accounts List */}
      <div className="grid gap-4">
        {filteredAccounts.map((account) => {
          const status = getAccountStatus(account);
          const isSelected = selectedIds.has(account.id);
          
          return (
            <Card
              key={account.id}
              className={`flex flex-col transition-shadow hover:shadow-md ${
                status === "vencido" ? "border-red-200 bg-red-50" : ""
              } ${isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
            >
              <CardContent className="p-6 pb-4 flex-1">
                <div className="flex items-start gap-3 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleSelection(account.id)}
                    className="p-1 h-auto"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:space-x-3">
                      <h3 className="text-lg font-semibold">{account.description}</h3>
                      <Badge variant={getStatusBadgeVariant(status)}>{getStatusLabel(status)}</Badge>
                    </div>
                  </div>
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
                    <Button variant="default" size="sm" onClick={() => onMarkAsPaid(account.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Pagar
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => onDelete(account.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          );
        })}
        {filteredAccounts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma conta a pagar encontrada.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}