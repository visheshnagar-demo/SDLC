import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import KPICard from "../components/common/KPICard";
import PatientDirectoryTable from "../components/admin/PatientDirectoryTable";
import AuditLogStream from "../components/admin/AuditLogStream";
import {
  ShieldAlert,
  Users,
  ShieldCheck,
  AlertTriangle,
  Activity,
  FileSpreadsheet,
  Download,
  Lock,
} from "lucide-react";

export const AdminConsolePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("directory"); // 'directory' | 'audit'

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-inner text-white">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">
                Hospital Administration &amp; HIPAA Security Console
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                RBAC Level 1
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Master patient indexing, National ID / SSN deduplication
              resolution, and real-time HIPAA PHI audit streaming.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              alert("Exporting full HIPAA compliance audit trail...")
            }
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-sky-400" />
            Export Audit Trail (CSV)
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Master Patient Index"
          value="1,480 Profiles"
          subtitle="Active demographic records"
          icon={Users}
          color="sky"
        />
        <KPICard
          title="SSN Verification Rate"
          value="99.4%"
          subtitle="Deduplication integrity verified"
          icon={ShieldCheck}
          color="emerald"
        />
        <KPICard
          title="Deduplication Alerts"
          value="1 Pending"
          subtitle="Requires admin manual review"
          icon={AlertTriangle}
          color="amber"
        />
        <KPICard
          title="HIPAA Logged Events"
          value="24,190 Events"
          subtitle="100% immutable audit capture"
          icon={Activity}
          color="indigo"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "directory"
              ? "bg-primary-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          Patient Master Directory &amp; SSN Resolution
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "audit"
              ? "bg-primary-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Real-Time HIPAA Compliance Audit Stream
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "directory" ? (
        <div className="space-y-6">
          <PatientDirectoryTable />
        </div>
      ) : (
        <div className="space-y-6">
          <AuditLogStream />
        </div>
      )}
    </div>
  );
};

export default AdminConsolePage;
