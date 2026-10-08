import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import FDOpeningPage from "./pages/FDOpeningPage";
import SelectAccountPage from "./pages/SelectAccountPage";
import ConfigureFDPage from "./pages/ConfigureFDPage";
import AuthorizeFDPage from "./pages/AuthorizeFDPage";
import FDConfirmationPage from "./pages/FDConfirmationPage";
import CheckoutPage from "./pages/CheckoutPage";
import RefundPortalPage from "./pages/RefundPortalPage";
import AnalyticsPage from "./pages/AnalyticsPage";

export function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/open-fd" replace />} />
            <Route path="/open-fd" element={<FDOpeningPage />} />
            <Route path="/fixed-deposit" element={<FDOpeningPage />} />
            <Route path="/select-account" element={<SelectAccountPage />} />
            <Route path="/configure-fd" element={<ConfigureFDPage />} />
            <Route path="/authorize-fd" element={<AuthorizeFDPage />} />
            <Route path="/fd-confirmation" element={<FDConfirmationPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/refunds" element={<RefundPortalPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="*" element={<Navigate to="/open-fd" replace />} />
          </Routes>
        </main>
        <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-center text-xs">
          <div className="max-w-7xl mx-auto px-4">
            <p>
              © {new Date().getFullYear()} NexusBank Retail Banking. Member
              FDIC. Equal Housing Lender.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
