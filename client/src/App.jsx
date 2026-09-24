import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AppNavbar from "./components/layout/AppNavbar";
import AlertsDashboardPage from "./pages/AlertsDashboardPage";
import AlertInvestigationPage from "./pages/AlertInvestigationPage";
import RuleEnginePage from "./pages/RuleEnginePage";
import AuditLogsPage from "./pages/AuditLogsPage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 antialiased">
        <AppNavbar />
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<AlertsDashboardPage />} />
            <Route path="/alerts/:id" element={<AlertInvestigationPage />} />
            <Route path="/rules" element={<RuleEnginePage />} />
            <Route path="/audit" element={<AuditLogsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
