import { FinancialReports } from "@/components/FinancialReports";

interface FinancialReportsTabProps {}

export function FinancialReportsTab({}: FinancialReportsTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Relatórios Financeiros</h2>
      <FinancialReports />
    </div>
  );
}