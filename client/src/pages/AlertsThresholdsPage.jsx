import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Bell,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Check,
} from "lucide-react";
import {
  getAlerts,
  getThresholds,
  getTanks,
  updateAlertStatus,
} from "../services/api";
import ThresholdTable from "../components/alerts/ThresholdTable";
import ThresholdEditDrawer from "../components/alerts/ThresholdEditDrawer";

export default function AlertsThresholdsPage() {
  const context = useOutletContext();
  const refreshAlertsContext = context?.refreshAlerts;

  const [tanks, setTanks] = useState([]);
  const [selectedTankId, setSelectedTankId] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedThreshold, setSelectedThreshold] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [tankList, alertList, thresholdList] = await Promise.all([
        getTanks(),
        getAlerts(selectedTankId ? { tank_id: selectedTankId } : {}),
        getThresholds(selectedTankId ? { tank_id: selectedTankId } : {}),
      ]);
      setTanks(Array.isArray(tankList) ? tankList : []);
      setAlerts(Array.isArray(alertList) ? alertList : []);
      setThresholds(Array.isArray(thresholdList) ? thresholdList : []);

      if (Array.isArray(tankList) && tankList.length > 0 && !selectedTankId) {
        setSelectedTankId(tankList[0].id);
      }
    } catch {
      setError("Failed to retrieve alert and threshold data.");
    }
  }, [selectedTankId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (alertId, newStatus) => {
    setIsActionLoading(alertId);
    try {
      await updateAlertStatus(alertId, newStatus);
      await loadData();
      if (refreshAlertsContext) refreshAlertsContext();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          `Failed to update alert status to ${newStatus}`,
      );
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleOpenEdit = (threshold) => {
    setSelectedThreshold(threshold);
    setIsDrawerOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedThreshold(null);
    setIsDrawerOpen(true);
  };

  const handleDrawerSaved = () => {
    loadData();
  };

  // Stats calculation
  const criticalCount = alerts.filter(
    (a) =>
      a.severity?.toUpperCase() === "CRITICAL" &&
      a.status?.toUpperCase() === "ACTIVE",
  ).length;
  const warningCount = alerts.filter(
    (a) =>
      a.severity?.toUpperCase() === "WARNING" &&
      a.status?.toUpperCase() === "ACTIVE",
  ).length;
  const acknowledgedCount = alerts.filter(
    (a) => a.status?.toUpperCase() === "ACKNOWLEDGED",
  ).length;
  const resolvedCount = alerts.filter(
    (a) => a.status?.toUpperCase() === "RESOLVED",
  ).length;

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter === "ALL") return true;
    return a.status?.toUpperCase() === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1e2e45]">
        <div>
          <h1 className="text-2xl font-bold font-mono text-[#00e5ff] tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#00e5ff]" />
            <span>Threshold Safety & Alert Center</span>
          </h1>
          <p className="text-xs text-[#bac9cc] font-mono mt-1">
            Establish parameter boundary triggers and triage automated water
            quality alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-[#bac9cc]">
            Filter Tank:
          </label>
          <select
            value={selectedTankId}
            onChange={(e) => setSelectedTankId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#141c27] border border-[#1e2e45] text-[#dbe3f3] text-xs font-mono focus:border-[#00e5ff] focus:outline-none"
          >
            <option value="">All Monitored Tanks</option>
            {tanks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#4c0519]/50 border border-[#fb7185] text-[#fb7185] text-xs font-mono">
          {error}
        </div>
      )}

      {/* 4 Summary Cards (from Figma Screen 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-xl bg-[#4c0519]/30 border border-[#fb7185]/40 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#fb7185] uppercase">
              CRITICAL ALERTS
            </div>
            <div className="text-3xl font-bold text-[#ffb4ab] mt-1">
              {criticalCount}
            </div>
          </div>
          <AlertOctagon className="w-8 h-8 text-[#fb7185]/60" />
        </div>

        <div className="p-4 rounded-xl bg-[#451a03]/30 border border-[#fbbf24]/40 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#fbbf24] uppercase">WARNINGS</div>
            <div className="text-3xl font-bold text-[#fbbf24] mt-1">
              {warningCount}
            </div>
          </div>
          <AlertTriangle className="w-8 h-8 text-[#fbbf24]/60" />
        </div>

        <div className="p-4 rounded-xl bg-[#0c4a6e]/30 border border-[#38bdf8]/40 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#38bdf8] uppercase">ACKNOWLEDGED</div>
            <div className="text-3xl font-bold text-[#c3f5ff] mt-1">
              {acknowledgedCount}
            </div>
          </div>
          <Clock className="w-8 h-8 text-[#38bdf8]/60" />
        </div>

        <div className="p-4 rounded-xl bg-[#064e3b]/30 border border-[#34d399]/40 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#34d399] uppercase">RESOLVED</div>
            <div className="text-3xl font-bold text-[#68dba9] mt-1">
              {resolvedCount}
            </div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-[#34d399]/60" />
        </div>
      </div>

      {/* Incident Triage Queue */}
      <div className="p-6 rounded-xl bg-[#141c27] border border-[#1e2e45] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00e5ff]" />
            <h2 className="text-base font-bold font-mono text-[#00e5ff]">
              Live Incident Triage Queue
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0c141f] p-1 rounded-lg border border-[#1e2e45] text-xs font-mono">
            {["ALL", "ACTIVE", "ACKNOWLEDGED", "RESOLVED"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded transition-colors ${
                  statusFilter === status
                    ? "bg-[#1e2e45] text-[#00e5ff] font-bold"
                    : "text-[#bac9cc] hover:text-[#dbe3f3]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1e2e45] text-[#8899a6] uppercase tracking-wider">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Parameter</th>
                <th className="py-3 px-4">Trigger Value</th>
                <th className="py-3 px-4">Message</th>
                <th className="py-3 px-4">Triggered At</th>
                <th className="py-3 px-4 text-right">Triage Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2e45]/50 text-[#dbe3f3]">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#bac9cc]">
                    No incident alerts in current filter state.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => {
                  const isCritical =
                    alert.severity?.toUpperCase() === "CRITICAL";
                  const isResolved = alert.status?.toUpperCase() === "RESOLVED";
                  const isAcknowledged =
                    alert.status?.toUpperCase() === "ACKNOWLEDGED";

                  return (
                    <tr
                      key={alert.id}
                      className="hover:bg-[#1e2e45]/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isCritical
                              ? "bg-[#4c0519] text-[#fb7185] border-[#fb7185]/40"
                              : "bg-[#451a03] text-[#fbbf24] border-[#fbbf24]/40"
                          }`}
                        >
                          {alert.severity || "WARNING"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#c3f5ff]">
                        {alert.parameter_name}
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        {alert.recorded_value !== undefined
                          ? alert.recorded_value
                          : "—"}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-[#bac9cc]">
                        {alert.message ||
                          `${alert.parameter_name} breach: limit exceeded`}
                      </td>
                      <td className="py-3.5 px-4 text-[#8899a6]">
                        {alert.triggered_at
                          ? new Date(alert.triggered_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Recent"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {!isAcknowledged && !isResolved && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStatus(alert.id, "ACKNOWLEDGED")
                              }
                              disabled={isActionLoading === alert.id}
                              className="px-2.5 py-1 rounded bg-[#0c4a6e]/80 hover:bg-[#0c4a6e] text-[#38bdf8] border border-[#38bdf8]/40 transition-colors disabled:opacity-50"
                            >
                              Ack
                            </button>
                          )}
                          {!isResolved && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStatus(alert.id, "RESOLVED")
                              }
                              disabled={isActionLoading === alert.id}
                              className="px-2.5 py-1 rounded bg-[#064e3b]/80 hover:bg-[#064e3b] text-[#34d399] border border-[#34d399]/40 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Resolve</span>
                            </button>
                          )}
                          {isResolved && (
                            <span className="text-xs text-[#34d399] font-medium">
                              Closed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Threshold Boundary Limits Table */}
      <ThresholdTable
        thresholds={thresholds}
        onEditThreshold={handleOpenEdit}
        onAddNewThreshold={handleOpenAdd}
      />

      {/* Threshold Edit Slide-Over / Modal */}
      <ThresholdEditDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        threshold={selectedThreshold}
        tankId={selectedTankId}
        tanks={tanks}
        onSaved={handleDrawerSaved}
      />
    </div>
  );
}
