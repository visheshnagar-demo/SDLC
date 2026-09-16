import React, { useState, useEffect, useCallback } from "react";
import UserSwitcher from "./components/UserSwitcher.jsx";
import MetricCards from "./components/MetricCards.jsx";
import WireForm from "./components/WireForm.jsx";
import ApprovalQueue from "./components/ApprovalQueue.jsx";
import ToastNotification from "./components/ToastNotification.jsx";
import {
  createWire,
  getPendingWires,
  approveWire,
  rejectWire,
  setAuthUserHeader,
} from "./services/api.js";

export default function App() {
  const [activeUser, setActiveUser] = useState("User A (Maker)");
  const [pendingWires, setPendingWires] = useState([]);
  const [recentWires, setRecentWires] = useState([]);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  // Sync active user to Axios headers
  useEffect(() => {
    setAuthUserHeader(activeUser);
  }, [activeUser]);

  const fetchQueue = useCallback(async () => {
    setIsLoadingQueue(true);
    try {
      const wires = await getPendingWires();
      setPendingWires(wires || []);
    } catch (err) {
      console.error("Error fetching pending wires:", err);
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleUserChange = (newUser) => {
    setActiveUser(newUser);
    setToast({
      type: "success",
      title: "Active Role Switched",
      message: `Switched context to ${newUser}. Requests will now send X-User-ID: ${newUser}.`,
    });
  };

  const handleWireSubmit = async (wireData) => {
    setIsSubmitting(true);
    try {
      const createdWire = await createWire(wireData, activeUser);

      // Add to recent wires list
      setRecentWires((prev) => [createdWire, ...prev]);

      if (createdWire.status === "APPROVED") {
        setToast({
          type: "success",
          title: "Wire Transfer Auto-Approved",
          message: `Wire ID ${createdWire.id} for $${createdWire.amount.toLocaleString()} to "${createdWire.beneficiaryName}" was auto-approved (&le; $10,000 threshold).`,
        });
      } else {
        setToast({
          type: "success",
          title: "Wire Transfer Submitted for Approval",
          message: `Wire ID ${createdWire.id} for $${createdWire.amount.toLocaleString()} exceeds $10,000 threshold and is held in PENDING status for Checker review.`,
        });
        fetchQueue();
      }
    } catch (err) {
      console.error("Wire submission error:", err);
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to submit wire transfer request.";
      setToast({
        type: "error",
        title: "Wire Submission Failed",
        message:
          typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveWire = async (wireId) => {
    try {
      const updatedWire = await approveWire(wireId, activeUser);
      setToast({
        type: "success",
        title: "Wire Transfer Approved",
        message: `Wire ID ${updatedWire.id} for $${updatedWire.amount.toLocaleString()} was successfully APPROVED by ${activeUser}.`,
      });

      // Update recent wires ledger if present
      setRecentWires((prev) =>
        prev.map((w) => (w.id === wireId ? updatedWire : w)),
      );

      fetchQueue();
    } catch (err) {
      console.error("Approve error:", err);
      if (err.response && err.response.status === 403) {
        const detail =
          err.response.data?.detail ||
          "Maker cannot approve their own wire transfer. Dual control policy violated (Policy Rule R-01).";
        setToast({
          type: "error",
          title: "403 Forbidden: Action Denied",
          message:
            typeof detail === "string"
              ? detail
              : "Maker cannot approve their own wire transfer.",
        });
      } else {
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to approve wire transfer.";
        setToast({
          type: "error",
          title: "Approval Error",
          message:
            typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg,
        });
      }
    }
  };

  const handleRejectWire = async (wireId) => {
    try {
      const updatedWire = await rejectWire(wireId, activeUser);
      setToast({
        type: "success",
        title: "Wire Transfer Rejected",
        message: `Wire ID ${updatedWire.id} was REJECTED by ${activeUser}.`,
      });

      // Update recent wires ledger if present
      setRecentWires((prev) =>
        prev.map((w) => (w.id === wireId ? updatedWire : w)),
      );

      fetchQueue();
    } catch (err) {
      console.error("Reject error:", err);
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to reject wire transfer.";
      setToast({
        type: "error",
        title: "Rejection Error",
        message:
          typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg,
      });
    }
  };

  // Metrics computation
  const autoApprovedCount = recentWires.filter(
    (w) => w.status === "APPROVED" && !w.approvedBy,
  ).length;
  const totalVolume = [...recentWires, ...pendingWires].reduce(
    (acc, curr) => acc + (curr.amount || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      <UserSwitcher activeUser={activeUser} onUserChange={handleUserChange} />

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <MetricCards
          pendingCount={pendingWires.length}
          autoApprovedCount={autoApprovedCount}
          totalVolume={totalVolume}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <WireForm onSubmit={handleWireSubmit} isSubmitting={isSubmitting} />
          </div>

          <div className="lg:col-span-7 space-y-6">
            <ApprovalQueue
              pendingWires={pendingWires}
              onApprove={handleApproveWire}
              onReject={handleRejectWire}
              activeUser={activeUser}
              isLoading={isLoadingQueue}
            />

            {recentWires.length > 0 && (
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Recent Session Wire Activity
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                        <th className="p-2.5">Wire ID</th>
                        <th className="p-2.5">Beneficiary</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Created By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {recentWires.map((w) => (
                        <tr key={w.id}>
                          <td className="p-2.5 font-mono font-semibold">
                            {w.id}
                          </td>
                          <td className="p-2.5 font-medium">
                            {w.beneficiaryName}
                          </td>
                          <td className="p-2.5 font-semibold">
                            ${w.amount?.toLocaleString()}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                w.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : w.status === "REJECTED"
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : "bg-amber-100 text-amber-800 border-amber-200"
                              }`}
                            >
                              {w.status}
                            </span>
                          </td>
                          <td className="p-2.5">{w.createdBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
