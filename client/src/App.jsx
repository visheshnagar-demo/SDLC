import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Guests from "./pages/Guests";
import Billing from "./pages/Billing";

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/guests" element={<Guests />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
