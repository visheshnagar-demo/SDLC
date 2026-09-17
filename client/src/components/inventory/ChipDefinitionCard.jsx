import React from "react";
import { Coins, Tag, PlusCircle } from "lucide-react";

export const ChipDefinitionCard = ({ chip, onAddBatch }) => {
  const total = chip.total_quantity || 100000;
  const available = chip.available_quantity || 80000;
  const allocated = chip.allocated_quantity || 20000;
  const percentAvailable = Math.round((available / total) * 100) || 0;

  return (
    <div className="bg-slate-800/90 rounded-xl border border-slate-700/80 p-5 shadow-lg flex flex-col justify-between hover:border-cyan-500/50 transition-all">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{chip.name}</h3>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400">
                <Tag className="w-3 h-3" />
                {chip.category || "STANDARD"}
              </span>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              chip.status === "Active"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            {chip.status || "Active"}
          </span>
        </div>

        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 my-4 space-y-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Face Value:</span>
            <span className="font-mono font-bold text-emerald-400">
              ${Number(chip.face_value || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-300">
            <span>Available Stock:</span>
            <span className="font-mono font-bold text-white">
              {available.toLocaleString()} / {total.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                percentAvailable < 20 ? "bg-amber-500" : "bg-cyan-500"
              }`}
              style={{ width: `${percentAvailable}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={() => onAddBatch && onAddBatch(chip)}
          className="w-full py-2 bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-600/50 transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-cyan-400" />
          Add Inventory Batch
        </button>
      </div>
    </div>
  );
};

export default ChipDefinitionCard;
