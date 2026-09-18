import React, { useState, useEffect } from "react";
import SecurityPolicyManager from "../components/SecurityPolicyManager";
import AuditTrailViewer from "../components/AuditTrailViewer";
import { getPolicies, getAuditLogs } from "../services/api";

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState("policies");
  const [policies, setPolicies] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    fetchPolicies();
    fetchLogs();
  }, []);

  const fetchPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const data = await getPolicies();
      setPolicies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Policies API fetch warning", err);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await getAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Audit logs API fetch warning", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Governance, Security & Audit Console
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure baseline compliance policies and review administrative audit
          trails
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-4">
        <button
          onClick={() => setActiveTab("policies")}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "policies"
              ? "border-purple-600 text-purple-600 dark:text-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Security Policies
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "audit"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Audit Trail Ledger
        </button>
      </div>

      {activeTab === "policies" ? (
        <SecurityPolicyManager
          policies={policies}
          onPolicyUpdated={fetchPolicies}
        />
      ) : (
        <AuditTrailViewer
          logs={logs}
          loading={loadingLogs}
          onRefresh={fetchLogs}
        />
      )}
    </div>
  );
}
