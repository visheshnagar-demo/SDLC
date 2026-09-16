import React, { useState, useEffect, useCallback } from "react";
import UserSwitcher from "../components/UserSwitcher";
import MetricsOverview from "../components/MetricsOverview";
import WireInitiationForm from "../components/WireInitiationForm";
import ApprovalQueueTable from "../components/ApprovalQueueTable";
import AuditHistoryTable from "../components/AuditHistoryTable";
import ErrorToast from "../components/ErrorToast";
import {
  createWire,
  getPendingWires,
  getAllWires,
  approveWire,
  rejectWire,
} from "../services/api";

export default function Dashboard() {
  const [activeUser, setActiveUser] = useState("User A");
  const [pendingWires, setPendingWires] = useState([]);
  const [allWires, setAllWires] = useState([]);
  const [activeTab, setActiveTab] = useState("initiate"); // 'initiate', 'queue', 'audit'
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorTitle, setErrorTitle] = useState(
    "403 Forbidden: Policy Violation",
  );

  const fetchWiresData = useCallback(async () => {
    try {
      const [pendingRes, allRes] = await Promise.all([
        getPendingWires(),
        getAllWires(),
      ]);
      setPendingWires(pendingRes || []);
      setAllWires(allRes || []);
    } catch (err) {
      console.error("Error fetching wires:", err);
    }
  }, []);

  useEffect(() => {
    fetchWiresData();
  }, [fetchWiresData]);

  const handleWireSubmitted = async (payload) => {
    setErrorMessage(null);
    try {
      const newWire = await createWire(payload);
      await fetchWiresData();
      return newWire;
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Error submitting wire transfer";
      if (err.response?.status === 403) {
        setErrorTitle("403 Forbidden: Policy Violation");
        setErrorMessage(detail);
      } else {
        setErrorTitle("Submission Error");
        setErrorMessage(detail);
      }
      throw err;
    }
  };

  const handleApprove = async (wireId, approvedBy) => {
    setErrorMessage(null);
    try {
      const result = await approveWire(wireId, approvedBy);
      await fetchWiresData();
      return result;
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        "Maker cannot approve their own wire transfer (Segregation of Duties policy violation).";
      if (err.response?.status === 403) {
        setErrorTitle("403 Forbidden: Policy Violation");
        setErrorMessage(detail);
      } else {
        setErrorTitle("Approval Error");
        setErrorMessage(detail);
      }
    }
  };

  const handleReject = async (wireId, approvedBy) => {
    setErrorMessage(null);
    try {
      const result = await rejectWire(wireId, approvedBy);
      await fetchWiresData();
      return result;
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        "Maker cannot reject their own wire transfer (Segregation of Duties policy violation).";
      if (err.response?.status === 403) {
        setErrorTitle("403 Forbidden: Policy Violation");
        setErrorMessage(detail);
      } else {
        setErrorTitle("Rejection Error");
        setErrorMessage(detail);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Banking Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-center border-b border-slate-800 shadow-md gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-black text-white text-lg tracking-tighter">
            AB
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight">
              Apex Bank
            </span>
            <span className="text-xs text-slate-400 block sm:inline sm:ml-2">
              | Commercial Treasury Services
            </span>
          </div>
        </div>
        <UserSwitcher activeUser={activeUser} onUserChange={setActiveUser} />
      </header>

      {/* Main Content Area */}
      <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 w-full flex-grow">
        {/* Visual Error Red Toast */}
        <ErrorToast
          title={errorTitle}
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />

        {/* Top Telemetry / Metrics */}
        <MetricsOverview wires={allWires} />

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-lg px-4 pt-2">
          <button
            onClick={() => setActiveTab("initiate")}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "initiate"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            1. Wire Initiation Form
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === "queue"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>2. Approval Queue</span>
            {pendingWires.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingWires.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "audit"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            3. Wire Audit Log
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === "initiate" && (
          <WireInitiationForm
            activeUser={activeUser}
            onWireSubmitted={handleWireSubmitted}
            onError={(msg) => {
              setErrorTitle("Initiation Error");
              setErrorMessage(msg);
            }}
          />
        )}

        {activeTab === "queue" && (
          <ApprovalQueueTable
            pendingWires={pendingWires}
            activeUser={activeUser}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}

        {activeTab === "audit" && <AuditHistoryTable wires={allWires} />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs text-center py-4 border-t border-slate-800 mt-8">
        Commercial Wire Maker-Checker System &copy; 2026 Apex Bank Treasury
        Operations. All Rights Reserved.
      </footer>
    </div>
  );
}
