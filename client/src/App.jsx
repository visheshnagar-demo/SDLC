import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import SubjectsAvailabilityPage from "./pages/SubjectsAvailabilityPage";
import SchedulePage from "./pages/SchedulePage";
import PriorityAnalyticsPage from "./pages/PriorityAnalyticsPage";

export function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        <Navbar />
        <main className="flex-1 pb-12">
          <Routes>
            <Route path="/" element={<SubjectsAvailabilityPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/analytics" element={<PriorityAnalyticsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-center text-xs">
          <div className="max-w-7xl mx-auto px-4">
            <p>
              © {new Date().getFullYear()} AI Study Planner & Dynamic Schedule
              Engine. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
