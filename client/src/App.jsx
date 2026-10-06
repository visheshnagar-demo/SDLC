import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PatientPage from "./pages/PatientPage.jsx";
import AppointmentPage from "./pages/AppointmentPage.jsx";
import EHRPage from "./pages/EHRPage.jsx";
import BillingPage from "./pages/BillingPage.jsx";

export const App = () => {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/patients" element={<PatientPage />} />
          <Route path="/appointments" element={<AppointmentPage />} />
          <Route path="/ehr" element={<EHRPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

export default App;
