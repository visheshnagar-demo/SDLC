import React, { useState, useEffect } from "react";
import ApprovalQueueList from "../components/ApprovalQueueList";
import ApprovalDetailDrawer from "../components/ApprovalDetailDrawer";
import { approvalService, authService } from "../services/api";
import {
  CheckSquare,
  RefreshCw,
  LogIn,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  User,
} from "lucide-react";

export default function EmployeeApprovalView({ currentUser, onUserChange }) {
  const [visits, setVisits] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Form state for quick login inside the page if not authenticated
  const [loginEmail, setLoginEmail] = useState("test@example.com");
  const [loginPassword, setLoginPassword] = useState("testpassword");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const fetchPendingApprovals = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError("");
    try {
      const data = await approvalService.getPendingApprovals({
        skip: 0,
        limit: 50,
      });
      setVisits(data.items || []);
      setTotal(data.total || 0);
      if (selectedVisit) {
        const stillPresent = (data.items || []).find(
          (v) => v.id === selectedVisit.id,
        );
        if (!stillPresent) setSelectedVisit(null);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch pending approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPendingApprovals();
    }
  }, [currentUser]);

  const handleInlineLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const data = await authService.login(loginEmail, loginPassword);
      if (onUserChange) onUserChange(data.user);
    } catch (err) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleActionComplete = (updatedVisit, actionType) => {
    setActionNotice({
      message: `Visit for ${updatedVisit.visitor?.full_name || "Visitor"} was successfully ${
        actionType === "APPROVE" ? "APPROVED" : "REJECTED"
      }.`,
      type: actionType === "APPROVE" ? "success" : "warning",
      passCode: updatedVisit.pass_code,
    });
    setSelectedVisit(null);
    fetchPendingApprovals();
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Host Employee Sign In</h2>
            <p className="text-slate-300 text-xs mt-1">
              Sign in to manage and approve incoming visitor requests.
            </p>
          </div>

          <form onSubmit={handleInlineLogin} className="p-6 space-y-4">
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Employee Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
              <span className="font-semibold text-slate-700 block">
                Host Test Account:
              </span>
              <div className="text-slate-600 font-mono text-[11px]">
                test@example.com / testpassword
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors disabled:opacity-50"
            >
              {authLoading ? "Signing In..." : "Sign In as Host"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Host Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Visitor Approval Queue
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Logged in as{" "}
            <strong className="text-slate-900">{currentUser.full_name}</strong>{" "}
            ({currentUser.email})
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPendingApprovals}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1.5 text-indigo-600 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Queue ({total})
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex items-center justify-between text-sm ${
            actionNotice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <div>
              <span className="font-bold">{actionNotice.message}</span>
              {actionNotice.passCode && (
                <span className="ml-2 font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                  Pass: {actionNotice.passCode}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-xs font-semibold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid with Approval Queue and Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className={selectedVisit ? "lg:col-span-7" : "lg:col-span-12"}>
          <ApprovalQueueList
            visits={visits}
            loading={loading}
            error={error}
            selectedVisit={selectedVisit}
            onSelectVisit={(item) => setSelectedVisit(item)}
          />
        </div>

        {selectedVisit && (
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <ApprovalDetailDrawer
              visit={selectedVisit}
              onClose={() => setSelectedVisit(null)}
              onActionComplete={handleActionComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
