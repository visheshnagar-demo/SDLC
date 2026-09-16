import React, { useState } from "react";
import {
  Send,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Building,
  Hash,
} from "lucide-react";

export function WireInitiationForm({ activeUser, onSubmitSuccess, onError }) {
  const [formData, setFormData] = useState({
    beneficiaryName: "",
    accountNumber: "",
    routingNumber: "",
    amount: "",
  });

  const [loading, setLoading] = useState(false);
  const [localSuccess, setLocalSuccess] = useState(null);

  const amountNum = parseFloat(formData.amount) || 0;
  const isHighValue = amountNum > 10000;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (localSuccess) setLocalSuccess(null);
  };

  const handleFillSample = (presetAmount) => {
    setFormData({
      beneficiaryName:
        presetAmount > 10000 ? "Acme Industrial Corp" : "Globex Logistics LLC",
      accountNumber: "1234567890",
      routingNumber: "987654321",
      amount: presetAmount.toString(),
    });
    setLocalSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalSuccess(null);

    try {
      const payload = {
        beneficiaryName: formData.beneficiaryName.trim(),
        accountNumber: formData.accountNumber.trim(),
        routingNumber: formData.routingNumber.trim(),
        amount: parseFloat(formData.amount),
        createdBy: activeUser,
      };

      const result = await onSubmitSuccess(payload);

      setLocalSuccess({
        id: result.id,
        status: result.status,
        amount: result.amount,
        autoApproved: result.status === "APPROVED",
      });

      // Clear form
      setFormData({
        beneficiaryName: "",
        accountNumber: "",
        routingNumber: "",
        amount: "",
      });
    } catch (err) {
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-400" />
            Initiate Commercial Wire Transfer
          </h2>
          <p className="text-xs text-slate-400">
            Wires over $10,000 require dual Checker authorization
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleFillSample(5000)}
            className="text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 transition"
          >
            Sample ≤ $10k
          </button>
          <button
            type="button"
            onClick={() => handleFillSample(15000)}
            className="text-[11px] font-medium bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 px-2.5 py-1 rounded border border-amber-800/60 transition"
          >
            Sample &gt; $10k
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Dynamic Threshold Warning Banner */}
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
            isHighValue
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          <AlertCircle
            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
              isHighValue ? "text-amber-600" : "text-slate-400"
            }`}
          />
          <div>
            <span className="font-bold">
              Dual Approval Rule (&gt;$10,000 USD):
            </span>{" "}
            {isHighValue ? (
              <span className="text-amber-800 font-medium">
                This transfer is <strong>${amountNum.toLocaleString()}</strong>{" "}
                (&gt;$10,000) and will be placed in{" "}
                <span className="underline font-bold">PENDING</span> status for
                Checker approval.
              </span>
            ) : (
              <span>
                Transfers up to $10,000.00 are automatically approved upon
                initiation. Transfers exceeding $10,000 require independent
                Checker verification.
              </span>
            )}
          </div>
        </div>

        {localSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">
                Wire Transfer Successfully Initiated!
              </p>
              <p className="mt-1">
                Wire ID:{" "}
                <span className="font-mono font-semibold">
                  {localSuccess.id}
                </span>{" "}
                | Amount:{" "}
                <span className="font-mono font-semibold">
                  ${localSuccess.amount.toLocaleString()}
                </span>
              </p>
              <p className="mt-1 font-semibold">
                Status:{" "}
                {localSuccess.autoApproved ? (
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    AUTO-APPROVED
                  </span>
                ) : (
                  <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    PENDING CHECKER REVIEW
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              Beneficiary Name *
            </label>
            <input
              type="text"
              name="beneficiaryName"
              required
              value={formData.beneficiaryName}
              onChange={handleChange}
              placeholder="e.g. Acme Industrial Corp"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              Account Number *
            </label>
            <input
              type="text"
              name="accountNumber"
              required
              value={formData.accountNumber}
              onChange={handleChange}
              placeholder="e.g. 1234567890"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              ABA Routing Number *
            </label>
            <input
              type="text"
              name="routingNumber"
              required
              value={formData.routingNumber}
              onChange={handleChange}
              placeholder="e.g. 987654321"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              Transfer Amount (USD) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">
                $
              </span>
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0.01"
                required
                value={formData.amount}
                onChange={handleChange}
                placeholder="15000.00"
                className="w-full pl-7 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Initiating as:{" "}
            <span className="font-semibold text-slate-800">{activeUser}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Submit Wire Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WireInitiationForm;
