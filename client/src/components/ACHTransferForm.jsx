import React, { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Copy,
  ArrowRightLeft,
  Sparkles,
} from "lucide-react";
import { submitACHTransfer } from "../services/achService";

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const SAMPLE_UUID = "123e4567-e89b-12d3-a456-426614174000";

export const ACHTransferForm = ({ onTransferSuccess }) => {
  const [accountId, setAccountId] = useState(SAMPLE_UUID);
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [correlationId, setCorrelationId] = useState(null);
  const [copied, setCopied] = useState(false);

  const validate = () => {
    const errs = {};
    if (!accountId.trim()) {
      errs.accountId = "Account ID is required.";
    } else if (!UUID_REGEX.test(accountId.trim())) {
      errs.accountId =
        "Account ID must be a valid UUID (e.g. 123e4567-e89b-12d3-a456-426614174000).";
    }

    if (!amount) {
      errs.amount = "Transfer Amount is required.";
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      errs.amount = "Transfer Amount must be greater than $0.00.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCopyCID = () => {
    if (correlationId) {
      navigator.clipboard.writeText(correlationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setAlert(null);
    setCorrelationId(null);

    try {
      const result = await submitACHTransfer({
        accountId: accountId.trim(),
        amount: parseFloat(amount),
      });

      setCorrelationId(result.correlationId);

      if (result.amlReview) {
        setAlert({
          type: "warning",
          title: "Approved — Flagged for AML Review",
          message: `Transfer of $${parseFloat(amount).toFixed(2)} approved but flagged for AML review (24h cumulative total > $5,000.00).`,
          correlationId: result.correlationId,
        });
      } else {
        setAlert({
          type: "success",
          title: "Transfer Approved",
          message: `Transfer of $${parseFloat(amount).toFixed(2)} to Account ${accountId} completed successfully.`,
          correlationId: result.correlationId,
        });
      }

      if (onTransferSuccess) {
        onTransferSuccess({
          ...result.data,
          correlationId: result.correlationId,
        });
      }
    } catch (err) {
      const cid = err.correlationId || "N/A";
      setCorrelationId(cid);

      if (err.velocityExceeded || err.status === 429) {
        setAlert({
          type: "error",
          title: "Transfer Rejected — Velocity Limit Exceeded",
          message: `24-Hour Velocity Limit ($10,000.00) Exceeded. ${err.message || ""}`,
          correlationId: cid,
        });
      } else if (err.status === 422) {
        setAlert({
          type: "error",
          title: "Validation Error",
          message: err.message || "Invalid Account ID format or Amount.",
          correlationId: cid,
        });
      } else {
        setAlert({
          type: "network",
          title: "Network / System Error",
          message:
            err.message ||
            "Unable to communicate with the ACH Velocity Limits backend.",
          correlationId: cid,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
            Initiate Outbound ACH Transfer
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluated against rolling 24-hour velocity limits ($5,000 AML flag /
            $10,000 Hard Limit).
          </p>
        </div>
        {correlationId && (
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs font-mono text-slate-700">
            <span>CID: {correlationId}</span>
            <button
              type="button"
              onClick={handleCopyCID}
              className="hover:text-indigo-600 transition-colors"
              title="Copy Correlation ID"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {copied && (
              <span className="text-[10px] text-emerald-600 font-sans font-bold">
                Copied!
              </span>
            )}
          </div>
        )}
      </div>

      {alert && (
        <div
          role="alert"
          className={`p-4 rounded-lg border flex items-start gap-3 text-sm transition-all ${
            alert.type === "success"
              ? "bg-emerald-50 text-emerald-950 border-emerald-300"
              : alert.type === "warning"
                ? "bg-amber-50 text-amber-950 border-amber-400"
                : alert.type === "error"
                  ? "bg-rose-50 text-red-950 border-red-400"
                  : "bg-slate-100 text-slate-900 border-slate-300"
          }`}
        >
          {alert.type === "success" && (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          {alert.type === "warning" && (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          {alert.type === "error" && (
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          {alert.type === "network" && (
            <AlertTriangle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-bold text-sm">{alert.title}</div>
            <div className="text-xs leading-relaxed">{alert.message}</div>
            {alert.correlationId && (
              <div className="text-[11px] font-mono opacity-80 pt-1">
                Correlation-ID:{" "}
                <span className="font-bold">{alert.correlationId}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="account-id-input"
              className="block text-xs font-medium text-slate-700"
            >
              Account ID *
            </label>
            <button
              type="button"
              onClick={() => setAccountId(SAMPLE_UUID)}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3 h-3" /> Insert Sample UUID
            </button>
          </div>
          <input
            id="account-id-input"
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            className={`w-full px-3 py-2 text-sm border rounded-lg font-mono focus:outline-none focus:ring-2 ${
              errors.accountId
                ? "border-red-500 focus:ring-red-200"
                : "border-slate-300 focus:ring-indigo-200"
            }`}
          />
          {errors.accountId && (
            <p className="text-xs text-red-600 mt-1">{errors.accountId}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="transfer-amount-input"
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            Transfer Amount ($ USD) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">
              $
            </span>
            <input
              id="transfer-amount-input"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1500.00"
              className={`w-full pl-7 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                errors.amount
                  ? "border-red-500 focus:ring-red-200"
                  : "border-slate-300 focus:ring-indigo-200"
              }`}
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-red-600 mt-1">{errors.amount}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processing Transfer...</span>
            </>
          ) : (
            <span>Submit Transfer</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default ACHTransferForm;
