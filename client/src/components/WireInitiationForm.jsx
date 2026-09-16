import React, { useState } from "react";
import {
  Send,
  DollarSign,
  Building2,
  CreditCard,
  Hash,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function WireInitiationForm({
  onSubmitWire,
  currentUser,
  isSubmitting,
}) {
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    if (!beneficiaryName.trim()) {
      setValidationError("Beneficiary Name is required.");
      return;
    }
    if (!accountNumber.trim()) {
      setValidationError("Account Number is required.");
      return;
    }
    if (!routingNumber.trim() || routingNumber.trim().length < 9) {
      setValidationError("Valid 9-digit Routing Number is required.");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setValidationError("Please enter a valid positive transfer amount.");
      return;
    }

    onSubmitWire({
      beneficiaryName: beneficiaryName.trim(),
      accountNumber: accountNumber.trim(),
      routingNumber: routingNumber.trim(),
      amount: numAmount,
    });

    // Reset fields on submit
    setBeneficiaryName("");
    setAccountNumber("");
    setRoutingNumber("");
    setAmount("");
  };

  const numAmount = parseFloat(amount) || 0;
  const isHighValue = numAmount > 10000;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-slate-100">
            Initiate Wire Transfer
          </h2>
        </div>
        <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700">
          Initiator: <strong className="text-white">{currentUser}</strong>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {validationError && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Beneficiary Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Acme Industrial Corp"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Routing Number (ABA) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 021000021"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  maxLength={9}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Wire Amount (USD) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 15000.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-slate-900 transition-all"
                required
              />
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        {/* Dual Control Dynamic Status Indicator */}
        {amount && !isNaN(numAmount) && numAmount > 0 && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
              isHighValue
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {isHighValue ? (
              <>
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">
                    Dual Control Required (&gt; $10,000.00)
                  </p>
                  <p className="mt-0.5 text-amber-700">
                    This wire transfer will be routed to the{" "}
                    <strong>PENDING Approval Queue</strong> and must be approved
                    by a Checker.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">
                    Auto-Approved (&le; $10,000.00)
                  </p>
                  <p className="mt-0.5 text-emerald-700">
                    This wire transfer is within standard limits and will be{" "}
                    <strong>APPROVED immediately</strong> upon submission.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow text-sm transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? "Submitting Wire..." : "Submit Wire Transfer"}
        </button>
      </form>
    </div>
  );
}
