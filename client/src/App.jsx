import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import TelemetryDashboardPage from "./pages/TelemetryDashboardPage";
import AlertsThresholdsPage from "./pages/AlertsThresholdsPage";
import FeedingPage from "./pages/FeedingPage";
import HealthEquipmentPage from "./pages/HealthEquipmentPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<TelemetryDashboardPage />} />
          <Route path="/alerts" element={<AlertsThresholdsPage />} />
          <Route path="/feeding" element={<FeedingPage />} />
          <Route path="/health-equipment" element={<HealthEquipmentPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
