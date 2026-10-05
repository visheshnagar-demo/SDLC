import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import CatalogPage from "./pages/CatalogPage";
import AdminBooksPage from "./pages/AdminBooksPage";
import PatronsPage from "./pages/PatronsPage";
import LoansPage from "./pages/LoansPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
        <div>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<CatalogPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/admin/books" element={<AdminBooksPage />} />
              <Route path="/patrons" element={<PatronsPage />} />
              <Route path="/loans" element={<LoansPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">
                Athenaeum LMS
              </span>
              <span>— Central Campus Library Management System</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Loan Period: 14 Days</span>
              <span>•</span>
              <span>Overdue Policy: $0.50 / day</span>
              <span>•</span>
              <span>Max Quota: 5 books/patron</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
