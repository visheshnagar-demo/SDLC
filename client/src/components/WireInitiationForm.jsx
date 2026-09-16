import React, { useState } from "react";
import {
  Send,
  AlertCircle,
  Info,
  DollarSign,
  User,
  CreditCard,
  Hash,
} from "lucide-react";

export default function WireInitiationForm({
  currentUser,
  onSubmitWire,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    beneficiaryName: "",
    accountNumber: "",
    routingNumber: "",
    amount: "",
  });

  const [validationError, setValidationError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationError) setValidationError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    const { beneficiaryName, accountNumber, routingNumber, amount } = formData;

    if (
      !beneficiaryName.trim() ||
      !accountNumber.trim() ||
      !routingNumber.trim() ||
      !amount
    ) {
      setValidationError("All fields are required.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setValidationError(
        "Amount must be a positive number greater than $0.00.",
      );
      return;
    }

    onSubmitWire(
      {
        beneficiaryName: beneficiaryName.trim(),
        accountNumber: accountNumber.trim(),
        routingNumber: routingNumber.trim(),
        amount: numericAmount,
        createdBy: currentUser,
      },
      () => {
        // Reset form on success callback
        setFormData({
          beneficiaryName: "",
          accountNumber: "",
          routingNumber: "",
          amount: "",
        });
      },
    );
  };

  const amountVal = parseFloat(formData.amount) || 0;
  const isOverThreshold = amountVal > 10000;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Initiate Commercial Wire Transfer
          </h2>
          <p className="text-xs text-slate-500">
            Submit a new wire transfer request into the system
          </p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
          Initiator: <strong className="text-slate-900">{currentUser}</strong>
        </span>
      </div>

      <div className="p-6">
        {/* $10,000 Threshold Information Notice Banner */}
        <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start space-x-3 text-sm text-blue-900">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-blue-950">
              Dual Approval Business Rule ($10,000 Threshold)
            </p>
            <p className="text-xs text-blue-800 leading-relaxed">
              Wire transfers <strong>&le; $10,000.00</strong> are automatically
              approved upon submission. Wire transfers{" "}
              <strong>&gt; $10,000.00</strong> require dual approval and will be
              queued for Checker review.
            </p>
          </div>
        </div>

        {validationError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center space-x-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Beneficiary Name */}
            <div>
              <label
                htmlFor="beneficiaryName"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Beneficiary Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="beneficiaryName"
                  name="beneficiaryName"
                  value={formData.beneficiaryName}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corporation"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Account Number */}
            <div>
              <label
                htmlFor="accountNumber"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Account Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="e.g. 123456789"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Routing Number */}
            <div>
              <label
                htmlFor="routingNumber"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Routing Number (ABA)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="routingNumber"
                  name="routingNumber"
                  value={formData.routingNumber}
                  onChange={handleChange}
                  placeholder="e.g. 021000021"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label
                htmlFor="amount"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Wire Amount ($ USD)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Real-time threshold indicator preview */}
          {formData.amount && amountVal > 0 && (
            <div className="mt-2 text-xs flex items-center justify-between px-3 py-2 rounded bg-slate-100 border border-slate-200">
              <span className="text-slate-600">
                Expected Processing Result:
              </span>
              {isOverThreshold ? (
                <span className="font-semibold text-amber-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  PENDING (Requires Checker Dual Approval)
                </span>
              ) : (
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  APPROVED (Auto-Approved &le; $10k)
                </span>
              )}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <span>Submitting Wire...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Wire Transfer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
