import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Calendar, BarChart3, Sparkles } from "lucide-react";

export function Navbar() {
  const location = useLocation();

  const navItems = [
    {
      name: "Subjects & Goals",
      path: "/",
      icon: BookOpen,
    },
    {
      name: "Study Schedule",
      path: "/schedule",
      icon: Calendar,
    },
    {
      name: "Priorities & Analytics",
      path: "/analytics",
      icon: BarChart3,
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight block">
                  AI Study Planner
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Smart Scheduling & Priority Engine
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              AI Model: Adaptive
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
