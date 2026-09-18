import React, { useState } from "react";
import {
  Heart,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  FileText,
} from "lucide-react";

export default function DonationForm({ onSubmit, isSubmitting }) {
  const [fundType, setFundType] = useState("E_HUNDI");
  const [amount, setAmount] = useState("501");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isTaxExempt, setIsTaxExempt] = useState(true);
  const [panNumber, setPanNumber] = useState("ABCDE1234F");
  const [donorName, setDonorName] = useState("Devotee Donor");
  const [phone, setPhone] = useState("9876543210");

  const presetAmounts = ["101", "251", "501", "1008", "2100", "5001"];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      fund_type: fundType,
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      is_tax_exempt: isTaxExempt,
      tax_80g_ref: isTaxExempt ? panNumber : null,
      donor_name: donorName,
      phone: phone,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-orange-200 overflow-hidden max-w-xl mx-auto">
      <div className="p-5 bg-gradient-to-r from-orange-800 to-rose-900 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-300 fill-rose-300" />
            e-Hundi & Sacred Offering Portal
          </h2>
          <p className="text-xs text-rose-200 mt-0.5">
            Support temple maintenance, Annadanam, and Corpus Fund
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-orange-950 uppercase tracking-wider mb-2">
            Select Offering Fund
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                id: "E_HUNDI",
                name: "General e-Hundi",
                desc: "Temple Daily Operations",
              },
              {
                id: "ANNADANAM",
                name: "Annadanam Seva",
                desc: "Free Prasad Feeding",
              },
              { id: "CORPUS", name: "Corpus Fund", desc: "Temple Renovation" },
            ].map((fund) => (
              <button
                key={fund.id}
                type="button"
                onClick={() => setFundType(fund.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  fundType === fund.id
                    ? "border-orange-600 bg-orange-50 font-bold text-orange-900 ring-2 ring-orange-400"
                    : "border-orange-200 bg-amber-50/30 text-orange-800 hover:bg-amber-50"
                }`}
              >
                <div className="text-sm font-semibold">{fund.name}</div>
                <div className="text-[10px] text-orange-600 font-normal mt-0.5">
                  {fund.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-orange-950 uppercase tracking-wider mb-2">
            Offering Amount (₹)
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  amount === amt
                    ? "bg-orange-700 text-white shadow"
                    : "bg-orange-100 text-orange-900 hover:bg-orange-200"
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg font-bold text-orange-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Enter custom amount"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-orange-950 uppercase tracking-wider mb-1">
              Donor Name
            </label>
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-orange-950 uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
        </div>

        <div className="bg-amber-50 p-3.5 rounded-lg border border-orange-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-950 flex items-center">
              <FileText className="w-4 h-4 mr-1 text-orange-700" />
              Claim 80G Tax Exemption Receipt
            </span>
            <input
              type="checkbox"
              checked={isTaxExempt}
              onChange={(e) => setIsTaxExempt(e.target.checked)}
              className="h-4 w-4 text-orange-600 rounded border-orange-300 focus:ring-orange-500"
            />
          </div>

          {isTaxExempt && (
            <div>
              <label className="block text-[11px] font-semibold text-orange-900 mb-1">
                PAN Card Number (Required for 80G Form 10BE)
              </label>
              <input
                type="text"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-orange-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                required={isTaxExempt}
              />
            </div>
          )}
        </div>

        <div className="border-t border-orange-200 pt-4 flex items-center justify-between">
          <div className="flex items-center text-xs text-green-700 font-semibold">
            <ShieldCheck className="w-4 h-4 mr-1" /> Secure Instant Gateway
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-6 py-2.5 bg-rose-800 hover:bg-rose-900 text-white font-bold rounded-lg text-sm shadow transition-colors disabled:opacity-50"
          >
            <QrCode className="w-4 h-4 mr-2" />
            {isSubmitting ? "Processing..." : `Donate ₹${amount || 0}`}
          </button>
        </div>
      </form>
    </div>
  );
}
