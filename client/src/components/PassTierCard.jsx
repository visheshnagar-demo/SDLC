import React from "react";
import { Shield, Sparkles, Check, AlertCircle } from "lucide-react";

export const PassTierCard = ({ tier, isSelected, onSelect }) => {
  const isSoldOut = tier.available_quota <= 0;
  const isLimited = tier.available_quota > 0 && tier.available_quota <= 50;
  const quotaPercent = Math.min(
    100,
    Math.round(
      ((tier.total_quota - tier.available_quota) / (tier.total_quota || 1)) *
        100,
    ),
  );

  return (
    <div
      onClick={() => {
        if (!isSoldOut) onSelect(tier);
      }}
      className={`relative rounded-2xl p-6 border transition-all duration-200 ${
        isSoldOut
          ? "bg-[#0F172A]/40 border-slate-800 opacity-60 cursor-not-allowed"
          : isSelected
            ? "bg-gradient-to-b from-[#1E1B4B] to-[#0F172A] border-[#F59E0B] shadow-xl shadow-[#F59E0B]/15 ring-2 ring-[#F59E0B] cursor-pointer"
            : "bg-[#0F172A] hover:bg-[#131D36] border-slate-800 hover:border-slate-700 cursor-pointer"
      }`}
    >
      {/* Badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isSoldOut
              ? "bg-rose-900/30 text-rose-400 border border-rose-800/40"
              : isLimited
                ? "bg-amber-900/30 text-amber-300 border border-amber-700/40"
                : "bg-emerald-900/30 text-emerald-400 border border-emerald-800/40"
          }`}
        >
          {isSoldOut ? (
            <>
              <AlertCircle className="w-3.5 h-3.5" /> Sold Out
            </>
          ) : isLimited ? (
            <>
              <Sparkles className="w-3.5 h-3.5" /> Fast Selling
            </>
          ) : (
            <>
              <Shield className="w-3.5 h-3.5" /> Available
            </>
          )}
        </span>

        {isSelected && (
          <span className="w-6 h-6 rounded-full bg-[#F59E0B] text-slate-950 flex items-center justify-center font-bold text-xs">
            <Check className="w-4 h-4 stroke-[3]" />
          </span>
        )}
      </div>

      {/* Tier Title & Description */}
      <h3 className="font-display font-extrabold text-xl text-slate-100">
        {tier.tier_name}
      </h3>
      <p className="text-xs text-slate-400 mt-1 min-h-[32px]">
        {tier.description ||
          "Access to Garba arenas, DJ nights, and dandiya dance rounds."}
      </p>

      {/* Price */}
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold text-[#F59E0B] font-display">
          ${Number(tier.price).toFixed(2)}
        </span>
        <span className="text-xs text-slate-400 font-medium">/ person</span>
      </div>

      {/* Quota Progress Bar */}
      <div className="mt-5 space-y-1.5">
        <div className="flex justify-between text-[11px] font-medium text-slate-400">
          <span>Capacity Filled</span>
          <span>
            {quotaPercent}% ({tier.available_quota} left)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              quotaPercent > 80
                ? "bg-rose-500"
                : quotaPercent > 50
                  ? "bg-amber-500"
                  : "bg-gradient-to-r from-emerald-500 to-[#F59E0B]"
            }`}
            style={{ width: `${quotaPercent}%` }}
          />
        </div>
      </div>

      {/* Select button */}
      <button
        type="button"
        disabled={isSoldOut}
        className={`w-full mt-6 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
          isSoldOut
            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
            : isSelected
              ? "bg-[#F59E0B] text-slate-950 shadow-md shadow-[#F59E0B]/25"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200"
        }`}
      >
        {isSoldOut ? "Sold Out" : isSelected ? "Selected" : "Select Tier"}
      </button>
    </div>
  );
};

export default PassTierCard;
