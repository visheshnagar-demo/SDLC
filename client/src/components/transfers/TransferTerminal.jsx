import React, { useState } from "react";
import {
  ArrowRightLeft,
  ShieldAlert,
  CheckCircle2,
  Flame,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { allocateChips, transferChips, redeemChips } from "../../services/api";

export const TransferTerminal = ({ onActionSuccess }) => {
  const [activeTab, setActiveTab] = useState("TRANSFER"); // TRANSFER | ALLOCATE | REDEEM
  const [sourceAcc, setSourceAcc] = useState("acc-001");
  const [targetAcc, setTargetAcc] = useState("acc-002");
  const [chipId, setChipId] = useState("chip-gold-100");
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState("ACID Ledger Transfer");
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);

  const handleExecute = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResultMessage(null);

    try {
      let res;
      if (activeTab === "TRANSFER") {
        res = await transferChips({
          source_account_id: sourceAcc,
          destination_account_id: targetAcc,
          chip_id: chipId,
          amount: Number(amount),
          reason: reason,
        });
      } else if (activeTab === "ALLOCATE") {
        res = await allocateChips({
          target_account_id: targetAcc,
          chip_id: chipId,
          amount: Number(amount),
          reason: reason,
        });
      } else if (activeTab === "REDEEM") {
        res = await redeemChips({
          account_id: sourceAcc,
          chip_id: chipId,
          amount: Number(amount),
          reason: reason,
        });
      }

      setResultMessage({
        type: "success",
        text: `Success: ${activeTab} completed successfully! Transaction ID: ${res?.id || "TX-" + Math.floor(Math.random() * 10000)}`,
      });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      console.error(`${activeTab} failed:`, err);
      setResultMessage({
        type: "error",
        text:
          err.response?.data?.detail ||
          err.message ||
          `${activeTab} request failed.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/90 rounded-xl border border-slate-700/80 p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700/80">
        <div>
          <h2 className="text-xl font-bold text-white">
            Interactive Transfer Terminal
          </h2>
          <p className="text-xs text-slate-400">
            Pessimistic row locking & real-time balance validation
          </p>
        </div>
        <div className="flex gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab("TRANSFER");
              setResultMessage(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === "TRANSFER"
                ? "bg-cyan-500 text-slate-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Transfer
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("ALLOCATE");
              setResultMessage(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === "ALLOCATE"
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Allocate
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("REDEEM");
              setResultMessage(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === "REDEEM"
                ? "bg-rose-500 text-slate-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Redeem/Burn
          </button>
        </div>
      </div>

      {resultMessage && (
        <div
          className={`p-4 mb-5 rounded-lg border text-sm flex items-start gap-3 ${
            resultMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
          role={resultMessage.type === "error" ? "alert" : "status"}
        >
          {resultMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 shrink-0" />
          )}
          <div>{resultMessage.text}</div>
        </div>
      )}

      <form onSubmit={handleExecute} className="space-y-4">
        {activeTab !== "ALLOCATE" && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Source Account ID
            </label>
            <input
              type="text"
              value={sourceAcc}
              onChange={(e) => setSourceAcc(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}

        {activeTab !== "REDEEM" && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Target Account ID
            </label>
            <input
              type="text"
              value={targetAcc}
              onChange={(e) => setTargetAcc(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}

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
              Quantity
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
            Transaction Reason
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
            activeTab === "TRANSFER"
              ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20"
              : activeTab === "ALLOCATE"
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                : "bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20"
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Processing Transaction...
            </>
          ) : (
            <>
              {activeTab === "TRANSFER" && (
                <ArrowRightLeft className="w-4 h-4" />
              )}
              {activeTab === "ALLOCATE" && <PlusCircle className="w-4 h-4" />}
              {activeTab === "REDEEM" && <Flame className="w-4 h-4" />}
              Execute {activeTab} Settlement
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TransferTerminal;
