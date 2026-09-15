import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import TenantDashboardPage from "./pages/TenantDashboardPage.jsx";
import TenantDetailPage from "./pages/TenantDetailPage.jsx";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TenantDashboardPage />} />
        <Route path="/tenants/:tenantId" element={<TenantDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
