import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import DevicesPage from "./pages/DevicesPage";
import DeviceDetailPage from "./pages/DeviceDetailPage";
import PoliciesPage from "./pages/PoliciesPage";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const token = localStorage.getItem("token");
    return token
      ? {
          email: "test@example.com",
          role: "admin",
          full_name: "IT Administrator",
        }
      : null;
  });

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
        {currentUser && (
          <Navbar currentUser={currentUser} onLogout={handleLogout} />
        )}

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route
              path="/login"
              element={
                currentUser ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginPage onLoginSuccess={handleLoginSuccess} />
                )
              }
            />

            <Route
              path="/dashboard"
              element={
                currentUser ? (
                  <DashboardPage />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/devices"
              element={
                currentUser ? <DevicesPage /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/devices/:id"
              element={
                currentUser ? (
                  <DeviceDetailPage />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/policies"
              element={
                currentUser ? (
                  <PoliciesPage />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="*"
              element={
                <Navigate to={currentUser ? "/dashboard" : "/login"} replace />
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
