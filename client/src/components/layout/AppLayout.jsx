import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  Droplets,
  HeartPulse,
  LogOut,
  Menu,
  X,
  User,
  ShieldCheck,
  Search,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../common/Badge";

export const AppLayout = ({ children }) => {
  const { user, logout, switchRole, isManager } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Cattle Inventory", path: "/cows", icon: Layers },
    { name: "Milk Production", path: "/milk-production", icon: Droplets },
    { name: "Health & Veterinary", path: "/health-records", icon: HeartPulse },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🐄</span>
          <span className="font-bold text-base tracking-tight">
            CattleTrack Pro
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded-md text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-64 bg-slate-900 text-slate-200 flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="hidden md:flex items-center space-x-3 px-2 py-3 border-b border-slate-800">
            <div className="h-9 w-9 bg-emerald-600 rounded-lg flex items-center justify-center text-xl shadow-sm">
              🐮
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight">
                CattleTrack Pro
              </h1>
              <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
                Livestock Operations
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Role Switcher */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">
                Current Role
              </span>
              <Badge variant={user?.role || "farm_manager"}>
                {user?.role === "farm_manager" ? "Farm Manager" : "Farm Worker"}
              </Badge>
            </div>

            {/* Quick Demo Role Switcher */}
            <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg text-[10px]">
              <button
                type="button"
                onClick={() => switchRole("farm_manager")}
                className={`py-1 rounded font-medium transition ${
                  isManager
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => switchRole("farm_worker")}
                className={`py-1 rounded font-medium transition ${
                  !isManager
                    ? "bg-amber-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Worker
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
                <User className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white truncate max-w-[100px]">
                  {user?.full_name || user?.email?.split("@")[0] || "Farm User"}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[100px]">
                  {user?.email || "user@farm.local"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 hidden md:flex items-center justify-between">
          <div className="flex items-center space-x-3 w-96">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Global herd search (Tag ID, Stall, Batch)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 border border-transparent rounded-lg focus:bg-white focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>
                Signed in as:{" "}
                <strong className="text-slate-900">
                  {user?.role === "farm_worker" ? "Worker" : "Farm Manager"}
                </strong>
              </span>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
