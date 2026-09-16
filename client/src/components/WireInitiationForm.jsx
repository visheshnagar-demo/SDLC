import React, { useState } from "react";
import { Send, AlertCircle, CheckCircle } from "lucide-react";

export const WireInitiationForm = ({ currentUser, onSubmitWire, loading }) => {
  const [beneficiaryName, setBeneficiaryName] = useState(
    "Acme Industrial Corp",
  );
  const [accountNumber, setAccountNumber] = useState("1234567890");
  const [routingNumber, setRoutingNumber] = useState("121000358");
  const [amount, setAmount] = useState("15000.00");
  const [formError, setFormError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (!beneficiaryName.trim()) {
      setFormError("Beneficiary Name is required.");
      return;
    }
    if (!accountNumber.trim()) {
      setFormError("Account Number is required.");
      return;
    }
    if (!routingNumber.trim()) {
      setFormError("Routing Number is required.");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Wire Amount must be a positive number.");
      return;
    }

    onSubmitWire({
      beneficiaryName: beneficiaryName.trim(),
      accountNumber: accountNumber.trim(),
      routingNumber: routingNumber.trim(),
      amount: numAmount,
      createdBy: currentUser,
    });
  };

  const isPendingThreshold = parseFloat(amount) > 10000;

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" /> Initiate Wire Transfer
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit commercial wire details. Initiating as{" "}
            <span className="font-semibold text-slate-700">{currentUser}</span>.
          </p>
        </div>
      </div>

      {formError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Beneficiary Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
            placeholder="e.g. Acme Industrial Corp"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:bg-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. 1234567890"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:bg-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Routing Number (ABA) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
              placeholder="e.g. 121000358"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:bg-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Wire Amount ($ USD) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">
              $
            </span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="15000.00"
              className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm font-semibold focus:bg-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div
          className={`p-3 rounded-md text-xs border flex items-start gap-2 ${
            isPendingThreshold
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
        >
          {isPendingThreshold ? (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold">Threshold Notice: </span>
            {isPendingThreshold
              ? "Amount exceeds $10,000.00. Status will be set to PENDING and require Checker approval."
              : "Amount is $10,000.00 or less. Wire will be AUTO-APPROVED immediately."}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-md text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? "Processing..." : "Submit Wire Transfer"}
        </button>
      </form>
    </div>
  );
};

export default WireInitiationForm;
