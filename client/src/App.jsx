import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import CatalogPage from "./pages/CatalogPage";
import TrackDetailPage from "./pages/TrackDetailPage";
import TutorialPage from "./pages/TutorialPage";
import QuizPage from "./pages/QuizPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/tracks" replace />} />
              <Route path="/tracks" element={<CatalogPage />} />
              <Route path="/tracks/:slug" element={<TrackDetailPage />} />
              <Route path="/tutorials" element={<TutorialPage />} />
              <Route path="/tutorials/:slug" element={<TutorialPage />} />
              <Route path="/quiz/:moduleId" element={<QuizPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/bookmarks" element={<DashboardPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/tracks" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
