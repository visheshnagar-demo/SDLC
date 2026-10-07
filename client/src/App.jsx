import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppHeader from "./components/layout/AppHeader";
import SidebarNav from "./components/layout/SidebarNav";
import PatientDashboardPage from "./pages/PatientDashboardPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import DoctorEHRPage from "./pages/DoctorEHRPage";
import AdminConsolePage from "./pages/AdminConsolePage";
import LoginPage from "./pages/LoginPage";

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <AppHeader />
          <div className="flex flex-1">
            <SidebarNav />
            <main className="flex-1 overflow-y-auto bg-slate-50">
              <Routes>
                <Route path="/" element={<PatientDashboardPage />} />
                <Route
                  path="/patient-portal"
                  element={<PatientDashboardPage />}
                />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/doctor-ehr" element={<DoctorEHRPage />} />
                <Route path="/clinical" element={<DoctorEHRPage />} />
                <Route path="/admin" element={<AdminConsolePage />} />
                <Route path="/audit" element={<AdminConsolePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
