import { FinancialHeader } from "@/components/financial/FinancialHeader";
import { FinancialTabs } from "@/components/financial/FinancialTabs";
import { AccountsReceivableForm } from "@/components/financial/AccountsReceivableForm";
import { AccountsPayableForm } from "@/components/financial/AccountsPayableForm";
import { useFinancialData } from "@/hooks/financial/useFinancialData";

export function FinancialPage() {
  const data = useFinancialData();

  return (
    <div className="space-y-6">
      <FinancialHeader
        financialData={data.financialData}
        showPayableForm={data.showPayableForm}
        setShowPayableForm={data.setShowPayableForm}
        showReceivableForm={data.showReceivableForm}
        setShowReceivableForm={data.setShowReceivableForm}
      />
      
      <FinancialTabs 
        activeTab={data.activeTab}
        onTabChange={data.setActiveTab}
        
        // Receivables
        receivableAccounts={data.accountsReceivable || []}
        filteredReceivables={data.filteredReceivables}
        searchReceivable={data.searchReceivable}
        onSearchReceivableChange={data.setSearchReceivable}
        statusFilterReceivable={data.statusFilterReceivable}
        onStatusFilterReceivableChange={data.setStatusFilterReceivable}
        selectedReceivableIds={data.selectedReceivableIds}
        onToggleReceivableSelection={data.toggleReceivableSelection}
        onSelectAllReceivables={data.selectAllReceivables}
        onClearReceivableSelection={data.clearReceivableSelection}
        onMarkReceivableAsPaid={data.handleMarkReceivableAsPaid}
        onDeleteReceivable={data.handleDeleteReceivable}
        onBulkMarkReceivablesAsPaid={data.handleBulkMarkReceivablesAsPaid}
        onBulkDeleteReceivables={data.handleBulkDeleteReceivables}
        onOpenReceivableForm={() => data.setShowReceivableForm(true)}
        
        // Payables
        payableAccounts={data.accountsPayable || []}
        filteredPayables={data.filteredPayables}
        searchPayable={data.searchPayable}
        onSearchPayableChange={data.setSearchPayable}
        statusFilterPayable={data.statusFilterPayable}
        onStatusFilterPayableChange={data.setStatusFilterPayable}
        selectedPayableIds={data.selectedPayableIds}
        onTogglePayableSelection={data.togglePayableSelection}
        onSelectAllPayables={data.selectAllPayables}
        onClearPayableSelection={data.clearPayableSelection}
        onMarkPayableAsPaid={data.handleMarkPayableAsPaid}
        onDeletePayable={data.handleDeletePayable}
        onBulkMarkPayablesAsPaid={data.handleBulkMarkPayablesAsPaid}
        onBulkDeletePayables={data.handleBulkDeletePayables}
        onOpenPayableForm={() => data.setShowPayableForm(true)}
        
        // Advanced filters
        showAdvancedFilters={data.showAdvancedFilters}
        onToggleAdvancedFilters={() => data.setShowAdvancedFilters(!data.showAdvancedFilters)}
        dateFilterReceivable={data.dateFilterReceivable}
        onDateFilterReceivableChange={data.setDateFilterReceivable}
        dateFilterPayable={data.dateFilterPayable}
        onDateFilterPayableChange={data.setDateFilterPayable}
        customStartDate={data.customStartDate}
        onCustomStartDateChange={data.setCustomStartDate}
        customEndDate={data.customEndDate}
        onCustomEndDateChange={data.setCustomEndDate}
        minAmount={data.minAmount}
        onMinAmountChange={data.setMinAmount}
        maxAmount={data.maxAmount}
        onMaxAmountChange={data.setMaxAmount}
      />

      {/* Formulários */}
      {data.showReceivableForm && (
        <AccountsReceivableForm onClose={() => data.setShowReceivableForm(false)} />
      )}

      {data.showPayableForm && (
        <AccountsPayableForm onClose={() => data.setShowPayableForm(false)} />
      )}
    </div>
  );
}