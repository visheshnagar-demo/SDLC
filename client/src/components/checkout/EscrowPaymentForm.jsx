import React, { useState } from "react";
import { Lock, CreditCard, ShieldCheck, AlertCircle } from "lucide-react";

export const EscrowPaymentForm = ({
  totalAmount,
  isSubmitting,
  onSubmit,
  error,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardDetails, setCardDetails] = useState({
    cardName: "",
    cardNumber: "",
    expDate: "",
    cvv: "",
  });

  const handleChange = (e) => {
    setCardDetails({ ...cardDetails, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ paymentMethod, ...cardDetails });
  };

  return (
    <section className="bg-[#181B22] p-6 rounded-xl border border-[#232733] space-y-5">
      <div className="flex items-center justify-between border-b border-[#232733] pb-3">
        <h2 className="font-serif text-xl font-semibold text-[#F8F9FA] flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#D4AF37]" />
          <span>3. Swiss Escrow Payment Vault</span>
        </h2>
        <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2 py-0.5 rounded">
          256-Bit Encrypted
        </span>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 text-red-200 text-xs p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Payment Method Selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPaymentMethod("card")}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all ${
            paymentMethod === "card"
              ? "border-[#D4AF37] bg-[#12141A] text-[#F2CA50]"
              : "border-[#232733] bg-[#12141A]/50 text-[#9EACB9] hover:border-[#4D4635]"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Credit / Debit Card</span>
        </button>

        <button
          type="button"
          onClick={() => setPaymentMethod("bank_escrow")}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all ${
            paymentMethod === "bank_escrow"
              ? "border-[#D4AF37] bg-[#12141A] text-[#F2CA50]"
              : "border-[#232733] bg-[#12141A]/50 text-[#9EACB9] hover:border-[#4D4635]"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Swiss Bank Wire Escrow</span>
        </button>
      </div>

      {/* Card Input Fields */}
      {paymentMethod === "card" ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#9EACB9] block mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              name="cardName"
              placeholder="e.g. ALEX MERCER"
              value={cardDetails.cardName}
              onChange={handleChange}
              required
              className="w-full bg-[#12141A] border border-[#232733] focus:border-[#D4AF37] rounded-lg p-3 text-sm text-[#F8F9FA] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#9EACB9] block mb-1">
              Card Number
            </label>
            <input
              type="text"
              name="cardNumber"
              placeholder="4111 2222 3333 4444"
              value={cardDetails.cardNumber}
              onChange={handleChange}
              required
              className="w-full bg-[#12141A] border border-[#232733] focus:border-[#D4AF37] rounded-lg p-3 text-sm text-[#F8F9FA] font-mono focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#9EACB9] block mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                name="expDate"
                placeholder="MM / YY"
                value={cardDetails.expDate}
                onChange={handleChange}
                required
                className="w-full bg-[#12141A] border border-[#232733] focus:border-[#D4AF37] rounded-lg p-3 text-sm text-[#F8F9FA] font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#9EACB9] block mb-1">
                CVV / CVC
              </label>
              <input
                type="password"
                name="cvv"
                maxLength="4"
                placeholder="•••"
                value={cardDetails.cvv}
                onChange={handleChange}
                required
                className="w-full bg-[#12141A] border border-[#232733] focus:border-[#D4AF37] rounded-lg p-3 text-sm text-[#F8F9FA] font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#12141A] border border-[#232733] p-4 rounded-lg text-xs space-y-2 text-[#9EACB9]">
          <div className="font-semibold text-[#F8F9FA]">
            Swiss Escrow Wire Instructions:
          </div>
          <div>Bank: Banque Cantonale de Genève (BCGE)</div>
          <div>Account: CH93 0079 0000 1234 5678 9</div>
          <div>Beneficiary: Chrono Certified Escrow Holding S.A.</div>
          <div className="text-[11px] text-[#F2CA50]">
            * Immediate hold guaranteed; order confirmed upon wire receipt.
          </div>
        </div>
      )}

      {/* Escrow Terms Banner */}
      <div className="bg-[#12141A] border border-[#4D4635]/50 p-3 rounded-lg flex items-start gap-2.5 text-xs text-[#9EACB9]">
        <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#F8F9FA]">Atelier Escrow Protection:</strong>{" "}
          Your funds remain secure in escrow and are only released to the seller
          after the timepiece is delivered and the verification PIN is verified.
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-[#D4AF37] hover:bg-[#E5C158] disabled:bg-[#896C00] text-[#0A0B0E] font-bold py-4 rounded-xl text-base uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Lock className="w-4 h-4" />
        <span>
          {isSubmitting
            ? "SECURING ESCROW & ACQUISITION..."
            : `COMPLETE ESCROW ACQUISITION — $${(totalAmount || 0).toLocaleString()} USD`}
        </span>
      </button>
    </section>
  );
};

export default EscrowPaymentForm;
