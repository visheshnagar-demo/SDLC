import React, { useState, useEffect } from "react";
import {
  allocateChips,
  transferChips,
  redeemChips,
  getChips,
  getAccounts,
} from "../services/api";
import {
  ArrowLeftRight,
  X,
  ArrowRight,
  ShieldCheck,
  Flame,
  PlusCircle,
} from "lucide-react";

export default function TransferModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "transfer",
}) {
  const [mode, setMode] = useState(initialMode); // 'transfer' | 'allocate' | 'redeem'
  const [chips, setChips] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [formData, setFormData] = useState({
    source_account_id: "",
    destination_account_id: "",
    account_id: "",
    chip_id: "",
    amount: 100,
    reason: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      setMode(initialMode);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, initialMode]);

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const [chipsData, accountsData] = await Promise.all([
        getChips(),
        getAccounts(),
      ]);
      setChips(chipsData);
      setAccounts(accountsData);

      if (chipsData.length > 0 && !formData.chip_id) {
        setFormData((prev) => ({ ...prev, chip_id: chipsData[0].id }));
      }
      if (accountsData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          source_account_id: prev.source_account_id || accountsData[0].id,
          destination_account_id:
            prev.destination_account_id ||
            accountsData[1]?.id ||
            accountsData[0].id,
          account_id: prev.account_id || accountsData[0].id,
        }));
      }
    } catch (err) {
      console.error("Error loading transfer dropdown options:", err);
      setError("Failed to load chips or accounts for transfer selection.");
    } finally {
      setLoadingOptions(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      let result;
      if (mode === "transfer") {
        if (formData.source_account_id === formData.destination_account_id) {
          throw new Error("Source and destination accounts must be different.");
        }
        result = await transferChips({
          source_account_id: formData.source_account_id,
          destination_account_id: formData.destination_account_id,
          chip_id: formData.chip_id,
          amount: parseInt(formData.amount, 10),
          reason: formData.reason || "Account Transfer",
        });
        setSuccess(
          `Transfer of ${formData.amount} chips completed successfully! Transaction ID: ${result.id}`,
        );
      } else if (mode === "allocate") {
        result = await allocateChips({
          account_id: formData.account_id,
          chip_id: formData.chip_id,
          amount: parseInt(formData.amount, 10),
          reason: formData.reason || "Stock Allocation",
        });
        setSuccess(
          `Allocation of ${formData.amount} chips completed successfully! Transaction ID: ${result.id}`,
        );
      } else if (mode === "redeem") {
        result = await redeemChips({
          account_id: formData.account_id,
          chip_id: formData.chip_id,
          amount: parseInt(formData.amount, 10),
          reason: formData.reason || "Redemption / Burn",
        });
        setSuccess(
          `Redemption of ${formData.amount} chips completed! Transaction ID: ${result.id}`,
        );
      }

      if (onSuccess) onSuccess(result);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      console.error(`Error executing ${mode}:`, err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        `Failed to execute ${mode}.`;
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">
            Chip Transaction Terminal
          </h2>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-lg border border-slate-700/80">
          <button
            type="button"
            onClick={() => setMode("transfer")}
            className={`py-2 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition ${
              mode === "transfer"
                ? "bg-cyan-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Transfer
          </button>
          <button
            type="button"
            onClick={() => setMode("allocate")}
            className={`py-2 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition ${
              mode === "allocate"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Allocate
          </button>
          <button
            type="button"
            onClick={() => setMode("redeem")}
            className={`py-2 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition ${
              mode === "redeem"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Redeem
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-red-200 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-900/40 border border-emerald-500/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Chip Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Select Chip Type
            </label>
            <select
              value={formData.chip_id}
              onChange={(e) =>
                setFormData({ ...formData, chip_id: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              {chips.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (${c.face_value}) - Avail: {c.available_quantity}
                </option>
              ))}
            </select>
          </div>

          {/* Account Fields depending on mode */}
          {mode === "transfer" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Source Account
                </label>
                <select
                  value={formData.source_account_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      source_account_id: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.owner_name} ({acc.account_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Destination Account
                </label>
                <select
                  value={formData.destination_account_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      destination_account_id: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.owner_name} ({acc.account_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                {mode === "allocate"
                  ? "Target Account (Receive Stock)"
                  : "Target Account (Redeem/Burn)"}
              </label>
              <select
                value={formData.account_id}
                onChange={(e) =>
                  setFormData({ ...formData, account_id: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.owner_name} ({acc.account_number})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Quantity / Amount
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Reason Code / Note
              </label>
              <input
                type="text"
                required
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="e.g. Settlement / Audit #12"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingOptions}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {submitting
                ? "Executing ACID Settlement..."
                : `Confirm ${mode.toUpperCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
