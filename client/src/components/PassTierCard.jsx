import React from "react";
import {
  ShieldCheck,
  Zap,
  Crown,
  Users,
  Check,
  AlertCircle,
} from "lucide-react";

export function PassTierCard({ tier, isSelected, onSelect }) {
  const isSoldOut = tier.available_quota <= 0;
  const isLimited = tier.available_quota > 0 && tier.available_quota <= 50;
  const quotaPercent =
    tier.total_quota > 0
      ? Math.min(
          100,
          Math.round(
            ((tier.total_quota - tier.available_quota) / tier.total_quota) *
              100,
          ),
        )
      : 0;

  const getTierIcon = (name) => {
    const lower = (name || "").toLowerCase();
    if (lower.includes("vip") || lower.includes("stage")) return Crown;
    if (lower.includes("season")) return Zap;
    if (lower.includes("group")) return Users;
    return ShieldCheck;
  };

  const Icon = getTierIcon(tier.tier_name);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!isSoldOut) onSelect(tier.id);
      }}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isSoldOut) {
          e.preventDefault();
          onSelect(tier.id);
        }
      }}
      className={`relative rounded-2xl p-6 text-left transition-all border flex flex-col justify-between ${
        isSoldOut
          ? "bg-slate-900/40 border-slate-800 opacity-60 cursor-not-allowed"
          : isSelected
            ? "bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] border-[#f59e0b] ring-2 ring-[#f59e0b]/40 shadow-xl shadow-amber-500/10 cursor-pointer"
            : "bg-[#0f172a]/90 hover:bg-[#0f172a] border-slate-800 hover:border-slate-700 cursor-pointer"
      }`}
    >
      {/* Badges */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl ${isSelected ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-300"}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <span className='font-["Syne"] font-bold text-lg text-slate-100'>
            {tier.tier_name}
          </span>
        </div>

        {isSoldOut ? (
          <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Sold Out
          </span>
        ) : isLimited ? (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse">
            Only {tier.available_quota} Left
          </span>
        ) : (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
            Available
          </span>
        )}
      </div>

      {/* Pricing */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className='text-3xl font-extrabold text-white font-["Syne"]'>
            ${Number(tier.price).toFixed(2)}
          </span>
          <span className="text-xs text-slate-400">/ attendee</span>
        </div>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
          {tier.description ||
            "Includes entry to arena, dandiya stick pair, and encrypted digital gate QR code."}
        </p>
      </div>

      {/* Quota Progress */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Capacity Quota</span>
          <span className="font-mono font-medium text-slate-300">
            {tier.available_quota} / {tier.total_quota} left
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              quotaPercent > 80
                ? "bg-rose-500"
                : quotaPercent > 50
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`}
            style={{ width: `${quotaPercent}%` }}
          />
        </div>
      </div>

      {/* Perks / Benefits list */}
      <ul className="space-y-2 mb-6 text-xs text-slate-300">
        {(
          tier.features || [
            "High-speed FastTrack Gate Entry",
            "HMAC SHA-256 Digital QR Pass",
            "Access to Live Musical Performances",
          ]
        ).map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Action button */}
      <button
        type="button"
        disabled={isSoldOut}
        onClick={(e) => {
          e.stopPropagation();
          if (!isSoldOut) onSelect(tier.id);
        }}
        className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
          isSoldOut
            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
            : isSelected
              ? "bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white"
        }`}
      >
        {isSoldOut
          ? "Sold Out"
          : isSelected
            ? "Selected Pass Tier"
            : "Select This Tier"}
      </button>
    </div>
  );
}

export default PassTierCard;
