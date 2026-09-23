import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import DetailPage from "./pages/DetailPage";

export function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/emails/:id" element={<DetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="bg-white text-slate-500 border-t border-slate-200 py-6 text-center text-xs">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
            <p>
              © {new Date().getFullYear()} EmailAI Classifier System.
              Intelligent Email Classification & Review.
            </p>
            <p className="text-slate-400">
              Powered by Multi-modal AI & Rule-based NLP Pipeline
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
