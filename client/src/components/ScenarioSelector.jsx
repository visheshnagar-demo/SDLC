import React from "react";
import PropTypes from "prop-types";
import { TrendingUp, Sparkles, Check } from "lucide-react";

export default function ScenarioSelector({
  scenarios,
  selectedScenarioCode,
  onSelectScenario,
  loading,
  error,
}) {
  if (loading) {
    return (
      <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-2 animate-pulse"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-lg p-4 h-40 animate-pulse bg-slate-50"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>Assortment Strategy Scenarios</span>
          <Sparkles className="w-4 h-4 text-[#E5B800]" />
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Select an optimization scenario to model projected sales and space
        impact
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded mb-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenarios.map((scenario) => {
          const isSelected = scenario.code === selectedScenarioCode;
          const skuActions = scenario.sku_actions_summary || {};

          return (
            <div
              key={scenario.code}
              onClick={() => onSelectScenario(scenario.code)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSelectScenario(scenario.code);
                }
              }}
              className={`rounded-lg p-3.5 cursor-pointer transition-all relative flex flex-col justify-between ${
                isSelected
                  ? "border-2 border-[#E5B800] bg-amber-50/40 shadow-sm ring-1 ring-[#E5B800]/20"
                  : "border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              {isSelected && (
                <span className="absolute -top-2.5 right-3 bg-[#E5B800] text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Check className="w-2.5 h-2.5" />
                  {scenario.is_default ? "Recommended & Active" : "Active"}
                </span>
              )}

              <div>
                <div className="text-sm font-bold text-slate-950 flex items-center justify-between">
                  <span>{scenario.title}</span>
                  {scenario.code === "BALANCED" && !isSelected && (
                    <span className="text-[9px] bg-slate-200 text-slate-700 font-semibold px-1.5 py-0.5 rounded">
                      Rec
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 mt-1 mb-3">
                  {scenario.description}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />+
                  {Number(scenario.projected_sales_growth_pct).toFixed(1)}%
                  Sales Growth
                </div>
                <div className="text-xs text-slate-700 font-medium mt-0.5">
                  {Number(scenario.projected_private_brand_share_pct).toFixed(
                    1,
                  )}
                  % Private Brand Share
                </div>
                <div className="text-[10px] text-slate-500 mt-2 font-medium border-t border-slate-200/60 pt-1.5 flex flex-wrap gap-1">
                  {skuActions.SWAP !== undefined && (
                    <span>{skuActions.SWAP} Swaps</span>
                  )}
                  {skuActions.REDUCE !== undefined && (
                    <span>• {skuActions.REDUCE} Reduces</span>
                  )}
                  {skuActions.GROW !== undefined && (
                    <span>• {skuActions.GROW} Grows</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

ScenarioSelector.propTypes = {
  scenarios: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      projected_sales_growth_pct: PropTypes.number.isRequired,
      projected_private_brand_share_pct: PropTypes.number.isRequired,
      shelf_space_impact_pct: PropTypes.number.isRequired,
      is_default: PropTypes.bool,
      sku_actions_summary: PropTypes.object,
    }),
  ).isRequired,
  selectedScenarioCode: PropTypes.string.isRequired,
  onSelectScenario: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
};
