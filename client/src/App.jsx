import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import JobsDashboardPage from "./pages/JobsDashboardPage";
import JobDetailPage from "./pages/JobDetailPage";

export function App() {
  const [userRole, setUserRole] = useState("admin");

  return (
    <Router>
      <AppLayout userRole={userRole} setUserRole={setUserRole}>
        <Routes>
          <Route path="/" element={<Navigate to="/jobs" replace />} />
          <Route
            path="/jobs"
            element={<JobsDashboardPage userRole={userRole} />}
          />
          <Route
            path="/jobs/:id"
            element={<JobDetailPage userRole={userRole} />}
          />
          <Route
            path="/departments"
            element={<JobsDashboardPage userRole={userRole} />}
          />
          <Route
            path="/candidates"
            element={<JobsDashboardPage userRole={userRole} />}
          />
          <Route
            path="/settings"
            element={<JobsDashboardPage userRole={userRole} />}
          />
          <Route path="*" element={<Navigate to="/jobs" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
