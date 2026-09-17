import React, { useEffect, useState } from "react";
import TransferTerminal from "../components/transfers/TransferTerminal";
import AccountBalancesTable from "../components/transfers/AccountBalancesTable";
import { fetchAccounts } from "../services/api";
import { RefreshCcw } from "lucide-react";

export const TransfersPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            ACID Ledger Transfers & Allocations
          </h1>
          <p className="text-sm text-slate-400">
            Pessimistic row locking, real-time balance validation, and account
            ledgers
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all"
        >
          <RefreshCcw
            className={`w-4 h-4 text-cyan-400 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Accounts
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <TransferTerminal onActionSuccess={loadData} />
        </div>

        <div className="lg:col-span-5">
          <AccountBalancesTable accounts={accounts} />
        </div>
      </div>
    </div>
  );
};

export default TransfersPage;
