import React, { useState, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import ApiDetailsPage from "./pages/ApiDetailsPage";
import FailuresPage from "./pages/FailuresPage";

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefreshNeeded = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <Router>
      <DashboardLayout
        onRefreshNeeded={handleRefreshNeeded}
        refreshCount={refreshTrigger}
      >
        <Routes>
          <Route
            path="/"
            element={<DashboardPage refreshTrigger={refreshTrigger} />}
          />
          <Route path="/apis/:id" element={<ApiDetailsPage />} />
          <Route
            path="/failures"
            element={<FailuresPage refreshTrigger={refreshTrigger} />}
          />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}
