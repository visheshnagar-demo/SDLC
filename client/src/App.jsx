import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import DevoteesPage from "./pages/DevoteesPage";
import PoojaBookingPage from "./pages/PoojaBookingPage";
import DonationsPage from "./pages/DonationsPage";
import InventoryPage from "./pages/InventoryPage";
import FinancePage from "./pages/FinancePage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-amber-50/40 text-orange-950 font-sans flex flex-col">
        <Navbar />
        <main className="flex-1 pb-12">
          <Routes>
            <Route path="/" element={<Navigate to="/devotees" replace />} />
            <Route path="/devotees" element={<DevoteesPage />} />
            <Route path="/poojas" element={<PoojaBookingPage />} />
            <Route path="/donations" element={<DonationsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="*" element={<Navigate to="/devotees" replace />} />
          </Routes>
        </main>
        <footer className="bg-orange-950 text-amber-200/80 text-center py-4 text-xs border-t border-orange-800">
          Ganesh Temple Management System • Siddhivinayak Temple Trust © 2026
        </footer>
      </div>
    </Router>
  );
}
