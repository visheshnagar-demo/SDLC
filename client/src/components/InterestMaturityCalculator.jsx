import React from "react";
import { TrendingUp, Calendar, DollarSign, Percent } from "lucide-react";

export const InterestMaturityCalculator = ({
  depositAmount = 5000,
  interestRate = 5.5,
  tenureMonths = 12,
  payoutFrequency = "maturity",
  maturityDateStr = null,
  calculatedInterest = null,
  calculatedMaturityAmount = null,
}) => {
  const principal = Number(depositAmount) || 0;
  const rate = Number(interestRate) || 0;
  const tenure = Number(tenureMonths) || 12;

  // Real-time calculation if not provided by backend projection
  const totalInterest =
    calculatedInterest !== null && calculatedInterest !== undefined
      ? Number(calculatedInterest)
      : principal * (rate / 100) * (tenure / 12);

  const maturityAmount =
    calculatedMaturityAmount !== null && calculatedMaturityAmount !== undefined
      ? Number(calculatedMaturityAmount)
      : principal + totalInterest;

  const getMaturityDate = () => {
    if (maturityDateStr) return maturityDateStr;
    const date = new Date();
    date.setMonth(date.getMonth() + tenure);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 shadow-sm border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          Calculation Summary
        </h3>
        <span className="text-[11px] text-blue-300 bg-blue-900/60 px-2 py-0.5 rounded-full font-medium">
          {payoutFrequency === "monthly"
            ? "Monthly Payout"
            : "Cumulative at Maturity"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">
            Principal Deposit
          </span>
          <span className="font-semibold text-slate-100 text-sm">
            $
            {principal.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">
            Interest Rate
          </span>
          <span className="font-semibold text-blue-400 text-sm">
            {rate.toFixed(2)}% p.a.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-2">
        <div>
          <span className="text-slate-400 block text-[11px]">
            Total Interest Earned
          </span>
          <span className="text-emerald-400 font-bold text-sm">
            +$
            {totalInterest.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">
            Maturity Date
          </span>
          <span className="font-semibold text-slate-200 text-sm">
            {getMaturityDate()}
          </span>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-2.5 flex justify-between items-center">
        <div>
          <span className="text-white text-xs font-bold block">
            Estimated Maturity Amount
          </span>
          <span className="text-[10px] text-slate-400">
            Principal + Total Interest
          </span>
        </div>
        <span className="text-emerald-400 text-lg font-bold">
          $
          {maturityAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
};

export default InterestMaturityCalculator;
