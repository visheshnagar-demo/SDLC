import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./pages/Dashboard";
import { Flocks } from "./pages/Flocks";
import { EggCollections } from "./pages/EggCollections";
import { FeedInventory } from "./pages/FeedInventory";
import { HealthLogs } from "./pages/HealthLogs";
import { getFeedInventory } from "./services/api";

function AppLayout() {
  const location = useLocation();
  const [lowStockAlerts, setLowStockAlerts] = useState(0);

  useEffect(() => {
    async function checkStock() {
      try {
        const feedRes = await getFeedInventory();
        const low = (feedRes || []).filter(
          (f) => f.quantity_kg <= f.reorder_threshold_kg,
        ).length;
        setLowStockAlerts(low);
      } catch (err) {
        console.warn("Could not check stock alerts for header", err);
      }
    }
    checkStock();
  }, [location.pathname]);

  const getPageTitle = (path) => {
    switch (path) {
      case "/":
        return "Farm Operations Dashboard";
      case "/flocks":
        return "Flock Registry & House Allocation";
      case "/egg-collections":
        return "Daily Egg Collection & Quality Grading";
      case "/feed-inventory":
        return "Feed Inventory & Consumption Tracking";
      case "/health-logs":
        return "Flock Health, Vaccination & Mortality Logs";
      default:
        return "Hens Management System";
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={getPageTitle(location.pathname)}
          lowStockAlerts={lowStockAlerts}
        />
        <main className="flex-1 bg-[#FAF8FF]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/flocks" element={<Flocks />} />
            <Route path="/egg-collections" element={<EggCollections />} />
            <Route path="/feed-inventory" element={<FeedInventory />} />
            <Route path="/health-logs" element={<HealthLogs />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
