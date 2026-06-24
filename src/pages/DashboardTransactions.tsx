import React from "react";
import { History, ChevronDown } from "lucide-react";
import { useOrbit } from "../context/OrbitContext";

export const DashboardTransactions: React.FC = () => {
  const { user } = useOrbit();

  const FilterPill = ({ label, options }: { label: string, options: string[] }) => (
    <div className="relative">
      <select className="appearance-none bg-neutral-900 border border-neutral-800 text-[11px] py-1 px-2.5 pr-6 rounded-full hover:bg-neutral-800 transition-colors text-white cursor-pointer outline-none">
        <option value="">{label}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={10} className="absolute top-1/2 right-2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
    </div>
  );

  return (
    <div className="space-y-6 font-sans overflow-x-hidden">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold font-heading text-orbit-white flex items-center gap-2">
          <History className="text-orbit-accent" size={24} />
          Transaction History
        </h2>
        
        {/* Filter Pills */}
        <div className="flex flex-row overflow-x-auto whitespace-nowrap gap-2 justify-start w-full pb-1">
          <FilterPill label="Type" options={["Deposits", "Withdrawals", "Trades"]} />
          <FilterPill label="Status" options={["Completed", "Pending", "Failed"]} />
          <FilterPill label="Time" options={["7D", "30D", "90D"]} />
        </div>
      </div>

      <div className="bg-orbit-card border border-orbit-border rounded-xl">
        <div className="flex flex-col divide-y divide-neutral-900">
          {user.transactions.map((tx) => {
            const cleanAmount = tx.amount.toString().replace("-", "");
            const isDeposit = tx.type === "DEPOSIT" || tx.type === "deposit";
            const amountDisplay = isDeposit ? `+${cleanAmount}` : `-${cleanAmount}`;
            const amountColor = isDeposit ? "text-emerald-400" : "text-white";

            return (
              <div key={tx.id} className="flex justify-between items-center py-4 px-4 hover:bg-orbit-darkcard/40 transition-colors">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-white">{tx.type.charAt(0) + tx.type.slice(1).toLowerCase()}</span>
                  <span className="text-xs text-neutral-500 font-mono">{tx.date}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className={`text-sm font-bold font-mono ${amountColor}`}>{amountDisplay}</span>
                  <span className="text-xs text-neutral-500">{tx.asset}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
