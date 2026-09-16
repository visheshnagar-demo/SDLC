import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  PlusCircle,
  Search,
  Bell,
  ShieldCheck,
  User,
} from "lucide-react";

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                  TenantControl
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                  Control Plane
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === "/"
                    ? "bg-slate-100 text-indigo-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Tenant Directory
              </Link>
              <Link
                to="/onboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  location.pathname === "/onboard"
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Onboard Tenant</span>
              </Link>
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-4">
            {/* Quick Search */}
            <div className="relative hidden lg:block w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tenant or slug..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-transparent rounded-lg text-xs focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>

            {/* Notification Bell */}
            <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full"></span>
            </button>

            {/* Admin Profile */}
            <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-medium text-xs">
                SA
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                  <span>SysAdmin</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="text-[10px] text-slate-500">Platform Admin</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
