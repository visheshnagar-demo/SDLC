import React from "react";
import { Calendar, Clock, DollarSign, Sparkles, Check } from "lucide-react";

export default function PoojaCatalog({
  poojas = [],
  selectedPooja,
  onSelectPooja,
}) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-orange-200 overflow-hidden">
      <div className="p-4 bg-amber-50 border-b border-orange-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-orange-700" />
          <h2 className="text-lg font-serif font-bold text-orange-950">
            Pooja & Seva Catalog
          </h2>
        </div>
        <span className="text-xs text-orange-700 font-medium">
          Select a Seva to view slots
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {poojas.map((pooja) => {
          const isSelected =
            selectedPooja?.id === pooja.id ||
            selectedPooja?.code === pooja.code;
          return (
            <div
              key={pooja.id || pooja.code}
              onClick={() => onSelectPooja(pooja)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? "border-orange-600 bg-orange-50/80 shadow-md ring-2 ring-orange-400"
                  : "border-orange-200 bg-amber-50/30 hover:border-orange-400 hover:bg-amber-50"
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 bg-orange-600 text-white rounded-full p-1 shadow">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-mono font-bold text-orange-700 px-2 py-0.5 bg-orange-100 rounded">
                    {pooja.code || "POOJA-01"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-orange-950 font-serif mb-2">
                  {pooja.name}
                </h3>
                <p className="text-xs text-orange-800/80 line-clamp-2 mb-3">
                  {pooja.description ||
                    "Sacred temple ritual performed by head priest with sankalpa mantras."}
                </p>
              </div>

              <div className="border-t border-orange-200/60 pt-3 flex items-center justify-between text-xs text-orange-900">
                <div className="flex items-center font-bold text-sm text-orange-800">
                  ₹{pooja.default_price || pooja.price || 251}
                </div>
                <div className="flex items-center text-orange-700">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {pooja.duration_minutes || 45} mins
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
