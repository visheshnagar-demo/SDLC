import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authService, profileService } from "../services/api";
import {
  Sparkles,
  Utensils,
  Award,
  BookOpen,
  ShieldCheck,
  LogOut,
  Heart,
  User,
} from "lucide-react";

export default function Navbar({
  activeChild,
  onChildChange,
  user,
  currentPoints,
  currentStreak,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const isParent = user?.role === "parent";
  const points = currentPoints ?? activeChild?.total_points ?? 0;
  const streak = currentStreak ?? activeChild?.active_streak_days ?? 0;

  return (
    <header className="bg-white border-b border-amber-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="flex items-center space-x-2 text-2xl font-bold font-heading text-amber-500 hover:text-amber-600 transition-colors"
            >
              <span className="text-3xl">🌱</span>
              <span>NutriKids</span>
            </Link>
            <span className="hidden md:inline-block bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Healthy Habits Tracker
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/child-dashboard"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                location.pathname === "/child-dashboard"
                  ? "bg-amber-100 text-amber-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Kids Dashboard</span>
            </Link>

            <Link
              to="/meal-logger"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                location.pathname === "/meal-logger"
                  ? "bg-amber-100 text-amber-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Utensils className="w-4 h-4 text-emerald-500" />
              <span>Log Meal</span>
            </Link>

            <Link
              to="/quiz"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                location.pathname === "/quiz"
                  ? "bg-amber-100 text-amber-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-4 h-4 text-sky-500" />
              <span>Food Quiz</span>
            </Link>

            <Link
              to="/avatar-shop"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                location.pathname === "/avatar-shop"
                  ? "bg-amber-100 text-amber-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Award className="w-4 h-4 text-purple-500" />
              <span>Rewards & Shop</span>
            </Link>

            {isParent && (
              <Link
                to="/parent-dashboard"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  location.pathname === "/parent-dashboard"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 bg-slate-100 hover:bg-slate-200"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Parent Portal</span>
              </Link>
            )}
          </nav>

          {/* User / Child Controls & Badges */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Gamification Badges */}
            <div className="flex items-center space-x-1.5">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-amber-100 text-amber-800 shadow-sm border border-amber-200"
                title="Earned Points"
              >
                ⭐ {points} Pts
              </span>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-orange-100 text-orange-800 shadow-sm border border-orange-200"
                title="Healthy Streak"
              >
                🔥 {streak} {streak === 1 ? "Day" : "Days"}
              </span>
            </div>

            {/* Child Profile Name */}
            {activeChild && (
              <div className="hidden sm:flex items-center space-x-1 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                <span>🌱</span>
                <span>{activeChild.display_name}</span>
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
