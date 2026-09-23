import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  Lock,
  ArrowRight,
} from "lucide-react";

export function SharedTripHeader({ itinerary, onClone }) {
  const navigate = useNavigate();
  const [isCloning, setIsCloning] = useState(false);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: itinerary?.currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleCloneClick = () => {
    setIsCloning(true);
    if (onClone) {
      onClone();
    } else {
      // Navigate to homepage with pre-filled destination/budget or saved copy
      navigate("/", {
        state: {
          cloneData: {
            destination: itinerary?.destination,
            budget: itinerary?.budget,
            currency: itinerary?.currency,
            durationDays: itinerary?.duration_days,
            interests: itinerary?.interests,
          },
        },
      });
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden mb-8">
      {/* Background Decorative Pattern */}
      <div className="absolute -right-12 -top-12 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Shared Banner Pill */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-primary-200 mb-4">
        <Lock className="w-3.5 h-3.5" />
        <span>Shared Trip Itinerary — Read-Only Mode</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary-300 text-sm font-semibold mb-1">
            <MapPin className="w-4 h-4 text-primary-400" />
            <span>{itinerary?.destination || "Custom Destination"}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            {itinerary?.destination
              ? `${itinerary.destination} Itinerary`
              : "Travel Itinerary"}
          </h1>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Calendar className="w-4 h-4 text-primary-300" />
              {itinerary?.duration_days || 1} Days
            </span>

            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Est. Spend:{" "}
              <strong className="text-white">
                {formatMoney(itinerary?.total_estimated_cost)}
              </strong>
            </span>

            {itinerary?.interests && itinerary.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {itinerary.interests.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clone CTA Action */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={handleCloneClick}
            disabled={isCloning}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Clone to My Planner</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SharedTripHeader;
