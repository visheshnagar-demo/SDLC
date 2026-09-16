import React, { useState, useEffect, useCallback } from "react";
import HeaderUserSwitcher from "../components/HeaderUserSwitcher";
import WireInitiationForm from "../components/WireInitiationForm";
import ApprovalQueueTable from "../components/ApprovalQueueTable";
import ToastNotification from "../components/ToastNotification";
import {
  createWireTransfer,
  getPendingWires,
  approveWireTransfer,
  rejectWireTransfer,
} from "../services/api";
import {
  ArrowLeftRight,
  CheckCircle2,
  ShieldAlert,
  FileText,
  Layers,
} from "lucide-react";

export default function BankingDashboard() {
  const [currentUser, setCurrentUser] = useState("User A (Maker)");
  const [pendingWires, setPendingWires] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [submittingWire, setSubmittingWire] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'initiate' or 'queue'
  const [toast, setToast] = useState(null);

  const fetchPendingWires = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const data = await getPendingWires();
      setPendingWires(data || []);
    } catch (err) {
      console.error("Failed to fetch pending wires:", err);
      setToast({
        type: "error",
        title: "Network Error",
        message:
          err.response?.data?.detail || "Failed to connect to backend server.",
      });
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingWires();
  }, [fetchPendingWires]);

  // Submit Wire Handler
  const handleCreateWire = async (wireData, resetFormCallback) => {
    setSubmittingWire(true);
    try {
      const createdWire = await createWireTransfer(wireData);

      if (createdWire.status === "APPROVED") {
        setToast({
          type: "success",
          title: "Wire Auto-Approved",
          message: `Wire transfer of $${createdWire.amount.toLocaleString()} for ${createdWire.beneficiaryName} was auto-approved (Amount ≤ $10,000).`,
        });
      } else {
        setToast({
          type: "info",
          title: "Wire Queued for Dual Approval",
          message: `Wire transfer of $${createdWire.amount.toLocaleString()} for ${createdWire.beneficiaryName} is > $10,000 and requires Checker approval.`,
        });
      }

      if (resetFormCallback) resetFormCallback();
      await fetchPendingWires();
    } catch (err) {
      console.error("Wire initiation failed:", err);
      const errorMsg =
        err.response?.data?.detail || "Failed to initiate wire transfer.";
      setToast({
        type: "error",
        title: "Submission Error",
        message:
          typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg),
      });
    } finally {
      setSubmittingWire(false);
    }
  };

  // Approve Wire Handler
  const handleApproveWire = async (wireId) => {
    setActionLoadingId(wireId);
    try {
      const updatedWire = await approveWireTransfer(wireId, currentUser);
      setToast({
        type: "success",
        title: "Wire Approved",
        message: `Wire transfer for ${updatedWire.beneficiaryName} ($${updatedWire.amount.toLocaleString()}) has been APPROVED by ${currentUser}.`,
      });
      await fetchPendingWires();
    } catch (err) {
      console.error("Approve failed:", err);
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 403) {
        // Red toast error for 403 Forbidden self-approval attempt
        setToast({
          type: "error",
          title: "403 Forbidden - Action Denied",
          message:
            typeof detail === "string"
              ? detail
              : "Maker cannot approve their own wire transfer.",
        });
      } else {
        setToast({
          type: "error",
          title: "Approval Error",
          message:
            typeof detail === "string"
              ? detail
              : "Failed to approve wire transfer.",
        });
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject Wire Handler
  const handleRejectWire = async (wireId) => {
    setActionLoadingId(wireId);
    try {
      const updatedWire = await rejectWireTransfer(wireId, currentUser);
      setToast({
        type: "info",
        title: "Wire Rejected",
        message: `Wire transfer for ${updatedWire.beneficiaryName} ($${updatedWire.amount.toLocaleString()}) has been REJECTED by ${currentUser}.`,
      });
      await fetchPendingWires();
    } catch (err) {
      console.error("Reject failed:", err);
      const detail = err.response?.data?.detail;
      setToast({
        type: "error",
        title: "Rejection Error",
        message:
          typeof detail === "string"
            ? detail
            : "Failed to reject wire transfer.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Header with User Switcher */}
      <HeaderUserSwitcher
        currentUser={currentUser}
        onUserChange={(newUser) => {
          setCurrentUser(newUser);
          setToast({
            type: "info",
            title: "User Context Switched",
            message: `Switched active user to ${newUser}.`,
          });
        }}
      />

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner / Instructions Bar */}
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              Commercial Wire Transfer Dashboard
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Commercial wire transfers over $10,000 enforce dual approval. The{" "}
              <strong>Maker</strong> initiates requests, and an independent{" "}
              <strong>Checker</strong> must approve them. Maker self-approval
              attempts are blocked by the backend (403 Forbidden).
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Current Session
              </span>
              <span className="font-semibold text-slate-100">
                {currentUser}
              </span>
            </div>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-2 ${
              activeTab === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Full Dashboard View</span>
          </button>
          <button
            onClick={() => setActiveTab("initiate")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-2 ${
              activeTab === "initiate"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>View 1: Wire Initiation Form</span>
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-2 ${
              activeTab === "queue"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>View 2: Approval Queue ({pendingWires.length})</span>
          </button>
        </div>

        {/* Dashboard Sections */}
        {(activeTab === "all" || activeTab === "initiate") && (
          <section className="space-y-6">
            <WireInitiationForm
              currentUser={currentUser}
              onSubmitWire={handleCreateWire}
              isLoading={submittingWire}
            />
          </section>
        )}

        {(activeTab === "all" || activeTab === "queue") && (
          <section className="space-y-6">
            <ApprovalQueueTable
              pendingWires={pendingWires}
              currentUser={currentUser}
              onApprove={handleApproveWire}
              onReject={handleRejectWire}
              onRefresh={fetchPendingWires}
              isLoading={loadingQueue}
              actionLoadingId={actionLoadingId}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          Commercial Wire Maker-Checker System &bull; Secure Banking Operations
          Portal
        </div>
      </footer>

      {/* Toast Notification Container */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
