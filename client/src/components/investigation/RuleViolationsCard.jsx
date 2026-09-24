import React from "react";
import { AlertOctagon, Zap, Globe, DollarSign } from "lucide-react";

export default function RuleViolationsCard({ violations = [] }) {
  const getRuleIcon = (ruleType) => {
    switch (ruleType) {
      case "AMOUNT_THRESHOLD":
        return <DollarSign className="w-4 h-4 text-red-600" />;
      case "FREQUENCY_VELOCITY":
        return <Zap className="w-4 h-4 text-amber-600" />;
      case "GEOGRAPHIC_VELOCITY":
        return <Globe className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertOctagon className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
        <AlertOctagon className="w-4 h-4 text-red-600" />
        <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
          Triggered Detection Rules ({violations.length})
        </h2>
      </div>

      {violations.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">
          No specific rule violation details recorded for this alert.
        </p>
      ) : (
        <div className="space-y-3">
          {violations.map((violation, index) => {
            const details = violation.violation_details || {};
            return (
              <div
                key={violation.id || index}
                className="p-3.5 bg-red-50/70 border border-red-200 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    {getRuleIcon(violation.rule_type)}
                    <span className="font-bold text-red-950 text-xs sm:text-sm">
                      {violation.rule_name ||
                        violation.rule_type ||
                        "Detection Rule"}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-red-200/80 text-red-900 rounded font-mono uppercase">
                    BREACH DETECTED
                  </span>
                </div>

                {/* Details Breakdown */}
                <div className="text-xs text-red-800 space-y-1 pl-6">
                  {details.message && (
                    <p className="font-medium">{details.message}</p>
                  )}

                  {details.threshold_amount !== undefined && (
                    <p className="text-[11px] text-red-700">
                      Threshold: $
                      {Number(details.threshold_amount).toLocaleString()} |
                      Actual: ${Number(details.actual_amount).toLocaleString()}
                      {details.breach_amount !== undefined && (
                        <span>
                          {" "}
                          (+${Number(
                            details.breach_amount,
                          ).toLocaleString()}{" "}
                          breach)
                        </span>
                      )}
                    </p>
                  )}

                  {details.speed_mph !== undefined && (
                    <p className="text-[11px] text-red-700">
                      Distance:{" "}
                      {Math.round(
                        details.distance_miles || details.distance || 0,
                      )}{" "}
                      miles in{" "}
                      {Math.round((details.time_diff_seconds || 0) / 60)} mins (
                      {Math.round(details.speed_mph)} mph vs{" "}
                      {details.speed_limit_mph || 500} mph limit)
                    </p>
                  )}

                  {details.transaction_count !== undefined && (
                    <p className="text-[11px] text-red-700">
                      Window: {details.window_seconds}s | Count:{" "}
                      {details.transaction_count} txs (Limit:{" "}
                      {details.max_count})
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
