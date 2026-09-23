import React from "react";
import { Navigation, Footprints, Train, Car } from "lucide-react";

export function TransitStepConnector({
  durationMinutes = 15,
  transitMode = "transit",
  toLocation = "",
}) {
  const getIcon = () => {
    switch (transitMode?.toLowerCase()) {
      case "walk":
      case "walking":
        return <Footprints className="w-3.5 h-3.5 text-emerald-600" />;
      case "drive":
      case "taxi":
        return <Car className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Train className="w-3.5 h-3.5 text-primary-600" />;
    }
  };

  return (
    <div className="py-2.5 px-6 my-1 flex items-center gap-3">
      <div className="flex flex-col items-center">
        <div className="w-0.5 h-3 bg-slate-200" />
        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center shadow-xs">
          {getIcon()}
        </div>
        <div className="w-0.5 h-3 bg-slate-200" />
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200">
        <Navigation className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-slate-700">
          ~{durationMinutes} min transfer
        </span>
        {toLocation && (
          <span className="hidden sm:inline text-slate-400">
            • heading to {toLocation}
          </span>
        )}
      </div>
    </div>
  );
}

export default TransitStepConnector;
