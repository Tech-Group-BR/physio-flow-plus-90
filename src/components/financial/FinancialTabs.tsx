import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialReceivablesTab } from "../FinancialReceivablesTab";
import { FinancialPayablesTab } from "../FinancialPayablesTab";
import { FinancialReportsTab } from "../FinancialReportsTab";
import type { AccountsReceivable, AccountsPayable } from "@/types";

interface FinancialTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  
  // Receivables
  receivableAccounts: AccountsReceivable[];
  filteredReceivables: AccountsReceivable[];
  searchReceivable: string;
  onSearchReceivableChange: (value: string) => void;
  statusFilterReceivable: string;
  onStatusFilterReceivableChange: (value: string) => void;
  selectedReceivableIds: Set<string>;
  onToggleReceivableSelection: (id: string) => void;
  onSelectAllReceivables: () => void;
  onClearReceivableSelection: () => void;
  onMarkReceivableAsPaid: (id: string, method: string) => void;
  onDeleteReceivable: (id: string) => void;
  onBulkMarkReceivablesAsPaid: () => void;
  onBulkDeleteReceivables: () => void;
  onOpenReceivableForm: () => void;
  
  // Payables
  payableAccounts: AccountsPayable[];
  filteredPayables: AccountsPayable[];
  searchPayable: string;
  onSearchPayableChange: (value: string) => void;
  statusFilterPayable: string;
  onStatusFilterPayableChange: (value: string) => void;
  selectedPayableIds: Set<string>;
  onTogglePayableSelection: (id: string) => void;
  onSelectAllPayables: () => void;
  onClearPayableSelection: () => void;
  onMarkPayableAsPaid: (id: string) => void;
  onDeletePayable: (id: string) => void;
  onBulkMarkPayablesAsPaid: () => void;
  onBulkDeletePayables: () => void;
  onOpenPayableForm: () => void;
  
  // Advanced filters
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  dateFilterReceivable: string;
  onDateFilterReceivableChange: (value: string) => void;
  dateFilterPayable: string;
  onDateFilterPayableChange: (value: string) => void;
  customStartDate: string;
  onCustomStartDateChange: (value: string) => void;
  customEndDate: string;
  onCustomEndDateChange: (value: string) => void;
  minAmount: string;
  onMinAmountChange: (value: string) => void;
  maxAmount: string;
  onMaxAmountChange: (value: string) => void;
}

export function FinancialTabs({
  activeTab,
  onTabChange,
  
  // Receivables
  receivableAccounts,
  filteredReceivables,
  searchReceivable,
  onSearchReceivableChange,
  statusFilterReceivable,
  onStatusFilterReceivableChange,
  selectedReceivableIds,
  onToggleReceivableSelection,
  onSelectAllReceivables,
  onClearReceivableSelection,
  onMarkReceivableAsPaid,
  onDeleteReceivable,
  onBulkMarkReceivablesAsPaid,
  onBulkDeleteReceivables,
  onOpenReceivableForm,
  
  // Payables
  payableAccounts,
  filteredPayables,
  searchPayable,
  onSearchPayableChange,
  statusFilterPayable,
  onStatusFilterPayableChange,
  selectedPayableIds,
  onTogglePayableSelection,
  onSelectAllPayables,
  onClearPayableSelection,
  onMarkPayableAsPaid,
  onDeletePayable,
  onBulkMarkPayablesAsPaid,
  onBulkDeletePayables,
  onOpenPayableForm,
  
  // Advanced filters
  showAdvancedFilters,
  onToggleAdvancedFilters,
  dateFilterReceivable,
  onDateFilterReceivableChange,
  dateFilterPayable,
  onDateFilterPayableChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  minAmount,
  onMinAmountChange,
  maxAmount,
  onMaxAmountChange,
}: FinancialTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid grid-cols-1 w-full sm:grid-cols-3 sm:w-fit">
        <TabsTrigger value="receivables">Contas a Receber</TabsTrigger>
        <TabsTrigger value="payables">Contas a Pagar</TabsTrigger>
        <TabsTrigger value="reports">Relatórios</TabsTrigger>
      </TabsList>

      <TabsContent value="receivables" className="space-y-4">
        <FinancialReceivablesTab
          accounts={receivableAccounts}
          filteredAccounts={filteredReceivables}
          searchTerm={searchReceivable}
          onSearchChange={onSearchReceivableChange}
          statusFilter={statusFilterReceivable}
          onStatusFilterChange={onStatusFilterReceivableChange}
          selectedIds={selectedReceivableIds}
          onToggleSelection={onToggleReceivableSelection}
          onSelectAll={onSelectAllReceivables}
          onClearSelection={onClearReceivableSelection}
          onMarkAsPaid={onMarkReceivableAsPaid}
          onDelete={onDeleteReceivable}
          onBulkMarkAsPaid={onBulkMarkReceivablesAsPaid}
          onBulkDelete={onBulkDeleteReceivables}
          onOpenForm={onOpenReceivableForm}
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={onToggleAdvancedFilters}
          dateFilter={dateFilterReceivable}
          onDateFilterChange={onDateFilterReceivableChange}
          customStartDate={customStartDate}
          onCustomStartDateChange={onCustomStartDateChange}
          customEndDate={customEndDate}
          onCustomEndDateChange={onCustomEndDateChange}
          minAmount={minAmount}
          onMinAmountChange={onMinAmountChange}
          maxAmount={maxAmount}
          onMaxAmountChange={onMaxAmountChange}
        />
      </TabsContent>

      <TabsContent value="payables" className="space-y-4">
        <FinancialPayablesTab
          accounts={payableAccounts}
          filteredAccounts={filteredPayables}
          searchTerm={searchPayable}
          onSearchChange={onSearchPayableChange}
          statusFilter={statusFilterPayable}
          onStatusFilterChange={onStatusFilterPayableChange}
          selectedIds={selectedPayableIds}
          onToggleSelection={onTogglePayableSelection}
          onSelectAll={onSelectAllPayables}
          onClearSelection={onClearPayableSelection}
          onMarkAsPaid={onMarkPayableAsPaid}
          onDelete={onDeletePayable}
          onBulkMarkAsPaid={onBulkMarkPayablesAsPaid}
          onBulkDelete={onBulkDeletePayables}
          onOpenForm={onOpenPayableForm}
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={onToggleAdvancedFilters}
          dateFilter={dateFilterPayable}
          onDateFilterChange={onDateFilterPayableChange}
          customStartDate={customStartDate}
          onCustomStartDateChange={onCustomStartDateChange}
          customEndDate={customEndDate}
          onCustomEndDateChange={onCustomEndDateChange}
          minAmount={minAmount}
          onMinAmountChange={onMinAmountChange}
          maxAmount={maxAmount}
          onMaxAmountChange={onMaxAmountChange}
        />
      </TabsContent>

      <TabsContent value="reports" className="space-y-4">
        <FinancialReportsTab />
      </TabsContent>
    </Tabs>
  );
}