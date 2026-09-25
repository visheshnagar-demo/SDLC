import React from "react";
import { Layers, Droplets, Plus } from "lucide-react";

export default function TankSelector({
  tanks = [],
  selectedTankId = "",
  onSelectTank,
  onAddNewTank,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#141c27] border border-[#1e2e45]">
      <div className="flex items-center gap-2 text-xs font-mono text-[#bac9cc] mr-2">
        <Layers className="w-4 h-4 text-[#00e5ff]" />
        <span>Aquarium Tank:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 flex-1">
        {tanks.map((tank) => {
          const isSelected = tank.id === selectedTankId;
          return (
            <button
              key={tank.id}
              type="button"
              onClick={() => onSelectTank && onSelectTank(tank.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                isSelected
                  ? "bg-[#00e5ff] text-[#070c13] font-bold shadow-md shadow-[#00e5ff]/20"
                  : "bg-[#0c141f] text-[#bac9cc] hover:text-[#dbe3f3] hover:bg-[#1e2e45] border border-[#1e2e45]"
              }`}
            >
              <Droplets
                className={`w-3.5 h-3.5 ${isSelected ? "text-[#070c13]" : "text-[#00e5ff]"}`}
              />
              <span>{tank.name}</span>
              {tank.capacity_liters && (
                <span
                  className={`text-[10px] ${isSelected ? "text-[#070c13]/80" : "text-[#8899a6]"}`}
                >
                  ({tank.capacity_liters}L)
                </span>
              )}
            </button>
          );
        })}

        {tanks.length === 0 && (
          <span className="text-xs font-mono text-[#8899a6] italic">
            No tanks registered
          </span>
        )}
      </div>

      {onAddNewTank && (
        <button
          type="button"
          onClick={onAddNewTank}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1e2e45] hover:bg-[#1e2e45]/80 text-[#00e5ff] text-xs font-mono border border-[#00e5ff]/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Tank</span>
        </button>
      )}
    </div>
  );
}
