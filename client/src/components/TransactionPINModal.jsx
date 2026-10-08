import React, { useState, useRef, useEffect } from "react";
import {
  Lock,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Fingerprint,
} from "lucide-react";

export const TransactionPINModal = ({
  sourceAccount,
  depositAmount,
  tenureMonths,
  interestRate,
  payoutFrequency,
  maturityAmount,
  onConfirm,
  onBack,
  loading = false,
  error = null,
}) => {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [pinError, setPinError] = useState("");
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    // Focus first input on mount
    inputRefs[0]?.current?.focus();
  }, []);

  const handlePinChange = (index, value) => {
    // Only accept numeric digit
    if (value && !/^\d+$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1); // Take latest single digit
    setPin(newPin);
    setPinError("");

    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs[index + 1]?.current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
  };

  const fullPin = pin.join("");
  const isPinComplete = fullPin.length === 4;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!isPinComplete) {
      setPinError("Please enter your complete 4-digit transaction PIN.");
      return;
    }
    if (!agreedToTerms) {
      setPinError("Please accept the terms and conditions to proceed.");
      return;
    }
    onConfirm(fullPin);
  };

  const handleSimulateBiometric = () => {
    setPin(["1", "2", "3", "4"]);
    setPinError("");
  };

  const formattedDeposit = Number(depositAmount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedMaturity = Number(maturityAmount || 0).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );

  return (
    <div className="space-y-4">
      {/* Order Summary Card */}
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Order Summary</span>
          <span className="text-[10px] text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded font-semibold">
            Final Review
          </span>
        </h3>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-xs">From Account</span>
            <span className="font-semibold text-slate-900 text-xs">
              {sourceAccount?.account_type || "Primary Savings"} (••
              {sourceAccount?.account_number?.slice(-4) || "1234"})
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-xs">Deposit Amount</span>
            <span className="font-bold text-slate-900">
              ${formattedDeposit}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-xs">Tenure & Rate</span>
            <span className="font-semibold text-slate-900 text-xs">
              {tenureMonths} Months @ {Number(interestRate || 5.5).toFixed(2)}%
              p.a.
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-xs">Payout Schedule</span>
            <span className="font-medium text-slate-800 text-xs capitalize">
              {payoutFrequency === "monthly"
                ? "Monthly Interest"
                : "At Maturity"}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center">
            <span className="text-slate-800 font-bold text-xs">
              Maturity Value
            </span>
            <span className="font-bold text-emerald-600 text-base">
              ${formattedMaturity}
            </span>
          </div>
        </div>
      </div>

      {/* Backend API Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Transaction Failed</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* 4-Digit PIN Security Input */}
      <div className="text-center space-y-3 py-2 bg-white rounded-xl border border-slate-200 p-4">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Enter 4-Digit Transaction PIN
        </label>
        <p className="text-[11px] text-slate-500">
          Enter your security PIN to authorize atomic fund transfer.
        </p>

        <div className="flex justify-center space-x-3 my-2">
          {pin.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-all ${
                digit
                  ? "border-blue-600 bg-blue-50/50 text-slate-900"
                  : "border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              }`}
            />
          ))}
        </div>

        {pinError && (
          <p className="text-xs text-red-600 font-medium flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {pinError}
          </p>
        )}

        <button
          type="button"
          onClick={handleSimulateBiometric}
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Fingerprint className="w-4 h-4 text-blue-600" />
          <span>Use Biometric / Demo PIN (1234)</span>
        </button>
      </div>

      {/* Agreement Checkbox */}
      <div className="flex items-start space-x-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <input
          id="terms_checkbox"
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
        />
        <label
          htmlFor="terms_checkbox"
          className="cursor-pointer select-none leading-relaxed"
        >
          I authorize the instant auto-debit of{" "}
          <strong>${formattedDeposit}</strong> from{" "}
          {sourceAccount?.account_type || "Primary Savings"} (#XXXX-
          {sourceAccount?.account_number?.slice(-4) || "1234"}) and agree to the
          Fixed Deposit Terms & Conditions.
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isPinComplete || !agreedToTerms || loading}
          className="flex-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 text-sm"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing Transfer...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Confirm & Open Fixed Deposit Account</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TransactionPINModal;
