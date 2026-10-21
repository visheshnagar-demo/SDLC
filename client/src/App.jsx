import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import EventCatalog from "./pages/EventCatalog";
import MyPasses from "./pages/MyPasses";
import GateScanner from "./pages/GateScanner";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#F59E0B]/30 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/events" replace />} />
              <Route path="/events" element={<EventCatalog />} />
              <Route path="/booking" element={<EventCatalog />} />
              <Route path="/my-passes" element={<MyPasses />} />
              <Route path="/scanner" element={<GateScanner />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/events" replace />} />
            </Routes>
          </main>
          <footer className="bg-[#0F172A] border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>
                © 2026 GarbaFest Management Platform. All rights reserved.
              </span>
              <span className="text-slate-400">
                HMAC SHA-256 Digital Security & Access Controls
              </span>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
