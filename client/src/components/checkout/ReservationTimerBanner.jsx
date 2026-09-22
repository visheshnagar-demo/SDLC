import React from "react";
import { Clock, ShieldAlert } from "lucide-react";
import { useCart } from "../../context/CartContext";

export const ReservationTimerBanner = () => {
  const { hasActiveHold, formattedTimeRemaining, secondsRemaining } = useCart();

  if (!hasActiveHold) {
    return (
      <div className="bg-[#181B22] border-b border-[#232733] px-6 py-2.5 text-center text-xs text-[#9EACB9] flex items-center justify-center gap-2">
        <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
        <span>
          Timepieces in vault are unique 1-of-1 pieces. An active 15-minute lock
          secures the item during checkout.
        </span>
      </div>
    );
  }

  const isLowTime = secondsRemaining < 180; // Less than 3 minutes

  return (
    <div
      className={`border-b px-6 py-3 text-center text-sm font-semibold flex items-center justify-center gap-3 transition-colors ${
        isLowTime
          ? "bg-red-950/50 border-red-500/80 text-red-200 animate-pulse"
          : "bg-[#896C00]/30 border-[#D4AF37] text-[#F8F9FA]"
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          isLowTime ? "bg-red-400" : "bg-[#F2CA50]"
        } animate-ping`}
      />
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <Clock className="w-4 h-4 text-[#F2CA50]" />
        <span>
          VAULT INVENTORY CONCURRENCY HOLD ACTIVE —{" "}
          <strong className="font-mono text-[#F2CA50] text-base font-bold underline">
            {formattedTimeRemaining}
          </strong>{" "}
          minutes remaining. Reserved exclusively for you.
        </span>
      </div>
    </div>
  );
};

export default ReservationTimerBanner;
