import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header.jsx";
import WireInitiationForm from "./components/WireInitiationForm.jsx";
import ApprovalQueueTable from "./components/ApprovalQueueTable.jsx";
import ToastNotification from "./components/ToastNotification.jsx";
import {
  createWire,
  getPendingWires,
  getAllWires,
  approveWire,
  rejectWire,
} from "./services/api.js";
import {
  Send,
  Clock,
  CheckCircle2,
  ShieldAlert,
  ArrowRightLeft,
} from "lucide-react";

export function App() {
  const [activeUser, setActiveUser] = useState("User A"); // Default: User A (Maker)
  const [pendingWires, setPendingWires] = useState([]);
  const [allWires, setAllWires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("initiate"); // 'initiate' | 'queue' | 'history'

  const fetchWiresData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingData, allData] = await Promise.all([
        getPendingWires(),
        getAllWires(),
      ]);
      setPendingWires(pendingData || []);
      setAllWires(allData || []);
    } catch (err) {
      console.error("Failed to fetch wires:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWiresData();
  }, [fetchWiresData]);

  const handleWireInitiate = async (payload) => {
    try {
      const created = await createWire(payload);
      await fetchWiresData();

      if (created.status === "APPROVED") {
        setToast({
          type: "success",
          title: "Wire Auto-Approved (≤ $10,000)",
          message: `Wire transfer of $${created.amount.toLocaleString()} to ${created.beneficiaryName} was automatically approved.`,
        });
      } else {
        setToast({
          type: "info",
          title: "Wire Submitted for Dual Approval (> $10,000)",
          message: `Wire transfer of $${created.amount.toLocaleString()} requires Checker authorization and is now in the pending queue.`,
        });
      }

      return created;
    } catch (err) {
      const errorMsg =
        err.data?.detail || err.message || "Failed to initiate wire transfer.";
      setToast({
        type: "error",
        title: "Initiation Failed",
        message: errorMsg,
      });
      throw err;
    }
  };

  const handleApproveWire = async (wireId) => {
    try {
      await approveWire(wireId, activeUser);
      setToast({
        type: "success",
        title: "Wire Transfer Approved",
        message: `Wire ${wireId} has been successfully approved by ${activeUser}.`,
      });
      await fetchWiresData();
    } catch (err) {
      if (err.status === 403 || err.response?.status === 403) {
        const detailMsg =
          err.data?.detail ||
          err.response?.data?.detail ||
          "Action Denied: Maker cannot approve their own wire transfer. Dual approval policy mandates independent Checker authorization.";
        setToast({
          type: "error",
          title: "HTTP 403 Forbidden - Action Denied",
          message: detailMsg,
        });
      } else {
        const errorMsg =
          err.data?.detail || err.message || "Failed to approve wire transfer.";
        setToast({
          type: "error",
          title: "Approval Error",
          message: errorMsg,
        });
      }
    }
  };

  const handleRejectWire = async (wireId) => {
    try {
      await rejectWire(wireId, activeUser);
      setToast({
        type: "info",
        title: "Wire Transfer Rejected",
        message: `Wire ${wireId} was marked as REJECTED by ${activeUser}.`,
      });
      await fetchWiresData();
    } catch (err) {
      const errorMsg =
        err.data?.detail || err.message || "Failed to reject wire transfer.";
      setToast({
        type: "error",
        title: "Rejection Error",
        message: errorMsg,
      });
    }
  };

  // Stats calculation
  const totalVolume = allWires.reduce((acc, w) => acc + (w.amount || 0), 0);
  const pendingCount = pendingWires.length;
  const approvedCount = allWires.filter((w) => w.status === "APPROVED").length;
  const rejectedCount = allWires.filter((w) => w.status === "REJECTED").length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <Header activeUser={activeUser} onUserChange={setActiveUser} />

      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {/* Top Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-medium text-slate-500 flex items-center justify-between">
              Total Volume Initiated
              <ArrowRightLeft className="w-4 h-4 text-blue-500" />
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              $
              {totalVolume.toLocaleString("en-US", {
                minimumFractionDigits: 0,
              })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {allWires.length} total transfers recorded
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-medium text-slate-500 flex items-center justify-between">
              Dual Approval Threshold
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              &gt; $10,000 USD
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Requires Maker ≠ Checker
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-medium text-slate-500 flex items-center justify-between">
              Pending Checker Review
              <Clock className="w-4 h-4 text-amber-600" />
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {pendingCount} Wires
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Awaiting Checker action
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-medium text-slate-500 flex items-center justify-between">
              Approved Transfers
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {approvedCount} Wires
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Auto or Checker Approved
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("initiate")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "initiate"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Send className="w-4 h-4" />
            Wire Initiation (Maker)
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "queue"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            Approval Queue (Checker)
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "history"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transfer Log ({allWires.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "initiate" && (
          <div className="space-y-6">
            <WireInitiationForm
              activeUser={activeUser}
              onSubmitSuccess={handleWireInitiate}
            />

            {/* Quick Preview of Pending Queue for convenience */}
            {pendingWires.length > 0 && (
              <div className="pt-4">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Quick View: Pending Wires Awaiting Review
                </h3>
                <ApprovalQueueTable
                  pendingWires={pendingWires}
                  activeUser={activeUser}
                  onApprove={handleApproveWire}
                  onReject={handleRejectWire}
                  onRefresh={fetchWiresData}
                  loading={loading}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "queue" && (
          <ApprovalQueueTable
            pendingWires={pendingWires}
            activeUser={activeUser}
            onApprove={handleApproveWire}
            onReject={handleRejectWire}
            onRefresh={fetchWiresData}
            loading={loading}
          />
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold">
                  All Commercial Wire Transfers Log
                </h2>
                <p className="text-xs text-slate-400">
                  Complete audit trail of auto-approved, pending, and
                  checker-reviewed wires
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[11px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                    <th className="p-3">ID</th>
                    <th className="p-3">Beneficiary</th>
                    <th className="p-3">Account</th>
                    <th className="p-3">Routing</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Maker (Created)</th>
                    <th className="p-3">Checker (Approved/Rejected)</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {allWires.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-6 text-center text-slate-500"
                      >
                        No wire transfer history available.
                      </td>
                    </tr>
                  ) : (
                    allWires.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-medium">{w.id}</td>
                        <td className="p-3 font-semibold">
                          {w.beneficiaryName}
                        </td>
                        <td className="p-3 font-mono">{w.accountNumber}</td>
                        <td className="p-3 font-mono">{w.routingNumber}</td>
                        <td className="p-3 font-mono font-bold">
                          $
                          {Number(w.amount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-3">{w.createdBy}</td>
                        <td className="p-3">{w.approvedBy || "-"}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              w.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : w.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-rose-100 text-rose-800 border border-rose-300"
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-4 border-t border-slate-800 text-center text-xs">
        <p>
          Commercial Bank Treasury System &bull; Dual Approval Security Engine
          &bull; SDLC Assistant
        </p>
      </footer>
    </div>
  );
}

export default App;
