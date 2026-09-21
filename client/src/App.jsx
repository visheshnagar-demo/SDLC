import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import TopNavBar from "./components/layout/TopNavBar";
import SideNavBar from "./components/layout/SideNavBar";
import DashboardPage from "./pages/DashboardPage";
import TanksPage from "./pages/TanksPage";
import QualityPage from "./pages/QualityPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AlertsPage from "./pages/AlertsPage";
import { fetchAlerts } from "./services/api";

export function App() {
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    fetchAlerts()
      .then((data) => {
        if (Array.isArray(data)) {
          setUnreadAlerts(data.filter((a) => !a.is_acknowledged).length);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <TopNavBar alertCount={unreadAlerts} />

        <div className="flex-1 flex flex-col md:flex-row">
          <SideNavBar unreadAlerts={unreadAlerts} />

          <main className="flex-1 bg-slate-950 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tanks" element={<TanksPage />} />
              <Route path="/quality" element={<QualityPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
