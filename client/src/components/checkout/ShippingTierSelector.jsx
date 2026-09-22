import React from "react";
import { Truck, Check } from "lucide-react";

export const ShippingTierSelector = ({ selectedTier, onSelectTier }) => {
  const tiers = [
    {
      id: "ferrari_express",
      name: "Ferrari Group Armored Express (24-48h)",
      subtitle:
        "Dual-officer armed hand-delivery & 100% Lloyd's of London transit insurance",
      price: 150.0,
      priceLabel: "$150.00",
      badge: "Fastest & Fully Armored",
    },
    {
      id: "malca_amit_priority",
      name: "Malca-Amit Priority Secure (2-3 days)",
      subtitle:
        "Tamper-evident Geneva vault seal box, armored vehicle, & biometric ID verification",
      price: 0.0,
      priceLabel: "Included",
      badge: "Vault Standard",
    },
  ];

  return (
    <section className="bg-[#181B22] p-6 rounded-xl border border-[#232733] space-y-4">
      <div className="flex items-center justify-between border-b border-[#232733] pb-3">
        <h2 className="font-serif text-xl font-semibold text-[#F8F9FA] flex items-center gap-2">
          <Truck className="w-5 h-5 text-[#D4AF37]" />
          <span>2. Insured Armored Courier</span>
        </h2>
        <span className="text-xs text-[#9EACB9] font-mono">
          100% Full Value Coverage
        </span>
      </div>

      <div className="space-y-3">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.id;
          return (
            <label
              key={tier.id}
              onClick={() => onSelectTier(tier.id, tier.price)}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? "border-[#D4AF37] bg-[#12141A] shadow-md shadow-[#D4AF37]/10 ring-1 ring-[#D4AF37]"
                  : "border-[#232733] bg-[#12141A]/50 hover:border-[#4D4635]"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <input
                  type="radio"
                  name="shippingTier"
                  checked={isSelected}
                  onChange={() => onSelectTier(tier.id, tier.price)}
                  className="mt-1 accent-[#D4AF37] w-4 h-4 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#F8F9FA]">
                      {tier.name}
                    </span>
                    <span className="bg-[#1F1F23] text-[#F2CA50] text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-[#4D4635]">
                      {tier.badge}
                    </span>
                  </div>
                  <div className="text-xs text-[#9EACB9] leading-relaxed">
                    {tier.subtitle}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 pl-3">
                <div
                  className={`text-sm font-bold font-mono ${
                    tier.price > 0 ? "text-[#F2CA50]" : "text-[#9EACB9]"
                  }`}
                >
                  {tier.priceLabel}
                </div>
                {isSelected && (
                  <span className="text-[10px] text-[#D4AF37] flex items-center justify-end gap-0.5 mt-0.5">
                    <Check className="w-3 h-3" /> Selected
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
};

export default ShippingTierSelector;
