import React, { useState, useEffect, useCallback } from "react";
import HeaderNavbar from "./components/HeaderNavbar.jsx";
import MetricsBar from "./components/MetricsBar.jsx";
import WireInitiationForm from "./components/WireInitiationForm.jsx";
import PendingApprovalQueueTable from "./components/PendingApprovalQueueTable.jsx";
import ToastNotification from "./components/ToastNotification.jsx";
import {
  getPendingWires,
  createWire,
  approveWire,
  rejectWire,
} from "./services/api.js";

export const App = () => {
  const [currentUser, setCurrentUser] = useState("User A (Maker)");
  const [pendingWires, setPendingWires] = useState([]);
  const [autoApprovedCount, setAutoApprovedCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState(null);

  const fetchPending = useCallback(async () => {
    try {
      const wires = await getPendingWires();
      setPendingWires(Array.isArray(wires) ? wires : []);
    } catch (err) {
      console.error("Failed to fetch pending wires:", err);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleUserChange = (newUser) => {
    setCurrentUser(newUser);
  };

  const handleCreateWire = async (wireData) => {
    setSubmitting(true);
    try {
      const result = await createWire(wireData);
      if (result.status === "APPROVED") {
        setAutoApprovedCount((prev) => prev + 1);
        setToast({
          type: "success",
          title: "Wire Auto-Approved",
          message: `Wire transfer of $${Number(result.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} to ${result.beneficiaryName} was automatically approved (amount ≤ $10,000.00).`,
        });
      } else {
        setToast({
          type: "success",
          title: "Wire Submitted for Approval",
          message: `Wire transfer of $${Number(result.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} to ${result.beneficiaryName} exceeds $10,000.00 and is now PENDING Checker approval.`,
        });
      }
      await fetchPending();
    } catch (err) {
      console.error("Error creating wire:", err);
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to submit wire transfer";
      setToast({
        type: "error",
        title: "Wire Submission Failed",
        message: detail,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (wireId) => {
    setLoadingActionId(wireId);
    try {
      await approveWire(wireId, currentUser);
      setToast({
        type: "success",
        title: "Wire Approved",
        message: `Wire transfer was successfully approved by ${currentUser}.`,
      });
      await fetchPending();
    } catch (err) {
      console.error("Error approving wire:", err);
      if (err.response?.status === 403) {
        const detailMessage =
          typeof err.response?.data?.detail === "string"
            ? err.response.data.detail
            : `${currentUser} cannot approve their own wire transfer per Segregation of Duties policy. A distinct Checker is required.`;

        setToast({
          type: "error_403",
          title: "🚫 403 Forbidden: Action Denied",
          message: detailMessage,
        });
      } else {
        const detail =
          err.response?.data?.detail ||
          err.message ||
          "Failed to approve wire transfer";
        setToast({
          type: "error",
          title: "Approval Failed",
          message: detail,
        });
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleReject = async (wireId) => {
    setLoadingActionId(wireId);
    try {
      await rejectWire(wireId, currentUser);
      setToast({
        type: "success",
        title: "Wire Rejected",
        message: `Wire transfer was rejected by ${currentUser}.`,
      });
      await fetchPending();
    } catch (err) {
      console.error("Error rejecting wire:", err);
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to reject wire transfer";
      setToast({
        type: "error",
        title: "Rejection Failed",
        message: detail,
      });
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <HeaderNavbar currentUser={currentUser} onUserChange={handleUserChange} />

      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <MetricsBar
          pendingWires={pendingWires}
          autoApprovedCount={autoApprovedCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <WireInitiationForm
              currentUser={currentUser}
              onSubmitWire={handleCreateWire}
              loading={submitting}
            />
          </div>

          <div className="lg:col-span-7">
            <PendingApprovalQueueTable
              pendingWires={pendingWires}
              currentUser={currentUser}
              onApprove={handleApprove}
              onReject={handleReject}
              loadingActionId={loadingActionId}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
