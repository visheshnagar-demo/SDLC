import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import DashboardPage from "./pages/DashboardPage";
import IntakePage from "./pages/IntakePage";
import HousingPage from "./pages/HousingPage";
import VisitorsPage from "./pages/VisitorsPage";
import AuditPage from "./pages/AuditPage";

export function App() {
  const [currentRole, setCurrentRole] = useState("ADMIN");

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar
          currentRole={currentRole}
          onRoleChange={(role) => setCurrentRole(role)}
        />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={<DashboardPage currentRole={currentRole} />}
            />
            <Route
              path="/intake"
              element={<IntakePage currentRole={currentRole} />}
            />
            <Route
              path="/housing"
              element={<HousingPage currentRole={currentRole} />}
            />
            <Route
              path="/visitors"
              element={<VisitorsPage currentRole={currentRole} />}
            />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
        <footer className="bg-slate-950 text-slate-500 border-t border-slate-900 py-6 text-center text-xs font-mono">
          <div className="max-w-7xl mx-auto px-4">
            <p>
              © {new Date().getFullYear()} APEX STATE CORRECTIONAL COMPLEX •
              HIGH-SECURITY PRISON MANAGEMENT SYSTEM
            </p>
            <p className="text-[10px] text-slate-600 mt-1">
              AUTHORIZED PERSONNEL ONLY • ALL MUTATIONS LOGGED TO AUDIT TRAIL
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
