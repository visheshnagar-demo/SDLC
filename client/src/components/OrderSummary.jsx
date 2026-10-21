import React from "react";
import {
  ShieldCheck,
  Receipt,
  Sparkles,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";

export function OrderSummary({
  event,
  tier,
  quantity,
  onConfirmBooking,
  isSubmitting,
  disabled,
}) {
  const unitPrice = tier ? Number(tier.price) : 0;
  const subtotal = unitPrice * quantity;
  const earlyBirdDiscount = subtotal > 100 ? subtotal * 0.1 : 0;
  const processingFee = (subtotal - earlyBirdDiscount) * 0.05;
  const grandTotal = Math.max(0, subtotal - earlyBirdDiscount + processingFee);

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-5">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-rose-500 text-slate-950 rounded-xl font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className='text-lg font-bold text-white font-["Syne"]'>
              Order Summary
            </h2>
            <p className="text-xs text-slate-400">
              Review booking totals & digital pass security.
            </p>
          </div>
        </div>

        {/* Selected Items */}
        <div className="space-y-3 mb-6 text-xs">
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className='font-bold text-white font-["Syne"] text-sm'>
                {event?.title || "Garba Event Night"}
              </span>
              <span className="text-amber-400 font-semibold">
                {tier?.tier_name || "Pass Tier"}
              </span>
            </div>
            <p className="text-slate-400">
              {event?.venue_name || "Grand Arena Complex"}
            </p>
            <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 text-[11px]">
              <span>
                {quantity} x ${unitPrice.toFixed(2)}
              </span>
              <span className="font-mono font-bold">
                ${subtotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Breakdown Calculations */}
          <div className="space-y-2 px-1 text-slate-300">
            <div className="flex justify-between">
              <span>Passes Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>

            {earlyBirdDiscount > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Early Bird Festive Saver
                  (10%)
                </span>
                <span className="font-mono">
                  -${earlyBirdDiscount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-400">
              <span>Service & Municipal Security Tax (5%)</span>
              <span className="font-mono">${processingFee.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="bg-gradient-to-r from-slate-900 to-[#1e1b4b] p-4 rounded-xl border border-[#f59e0b]/30 mb-6">
          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
              Total Payable
            </span>
            <div className="text-right">
              <span className='text-2xl font-extrabold text-[#ffc174] font-["Syne"]'>
                ${grandTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                USD (All taxes included)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        {/* Security Feature Notice */}
        <div className="flex items-center gap-2 mb-4 p-2.5 bg-[#0b1326] rounded-xl border border-amber-500/20 text-[11px] text-amber-200/80">
          <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            Instant issuance with HMAC SHA-256 cryptographically signed QR
            token.
          </span>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={disabled || isSubmitting || !tier}
          onClick={onConfirmBooking}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Issuing Signed Passes...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Confirm & Generate Digital Passes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default OrderSummary;
