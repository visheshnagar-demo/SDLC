import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  ShieldCheck,
  AlertCircle,
  FileText,
  CheckCircle2,
} from "lucide-react";
import UserSwitcher from "../components/UserSwitcher";
import MetricGroup from "../components/MetricGroup";
import WireInitiationForm from "../components/WireInitiationForm";
import ApprovalQueueTable from "../components/ApprovalQueueTable";
import ToastNotification from "../components/ToastNotification";
import {
  createWire,
  getPendingWires,
  getAllWires,
  approveWire,
  rejectWire,
} from "../services/api";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState("User A"); // Default: User A (Maker)
  const [pendingWires, setPendingWires] = useState([]);
  const [allWires, setAllWires] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'initiate', 'queue'

  const fetchWires = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pendingData, allData] = await Promise.all([
        getPendingWires(),
        getAllWires(),
      ]);
      setPendingWires(pendingData || []);
      setAllWires(allData || []);
    } catch (err) {
      console.error("Failed to fetch wires:", err);
      // Fallback if backend isn't ready or during isolated dev
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWires();
  }, [fetchWires]);

  const handleCreateWire = async (wireData) => {
    setIsSubmitting(true);
    try {
      const result = await createWire(wireData, currentUser);

      const isPending = result.status === "PENDING";
      setToast({
        type: "success",
        title: isPending
          ? "Wire Submitted for Dual Control"
          : "Wire Auto-Approved",
        message: isPending
          ? `Wire of $${wireData.amount.toLocaleString()} for ${wireData.beneficiaryName} exceeds $10,000 threshold and is now PENDING Checker approval.`
          : `Wire of $${wireData.amount.toLocaleString()} for ${wireData.beneficiaryName} is <= $10,000 and was auto-approved immediately.`,
      });

      await fetchWires();
    } catch (err) {
      console.error("Error creating wire:", err);
      const errMsg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to submit wire transfer.";
      setToast({
        type: "error",
        title: "Wire Submission Failed",
        message: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveWire = async (wireId) => {
    try {
      const updatedWire = await approveWire(wireId, currentUser);
      setToast({
        type: "success",
        title: "Wire Approved Successfully",
        message: `Wire transfer ID ${wireId.slice(0, 8)}... for ${updatedWire.beneficiaryName} ($${updatedWire.amount.toLocaleString()}) has been APPROVED by ${currentUser}.`,
      });
      await fetchWires();
    } catch (err) {
      console.error("Approval Error:", err);
      const statusCode = err.response?.status;
      const detailMsg = err.response?.data?.detail;

      if (
        statusCode === 403 ||
        detailMsg?.toLowerCase().includes("same user") ||
        detailMsg?.toLowerCase().includes("cannot approve")
      ) {
        setToast({
          type: "error",
          title: "403 Forbidden: Dual Control Violation",
          message:
            detailMsg ||
            `Dual Control Enforcement Error: As "${currentUser}", you cannot approve a wire transfer that you initiated. A different Checker user must approve this request.`,
        });
      } else {
        setToast({
          type: "error",
          title: "Approval Failed",
          message: detailMsg || "Failed to approve wire transfer.",
        });
      }
    }
  };

  const handleRejectWire = async (wireId) => {
    try {
      const updatedWire = await rejectWire(wireId, currentUser);
      setToast({
        type: "warning",
        title: "Wire Transfer Rejected",
        message: `Wire transfer ID ${wireId.slice(0, 8)}... for ${updatedWire.beneficiaryName} ($${updatedWire.amount.toLocaleString()}) has been REJECTED by ${currentUser}.`,
      });
      await fetchWires();
    } catch (err) {
      console.error("Rejection Error:", err);
      const detailMsg = err.response?.data?.detail;
      setToast({
        type: "error",
        title: "Rejection Failed",
        message: detailMsg || "Failed to reject wire transfer.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header Navigation */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                Apex Commercial Bank
              </h1>
              <p className="text-xs text-slate-400">
                Commercial Wire Maker-Checker System
              </p>
            </div>
          </div>

          <UserSwitcher
            currentUser={currentUser}
            onUserChange={setCurrentUser}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Compliance Notice Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-sm border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                Dual Control Security Policy
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                Commercial wires exceeding <strong>$10,000.00 USD</strong>{" "}
                require dual-control approval. Wires created by a{" "}
                <strong>Maker</strong> must be reviewed and approved by a
                different <strong>Checker</strong> user. Self-approval is
                strictly forbidden.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 self-stretch sm:self-auto justify-center">
            <span>Current Persona:</span>
            <span className="font-bold text-white">{currentUser}</span>
          </div>
        </div>

        {/* High Level Metrics Cards */}
        <MetricGroup wires={allWires} />

        {/* Tab Navigation for Views */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "all"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Full Dashboard View
          </button>
          <button
            onClick={() => setActiveTab("initiate")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "initiate"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            Wire Initiation Form
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 relative ${
              activeTab === "queue"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Approval Queue
            {pendingWires.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingWires.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Rendering */}
        {(activeTab === "all" || activeTab === "initiate") && (
          <div
            className={
              activeTab === "all"
                ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                : "max-w-2xl mx-auto"
            }
          >
            <div className={activeTab === "all" ? "lg:col-span-5" : "w-full"}>
              <WireInitiationForm
                onSubmitWire={handleCreateWire}
                currentUser={currentUser}
                isSubmitting={isSubmitting}
              />
            </div>

            {activeTab === "all" && (
              <div className="lg:col-span-7">
                <ApprovalQueueTable
                  pendingWires={pendingWires}
                  onApprove={handleApproveWire}
                  onReject={handleRejectWire}
                  currentUser={currentUser}
                  isLoading={isLoading}
                  onRefresh={fetchWires}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "queue" && (
          <div className="max-w-5xl mx-auto">
            <ApprovalQueueTable
              pendingWires={pendingWires}
              onApprove={handleApproveWire}
              onReject={handleRejectWire}
              currentUser={currentUser}
              isLoading={isLoading}
              onRefresh={fetchWires}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          Apex Commercial Bank &copy; 2026. Commercial Wire Maker-Checker
          Application.
        </div>
      </footer>

      {/* Toast Notification Container */}
      <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
