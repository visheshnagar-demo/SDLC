import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert, ShieldCheck } from "lucide-react";
import { getAlertById, updateAlertStatus, getAuditLogs } from "../services/api";
import TransactionSnapshotCard from "../components/investigation/TransactionSnapshotCard";
import RuleViolationsCard from "../components/investigation/RuleViolationsCard";
import AlertWorkflowPanel from "../components/investigation/AlertWorkflowPanel";
import AuditTrailTimeline from "../components/investigation/AuditTrailTimeline";

export default function AlertInvestigationPage() {
  const { id } = useParams();
  const [alert, setAlert] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [updateError, setUpdateError] = useState(null);

  const fetchAlertDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAlertById(id);
      setAlert(data);

      try {
        const logs = await getAuditLogs({ entity_id: id });
        setAuditLogs(Array.isArray(logs) ? logs : logs.items || []);
      } catch {
        // Non-blocking audit log fetch
      }
    } catch (err) {
      setError(err.message || "Failed to load alert dossier");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAlertDetails();
  }, [fetchAlertDetails]);

  const handleStatusUpdate = async (updateData) => {
    setUpdating(true);
    setUpdateError(null);
    try {
      const updated = await updateAlertStatus(id, updateData);
      setAlert(updated);
      // Refresh audit logs
      try {
        const logs = await getAuditLogs({ entity_id: id });
        setAuditLogs(Array.isArray(logs) ? logs : logs.items || []);
      } catch {
        // Ignore secondary audit log error
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to update alert status";
      setUpdateError(msg);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
        <p className="text-sm font-medium">Loading Investigation Dossier...</p>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">
          Alert Dossier Not Found
        </h2>
        <p className="text-xs text-slate-500">
          {error || `Unable to locate compliance alert with ID ${id}`}
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Alerts Dashboard</span>
        </Link>
      </div>
    );
  }

  const shortId = alert.id ? alert.id.slice(0, 8).toUpperCase() : "N/A";
  const violations = alert.violations || alert.alert_violations || [];
  const tx = alert.transaction || {};

  return (
    <div className="space-y-6">
      {/* Investigation Dossier Header */}
      <header className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Alerts</span>
          </Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-base sm:text-lg font-bold text-slate-900">
            Investigation Dossier: ALT-{shortId}
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            {alert.severity || "CRITICAL"} (Score: {alert.risk_score ?? "--"})
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            {alert.status || "NEW"}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
          <span>Created: {new Date(alert.created_at).toUTCString()}</span>
        </div>
      </header>

      {/* Main Dossier Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: Evidence & Violations */}
        <div className="lg:col-span-7 space-y-6">
          <TransactionSnapshotCard transaction={tx} alert={alert} />
          <RuleViolationsCard violations={violations} />
        </div>

        {/* Right Section: Workflow & Audit Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <AlertWorkflowPanel
            alert={alert}
            onStatusUpdate={handleStatusUpdate}
            updating={updating}
            error={updateError}
          />
          <AuditTrailTimeline auditLogs={auditLogs} />
        </div>
      </main>
    </div>
  );
}
