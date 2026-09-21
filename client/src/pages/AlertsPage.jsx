import React, { useState, useEffect } from "react";
import { AlertsTable } from "../components/alerts/AlertsTable";
import { fetchAlerts, acknowledgeAlert } from "../services/api";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleAcknowledgeAlert = async (alertId) => {
    await acknowledgeAlert(alertId);
    await loadAlerts();
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Maintenance Tickets & Real-Time Failure Alerts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated notifications for pump operating hours, filter
            replacements, and overflow events.
          </p>
        </div>

        <button
          onClick={loadAlerts}
          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <AlertsTable
        alerts={alerts}
        onAcknowledgeAlert={handleAcknowledgeAlert}
      />
    </div>
  );
}

export default AlertsPage;
