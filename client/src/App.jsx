import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TopNavBar from "./components/common/TopNavBar.jsx";
import SideNavBar from "./components/common/SideNavBar.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import InstanceDetailPage from "./pages/InstanceDetailPage.jsx";
import ProvisionInstancePage from "./pages/ProvisionInstancePage.jsx";
import ProvidersPage from "./pages/ProvidersPage.jsx";
import AuditLogsPage from "./pages/AuditLogsPage.jsx";

export default function App() {
  const [currentUser, setCurrentUser] = useState({
    id: "usr-admin-01",
    email: "admin@example.com",
    full_name: "Cloud Infrastructure Administrator",
    role: "ADMIN", // 'ADMIN' or 'READ_ONLY'
    is_active: true,
  });

  const handleRoleChange = (newRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      role: newRole,
      email: newRole === "ADMIN" ? "admin@example.com" : "test@example.com",
      full_name:
        newRole === "ADMIN"
          ? "Cloud Infrastructure Administrator"
          : "Read-Only Auditor",
    }));
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col font-sans">
        {/* Global Header */}
        <TopNavBar currentUser={currentUser} onRoleChange={handleRoleChange} />

        {/* Main Content Layout with Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          <SideNavBar />
          <main className="flex-1 p-6 overflow-y-auto bg-[#0b1326]">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route
                  path="/"
                  element={<DashboardPage currentUser={currentUser} />}
                />
                <Route
                  path="/instances/:instanceId"
                  element={<InstanceDetailPage currentUser={currentUser} />}
                />
                <Route
                  path="/provision"
                  element={<ProvisionInstancePage currentUser={currentUser} />}
                />
                <Route
                  path="/providers"
                  element={<ProvidersPage currentUser={currentUser} />}
                />
                <Route
                  path="/audit-logs"
                  element={<AuditLogsPage currentUser={currentUser} />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
