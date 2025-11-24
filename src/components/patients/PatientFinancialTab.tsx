import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Filter, 
  Search, 
  DollarSign, 
  Package, 
  CheckCircle, 
  Trash2, 
  Users 
} from "lucide-react";
import { Patient } from "@/types";
import { formatLocalDate } from '@/shared/utils';

interface PatientFinancialTabProps {
  patient: Patient;
  receivables: any[];
  packages: any[];
  selectedReceivableIds: Set<string>;
  financialStatusFilter: string;
  setFinancialStatusFilter: (filter: string) => void;
  financialDateFilter: string;
  setFinancialDateFilter: (filter: string) => void;
  financialSearchTerm: string;
  setFinancialSearchTerm: (term: string) => void;
  showFinancialFilters: boolean;
  setShowFinancialFilters: (show: boolean) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  onBulkMarkReceivablesAsPaid: () => void;
  onBulkDeleteReceivables: () => void;
  onReceivableSelectionChange: (id: string, selected: boolean) => void;
  getFinancialStatus: (receivable: any) => string;
}

export function PatientFinancialTab({
  patient,
  receivables,
  packages,
  selectedReceivableIds,
  financialStatusFilter,
  setFinancialStatusFilter,
  financialDateFilter,
  setFinancialDateFilter,
  financialSearchTerm,
  setFinancialSearchTerm,
  showFinancialFilters,
  setShowFinancialFilters,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  onBulkMarkReceivablesAsPaid,
  onBulkDeleteReceivables,
  onReceivableSelectionChange,
  getFinancialStatus
}: PatientFinancialTabProps) {
  
  // Calcular resumo financeiro
  const calculateFinancialSummary = () => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalPending = 0;
    
    receivables.forEach(receivable => {
      const amount = Number(receivable.amount);
      totalBilled += amount;
      
      if (receivable.status === 'recebido') {
        totalPaid += amount;
      } else {
        totalPending += amount;
      }
    });
    
    return {
      totalBilled,
      totalPaid,
      totalPending,
      balance: totalBilled - totalPaid
    };
  };

  const financialSummary = calculateFinancialSummary();

  const selectAllReceivables = () => {
    receivables.forEach(receivable => {
      onReceivableSelectionChange(receivable.id, true);
    });
  };

  const clearReceivableSelection = () => {
    receivables.forEach(receivable => {
      onReceivableSelectionChange(receivable.id, false);
    });
  };

  const toggleReceivableSelection = (receivableId: string) => {
    const isSelected = selectedReceivableIds.has(receivableId);
    onReceivableSelectionChange(receivableId, !isSelected);
  };

  return (
    <>
      {/* Filtros Avançados - Financeiro */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Button
          variant="outline"
          onClick={() => setShowFinancialFilters(!showFinancialFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar descrição..."
              value={financialSearchTerm}
              onChange={(e) => setFinancialSearchTerm(e.target.value)}
              className="pl-10 w-48"
            />
          </div>
          <Select value={financialStatusFilter} onValueChange={setFinancialStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="recebido">Recebido</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showFinancialFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={financialDateFilter} onValueChange={setFinancialDateFilter}>
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
              {financialDateFilter === "custom" && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data inicial</label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data final</label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barra de Ações em Massa - Financeiro */}
      {selectedReceivableIds.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">
                  {selectedReceivableIds.size} contas selecionadas
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkMarkReceivablesAsPaid}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como Recebido
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkDeleteReceivables}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearReceivableSelection}
                >
                  Limpar Seleção
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pacotes do Paciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Package className="mr-2 h-5 w-5 text-blue-600" />
            Pacotes de Sessões
          </CardTitle>
        </CardHeader>
        <CardContent>
          {packages.length > 0 ? (
            <div className="space-y-4">
              {packages.map((pkg) => {
                const packageDetails = pkg.session_packages && (
                  Array.isArray(pkg.session_packages)
                    ? pkg.session_packages[0]
                    : pkg.session_packages
                );
                
                if (!packageDetails) return null;
                
                const sessionsRemaining = packageDetails.sessions - pkg.sessions_used;
                const progressPercentage = (pkg.sessions_used / packageDetails.sessions) * 100;
                const isExpired = new Date(pkg.expiry_date) < new Date();
                const isCompleted = pkg.status === 'completed';
                
                return (
                  <div key={pkg.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg">{packageDetails.name}</h4>
                          <Badge 
                            variant={
                              isCompleted ? "secondary" : 
                              isExpired ? "destructive" : 
                              pkg.status === 'active' ? "default" : 
                              "outline"
                            }
                          >
                            {isCompleted ? 'Concluído' : isExpired ? 'Expirado' : pkg.status === 'active' ? 'Ativo' : pkg.status}
                          </Badge>
                          {!pkg.is_paid && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                              Não Pago
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Comprado em: {formatLocalDate(pkg.purchase_date)}</p>
                          <p>Válido até: {formatLocalDate(pkg.expiry_date)}</p>
                          <p className="font-medium">
                            Valor: R$ {parseFloat(packageDetails.price).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          {sessionsRemaining}
                        </div>
                        <div className="text-sm text-gray-600">
                          de {packageDetails.sessions} restantes
                        </div>
                      </div>
                    </div>
                    
                    {/* Barra de progresso */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{pkg.sessions_used} sessões utilizadas</span>
                        <span>{progressPercentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isCompleted ? 'bg-gray-400' :
                            isExpired ? 'bg-red-500' :
                            'bg-blue-600'
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum pacote de sessões encontrado</p>
              <p className="text-sm text-gray-400 mt-1">
                Pacotes aparecerão aqui quando o paciente adquirir sessões
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <DollarSign className="mr-2 h-5 w-5" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                R$ {financialSummary.totalBilled.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Faturado</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                R$ {financialSummary.totalPaid.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Pago</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                R$ {financialSummary.totalPending.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">A Receber</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Contas a Receber</h4>
              {receivables.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectedReceivableIds.size === receivables.length ? clearReceivableSelection : selectAllReceivables}
                >
                  <input
                    type="checkbox"
                    checked={selectedReceivableIds.size === receivables.length && receivables.length > 0}
                    readOnly
                    className="mr-2"
                  />
                  Selecionar todos
                </Button>
              )}
            </div>
            
            {receivables.length > 0 ? (
              <div className="space-y-2">
                {receivables.map((receivable) => (
                  <div key={receivable.id} className="flex items-center gap-3 p-3 border rounded">
                    <Checkbox
                      checked={selectedReceivableIds.has(receivable.id)}
                      onCheckedChange={() => toggleReceivableSelection(receivable.id)}
                    />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2">
                      <div>
                        <div className="font-medium">{receivable.description}</div>
                        <div className="text-sm text-gray-600">
                          Vencimento: {formatLocalDate(receivable.dueDate)}
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="font-medium">R$ {Number(receivable.amount).toFixed(2)}</div>
                        <Badge variant={receivable.status === 'recebido' ? 'default' : 'secondary'}>
                          {receivable.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nenhuma conta a receber.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}