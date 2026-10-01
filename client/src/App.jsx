import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChildDashboard from "./pages/ChildDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import MealLogger from "./pages/MealLogger";
import QuizPage from "./pages/QuizPage";
import AvatarShop from "./pages/AvatarShop";
import { authService, profileService } from "./services/api";

export default function App() {
  const [user, setUser] = useState(authService.getStoredUser());
  const [activeChild, setActiveChild] = useState(
    profileService.getSelectedChild() || {
      id: "00000000-0000-0000-0000-000000000001",
      display_name: "Leo",
      age: 7,
      total_points: 150,
      active_streak_days: 5,
    },
  );
  const [currentPoints, setCurrentPoints] = useState(150);
  const [currentStreak, setCurrentStreak] = useState(5);

  useEffect(() => {
    // If no stored user, set a default parent user for immediate demo access
    if (!authService.getStoredToken()) {
      const demoUser = {
        email: "test@example.com",
        role: "parent",
        name: "Demo Parent",
      };
      localStorage.setItem("nutrikids_token", "demo-token");
      localStorage.setItem("nutrikids_user", JSON.stringify(demoUser));
      setUser(demoUser);
    }
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleUpdatePoints = (newPoints) => {
    setCurrentPoints(newPoints);
    setActiveChild((prev) => ({ ...prev, total_points: newPoints }));
  };

  const handleMealLogged = (meal) => {
    setCurrentPoints((prev) => prev + 40);
    setCurrentStreak((prev) => Math.max(prev, 5));
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#FFFDF7] font-body text-slate-800">
        <Navbar
          activeChild={activeChild}
          onChildChange={setActiveChild}
          user={user}
          currentPoints={currentPoints}
          currentStreak={currentStreak}
        />

        <main className="flex-grow">
          <Routes>
            <Route
              path="/login"
              element={<Login onLoginSuccess={handleLoginSuccess} />}
            />
            <Route
              path="/register"
              element={<Register onLoginSuccess={handleLoginSuccess} />}
            />

            <Route
              path="/child-dashboard"
              element={
                <ProtectedRoute>
                  <ChildDashboard
                    activeChild={activeChild}
                    onUpdatePoints={handleUpdatePoints}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/meal-logger"
              element={
                <ProtectedRoute>
                  <MealLogger
                    activeChild={activeChild}
                    onMealLogged={handleMealLogged}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/parent-dashboard"
              element={
                <ProtectedRoute roleRequired="parent">
                  <ParentDashboard activeChild={activeChild} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/quiz"
              element={
                <ProtectedRoute>
                  <QuizPage onPointsEarned={handleUpdatePoints} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/avatar-shop"
              element={
                <ProtectedRoute>
                  <AvatarShop
                    activeChild={activeChild}
                    currentPoints={currentPoints}
                    onPointsChange={handleUpdatePoints}
                  />
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route
              path="/"
              element={<Navigate to="/child-dashboard" replace />}
            />
            <Route
              path="*"
              element={<Navigate to="/child-dashboard" replace />}
            />
          </Routes>
        </main>

        <footer className="bg-white border-t border-amber-100 py-6 text-center text-xs text-slate-400">
          <p>
            © 2026 NutriKids. Interactive Healthy Eating Habits Tracker for
            Kids & Parents.
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
