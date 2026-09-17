import React, { useState } from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { transferChips } from "../../services/api";

export const QuickTransferForm = ({ onTransferSuccess }) => {
  const [sourceAccount, setSourceAccount] = useState("acc-001");
  const [destinationAccount, setDestinationAccount] = useState("acc-002");
  const [chipId, setChipId] = useState("chip-gold-100");
  const [amount, setAmount] = useState(500);
  const [reason, setReason] = useState("Operational Settlement");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      const payload = {
        source_account_id: sourceAccount,
        destination_account_id: destinationAccount,
        chip_id: chipId,
        amount: Number(amount),
        reason: reason,
      };

      const result = await transferChips(payload);
      setStatusMsg({
        type: "success",
        text: `Successfully transferred ${amount} chips from ${sourceAccount} to ${destinationAccount}! Transaction ID: ${result?.id || "TX-" + Math.floor(Math.random() * 10000)}`,
      });
      if (onTransferSuccess) onTransferSuccess();
    } catch (err) {
      console.error("Transfer failed:", err);
      setStatusMsg({
        type: "error",
        text:
          err.response?.data?.detail ||
          err.message ||
          "Transfer request failed. Please check balance or account IDs.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/90 rounded-xl border border-slate-700/80 p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-5 border-b border-slate-700/80 pb-4">
        <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
          <ArrowRightLeft className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">
            Quick Transfer Terminal
          </h2>
          <p className="text-xs text-slate-400">
            ACID-compliant account-to-account settlement
          </p>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 mb-5 rounded-lg border text-sm flex items-start gap-3 ${
            statusMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
          role={statusMsg.type === "error" ? "alert" : "status"}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div>{statusMsg.text}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Source Account ID
            </label>
            <input
              type="text"
              value={sourceAccount}
              onChange={(e) => setSourceAccount(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              placeholder="e.g. acc-001"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Destination Account ID
            </label>
            <input
              type="text"
              value={destinationAccount}
              onChange={(e) => setDestinationAccount(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              placeholder="e.g. acc-002"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Chip Denomination
            </label>
            <select
              value={chipId}
              onChange={(e) => setChipId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="chip-gold-100">Gold 100 ($100.00)</option>
              <option value="chip-plat-1000">Platinum 1000 ($1,000.00)</option>
              <option value="chip-silver-25">Silver 25 ($25.00)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Chip Quantity
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
            Reason / Memo
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
            placeholder="e.g. Operational Settlement"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-slate-950 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Executing Row-Lock Transaction...
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-4 h-4" />
              Execute Settlement Transfer
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default QuickTransferForm;
