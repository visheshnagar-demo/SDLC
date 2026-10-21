import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import EventBookingPage from "./pages/EventBookingPage";
import MyPassesPage from "./pages/MyPassesPage";
import GateScannerPage from "./pages/GateScannerPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

export function App() {
  return (
    <Router>
      <div className='min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-["Plus_Jakarta_Sans",sans-serif] selection:bg-amber-500 selection:text-slate-950'>
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/events" replace />} />
            <Route path="/events" element={<EventBookingPage />} />
            <Route path="/booking" element={<EventBookingPage />} />
            <Route path="/my-passes" element={<MyPassesPage />} />
            <Route path="/scanner" element={<GateScannerPage />} />
            <Route path="/gate-scanner" element={<GateScannerPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="*" element={<Navigate to="/events" replace />} />
          </Routes>
        </main>
        <footer className="bg-[#080c14] border-t border-[#f59e0b]/20 py-8 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <p className="font-medium text-slate-300">
              © {new Date().getFullYear()} GarbaFest Management System • All
              Rights Reserved.
            </p>
            <p className="text-[11px] text-slate-500">
              Secured with HMAC SHA-256 Cryptographic Digital Signatures &
              Anti-Duplicate Gate Entry Protocols.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
