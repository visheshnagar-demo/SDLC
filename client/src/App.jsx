import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import CattlePage from "./pages/CattlePage.jsx";
import MilkingPage from "./pages/MilkingPage.jsx";
import BreedingPage from "./pages/BreedingPage.jsx";
import HealthPage from "./pages/HealthPage.jsx";
import { getActiveWithdrawals } from "./services/api.js";

export default function App() {
  const [activeWithholdings, setActiveWithholdings] = useState([]);

  useEffect(() => {
    const fetchWithholdings = async () => {
      try {
        const data = await getActiveWithdrawals();
        if (Array.isArray(data)) {
          setActiveWithholdings(data);
        }
      } catch (err) {
        // Soft fallback
        console.debug("Could not fetch active withholdings:", err);
      }
    };
    fetchWithholdings();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-[#F5FAF7] flex flex-col font-sans">
        <Navbar activeWithholdingCount={activeWithholdings.length} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/cattle" element={<CattlePage />} />
            <Route path="/milking" element={<MilkingPage />} />
            <Route path="/breeding" element={<BreedingPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-[#DBE5E0] py-4 text-center text-xs text-[#6B7A73]">
          <div className="max-w-7xl mx-auto px-4">
            CattleCare &bull; Cattle &amp; Dairy Farm Management System &bull;
            ISO-compliant RFID &amp; Withholding Enforcement
          </div>
        </footer>
      </div>
    </Router>
  );
}
