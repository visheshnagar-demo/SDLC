import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import IntakePage from "./pages/IntakePage.jsx";
import HousingPage from "./pages/HousingPage.jsx";
import MovementsPage from "./pages/MovementsPage.jsx";
import ReleasesPage from "./pages/ReleasesPage.jsx";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#090D16] text-[#F8FAFC] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 p-6 md:p-8">
          <Routes>
            <Route path="/" element={<IntakePage />} />
            <Route path="/housing" element={<HousingPage />} />
            <Route path="/movements" element={<MovementsPage />} />
            <Route path="/releases" element={<ReleasesPage />} />
          </Routes>
        </main>
        <footer className="bg-[#0F172A] border-t border-[#334155] py-4 px-6 text-center text-xs text-[#94A3B8]">
          Jail Management System (JMS Enterprise) &bull; NIST SP 800-53
          Compliant &bull; Facility Security Operations
        </footer>
      </div>
    </Router>
  );
}
