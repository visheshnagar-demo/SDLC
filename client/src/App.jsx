import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import TenantDashboardPage from "./pages/TenantDashboardPage";
import TenantOnboardingPage from "./pages/TenantOnboardingPage";
import TenantDetailPage from "./pages/TenantDetailPage";
import TenantConfigPage from "./pages/TenantConfigPage";
import CheckoutPage from "./pages/CheckoutPage";
import RefundPortalPage from "./pages/RefundPortalPage";
import AnalyticsPage from "./pages/AnalyticsPage";

export function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/tenants" replace />} />
            <Route path="/tenants" element={<TenantDashboardPage />} />
            <Route path="/onboard" element={<TenantOnboardingPage />} />
            <Route path="/tenants/onboard" element={<TenantOnboardingPage />} />
            <Route path="/tenants/:tenantId" element={<TenantDetailPage />} />
            <Route
              path="/tenants/:tenantId/config"
              element={<TenantConfigPage />}
            />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/refunds" element={<RefundPortalPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="*" element={<Navigate to="/tenants" replace />} />
          </Routes>
        </main>
        <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-center text-xs">
          <div className="max-w-7xl mx-auto px-4">
            <p>
              © {new Date().getFullYear()} MultiTenant Platform Admin. Secure
              Multi-Tenant Data Isolation.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
