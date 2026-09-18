import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Key,
  Lock,
  Eye,
} from "lucide-react";

export default function VaultCard({ preciousAssets = [] }) {
  const defaultAssets = [
    {
      name: "Kireetam (Gold Crown - 1.2kg)",
      weight: "1,200g Gold",
      custodian: "Head Priest & Trustee",
      verified: true,
    },
    {
      name: "Silver Kavacham (Armor Set)",
      weight: "12.5kg Silver",
      custodian: "Chief Custodian",
      verified: true,
    },
    {
      name: "Gold Modak Offerings (Set of 21)",
      weight: "350g Gold",
      custodian: "Treasurer",
      verified: true,
    },
    {
      name: "Nagabharana Ornament",
      weight: "850g Gold",
      custodian: "Head Priest",
      verified: true,
    },
  ];

  const assetsToDisplay =
    preciousAssets.length > 0 ? preciousAssets : defaultAssets;

  return (
    <div className="bg-gradient-to-br from-amber-900 via-orange-900 to-amber-950 text-amber-50 rounded-xl shadow-xl border-2 border-amber-500/50 p-5">
      <div className="flex items-center justify-between border-b border-amber-600/50 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-amber-100 flex items-center">
              Precious Vault & Sacred Ornaments
              <Sparkles className="w-4 h-4 ml-1.5 text-amber-400" />
            </h3>
            <p className="text-xs text-amber-300/80">
              Dual-custodian verified asset audit ledger
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-orange-950">
            <Key className="w-3 h-3 mr-1" /> Dual Key Lock
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {assetsToDisplay.map((asset, idx) => (
          <div
            key={idx}
            className="bg-orange-950/60 p-3 rounded-lg border border-amber-600/30 flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-xs text-amber-100">
                {asset.name || asset.item_name}
              </div>
              <div className="text-[11px] text-amber-300/90 font-mono mt-0.5">
                {asset.weight || `${asset.current_stock || 1} units`}
              </div>
              <div className="text-[10px] text-amber-400/70 mt-1 flex items-center">
                <Eye className="w-3 h-3 mr-1" /> Custodian:{" "}
                {asset.custodian || "Head Priest"}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-900/80 text-green-300 border border-green-600/50">
                <ShieldCheck className="w-3 h-3 mr-1" /> Verified
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
