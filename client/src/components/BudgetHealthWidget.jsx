import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function BudgetHealthWidget({
  budget = 2000,
  totalEstimatedCost = 0,
  currency = "USD",
}) {
  const numBudget = Number(budget) || 0;
  const numCost = Number(totalEstimatedCost) || 0;
  const percentUsed =
    numBudget > 0 ? Math.round((numCost / numBudget) * 100) : 0;
  const isOverBudget = numCost > numBudget;
  const remaining = numBudget - numCost;

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Budget Health & Analytics
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isOverBudget
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
              }`}
            >
              {isOverBudget ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  OVER BUDGET ({percentUsed}%)
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  WITHIN BUDGET ({percentUsed}%)
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time financial tracking across all planned days
          </p>
        </div>

        <div className="text-right sm:text-right">
          <span className="text-xs text-slate-500">Estimated Total Spend</span>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatMoney(numCost)}
            <span className="text-xs font-normal text-slate-500 ml-1">
              / {formatMoney(numBudget)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-3 p-0.5 border border-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOverBudget
              ? "bg-gradient-to-r from-amber-500 to-red-500"
              : percentUsed > 85
                ? "bg-gradient-to-r from-primary-500 to-amber-500"
                : "bg-gradient-to-r from-emerald-500 to-primary-600"
          }`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>

      {/* Metric Breakdown Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
        <div>
          <span className="text-slate-400 font-medium">Allocated Budget</span>
          <p className="text-sm font-bold text-slate-800">
            {formatMoney(numBudget)}
          </p>
        </div>
        <div>
          <span className="text-slate-400 font-medium">Estimated Spend</span>
          <p className="text-sm font-bold text-primary-600">
            {formatMoney(numCost)}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-slate-400 font-medium">
            {isOverBudget ? "Budget Deficit" : "Remaining Buffer"}
          </span>
          <p
            className={`text-sm font-bold ${
              isOverBudget ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {isOverBudget
              ? `-${formatMoney(Math.abs(remaining))}`
              : formatMoney(remaining)}
          </p>
        </div>
      </div>

      {/* Warning Alert if Over Budget */}
      {isOverBudget && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Budget threshold exceeded: </span>
            Your planned activities currently exceed your target budget by{" "}
            {formatMoney(Math.abs(remaining))}. You can remove or edit costly
            activities to stay within budget.
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetHealthWidget;
