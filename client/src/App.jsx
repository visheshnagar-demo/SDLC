import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import ItineraryPage from "./pages/ItineraryPage";
import SharedItineraryPage from "./pages/SharedItineraryPage";

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/itineraries/:id" element={<ItineraryPage />} />
        <Route path="/shared/:token" element={<SharedItineraryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
