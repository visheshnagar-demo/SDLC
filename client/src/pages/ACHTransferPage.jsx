import React, { useState } from "react";
import Navbar from "../components/Navbar";
import ACHTransferForm from "../components/ACHTransferForm";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  History,
  Info,
  ShieldCheck,
} from "lucide-react";

export const ACHTransferPage = () => {
  const [recentTransfers, setRecentTransfers] = useState([]);

  const handleTransferSuccess = (newTransfer) => {
    if (newTransfer) {
      setRecentTransfers((prev) => [newTransfer, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ACH Velocity Limits Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time evaluation of outbound ACH transfers against Anti-Money
              Laundering (AML) rolling 24-hour velocity rules.
            </p>
          </div>
        </div>

        {/* Velocity Rules Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Normal Approval
              </div>
              <div className="text-lg font-bold text-emerald-950 mt-0.5">
                ≤ $5,000.00
              </div>
              <p className="text-xs text-emerald-700 mt-1">
                Rolling 24h sum approved normally with no flags.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                AML Review Flag
              </div>
              <div className="text-lg font-bold text-amber-950 mt-0.5">
                $5,000.01 – $10,000.00
              </div>
              <p className="text-xs text-amber-700 mt-1">
                Approved but flagged in database for AML compliance review.
              </p>
            </div>
          </div>

          <div className="bg-rose-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-red-800">
                Velocity Rejection
              </div>
              <div className="text-lg font-bold text-red-950 mt-0.5">
                &gt; $10,000.00
              </div>
              <p className="text-xs text-red-700 mt-1">
                Rejected immediately with HTTP 429 Too Many Requests.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Transfer Form (Left) */}
          <div className="lg:col-span-6 space-y-6">
            <ACHTransferForm onTransferSuccess={handleTransferSuccess} />
          </div>

          {/* Activity / Audit Ledger (Right) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  Recent Session Transfers
                </h3>
                <span className="text-xs text-slate-500">
                  {recentTransfers.length} recorded
                </span>
              </div>

              {recentTransfers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <Info className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-xs">
                    No ACH transfers submitted in this session yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Rolling 24h Total</th>
                        <th className="py-2 px-3">AML Review</th>
                        <th className="py-2 px-3">Correlation ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentTransfers.map((tx, idx) => (
                        <tr
                          key={tx.transfer_id || idx}
                          className="hover:bg-slate-50/80"
                        >
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            ${parseFloat(tx.amount || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            ${parseFloat(tx.rolling_24h_total || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3">
                            {tx.requires_aml_review ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3" /> Flagged
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <ShieldCheck className="w-3 h-3" /> Clear
                              </span>
                            )}
                          </td>
                          <td
                            className="py-2.5 px-3 font-mono text-[11px] text-slate-500 max-w-[120px] truncate"
                            title={tx.correlationId}
                          >
                            {tx.correlationId || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ACHTransferPage;
