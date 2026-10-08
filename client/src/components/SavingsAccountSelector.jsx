import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Wallet,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

export const SavingsAccountSelector = ({
  accounts = [],
  selectedAccountId,
  onSelectAccount,
  onProceed,
  loading = false,
  error = null,
  onRetry,
}) => {
  return (
    <div className="space-y-4">
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-800">
            Select Funding Account
          </h2>
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={loading}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <RefreshCw
                className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
              />
              Refresh Accounts
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to load accounts</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse border border-slate-200 bg-slate-100 rounded-xl p-4 h-24"
              />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
            <Wallet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">
              No Savings Accounts Found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Please ensure your retail savings account is active.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc) => {
              const isEligible =
                acc.is_eligible_for_fd !== false &&
                acc.available_balance >= 500;
              const isSelected = selectedAccountId === acc.id;

              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    if (isEligible) {
                      onSelectAccount(acc.id);
                    }
                  }}
                  className={`rounded-xl p-4 transition-all flex justify-between items-center ${
                    isEligible
                      ? isSelected
                        ? "border-2 border-blue-600 bg-blue-50/40 cursor-pointer shadow-sm"
                        : "border border-slate-200 hover:border-blue-300 bg-white cursor-pointer hover:bg-slate-50/50"
                      : "border border-slate-200 bg-slate-100/70 opacity-70 cursor-not-allowed"
                  }`}
                >
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {acc.account_type || "Savings Account"} (#
                        {acc.account_number || acc.id})
                      </p>
                    </div>
                    <p
                      className={`text-lg font-bold mt-1 ${
                        isEligible ? "text-emerald-600" : "text-slate-600"
                      }`}
                    >
                      Available: $
                      {Number(acc.available_balance || 0).toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                      )}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {isEligible ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />{" "}
                          Eligible for FD
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-medium bg-amber-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {acc.ineligibility_reason ||
                            "Insufficient balance (< $500 min)"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="radio"
                      name="funding_account"
                      checked={isSelected}
                      disabled={!isEligible}
                      onChange={() => isEligible && onSelectAccount(acc.id)}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" /> Why Open a Fixed
          Deposit?
        </h3>
        <ul className="text-xs text-slate-700 space-y-1.5">
          <li className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">•</span>
            <span>
              <strong>High Returns:</strong> Up to 6.00% p.a. guaranteed
              interest
            </span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="text-blue-500 font-bold">•</span>
            <span>
              <strong>Flexible Tenures:</strong> 6 to 60 months duration
            </span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="text-indigo-500 font-bold">•</span>
            <span>
              <strong>Instant Setup:</strong> Zero branch visits, instant
              auto-debit
            </span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">•</span>
            <span>
              <strong>Guaranteed Capital:</strong> FDIC insured up to $250,000
            </span>
          </li>
        </ul>
      </section>

      <button
        onClick={onProceed}
        disabled={!selectedAccountId || loading}
        className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <span>Proceed to Choose Plan</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SavingsAccountSelector;
