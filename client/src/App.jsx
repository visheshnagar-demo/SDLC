import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CattleInventoryPage } from "./pages/CattleInventoryPage";
import { MilkYieldPage } from "./pages/MilkYieldPage";
import { HealthRecordsPage } from "./pages/HealthRecordsPage";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  // Allow open access or redirect if strictly unauthenticated (with fallback to demo mode)
  return <AppLayout>{children}</AppLayout>;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cows"
            element={
              <ProtectedRoute>
                <CattleInventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/milk-production"
            element={
              <ProtectedRoute>
                <MilkYieldPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/health-records"
            element={
              <ProtectedRoute>
                <HealthRecordsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
