import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { getAlerts } from "../../services/api";

export default function AppLayout() {
  const [activeAlertCount, setActiveAlertCount] = useState(0);

  const fetchActiveAlerts = async () => {
    try {
      const data = await getAlerts({ status: "ACTIVE" });
      if (Array.isArray(data)) {
        setActiveAlertCount(data.length);
      }
    } catch {
      // Keep existing count on transient network issue
    }
  };

  useEffect(() => {
    fetchActiveAlerts();
    const interval = setInterval(fetchActiveAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0c141f] text-[#dbe3f3] font-sans flex flex-col selection:bg-[#00e5ff]/20 selection:text-[#00e5ff]">
      <Navbar activeAlertCount={activeAlertCount} />
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet context={{ refreshAlerts: fetchActiveAlerts }} />
      </div>
    </div>
  );
}
