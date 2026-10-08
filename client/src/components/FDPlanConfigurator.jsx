import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Check,
} from "lucide-react";
import InterestMaturityCalculator from "./InterestMaturityCalculator";

export const FDPlanConfigurator = ({
  sourceAccount,
  ratePlans = [],
  depositAmount,
  setDepositAmount,
  tenureMonths,
  setTenureMonths,
  payoutFrequency,
  setPayoutFrequency,
  onProceed,
  onBack,
  projectionData = null,
}) => {
  const defaultPlans = [
    {
      tenure_months: 6,
      interest_rate: 4.75,
      min_deposit: 500,
      label: "6 Months",
    },
    {
      tenure_months: 12,
      interest_rate: 5.5,
      min_deposit: 500,
      label: "12 Months",
      is_recommended: true,
    },
    {
      tenure_months: 24,
      interest_rate: 5.8,
      min_deposit: 500,
      label: "24 Months",
    },
    {
      tenure_months: 36,
      interest_rate: 6.0,
      min_deposit: 500,
      label: "36 Months",
    },
  ];

  const activePlans = ratePlans.length > 0 ? ratePlans : defaultPlans;
  const currentPlan =
    activePlans.find((p) => p.tenure_months === tenureMonths) ||
    activePlans[1] ||
    activePlans[0];
  const interestRate = currentPlan?.interest_rate || 5.5;

  const availableBalance = Number(sourceAccount?.available_balance || 0);
  const minDeposit = currentPlan?.min_deposit || 500;

  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    const amt = Number(depositAmount);
    if (!amt || isNaN(amt)) {
      setValidationError("Please enter a valid deposit amount.");
    } else if (amt < minDeposit) {
      setValidationError(
        `Minimum deposit amount is $${minDeposit.toLocaleString()}.`,
      );
    } else if (sourceAccount && amt > availableBalance) {
      setValidationError(
        `Deposit amount exceeds available balance ($${availableBalance.toLocaleString()}).`,
      );
    } else {
      setValidationError("");
    }
  }, [depositAmount, minDeposit, availableBalance, sourceAccount]);

  const handleAddAmount = (addValue) => {
    const current = Number(depositAmount) || 0;
    const newAmount = Math.min(
      current + addValue,
      availableBalance > 0 ? availableBalance : current + addValue,
    );
    setDepositAmount(newAmount);
  };

  const handleSetMax = () => {
    if (availableBalance > 0) {
      setDepositAmount(availableBalance);
    }
  };

  const isFormValid = !validationError && Number(depositAmount) >= minDeposit;

  return (
    <div className="space-y-5">
      {/* Source Account Info Ribbon */}
      {sourceAccount && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex justify-between items-center text-xs">
          <div>
            <span className="text-slate-500 block">Funding From</span>
            <span className="font-semibold text-slate-800">
              {sourceAccount.account_type || "Savings"} (••
              {sourceAccount.account_number?.slice(-4) || "1234"})
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Available Balance</span>
            <span className="font-bold text-emerald-700">
              $
              {availableBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      )}

      {/* Deposit Amount Input */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label
            htmlFor="deposit_amount_input"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            Deposit Amount ($500 min)
          </label>
          {availableBalance > 0 && (
            <button
              type="button"
              onClick={handleSetMax}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
            >
              Use Max Balance
            </button>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-lg">
            $
          </span>
          <input
            id="deposit_amount_input"
            type="number"
            min="500"
            step="100"
            value={depositAmount}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
            placeholder="5000"
            className={`w-full pl-9 pr-4 py-2.5 text-lg font-bold border rounded-xl focus:ring-2 focus:outline-none transition-colors ${
              validationError
                ? "border-red-400 focus:ring-red-400 bg-red-50/20 text-red-900"
                : "border-slate-300 focus:ring-blue-600 text-slate-900"
            }`}
          />
        </div>

        {validationError && (
          <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {validationError}
          </p>
        )}

        {/* Quick Amount Buttons */}
        <div className="flex flex-wrap gap-2 mt-2.5">
          <button
            type="button"
            onClick={() => handleAddAmount(1000)}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-lg transition-colors"
          >
            +$1,000
          </button>
          <button
            type="button"
            onClick={() => handleAddAmount(5000)}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-xs font-semibold text-blue-800 rounded-lg transition-colors"
          >
            +$5,000
          </button>
          <button
            type="button"
            onClick={() => handleAddAmount(10000)}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-lg transition-colors"
          >
            +$10,000
          </button>
        </div>
      </div>

      {/* Select Tenure */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Select Tenure Duration
        </label>
        <div className="grid grid-cols-2 gap-3">
          {activePlans.map((plan) => {
            const isSelected = tenureMonths === plan.tenure_months;
            const isRec = plan.is_recommended || plan.tenure_months === 12;

            return (
              <div
                key={plan.tenure_months}
                onClick={() => setTenureMonths(plan.tenure_months)}
                className={`rounded-xl p-3 text-center cursor-pointer relative transition-all ${
                  isSelected
                    ? "border-2 border-blue-600 bg-blue-50/40 shadow-sm"
                    : "border border-slate-200 hover:border-blue-300 bg-white"
                }`}
              >
                {isRec && (
                  <span className="absolute -top-2 right-2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
                    <Sparkles className="w-2.5 h-2.5" /> RECOMMENDED
                  </span>
                )}
                <p className="text-sm font-bold text-slate-900">
                  {plan.label || `${plan.tenure_months} Months`}
                </p>
                <p
                  className={`text-xs font-bold mt-0.5 ${isSelected ? "text-blue-700" : "text-blue-600"}`}
                >
                  {Number(plan.interest_rate).toFixed(2)}% p.a.
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interest Payout Frequency */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Interest Payout Frequency
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPayoutFrequency("maturity")}
            className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 ${
              payoutFrequency === "maturity"
                ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {payoutFrequency === "maturity" && (
              <Check className="w-3.5 h-3.5" />
            )}
            At Maturity (Highest Return)
          </button>
          <button
            type="button"
            onClick={() => setPayoutFrequency("monthly")}
            className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 ${
              payoutFrequency === "monthly"
                ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {payoutFrequency === "monthly" && <Check className="w-3.5 h-3.5" />}
            Monthly Payout
          </button>
        </div>
      </div>

      {/* Real-time Calculation Summary */}
      <InterestMaturityCalculator
        depositAmount={depositAmount}
        interestRate={interestRate}
        tenureMonths={tenureMonths}
        payoutFrequency={payoutFrequency}
        maturityDateStr={projectionData?.maturity_date}
        calculatedInterest={projectionData?.total_interest_earned}
        calculatedMaturityAmount={projectionData?.maturity_amount}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={onProceed}
          disabled={!isFormValid}
          className="flex-2 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <span>Proceed to Review & Authorize</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FDPlanConfigurator;
