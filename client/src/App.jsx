import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import TenantDirectoryPage from "./pages/TenantDirectoryPage";
import TenantOnboardingPage from "./pages/TenantOnboardingPage";
import TenantDetailPage from "./pages/TenantDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<TenantDirectoryPage />} />
            <Route path="/onboard" element={<TenantOnboardingPage />} />
            <Route path="/tenants/:id" element={<TenantDetailPage />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            TenantControl &copy; {new Date().getFullYear()} Enterprise
            Multi-Tenant Control Plane. All rights reserved.
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
