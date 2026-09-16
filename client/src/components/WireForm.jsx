import React, { useState } from "react";

export default function WireForm({ onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    beneficiaryName: "",
    accountNumber: "",
    routingNumber: "",
    amount: "",
  });

  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.beneficiaryName ||
      !formData.accountNumber ||
      !formData.routingNumber ||
      !formData.amount
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid transfer amount greater than $0.");
      return;
    }

    onSubmit({
      beneficiaryName: formData.beneficiaryName.trim(),
      accountNumber: formData.accountNumber.trim(),
      routingNumber: formData.routingNumber.trim(),
      amount: numAmount,
    });

    // Reset form upon successful submission trigger
    setFormData({
      beneficiaryName: "",
      accountNumber: "",
      routingNumber: "",
      amount: "",
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
        Initiate Commercial Wire Transfer
      </h2>

      {formError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="beneficiaryName"
            className="block text-xs font-semibold text-slate-600 mb-1"
          >
            Beneficiary Name
          </label>
          <input
            id="beneficiaryName"
            name="beneficiaryName"
            type="text"
            value={formData.beneficiaryName}
            onChange={handleChange}
            placeholder="e.g. ACME Corp Holdings LLC"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
            required
          />
        </div>

        <div>
          <label
            htmlFor="accountNumber"
            className="block text-xs font-semibold text-slate-600 mb-1"
          >
            Account Number
          </label>
          <input
            id="accountNumber"
            name="accountNumber"
            type="text"
            value={formData.accountNumber}
            onChange={handleChange}
            placeholder="e.g. 987654321012"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
            required
          />
        </div>

        <div>
          <label
            htmlFor="routingNumber"
            className="block text-xs font-semibold text-slate-600 mb-1"
          >
            ABA Routing Number (9 digits)
          </label>
          <input
            id="routingNumber"
            name="routingNumber"
            type="text"
            value={formData.routingNumber}
            onChange={handleChange}
            placeholder="e.g. 121000358"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
            required
          />
        </div>

        <div>
          <label
            htmlFor="amount"
            className="block text-xs font-semibold text-slate-600 mb-1"
          >
            Transfer Amount ($ USD)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            placeholder="e.g. 15000.00"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
            required
          />
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
          <span className="font-bold">Dual Approval Policy:</span> Transfers
          over $10,000.00 will be held in{" "}
          <span className="font-bold">PENDING</span> status for Checker review.
          Transfers &le; $10,000.00 are auto-approved.
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-sm rounded transition-colors shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? "Submitting Wire..." : "Submit Wire Transfer"}
        </button>
      </form>
    </div>
  );
}
