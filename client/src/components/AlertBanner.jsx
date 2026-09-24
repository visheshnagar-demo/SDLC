import React from "react";
import { AlertTriangle, CheckCircle, UserCheck, X } from "lucide-react";

export default function AlertBanner({
  alerts = [],
  onAcknowledge,
  onDispatchConservator,
  onDismiss,
}) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const activeAlert = alerts[0];

  return (
    <div className="bg-red-50 border-l-4 border-red-600 border-y border-r border-red-200 text-red-900 px-5 py-3.5 rounded-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-start space-x-3">
        <div className="p-1.5 bg-red-100 text-red-600 rounded-full mt-0.5 md:mt-0 flex-shrink-0">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xs uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded">
              CRITICAL MICRO-CLIMATE BREACH
            </span>
            <span className="text-xs text-red-700 font-mono">
              {activeAlert.location_name || "Storage Vault A"}
            </span>
          </div>
          <p className="text-sm mt-1 font-medium text-red-950">
            {activeAlert.breach_details ||
              `Relative Humidity ${activeAlert.humidity_percentage || "68.2"}% (Threshold Max ${activeAlert.humidity_max || "55.0"}%) — Temperature ${activeAlert.temperature_celsius || "24.5"}°C. Sensor excursion logged.`}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
        <button
          onClick={() => onAcknowledge && onAcknowledge(activeAlert)}
          className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition-colors flex items-center space-x-1.5 shadow-sm"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Acknowledge Alert</span>
        </button>
        <button
          onClick={() =>
            onDispatchConservator && onDispatchConservator(activeAlert)
          }
          className="px-3 py-1.5 bg-white border border-red-300 text-red-800 text-xs font-semibold rounded hover:bg-red-100 transition-colors flex items-center space-x-1.5 shadow-sm"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Dispatch Conservator</span>
        </button>
        {onDismiss && (
          <button
            onClick={() => onDismiss(activeAlert.id)}
            className="p-1 text-red-400 hover:text-red-700 rounded transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
