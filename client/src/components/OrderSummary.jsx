import React from "react";
import { Receipt, ShieldCheck, Ticket, Sparkles } from "lucide-react";

export const OrderSummary = ({ selectedEvent, selectedTier, quantity = 1 }) => {
  const pricePerPass = selectedTier ? Number(selectedTier.price) : 0;
  const subtotal = pricePerPass * quantity;
  const serviceFee = subtotal > 0 ? Number((subtotal * 0.05).toFixed(2)) : 0; // 5% facility & processing
  const discount = subtotal > 200 ? 15.0 : 0.0; // Early bird / bulk discount
  const total = Math.max(0, subtotal + serviceFee - discount);

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
        <Receipt className="w-5 h-5 text-[#F59E0B]" />
        <h3 className="font-display font-bold text-lg text-slate-100">
          Booking Summary
        </h3>
      </div>

      {/* Selected Items */}
      <div className="space-y-3 text-xs">
        {selectedEvent && (
          <div className="flex justify-between items-start pb-2 border-b border-slate-800/60">
            <div>
              <span className="text-slate-400 block">Event</span>
              <span className="font-semibold text-slate-200">
                {selectedEvent.title}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {selectedEvent.venue_name}
            </span>
          </div>
        )}

        {selectedTier ? (
          <div className="flex justify-between items-start pb-2 border-b border-slate-800/60">
            <div>
              <span className="text-slate-400 block">Pass Category</span>
              <span className="font-semibold text-[#F59E0B] flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" />
                {selectedTier.tier_name}
              </span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-200">
                ${pricePerPass.toFixed(2)} × {quantity}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 italic">
            Please select a pass category above.
          </p>
        )}

        {/* Breakdown */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-slate-400">
            <span>
              Subtotal ({quantity} pass{quantity > 1 ? "es" : ""})
            </span>
            <span className="text-slate-200">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Venue Facility & Booking Fee</span>
            <span className="text-slate-200">${serviceFee.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-400 font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Bulk Pass Savings
              </span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Total Amount */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block">Total Payable</span>
          <span className="text-2xl font-extrabold font-display text-[#F59E0B]">
            ${total.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Instant HMAC QR</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
