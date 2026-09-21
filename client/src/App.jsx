import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ApiDetailsPage from "./pages/ApiDetailsPage";
import FailuresPage from "./pages/FailuresPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/apis/:apiId" element={<ApiDetailsPage />} />
        <Route path="/failures" element={<FailuresPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
