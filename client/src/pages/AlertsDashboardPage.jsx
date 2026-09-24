import React, { useState, useEffect, useCallback } from "react";
import KpiMetricGroup from "../components/alerts/KpiMetricGroup";
import AlertFilterToolbar from "../components/alerts/AlertFilterToolbar";
import AlertsTable from "../components/alerts/AlertsTable";
import { getAlerts, evaluateTransaction } from "../services/api";
import { PlusCircle, X, Check, AlertCircle } from "lucide-react";

export default function AlertsDashboardPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txForm, setTxForm] = useState({
    account_id: "ACC-982341",
    amount: "15000",
    currency: "USD",
    merchant: "Vanguard Global Wire",
    location_name: "New York, NY",
    latitude: "40.7128",
    longitude: "-74.0060",
  });
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulationError, setSimulationError] = useState("");

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAlerts({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
      });
      setAlerts(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleSimulateTransaction = async (e) => {
    e.preventDefault();
    setSimulating(true);
    setSimulationError("");
    setSimulationResult(null);

    try {
      const payload = {
        account_id: txForm.account_id,
        amount: parseFloat(txForm.amount),
        currency: txForm.currency,
        merchant: txForm.merchant,
        location_name: txForm.location_name,
        latitude: parseFloat(txForm.latitude),
        longitude: parseFloat(txForm.longitude),
        timestamp: new Date().toISOString(),
      };

      const result = await evaluateTransaction(payload);
      setSimulationResult(result);
      fetchAlerts();
    } catch (err) {
      setSimulationError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to evaluate transaction",
      );
    } finally {
      setSimulating(false);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const tx = alert.transaction || {};
    const matchesSearch =
      !searchTerm ||
      (alert.id && alert.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (alert.account_id &&
        alert.account_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.account_id &&
        tx.account_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.merchant &&
        tx.merchant.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = !statusFilter || alert.status === statusFilter;
    const matchesSeverity =
      !severityFilter || alert.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Transaction Monitoring &amp; Alert Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time automated fraud detection and compliance triage for
            flagged banking transactions.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchAlerts}
            className="text-xs font-semibold underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Metrics */}
      <KpiMetricGroup alerts={alerts} loading={loading} />

      {/* Alert Data Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <AlertFilterToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          severityFilter={severityFilter}
          onSeverityChange={setSeverityFilter}
          onRefresh={fetchAlerts}
          onOpenEvaluateModal={() => setIsModalOpen(true)}
          loading={loading}
        />

        <AlertsTable alerts={filteredAlerts} loading={loading} />
      </div>

      {/* Simulation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-base">
                  Simulate Live Transaction
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateTransaction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account ID
                  </label>
                  <input
                    type="text"
                    required
                    value={txForm.account_id}
                    onChange={(e) =>
                      setTxForm({ ...txForm, account_id: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={txForm.amount}
                    onChange={(e) =>
                      setTxForm({ ...txForm, amount: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Merchant / Destination
                </label>
                <input
                  type="text"
                  required
                  value={txForm.merchant}
                  onChange={(e) =>
                    setTxForm({ ...txForm, merchant: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location Name
                  </label>
                  <input
                    type="text"
                    required
                    value={txForm.location_name}
                    onChange={(e) =>
                      setTxForm({ ...txForm, location_name: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={txForm.latitude}
                    onChange={(e) =>
                      setTxForm({ ...txForm, latitude: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={txForm.longitude}
                    onChange={(e) =>
                      setTxForm({ ...txForm, longitude: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {simulationError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{simulationError}</span>
                </div>
              )}

              {simulationResult && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                    <Check className="w-4 h-4" />
                    <span>Transaction Evaluated!</span>
                  </div>
                  <p>
                    <span className="font-semibold">Result:</span>{" "}
                    {simulationResult.is_suspicious
                      ? "⚠️ Suspicious (Alert Generated)"
                      : "✅ Clean"}
                  </p>
                  {simulationResult.alert_id && (
                    <p className="font-mono text-[11px] text-blue-700">
                      Alert ID: {simulationResult.alert_id} (Score:{" "}
                      {simulationResult.risk_score})
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={simulating}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {simulating ? "Evaluating..." : "Send &amp; Evaluate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
