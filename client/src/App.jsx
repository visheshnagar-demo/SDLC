import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TopNavBar from "./components/TopNavBar";
import VisitorRegistrationView from "./pages/VisitorRegistrationView";
import EmployeeApprovalView from "./pages/EmployeeApprovalView";
import ReceptionistDashboardView from "./pages/ReceptionistDashboardView";
import VisitorHistoryView from "./pages/VisitorHistoryView";
import { authService } from "./services/api";
import { ShieldCheck, Heart } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check local storage for existing session
    const stored = authService.getStoredUser();
    if (stored) {
      setCurrentUser(stored);
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
        {/* Global Navigation Header */}
        <TopNavBar
          currentUser={currentUser}
          onUserChange={(user) => setCurrentUser(user)}
        />

        {/* Main Content Area */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="/register" element={<VisitorRegistrationView />} />
            <Route
              path="/approvals"
              element={
                <EmployeeApprovalView
                  currentUser={currentUser}
                  onUserChange={(user) => setCurrentUser(user)}
                />
              }
            />
            <Route
              path="/reception"
              element={
                <ReceptionistDashboardView
                  currentUser={currentUser}
                  onUserChange={(user) => setCurrentUser(user)}
                />
              }
            />
            <Route
              path="/history"
              element={
                <VisitorHistoryView
                  currentUser={currentUser}
                  onUserChange={(user) => setCurrentUser(user)}
                />
              }
            />
            <Route path="*" element={<Navigate to="/register" replace />} />
          </Routes>
        </main>

        {/* Branded Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-700">
                PassVault Office Visitor Pass System
              </span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
              <span>Enterprise SOC2 Compliant Physical Security</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
