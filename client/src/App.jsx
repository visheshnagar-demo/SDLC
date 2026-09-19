import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import DashboardPage from "./pages/DashboardPage";
import ChannelsPage from "./pages/ChannelsPage";
import SchedulePage from "./pages/SchedulePage";
import EditorialPage from "./pages/EditorialPage";

export default function App() {
  const [user, setUser] = useState({
    id: "usr-admin-1",
    email: "test@example.com",
    full_name: "Operations Admin",
    role: "News Manager",
  });

  const handleRoleChange = (newRole) => {
    setUser((prev) => ({ ...prev, role: newRole }));
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
        <Navbar currentUser={user} onRoleChange={handleRoleChange} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/channels" element={<ChannelsPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/editorial" element={<EditorialPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
