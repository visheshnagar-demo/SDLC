import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import SidebarNav from "./components/SidebarNav";
import HeaderBar from "./components/HeaderBar";
import RegistrationStepperForm from "./components/RegistrationStepperForm";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import MedicalRecords from "./pages/MedicalRecords";
import AuditLogs from "./pages/AuditLogs";

function MainAppLayout({ user, onLogout }) {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isQuickIntakeOpen, setIsQuickIntakeOpen] = useState(false);
  const [selectedPatientForEmr, setSelectedPatientForEmr] = useState(null);
  const [selectedPatientForAppt, setSelectedPatientForAppt] = useState(null);

  const handleGlobalSearch = (query) => {
    if (query) {
      navigate(`/patients?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased overflow-hidden text-slate-900">
      {/* Primary Sidebar Rail */}
      <SidebarNav
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onQuickIntake={() => setIsQuickIntakeOpen(true)}
      />

      {/* Main App Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <HeaderBar
          user={user}
          onLogout={onLogout}
          onGlobalSearch={handleGlobalSearch}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    onOpenRegistration={() => setIsQuickIntakeOpen(true)}
                    onSelectPatientForEmr={(patient) =>
                      setSelectedPatientForEmr(patient)
                    }
                  />
                }
              />
              <Route
                path="/patients"
                element={
                  <Patients
                    onSelectPatientForEmr={(patient) =>
                      setSelectedPatientForEmr(patient)
                    }
                    onSelectPatientForAppt={(patient) =>
                      setSelectedPatientForAppt(patient)
                    }
                  />
                }
              />
              <Route
                path="/appointments"
                element={
                  <Appointments preSelectedPatient={selectedPatientForAppt} />
                }
              />
              <Route
                path="/emr"
                element={
                  <MedicalRecords
                    selectedPatient={selectedPatientForEmr}
                    onSelectPatient={(p) => setSelectedPatientForEmr(p)}
                    currentUser={user}
                  />
                }
              />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Quick Intake Modal Triggerable from Any Screen */}
      <RegistrationStepperForm
        isOpen={isQuickIntakeOpen}
        onClose={() => setIsQuickIntakeOpen(false)}
        onSuccess={(newPatient) => {
          setSelectedPatientForEmr(newPatient);
        }}
      />
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Default logged in user for immediate seamless access
    return {
      username: "Dr. Sarah Smith",
      email: "test@example.com",
      role: "DOCTOR",
    };
  });

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/*"
          element={
            currentUser ? (
              <MainAppLayout user={currentUser} onLogout={handleLogout} />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
      </Routes>
    </Router>
  );
}
