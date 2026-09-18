import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Smartphone,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  User,
} from "lucide-react";
import { logout } from "../services/api";

export default function Navbar({ currentUser, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Device Inventory", path: "/devices", icon: Smartphone },
    { name: "Policies & Audit", path: "/policies", icon: ShieldCheck },
  ];

  return (
    <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                MobileManager{" "}
                <span className="text-xs font-normal text-blue-400">
                  Enterprise
                </span>
              </span>
            </Link>

            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {currentUser && (
              <div className="flex items-center space-x-3 text-xs border-r border-slate-700 pr-4">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="font-semibold text-slate-200">
                    {currentUser.full_name || currentUser.email}
                  </p>
                  <p className="text-slate-400 capitalize">
                    {currentUser.role || "IT Admin"}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
