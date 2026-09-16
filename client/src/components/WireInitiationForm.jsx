import React, { useState } from "react";

export default function WireInitiationForm({
  activeUser,
  onWireSubmitted,
  onError,
}) {
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (
      !beneficiaryName.trim() ||
      !accountNumber.trim() ||
      !routingNumber.trim() ||
      !amount
    ) {
      if (onError) onError("Please fill in all required fields.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      if (onError)
        onError("Please enter a valid transfer amount greater than $0.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        beneficiaryName: beneficiaryName.trim(),
        accountNumber: accountNumber.trim(),
        routingNumber: routingNumber.trim(),
        amount: numericAmount,
        createdBy: activeUser,
      };

      const result = await onWireSubmitted(payload);

      if (result) {
        if (result.status === "APPROVED") {
          setSuccessMessage(
            `Wire transfer of $${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} to ${beneficiaryName} was automatically APPROVED (<= $10,000 threshold).`,
          );
        } else if (result.status === "PENDING") {
          setSuccessMessage(
            `Wire transfer of $${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} to ${beneficiaryName} submitted! Status: PENDING (Requires Checker dual approval).`,
          );
        } else {
          setSuccessMessage(
            `Wire transfer created successfully with status: ${result.status}`,
          );
        }
      }

      setBeneficiaryName("");
      setAccountNumber("");
      setRoutingNumber("");
      setAmount("");
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to submit wire transfer.";
      if (onError) onError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Initiate Wire Transfer
          </h2>
          <p className="text-xs text-slate-500">
            Initiating as{" "}
            <span className="font-semibold text-slate-700">{activeUser}</span>
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs rounded flex justify-between items-center">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div>
          <label
            htmlFor="beneficiary-name"
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            Beneficiary Name
          </label>
          <input
            id="beneficiary-name"
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Acme Industrial Logistics"
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="account-number"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Account Number
            </label>
            <input
              id="account-number"
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="9876543210"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="routing-number"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Routing Number
            </label>
            <input
              id="routing-number"
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="121000358"
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="amount"
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            Amount ($ USD)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="15000.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-amber-600 mt-1">
            Note: Wire transfers strictly greater than $10,000 require Checker
            dual approval.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-sm disabled:opacity-50 transition-colors"
        >
          {loading ? "Submitting..." : "Submit Wire Transfer"}
        </button>
      </form>
    </div>
  );
}
