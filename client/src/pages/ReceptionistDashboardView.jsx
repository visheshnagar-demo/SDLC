import React, { useState, useEffect } from "react";
import ReceptionistQuickSearch from "../components/ReceptionistQuickSearch";
import LiveVisitorRosterTable from "../components/LiveVisitorRosterTable";
import CheckInVerificationInspector from "../components/CheckInVerificationInspector";
import { checkinService, authService } from "../services/api";
import {
  Building2,
  RefreshCw,
  KeyRound,
  AlertCircle,
  ShieldCheck,
  Users,
  CheckCircle,
} from "lucide-react";

export default function ReceptionistDashboardView({
  currentUser,
  onUserChange,
}) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeParams, setActiveParams] = useState({});
  const [selectedVisitForCheckIn, setSelectedVisitForCheckIn] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  // Quick inline login state
  const [loginEmail, setLoginEmail] = useState("receptionist@example.com");
  const [loginPassword, setLoginPassword] = useState("receptionistpassword");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const fetchRoster = async (params = activeParams) => {
    if (!currentUser) return;
    setLoading(true);
    setError("");
    try {
      const data = await checkinService.lookup(params);
      setVisits(data || []);
    } catch (err) {
      setError(err.message || "Failed to search visitor roster.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchRoster(activeParams);
    }
  }, [currentUser]);

  const handleSearch = (searchParams) => {
    setActiveParams(searchParams);
    fetchRoster(searchParams);
  };

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

  const handleCheckOut = async (visit) => {
    if (
      !window.confirm(
        `Check out ${visit.visitor?.full_name || "visitor"} from premises?`,
      )
    ) {
      return;
    }
    setError("");
    try {
      await checkinService.checkOut(visit.id);
      setStatusMessage({
        text: `${visit.visitor?.full_name || "Visitor"} has been checked out successfully.`,
        type: "success",
      });
      fetchRoster();
    } catch (err) {
      setError(err.message || "Check-out failed.");
    }
  };

  const handleCheckInComplete = (updatedVisit) => {
    setSelectedVisitForCheckIn(null);
    setStatusMessage({
      text: `${updatedVisit.visitor?.full_name || "Visitor"} is now checked in (Badge: ${
        updatedVisit.badge_id || "Digital"
      }).`,
      type: "success",
    });
    fetchRoster();
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Reception Desk Portal</h2>
            <p className="text-slate-300 text-xs mt-1">
              Sign in as Receptionist or Security Officer to manage arrivals &
              badges.
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
                Staff Email
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
                Reception Test Account:
              </span>
              <div className="text-slate-600 font-mono text-[11px]">
                receptionist@example.com / receptionistpassword
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors disabled:opacity-50"
            >
              {authLoading ? "Signing In..." : "Sign In to Front Desk"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Front Desk Console</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Visitor Check-In & Check-Out
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Search passes, verify guest IDs, assign physical badges, and track
            real-time occupancy.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchRoster(activeParams)}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1.5 text-indigo-600 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Roster
        </button>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Search & Filter Component */}
      <ReceptionistQuickSearch onSearch={handleSearch} loading={loading} />

      {/* Roster Table */}
      <LiveVisitorRosterTable
        visits={visits}
        loading={loading}
        error={error}
        onSelectVisit={(v) => setSelectedVisitForCheckIn(v)}
        onCheckOut={handleCheckOut}
      />

      {/* Check-In Inspector Modal */}
      {selectedVisitForCheckIn && (
        <CheckInVerificationInspector
          visit={selectedVisitForCheckIn}
          onClose={() => setSelectedVisitForCheckIn(null)}
          onCheckInComplete={handleCheckInComplete}
        />
      )}
    </div>
  );
}
